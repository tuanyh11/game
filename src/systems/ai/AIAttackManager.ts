// ============================================================
//  AI Attack Manager — Wave attacks, rally, raiding, enemy analysis
//  Extracted from AIController.ts
// ============================================================

import {
    BuildingType, ResourceNodeType, UnitType, ResourceType, UnitState,
    C, TILE_SIZE, UPGRADE_DATA, UpgradeType, isRangedType, isCavalryType, MAP_COLS, MAP_ROWS, UNIT_DATA,
    CIV_ELITE_UNIT, CivilizationType
} from "../../config/GameConfig";
import { Unit } from "../../entities/Unit";
import { Building } from "../../entities/Building";
import type { AIContext } from "./AIContext";
import { sharedIntel, AIDifficulty } from "./AIConfig";

export function sendAttackWave(ai: AIContext): void {
    // Recalculate allocation to know how many we can send
    ai.calculateForceAllocation();

    // Only use attack-allocated units for waves (garrison stays home!)
    const availableForAttack = ai.forceAllocation.attackUnits.filter(
        u => u.state === UnitState.Idle || u.state === UnitState.Moving
    );
    // Also add support units if no ally needs help
    const allyUnderAttack = ai.entityManager.buildings.some(
        b => b.alive && b.built && b.hp < b.maxHp &&
            b.team !== ai.team && ai.entityManager.isAlly(ai.team, b.team)
    );
    const military = allyUnderAttack
        ? availableForAttack
        : availableForAttack.concat(
            ai.forceAllocation.supportUnits.filter(
                u => u.state === UnitState.Idle || u.state === UnitState.Moving
            )
        );
    if (military.length < ai.attackWaveSize) return;

    // === PRE-ATTACK POWER CHECK (only against enemies near target, not global) ===
    const ownPower = ai.calculateCombatPower(military);

    // Find the probable target area to check local enemy strength
    const targetBuildings = ai.getScoutedEnemyBuildings();
    let checkX = 0, checkY = 0;
    if (targetBuildings.length > 0) {
        checkX = targetBuildings[0].x;
        checkY = targetBuildings[0].y;
    }
    // Only count enemies NEAR the target (within 20 tiles), not all enemies globally
    const nearTargetEnemies = ai.entityManager.units.filter(
        u => u.alive && ai.entityManager.isEnemy(ai.team, u.team) && !u.isVillager &&
            Math.hypot(u.x - checkX, u.y - checkY) < TILE_SIZE * 20
    );
    const enemyDefensePower = ai.calculateCombatPower(nearTargetEnemies);

    // Only abort if enemy defense is MUCH stronger AND we haven't reached max wave
    const hasMaxArmy = military.length >= ai.params.maxWaveSize;

    // Scale acceptable disadvantage by difficulty. The higher the number, the more reckless the AI is.
    // Hard AI will charge even if enemy is 3x stronger. Normal AI tolerates 2x.
    const acceptableDisadvantage = ai.difficulty === AIDifficulty.Hard ? 3.0 : 2.0;

    // AI will also ignore the power disadvantage and just charge if its army is at least 50% of max size (very reckless)
    if (!hasMaxArmy && enemyDefensePower > ownPower * acceptableDisadvantage && military.length < ai.params.maxWaveSize * 0.5) {
        ai.log(`⚠️ Địch phòng thủ mạnh! Chờ thêm quân... (${military.length}/${ai.params.maxWaveSize})`, '#ffaa00');
        return;
    }

    // ===== FOG OF WAR: Only attack SCOUTED enemy buildings =====
    if (!ai.hasScoutedEnemy()) {
        ai.log('🔍 Chưa trinh sát được địch! Cử trinh sát khám phá...', '#ffcc00');
        for (const u of military) {
            if (u.type === UnitType.Scout) {
                ai.sendToExplore(u);
            }
        }
        const scouts = military.filter(u => u.type === UnitType.Scout);
        if (scouts.length === 0) {
            const fastUnit = military.sort((a, b) => b.speed - a.speed)[0];
            if (fastUnit) ai.sendToExplore(fastUnit);
        }
        return;
    }

    const enemyBuildings = ai.getScoutedEnemyBuildings();
    ai.log(`📊 Chia quân: ${ai.forceAllocation.garrisonUnits.length} giữ nhà, ${military.length} tấn công (${ai.scoutedEnemyBuildings.size} mục tiêu đã trinh sát)`, '#88aaff');

    if (enemyBuildings.length === 0) {
        ai.log('🔍 Mục tiêu đã bị phá hủy, cần trinh sát lại...', '#ffcc00');
        for (const u of military) {
            if (u.type === UnitType.Scout) ai.sendToExplore(u);
        }
        return;
    }

    // ===== SMART TARGET PRIORITY with SCORING =====
    const scoreBldg = (b: Building): number => {
        let s = 0;
        // Damaged buildings = high priority (finish them off)
        if (b.hp < b.maxHp * 0.5) s += 80;
        else if (b.hp < b.maxHp * 0.8) s += 40;

        // Target type priority
        if (b.type === BuildingType.Tower) s += 70; // Destroy defenses FIRST
        if (b.type === BuildingType.TownCenter) s += 60; // Then the economic heart
        if (b.type === BuildingType.Barracks || b.type === BuildingType.Stable) s += 45;
        if (b.type === BuildingType.HeroAltar) s += 40;
        if (b.type === BuildingType.Farm || b.type === BuildingType.Market) s += 20;
        if (b.type === BuildingType.House) s += 10;

        // Distance penalty (prefer closer buildings)
        let avgX = 0, avgY = 0;
        for (const u of military) { avgX += u.x; avgY += u.y; }
        avgX /= military.length; avgY /= military.length;
        const dist = Math.hypot(b.x - avgX, b.y - avgY);
        s -= dist / TILE_SIZE * 1.5;

        return s;
    };

    // Sort buildings by score
    const sortedBuildings = [...enemyBuildings].sort((a, b) => scoreBldg(b) - scoreBldg(a));
    const targetBldg = sortedBuildings[0];

    // ===== MULTI-PRONG ATTACK =====
    // Split army: 70% main force, 30% flanking force (if enough units)
    const doMultiProng = military.length >= 8 && sortedBuildings.length >= 2 &&
        ai.difficulty !== AIDifficulty.Easy;

    if (doMultiProng) {
        const mainSize = Math.ceil(military.length * 0.7);
        const flankSize = military.length - mainSize;

        // Sort by DPS: send tanky units to main, fast units to flank
        const sorted = [...military].sort((a, b) => {
            const aScore = a.hp + (isCavalryType(a.type) ? 100 : 0) + (a.speed > 100 ? 50 : 0);
            const bScore = b.hp + (isCavalryType(b.type) ? 100 : 0) + (b.speed > 100 ? 50 : 0);
            return bScore - aScore;
        });

        const mainForce = sorted.slice(0, mainSize);
        const flankForceUnits = sorted.slice(mainSize);

        // Find secondary target (different from primary)
        const secondaryTarget = sortedBuildings.find(b => b !== targetBldg) || targetBldg;

        // Main force attacks primary target
        for (const u of mainForce) {
            u.attackBuilding(targetBldg);
        }

        // Flank force attacks from different angle
        const flankAngle = Math.atan2(secondaryTarget.y - targetBldg.y, secondaryTarget.x - targetBldg.x);
        ai.flankForce = flankForceUnits;
        ai.flankTarget = { x: secondaryTarget.x, y: secondaryTarget.y };

        for (let i = 0; i < flankForceUnits.length; i++) {
            const u = flankForceUnits[i];
            // Approach from opposite side
            const angle = flankAngle + (i / flankForceUnits.length) * Math.PI * 0.5;
            u.attackBuilding(secondaryTarget);
        }

        ai.log(`🔱 TẤN CÔNG GỌNG KÌM! ${mainSize} quân → mục tiêu chính, ${flankSize} quân → mục tiêu phụ!`, '#ff4400');
    } else {
        // Standard attack: all units attack primary target
        for (const u of military) {
            u.attackBuilding(targetBldg);
        }
    }

    // ===== ALSO ATTACK ENEMY UNITS defending the target =====
    // Assign some units to fight defenders instead of hitting the building
    if (nearTargetEnemies.length > 0) {
        const defenseKillers = military.filter(u => isRangedType(u.type) || u.type === UnitType.Archer);
        const meleeDefenders = nearTargetEnemies.filter(u => !isRangedType(u.type));
        let assigned = 0;
        for (const dk of defenseKillers) {
            if (assigned >= Math.ceil(nearTargetEnemies.length * 0.6)) break;
            const closestDefender = nearTargetEnemies.reduce((a, b) =>
                Math.hypot(a.x - dk.x, a.y - dk.y) < Math.hypot(b.x - dk.x, b.y - dk.y) ? a : b
            );
            dk.attackUnit(closestDefender);
            assigned++;
        }
    }

    ai.waveState = 'attacking';
    ai.wavesSent++;
    ai.attackWaveSize = Math.min(ai.params.maxWaveSize, ai.attackWaveSize + 1);
    ai.waveResetTimer = 35;

    // BROADCAST coordinated attack to allies
    sharedIntel.coordinatedAttacks.push({
        targetX: targetBldg.x,
        targetY: targetBldg.y,
        targetBuilding: targetBldg,
        initiatorTeam: ai.team,
        timestamp: sharedIntel.gameTime,
        participating: new Set([ai.team]),
    });
    ai.log(`🚀 Phát động tấn công vào căn cứ đối phương! Mời đồng minh tham chiến!`, "#ff8800");
}

// ===== RALLY: Gather idle troops with smart split =====
export function rallyTroops(ai: AIContext): void {
    ai.calculateForceAllocation();

    const enemyBuildings = ai.getScoutedEnemyBuildings();

    const baseX = ai.baseX;
    const baseY = ai.baseY;

    // Calculate rally point for ATTACK units
    if (enemyBuildings.length > 0) {
        let nearestBldg = enemyBuildings[0];
        let nearestDist = Infinity;
        for (const pb of enemyBuildings) {
            const d = Math.hypot(pb.x - baseX, pb.y - baseY);
            if (d < nearestDist) { nearestDist = d; nearestBldg = pb; }
        }
        const angleToTarget = Math.atan2(nearestBldg.y - baseY, nearestBldg.x - baseX);
        const rallyDist = TILE_SIZE * 15; // Stay close to home to rally
        ai.rallyX = baseX + Math.cos(angleToTarget) * rallyDist;
        ai.rallyY = baseY + Math.sin(angleToTarget) * rallyDist;
    } else {
        // Pick rally point slightly in front of base (toward center of map)
        const angleToCenter = Math.atan2((MAP_ROWS * TILE_SIZE) / 2 - ai.baseY, (MAP_COLS * TILE_SIZE) / 2 - ai.baseX);
        const rallyDist = TILE_SIZE * 15; // Increased from 8 to 15 to pull them away from buildings

        // Check if we have a primary threat direction — rally toward it!
        const dtp = ai.getDefenseTrainingPriority();
        const hasPatternData = dtp.lastUpdate > 0 && (sharedIntel.gameTime - dtp.lastUpdate) < 120;

        ai.rallyX = ai.baseX + Math.cos(angleToCenter) * rallyDist;
        ai.rallyY = ai.baseY + Math.sin(angleToCenter) * rallyDist;

        if (hasPatternData && ai.threatDirectionConfidence > 0.4) {
            ai.rallyX = ai.baseX + Math.cos(ai.primaryThreatDirection) * rallyDist;
            ai.rallyY = ai.baseY + Math.sin(ai.primaryThreatDirection) * rallyDist;
        }
    }

    // === GARRISON units: actively patrol around buildings (WIDER PATROL) ===
    const garrisonSet = new Set(ai.forceAllocation.garrisonUnits);
    const buildingsToGuard = ai.entityManager.buildings.filter(
        b => b.alive && b.team === ai.team && b.built
    );
    for (let i = 0; i < ai.forceAllocation.garrisonUnits.length; i++) {
        const u = ai.forceAllocation.garrisonUnits[i];
        if (u.state !== UnitState.Idle) continue;

        const distToBase = Math.hypot(u.x - baseX, u.y - baseY);
        if (distToBase > TILE_SIZE * 20) {
            // Way too far from base — return
            ai.safeMoveTo(u, baseX + (Math.random() - 0.5) * TILE_SIZE * 6,
                baseY + (Math.random() - 0.5) * TILE_SIZE * 6);
            continue;
        }

        // Assign each garrison unit to patrol around a specific building
        // with WIDER patrol radius so they're not stacked on TC
        if (buildingsToGuard.length > 0) {
            const assignedBuilding = buildingsToGuard[i % buildingsToGuard.length];
            // assignedBuilding.
            // Wider patrol radius (8-13 tiles instead of 6-9)
            const patrolAngle = (sharedIntel.gameTime * 0.3 + i * Math.PI * 2 / Math.max(1, ai.forceAllocation.garrisonUnits.length)) % (Math.PI * 2);
            const patrolRadius = TILE_SIZE * (8 + (i % 6)); // 8-13 tiles radius
            const patrolX = assignedBuilding.x + Math.cos(patrolAngle) * patrolRadius;
            const patrolY = assignedBuilding.y + Math.sin(patrolAngle) * patrolRadius;
            // Only move if sufficiently far from patrol point
            const distToPatrol = Math.hypot(u.x - patrolX, u.y - patrolY);
            if (distToPatrol > TILE_SIZE * 3) {
                ai.safeMoveTo(u,
                    Math.max(TILE_SIZE, Math.min(patrolX, (MAP_COLS - 1) * TILE_SIZE)),
                    Math.max(TILE_SIZE, Math.min(patrolY, (MAP_ROWS - 1) * TILE_SIZE))
                );
            }
        } else {
            // No buildings? Patrol around base center with wider area
            const angle = Math.random() * Math.PI * 2;
            ai.safeMoveTo(u,
                baseX + Math.cos(angle) * TILE_SIZE * (5 + Math.random() * 5),
                baseY + Math.sin(angle) * TILE_SIZE * (5 + Math.random() * 5)
            );
        }
    }

    // === ATTACK units ONLY: rally to staging area ===
    // Support units are managed by AIAllianceManager
    const rallyUnits = [
        ...ai.forceAllocation.attackUnits,
    ].filter(u => u.state === UnitState.Idle && !garrisonSet.has(u));

    for (const u of rallyUnits) {
        const dist = Math.hypot(u.x - ai.rallyX, u.y - ai.rallyY);
        // Ensure units don't constantly shuffle if they are "close enough" (within 10 tiles of rally center)
        if (dist > TILE_SIZE * 10) {
            // Give them a very wide spread radius (0-18 tiles) to prevent massive clumping
            const angle = Math.random() * Math.PI * 2;
            const spreadRadius = Math.random() * TILE_SIZE * 18;
            const tx = ai.rallyX + Math.cos(angle) * spreadRadius;
            const ty = ai.rallyY + Math.sin(angle) * spreadRadius;
            const cx = Math.max(TILE_SIZE * 2, Math.min(tx, (MAP_COLS - 2) * TILE_SIZE));
            const cy = Math.max(TILE_SIZE * 2, Math.min(ty, (MAP_ROWS - 2) * TILE_SIZE));
            ai.safeMoveTo(u, cx, cy);
        }
    }
}

// ===================================================================
//  RAIDING SYSTEM: Send fast units to harass enemy economy
//  Targets villagers, farms, and undefended economic buildings
// ===================================================================
export function handleRaiding(ai: AIContext): void {
    // Don't raid if own base is under attack or we're already attacking
    if (ai.waveState !== 'gathering' && ai.waveState !== 'attacking') return;
    if (ai.raidCooldown > 0) return;
    if (ai.raidActive) {
        // Check if raid is still active
        const aliveRaiders = [...ai.raidingUnits].filter(id => {
            const u = ai.entityManager.units.find(u => u.id === id);
            return u && u.alive;
        });
        if (aliveRaiders.length === 0) {
            ai.raidActive = false;
            ai.raidingUnits.clear();
            ai.raidCooldown = 30; // Wait 30s before next raid
        }

        // Raid units: retreat if facing more than 3 military enemies
        for (const id of aliveRaiders) {
            const u = ai.entityManager.units.find(u => u.id === id);
            if (!u || !u.alive) continue;

            const nearbyDefenders = ai.entityManager.units.filter(
                e => e.alive && ai.entityManager.isEnemy(ai.team, e.team) && !e.isVillager &&
                    Math.hypot(e.x - u.x, e.y - u.y) < TILE_SIZE * 8
            );

            if (nearbyDefenders.length >= 3 || u.hp < u.maxHp * 0.3) {
                // RETREAT! Run home
                ai.raidingUnits.delete(id);
                const safeBldg = ai.findNearestAllyBuilding(u.x, u.y);
                if (safeBldg) {
                    ai.safeMoveTo(u, safeBldg.x + (Math.random() - 0.5) * TILE_SIZE * 3,
                        safeBldg.y + (Math.random() - 0.5) * TILE_SIZE * 3);
                }
            } else if (u.state === UnitState.Idle) {
                // Find new target: villager > farm > market
                const villager = ai.findNearestEnemyVillager(u.x, u.y, TILE_SIZE * 20);
                if (villager) {
                    u.attackUnit(villager);
                } else {
                    const ecoBuilding = ai.findNearestEnemyEcoBuilding(u.x, u.y, TILE_SIZE * 20);
                    if (ecoBuilding) {
                        u.attackBuilding(ecoBuilding);
                    }
                }
            }
        }
        return;
    }

    // Initiate new raid
    if (!ai.hasScoutedEnemy()) return;

    // Find fast units not assigned to garrison or defense
    const garrisonSet = new Set(ai.forceAllocation.garrisonUnits.map(u => u.id));
    const fastUnits = ai.entityManager.units.filter(
        u => u.alive && u.team === ai.team && !u.isVillager && !u.manualCommand &&
            !ai.defendingUnits.has(u.id) && !garrisonSet.has(u.id) &&
            (u.state === UnitState.Idle || u.state === UnitState.Moving) &&
            (isCavalryType(u.type) || u.speed >= 100) &&
            u.hp > u.maxHp * 0.7
    );

    if (fastUnits.length < 2) return; // Need at least 2 raiders

    // Select 2-4 raiders (fast units)
    const raidSize = Math.min(4, fastUnits.length);
    const raiders = fastUnits.slice(0, raidSize);

    // Find enemy villager locations or economy buildings
    const scoutedBuildings = ai.getScoutedEnemyBuildings();
    const ecoBuildings = scoutedBuildings.filter(
        b => b.type === BuildingType.Farm || b.type === BuildingType.Market
    );
    // Prefer TC area (villagers gather there)
    const enemyTC = scoutedBuildings.find(b => b.type === BuildingType.TownCenter);

    let targetX: number, targetY: number;
    if (ecoBuildings.length > 0) {
        const target = ecoBuildings[Math.floor(Math.random() * ecoBuildings.length)];
        targetX = target.x;
        targetY = target.y;
    } else if (enemyTC) {
        // Raid around enemy TC (where villagers are)
        const raidAngle = Math.random() * Math.PI * 2;
        targetX = enemyTC.x + Math.cos(raidAngle) * TILE_SIZE * 8;
        targetY = enemyTC.y + Math.sin(raidAngle) * TILE_SIZE * 8;
    } else {
        return; // No known targets
    }

    // Send raiders
    ai.raidActive = true;
    ai.raidTarget = { x: targetX, y: targetY };
    for (const u of raiders) {
        ai.raidingUnits.add(u.id);
        const villager = ai.findNearestEnemyVillager(targetX, targetY, TILE_SIZE * 15);
        if (villager) {
            u.attackUnit(villager);
        } else {
            ai.safeMoveTo(u,
                targetX + (Math.random() - 0.5) * TILE_SIZE * 4,
                targetY + (Math.random() - 0.5) * TILE_SIZE * 4
            );
        }
    }

    ai.log(`🏇 RAID! ${raidSize} kỵ binh đột kích kinh tế địch!`, '#ff8800');
}

// ===================================================================
//  ENEMY COMPOSITION ANALYSIS: Track what the enemy is building
//  Used to adapt training priorities (counter-play)
// ===================================================================
export function analyzeEnemyComposition(ai: AIContext): void {
    const now = sharedIntel.gameTime;
    if (now - ai.enemyComposition.lastUpdate < 8) return; // Don't update too often
    ai.enemyComposition.lastUpdate = now;

    let melee = 0, ranged = 0, cavalry = 0, heroes = 0, total = 0;

    for (const u of ai.entityManager.units) {
        if (!u.alive || !ai.entityManager.isEnemy(ai.team, u.team)) continue;
        if (u.isVillager) continue;

        // Only count scouted enemies (within vision)
        if (!ai.isPositionVisible(u.x, u.y)) continue;

        total++;
        if (u.isHero) heroes++;
        else if (isCavalryType(u.type)) cavalry++;
        else if (isRangedType(u.type) || u.type === UnitType.Archer) ranged++;
        else melee++;
    }

    ai.enemyComposition = { melee, ranged, cavalry, heroes, total, lastUpdate: now };
}
