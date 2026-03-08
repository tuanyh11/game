// ============================================================
//  AI Defense Manager — Defense, counter-attack, force allocation
//  TIER-1 UPGRADE: Early Warning, Tower-Aware, Smart Defense
//  Extracted from AIController.ts
// ============================================================

import {
    BuildingType, ResourceNodeType, UnitType, ResourceType, UnitState,
    C, TILE_SIZE, UPGRADE_DATA, UpgradeType, isRangedType, isCavalryType, MAP_COLS, MAP_ROWS, UNIT_DATA,
    CIV_ELITE_UNIT, CivilizationType, TOWER_ATTACK_DATA, TerrainType
} from "../../config/GameConfig";
import { Unit } from "../../entities/Unit";
import { Building } from "../../entities/Building";
import type { AIContext, AttackPatternRecord, DefenseTrainingPriority, Chokepoint, TrapState } from "./AIContext";
import { DefenseStance, DefenseLayer } from "./AIContext";
import { sharedIntel, AIDifficulty } from "./AIConfig";

const ATTACK_PATTERN_MAX = 15;                    // Tối đa bao nhiêu đợt tấn công nhớ (Tier-2)

// ===================================================================
//  CONSTANTS
// ===================================================================
const EARLY_WARNING_RADIUS = TILE_SIZE * 25;    // Vùng cảnh báo sớm
const ALERT_RADIUS = TILE_SIZE * 18;             // Vùng cảnh giác (chuyển sang Alert)
const ATTACK_HISTORY_MAX = 10;                    // Tối đa bao nhiêu đợt tấn công nhớ
const ATTACK_HISTORY_DECAY = 120;                 // Giây để một record hết hiệu lực

// ===================================================================
//  FORCE ALLOCATION: Smart army splitting
//  Calculates how to divide military between defense, attack, support
//  TIER-1: Now considers defense stance & early warning
// ===================================================================
export function calculateForceAllocation(ai: AIContext): void {
    const military = ai.entityManager.units.filter(
        u => u.alive && u.team === ai.team && !u.isVillager && !u.manualCommand
    );
    if (military.length === 0) {
        ai.forceAllocation.garrisonUnits = [];
        ai.forceAllocation.attackUnits = [];
        ai.forceAllocation.supportUnits = [];
        return;
    }

    const total = military.length;

    // === Situational awareness ===
    const ownBuildings = ai.entityManager.buildings.filter(
        b => b.alive && b.team === ai.team && b.built
    );
    const baseX = ai.baseX;
    const baseY = ai.baseY;

    // Is OUR base under attack?
    const baseUnderAttack = ownBuildings.some(b => b.hp < b.maxHp);
    // Only count non-scout military enemies near base (scouts shouldn't trigger full defense)
    const enemiesNearBase = ai.entityManager.units.filter(
        u => u.alive && ai.entityManager.isEnemy(ai.team, u.team) &&
            !u.isVillager &&
            Math.hypot(u.x - baseX, u.y - baseY) < TILE_SIZE * 15
    ).length;

    // Is ALLY under attack?
    const allyUnderAttack = ai.entityManager.buildings.some(
        b => b.alive && b.built && b.hp < b.maxHp &&
            b.team !== ai.team && ai.entityManager.isAlly(ai.team, b.team)
    );
    const allyUnitsInDanger = ai.entityManager.units.some(
        u => u.alive && u.hp < u.maxHp &&
            u.team !== ai.team && ai.entityManager.isAlly(ai.team, u.team) &&
            u.state === UnitState.Attacking
    );
    const allyNeedsHelp = allyUnderAttack || allyUnitsInDanger;

    // Tower helps with defense
    const towerCount = ownBuildings.filter(b => b.type === BuildingType.Tower).length;

    // === DEFENSE STANCE ADJUSTMENT ===
    // Stance modifies garrison ratio (reduced multipliers so garrison isn't too greedy)
    let stanceGarrisonMult = 1.0;
    if (ai.defenseStance === DefenseStance.Alert) stanceGarrisonMult = 1.2;
    if (ai.defenseStance === DefenseStance.Fortress) stanceGarrisonMult = 2.0;

    // === PRIORITY 1: GARRISON (Defense) ===
    let garrisonCount: number;

    if (baseUnderAttack && enemiesNearBase >= 3) {
        // === BASE UNDER SERIOUS ATTACK → Most units defend (keep a small attack reserve) ===
        garrisonCount = Math.max(Math.ceil(total * 0.8), total - 2);
        const sortedByDistToBase = [...military].sort((a, b) => {
            const da = Math.hypot(a.x - baseX, a.y - baseY);
            const db = Math.hypot(b.x - baseX, b.y - baseY);
            return da - db;
        });
        ai.forceAllocation.garrisonRatio = garrisonCount / total;
        ai.forceAllocation.attackRatio = (total - garrisonCount) / total;
        ai.forceAllocation.supportRatio = 0;
        ai.forceAllocation.garrisonUnits = sortedByDistToBase.slice(0, garrisonCount);
        ai.forceAllocation.attackUnits = sortedByDistToBase.slice(garrisonCount);
        ai.forceAllocation.supportUnits = [];
        return;
    } else if (baseUnderAttack || enemiesNearBase >= 2) {
        // Moderate threat — 60% garrison
        garrisonCount = Math.ceil(total * 0.6);
    } else if (enemiesNearBase === 1) {
        // Minor threat (scout or single unit) — just a few garrison
        garrisonCount = Math.min(3, Math.ceil(total * 0.3));
    }

    // === FORTRESS MODE: Most defend (but not ALL) ===
    else if (ai.defenseStance === DefenseStance.Fortress) {
        garrisonCount = Math.max(Math.ceil(total * 0.6), 1);
    } else if (ai.earlyWarningActive) {
        // Early warning detected: increase garrison proportionally to threat
        const threatLevel = Math.min(1.0, ai.earlyWarningEnemies.length / 8);
        garrisonCount = Math.max(
            Math.ceil(total * (0.2 + threatLevel * 0.3)),
            2
        );
    } else {
        // Normal peacetime: keep garrison SMALL so most units can attack
        // Only 15-20% garrison normally, towers reduce need further
        const towerReduction = Math.min(2, towerCount);
        garrisonCount = Math.max(
            1,
            Math.ceil(total * 0.15 * stanceGarrisonMult) - towerReduction
        );
    }
    garrisonCount = Math.min(garrisonCount, total);

    const remaining = total - garrisonCount;

    // === PRIORITY 2: SUPPORT (Ally help) ===
    let supportCount: number;

    if (allyNeedsHelp) {
        if (remaining <= 7) {
            supportCount = remaining;
        } else {
            supportCount = 3;
        }
    } else {
        supportCount = Math.min(2, Math.floor(remaining * 0.1));
    }
    supportCount = Math.min(supportCount, remaining);

    // === PRIORITY 3: ATTACK (What's left) ===
    const attackCount = remaining - supportCount;

    // === Assign units by distance to base ===
    // Closest to base → garrison
    const sortedByDistToBase = [...military].sort((a, b) => {
        const da = Math.hypot(a.x - baseX, a.y - baseY);
        const db = Math.hypot(b.x - baseX, b.y - baseY);
        return da - db;
    });

    const garrisonRatio = garrisonCount / total;
    const supportRatio = supportCount / total;
    const attackRatio = attackCount / total;

    ai.forceAllocation.garrisonRatio = garrisonRatio;
    ai.forceAllocation.attackRatio = attackRatio;
    ai.forceAllocation.supportRatio = supportRatio;
    ai.forceAllocation.garrisonUnits = sortedByDistToBase.slice(0, garrisonCount);
    ai.forceAllocation.supportUnits = sortedByDistToBase.slice(garrisonCount, garrisonCount + supportCount);
    ai.forceAllocation.attackUnits = sortedByDistToBase.slice(garrisonCount + supportCount);
}

// ===================================================================
//  EARLY WARNING PERIMETER: Detect enemies approaching base BEFORE
//  they attack. Gives AI time to prepare defense positions.
// ===================================================================
export function earlyWarningCheck(ai: AIContext): void {
    if (ai.earlyWarningCooldown > 0) {
        ai.earlyWarningCooldown -= 0.5; // decay with defend timer
        return;
    }

    const ownBuildings = ai.entityManager.buildings.filter(
        b => b.alive && b.team === ai.team && b.built
    );
    const baseX = ai.baseX;
    const baseY = ai.baseY;

    // Scan for enemies in the EARLY WARNING zone (25 tiles around base)
    // These are enemies not yet attacking but approaching
    const earlyWarningEnemies: Unit[] = [];
    for (const u of ai.entityManager.units) {
        if (!u.alive || !ai.entityManager.isEnemy(ai.team, u.team)) continue;
        const dist = Math.hypot(u.x - baseX, u.y - baseY);
        if (dist < EARLY_WARNING_RADIUS && dist > TILE_SIZE * 10) {
            earlyWarningEnemies.push(u);
        }
    }

    ai.earlyWarningEnemies = earlyWarningEnemies;

    if (earlyWarningEnemies.length === 0) {
        // No threats in perimeter — gradually relax stance
        if (ai.earlyWarningActive) {
            ai.earlyWarningActive = false;
            if (ai.defenseStance === DefenseStance.Alert) {
                ai.defenseStance = DefenseStance.Peaceful;
                ai.log(`✅ Hết cảnh báo sớm. Chuyển về chế độ Bình Thường.`, '#44ff88');
            }
        }
        return;
    }

    // === ENEMY DETECTED IN PERIMETER ===
    const threatCount = earlyWarningEnemies.length;
    const wasAlreadyActive = ai.earlyWarningActive;
    ai.earlyWarningActive = true;

    // Calculate approach direction
    let avgEnemyX = 0, avgEnemyY = 0;
    for (const e of earlyWarningEnemies) { avgEnemyX += e.x; avgEnemyY += e.y; }
    avgEnemyX /= threatCount;
    avgEnemyY /= threatCount;
    const approachAngle = Math.atan2(avgEnemyY - baseY, avgEnemyX - baseX);

    // Record attack direction in memory
    recordAttackDirection(ai, approachAngle, threatCount, baseX, baseY);

    // === AUTO STANCE: Raise to ALERT when enemies detected ===
    if (ai.defenseStance === DefenseStance.Peaceful && threatCount >= 3) {
        ai.defenseStance = DefenseStance.Alert;
        if (!wasAlreadyActive) {
            ai.log(`⚠️ CẢNH BÁO SỚM! ${threatCount} địch tiến về base từ hướng ${getDirectionName(approachAngle)}!`, '#ffaa00');
        }
    }
    // Escalate to FORTRESS if large force approaching
    if (threatCount >= 8 && ai.defenseStance !== DefenseStance.Fortress) {
        ai.defenseStance = DefenseStance.Fortress;
        ai.log(`🚨 KHẨN CẤP! ${threatCount} địch đại quân! CHUYỂN CHẾ ĐỘ PHÁO ĐÀI!`, '#ff4400');
    }

    // === PROACTIVE DEFENSE: Try chokepoint first, then standard intercept ===
    if (!wasAlreadyActive && ai.defenseStance >= DefenseStance.Alert) {
        // TIER-3: Try chokepoint defense first
        const usedChokepoint = handleChokepointDefense(ai);
        if (!usedChokepoint) {
            positionGarrisonForIntercept(ai, approachAngle, baseX, baseY);
        }
    }

    ai.earlyWarningCooldown = 2; // Check again in 2 seconds
}

// ===================================================================
//  POSITION GARRISON: LAYERED DEFENSE FORMATION (TIER-2 UPGRADE)
//  Layer 1 (Vanguard):  Cavalry — flanking from sides, fast intercept
//  Layer 2 (Frontline): Heavy melee — defensive wall in front of tower
//  Layer 3 (Backline):  Ranged + Heroes — DPS from behind tower
// ===================================================================
function positionGarrisonForIntercept(ai: AIContext, approachAngle: number, baseX: number, baseY: number): void {
    const garrison = ai.forceAllocation.garrisonUnits;
    if (garrison.length === 0) return;

    const towers = ai.getOwnTowers();

    // Find the tower closest to the approach direction
    let bestTower: Building | null = null;
    let bestTowerScore = -Infinity;
    for (const t of towers) {
        const towerAngle = Math.atan2(t.y - baseY, t.x - baseX);
        const angleDiff = Math.abs(normalizeAngle(towerAngle - approachAngle));
        const score = (Math.PI - angleDiff) / Math.PI;
        if (score > bestTowerScore) {
            bestTowerScore = score;
            bestTower = t;
        }
    }

    const ageIdx = Math.min(ai.aiState.age, TOWER_ATTACK_DATA.length - 1);
    const towerRange = TOWER_ATTACK_DATA[ageIdx].range;

    // === CLASSIFY UNITS INTO 3 LAYERS ===
    const cavalry: Unit[] = [];
    const melee: Unit[] = [];
    const ranged: Unit[] = [];

    for (const u of garrison) {
        if (isCavalryType(u.type)) {
            cavalry.push(u);
            ai.defenseLayerAssignments.set(u.id, DefenseLayer.Vanguard);
        } else if (isRangedType(u.type) || u.type === UnitType.Archer || u.isHero) {
            ranged.push(u);
            ai.defenseLayerAssignments.set(u.id, DefenseLayer.Backline);
        } else {
            melee.push(u);
            ai.defenseLayerAssignments.set(u.id, DefenseLayer.Frontline);
        }
    }

    // Intercept point
    const interceptDist = TILE_SIZE * 12;
    const interceptX = baseX + Math.cos(approachAngle) * interceptDist;
    const interceptY = baseY + Math.sin(approachAngle) * interceptDist;
    const spreadAngle = approachAngle + Math.PI / 2; // perpendicular

    // === LAYER 1: VANGUARD (Cavalry) — Flanking from both sides ===
    for (let i = 0; i < cavalry.length; i++) {
        const u = cavalry[i];
        if (u.state === UnitState.Attacking) continue;

        // Position cavalry on FLANKS — left and right of approach
        const side = i % 2 === 0 ? 1 : -1;
        const flankDist = TILE_SIZE * 6 + (Math.floor(i / 2)) * TILE_SIZE * 2;

        let targetX: number, targetY: number;
        if (bestTower && bestTowerScore > 0.5) {
            // Flank from tower sides
            targetX = bestTower.x + Math.cos(approachAngle) * (towerRange * 0.3) +
                Math.cos(spreadAngle) * flankDist * side;
            targetY = bestTower.y + Math.sin(approachAngle) * (towerRange * 0.3) +
                Math.sin(spreadAngle) * flankDist * side;
        } else {
            // Flank from intercept sides
            targetX = interceptX + Math.cos(approachAngle) * TILE_SIZE * 3 +
                Math.cos(spreadAngle) * flankDist * side;
            targetY = interceptY + Math.sin(approachAngle) * TILE_SIZE * 3 +
                Math.sin(spreadAngle) * flankDist * side;
        }

        ai.safeMoveTo(u, targetX, targetY);
        ai.defendingUnits.add(u.id);
    }

    // === LAYER 2: FRONTLINE (Heavy Melee) — Defensive wall ===
    for (let i = 0; i < melee.length; i++) {
        const u = melee[i];
        if (u.state === UnitState.Attacking) continue;

        const offset = (i - melee.length / 2) * TILE_SIZE * 2;
        let targetX: number, targetY: number;

        if (bestTower && bestTowerScore > 0.5) {
            targetX = bestTower.x + Math.cos(approachAngle) * (towerRange * 0.5) +
                Math.cos(spreadAngle) * offset;
            targetY = bestTower.y + Math.sin(approachAngle) * (towerRange * 0.5) +
                Math.sin(spreadAngle) * offset;
        } else {
            targetX = interceptX + Math.cos(spreadAngle) * offset;
            targetY = interceptY + Math.sin(spreadAngle) * offset;
        }

        ai.safeMoveTo(u, targetX, targetY);
        ai.defendingUnits.add(u.id);
    }

    // === LAYER 3: BACKLINE (Ranged + Heroes) — Behind tower, max DPS ===
    for (let i = 0; i < ranged.length; i++) {
        const u = ranged[i];
        if (u.state === UnitState.Attacking) continue;

        const offset = (i - ranged.length / 2) * TILE_SIZE * 2;
        let targetX: number, targetY: number;

        if (bestTower && bestTowerScore > 0.5) {
            // BEHIND tower
            targetX = bestTower.x - Math.cos(approachAngle) * TILE_SIZE * 3 +
                Math.cos(spreadAngle) * offset;
            targetY = bestTower.y - Math.sin(approachAngle) * TILE_SIZE * 3 +
                Math.sin(spreadAngle) * offset;
        } else {
            // Behind melee line
            targetX = interceptX - Math.cos(approachAngle) * TILE_SIZE * 5 +
                Math.cos(spreadAngle) * offset;
            targetY = interceptY - Math.sin(approachAngle) * TILE_SIZE * 5 +
                Math.sin(spreadAngle) * offset;
        }

        ai.safeMoveTo(u, targetX, targetY);
        ai.defendingUnits.add(u.id);
    }

    if (cavalry.length > 0) {
        ai.log(`⚔️ Phòng thủ 3 lớp: ${cavalry.length} kỵ binh sườn | ${melee.length} bộ binh tường | ${ranged.length} cung thủ sau`, '#00ccff');
    }
}

// ===================================================================
//  ATTACK DIRECTION MEMORY: Learn from past attacks to predict future
// ===================================================================
function recordAttackDirection(ai: AIContext, direction: number, severity: number, baseX: number, baseY: number): void {
    // Don't record duplicate directions too quickly
    const now = sharedIntel.gameTime;
    const recentSame = ai.attackHistory.find(
        h => Math.abs(normalizeAngle(h.direction - direction)) < 0.5 &&
            now - h.time < 30
    );
    if (recentSame) {
        recentSame.severity = Math.max(recentSame.severity, severity);
        return;
    }

    ai.attackHistory.push({ direction, time: now, severity });

    // Trim old entries
    ai.attackHistory = ai.attackHistory.filter(
        h => now - h.time < ATTACK_HISTORY_DECAY
    );
    if (ai.attackHistory.length > ATTACK_HISTORY_MAX) {
        ai.attackHistory = ai.attackHistory.slice(-ATTACK_HISTORY_MAX);
    }

    // Recalculate primary threat direction (weighted average)
    if (ai.attackHistory.length > 0) {
        let sinSum = 0, cosSum = 0, totalWeight = 0;
        for (const h of ai.attackHistory) {
            const recency = 1 - (now - h.time) / ATTACK_HISTORY_DECAY;
            const weight = h.severity * recency;
            sinSum += Math.sin(h.direction) * weight;
            cosSum += Math.cos(h.direction) * weight;
            totalWeight += weight;
        }
        if (totalWeight > 0) {
            ai.primaryThreatDirection = Math.atan2(sinSum / totalWeight, cosSum / totalWeight);
            ai.threatDirectionConfidence = Math.min(1.0, ai.attackHistory.length / 3);
        }
    }
}

// ===================================================================
//  TOWER-AWARE LURING: When defending, lure enemies into tower range
// ===================================================================
function towerLureDefense(ai: AIContext, defender: Unit, enemy: Unit): boolean {
    const nearestTower = ai.findNearestOwnTower(defender.x, defender.y);
    if (!nearestTower) return false;

    const ageIdx = Math.min(ai.aiState.age, TOWER_ATTACK_DATA.length - 1);
    const towerRange = TOWER_ATTACK_DATA[ageIdx].range;

    const enemyDistToTower = Math.hypot(enemy.x - nearestTower.x, enemy.y - nearestTower.y);
    const defenderDistToTower = Math.hypot(defender.x - nearestTower.x, defender.y - nearestTower.y);

    // Enemy is outside tower range but close enough to lure
    if (enemyDistToTower > towerRange && enemyDistToTower < towerRange * 2.5) {
        // Move defender to a position BETWEEN tower and enemy
        // This creates a "lure" — enemy follows defender into tower fire
        const angle = Math.atan2(enemy.y - nearestTower.y, enemy.x - nearestTower.x);
        const lureX = nearestTower.x + Math.cos(angle) * (towerRange * 0.7);
        const lureY = nearestTower.y + Math.sin(angle) * (towerRange * 0.7);

        // Only lure if defender is currently near tower
        if (defenderDistToTower < towerRange * 1.2) {
            ai.safeMoveTo(defender, lureX, lureY);
            ai.towerDefenseActive = true;
            return true;
        }
    }

    // Enemy IS within tower range — fight alongside tower!
    if (enemyDistToTower <= towerRange * 1.2) {
        // Stay near tower and attack (tower provides free DPS)
        defender.attackUnit(enemy);
        ai.towerDefenseActive = true;
        return true;
    }

    return false;
}

// ===================================================================
//  DEFENSE: Priority retreat when own base is attacked, or ally support
//  UPGRADED: Early Warning, Tower-Aware, Counter-attack, Pursuit
//  GARRISON RETURN: Defenders return to their barracks after defense
// ===================================================================
export function handleDefense(ai: AIContext): void {
    // === TIER-3: One-time chokepoint scan (runs once per game) ===
    if (!ai.chokepointScanDone && ai.aiState.age >= 2) {
        scanForChokepoints(ai);
    }

    // === TIER-1: Early Warning Perimeter Check ===
    earlyWarningCheck(ai);

    // === TIER-2: Proactive Defense Stance (timing prediction) ===
    proactiveDefenseStance(ai);

    // === TIER-3: Bait & Trap (runs when in Alert with early warning) ===
    if (ai.earlyWarningActive && ai.defenseStance === DefenseStance.Alert &&
        ai.difficulty !== AIDifficulty.Easy && !ai.trapState) {
        handleBaitAndTrap(ai);
    } else if (ai.trapState) {
        handleBaitAndTrap(ai); // Continue managing active trap
    }

    // Recalculate force allocation every defense tick
    ai.calculateForceAllocation();

    const ownBuildings = ai.entityManager.buildings.filter(
        b => b.alive && b.team === ai.team && b.built
    );
    const alliedBuildings = ai.entityManager.buildings.filter(
        b => b.alive && ai.entityManager.isAlly(ai.team, b.team) && b.built
    );

    const damagedOwnBuildings = ownBuildings.filter(b => b.hp < b.maxHp);
    const damagedAllyBuildings = alliedBuildings.filter(b => b.hp < b.maxHp && b.team !== ai.team);

    const military = ai.entityManager.units.filter(
        u => u.alive && u.team === ai.team && !u.isVillager
    );

    // ===== Detect villagers under attack (enemy near our villagers) =====
    const villagersUnderAttack: Unit[] = [];
    const ownVillagers = ai.entityManager.units.filter(
        u => u.alive && u.team === ai.team && u.isVillager
    );
    for (const v of ownVillagers) {
        const enemyNearVillager = ai.findNearestEnemyUnit(v.x, v.y, TILE_SIZE * 6);
        if (enemyNearVillager) {
            villagersUnderAttack.push(v);
        }
    }

    // Combine threat sources: damaged buildings AND villagers under attack
    const hasOwnBaseThreats = damagedOwnBuildings.length > 0 || villagersUnderAttack.length > 0;

    // ===== OWN BASE UNDER ATTACK =====
    if (hasOwnBaseThreats) {
        // Auto-escalate to Fortress stance when base is hit
        if (ai.defenseStance !== DefenseStance.Fortress) {
            ai.defenseStance = DefenseStance.Fortress;
        }

        // Report threat
        if (damagedOwnBuildings.length > 0) {
            const worstBuilding = damagedOwnBuildings.reduce((a, b) =>
                (a.hp / a.maxHp) < (b.hp / b.maxHp) ? a : b
            );
            const severity = Math.min(1.0, 1.0 - (worstBuilding.hp / worstBuilding.maxHp) + 0.3);
            ai.reportThreat(worstBuilding.x, worstBuilding.y, severity, ai.team);
        }
        if (villagersUnderAttack.length > 0) {
            const worstVillager = villagersUnderAttack.reduce((a, b) =>
                (a.hp / a.maxHp) < (b.hp / b.maxHp) ? a : b
            );
            ai.reportThreat(worstVillager.x, worstVillager.y, 0.8, ai.team);
        }

        // Record attack direction for memory
        const allAttackSources: { x: number; y: number }[] = [
            ...damagedOwnBuildings.map(b => ({ x: b.x, y: b.y })),
            ...villagersUnderAttack.map(v => ({ x: v.x, y: v.y })),
        ];
        let avgAttkX = 0, avgAttkY = 0;
        for (const s of allAttackSources) { avgAttkX += s.x; avgAttkY += s.y; }
        avgAttkX /= allAttackSources.length;
        avgAttkY /= allAttackSources.length;
        const atkDirection = Math.atan2(avgAttkY - ai.baseY, avgAttkX - ai.baseX);
        recordAttackDirection(ai, atkDirection, damagedOwnBuildings.length + villagersUnderAttack.length, ai.baseX, ai.baseY);

        // === TIER-2: Record full attack pattern (composition, timing) ===
        const allEnemiesNearBase = ai.entityManager.units.filter(
            u => u.alive && ai.entityManager.isEnemy(ai.team, u.team) &&
                Math.hypot(u.x - ai.baseX, u.y - ai.baseY) < TILE_SIZE * 25
        );
        recordAttackPattern(ai, allEnemiesNearBase, atkDirection, false);

        // Find ALL enemies near any of our damaged buildings or threatened villagers
        const allThreats: Unit[] = [];
        for (const dmgBldg of damagedOwnBuildings) {
            for (const u of ai.entityManager.units) {
                if (!u.alive || !ai.entityManager.isEnemy(ai.team, u.team)) continue;
                const d = Math.hypot(u.x - dmgBldg.x, u.y - dmgBldg.y);
                if (d < TILE_SIZE * 15 && !allThreats.includes(u)) {
                    allThreats.push(u);
                }
            }
        }
        for (const v of villagersUnderAttack) {
            for (const u of ai.entityManager.units) {
                if (!u.alive || !ai.entityManager.isEnemy(ai.team, u.team)) continue;
                const d = Math.hypot(u.x - v.x, u.y - v.y);
                if (d < TILE_SIZE * 8 && !allThreats.includes(u)) {
                    allThreats.push(u);
                }
            }
        }

        // Track enemy count trend
        const currentEnemyCount = allThreats.length;
        const wasWinning = currentEnemyCount < ai.lastDefenseEnemyCount;
        ai.lastDefenseEnemyCount = currentEnemyCount;

        if (allThreats.length === 0) {
            // ===== DEFENSE COMPLETE! All threats eliminated =====
            ai.defenseSuccessStreak++;
            ai.defenseStance = DefenseStance.Alert; // Stay alert after defense

            // === DEFENSE DONE — RALLY FORWARD instead of camping at barracks ===
            // Clear defending status and let normal rally logic take over
            for (const u of military) {
                if (!ai.defendingUnits.has(u.id)) continue;
                ai.defendingUnits.delete(u.id);

                // Instead of going back to barracks (which causes camping),
                // send them to rally point so they're ready for next action
                if (u.state !== UnitState.Attacking) {
                    const rallyX = ai.rallyX || (ownBuildings[0]?.x ?? 0);
                    const rallyY = ai.rallyY || (ownBuildings[0]?.y ?? 0);
                    ai.safeMoveTo(u,
                        rallyX + (Math.random() - 0.5) * TILE_SIZE * 6,
                        rallyY + (Math.random() - 0.5) * TILE_SIZE * 6
                    );
                }
            }

            // Counter-attack with attack squad only!
            const attackForce = ai.forceAllocation.attackUnits.concat(
                ai.forceAllocation.supportUnits
            );
            if (attackForce.length >= 3 && ai.counterAttackTimer <= 0 && damagedOwnBuildings.length > 0) {
                const worstBuilding = damagedOwnBuildings.reduce((a, b) =>
                    (a.hp / a.maxHp) < (b.hp / b.maxHp) ? a : b
                );
                ai.initiateCounterAttack(attackForce, worstBuilding);
            }

            ai.log(`🛡️ Phòng thủ xong! ${military.length} lính quay về doanh trại!`, '#44ff88');
            return;
        }

        // EMERGENCY: abort ongoing attack/support
        if (ai.waveState === 'attacking' || ai.waveState === 'supporting') {
            ai.waveState = 'gathering';
            ai.supportTimer = 0;
            ai.log("🛑 CĂN CỨ BỊ TẤN CÔNG! BỎ NHIỆM VỤ, RÚT VỀ NGAY!", "#ff0000");
        }

        const referenceBuilding = damagedOwnBuildings.length > 0
            ? damagedOwnBuildings.reduce((a, b) => (a.hp / a.maxHp) < (b.hp / b.maxHp) ? a : b)
            : ownBuildings[0];

        // PURSUIT: Chase retreating enemies (only with attack squad!)
        if (wasWinning && allThreats.length <= 3 && military.length > allThreats.length * 2 && referenceBuilding) {
            const furthestThreat = allThreats.reduce((a, b) => {
                const da = Math.hypot(a.x - referenceBuilding.x, a.y - referenceBuilding.y);
                const db = Math.hypot(b.x - referenceBuilding.x, b.y - referenceBuilding.y);
                return da > db ? a : b;
            });
            const distFromBase = Math.hypot(furthestThreat.x - referenceBuilding.x, furthestThreat.y - referenceBuilding.y);

            if (distFromBase > TILE_SIZE * 8) {
                ai.pursuitTarget = furthestThreat;
                ai.pursuitTimer = 15;
                const pursuitSquad = ai.forceAllocation.attackUnits;
                for (const u of pursuitSquad) {
                    u.attackUnit(furthestThreat);
                }
                ai.waveState = 'pursuit';
                ai.waveResetTimer = 20;
                ai.log(`🏹 Truy kích ${pursuitSquad.length} lính! (${ai.forceAllocation.garrisonUnits.length} lính giữ nhà)`, '#ffaa00');
                return;
            }
        }

        // === TOWER-AWARE SMART DEFENSE ===
        // Build threat map from BOTH buildings AND villagers
        type AttackSite = { x: number; y: number; label: string };
        const attackSites: AttackSite[] = [];

        for (const dmgBldg of damagedOwnBuildings) {
            attackSites.push({ x: dmgBldg.x, y: dmgBldg.y, label: 'building' });
        }
        for (const v of villagersUnderAttack) {
            attackSites.push({ x: v.x, y: v.y, label: 'villager' });
        }

        // Build threat map
        const threatsBySite = new Map<AttackSite, Unit[]>();
        for (const site of attackSites) {
            const nearbyEnemies: Unit[] = [];
            for (const t of allThreats) {
                const d = Math.hypot(t.x - site.x, t.y - site.y);
                if (d < TILE_SIZE * 15) {
                    nearbyEnemies.push(t);
                }
            }
            if (nearbyEnemies.length > 0) {
                threatsBySite.set(site, nearbyEnemies);
            }
        }

        // === TIER-1: TOWER-AWARE UNIT ASSIGNMENT ===
        // Each military unit: try to lure enemies to tower first, then standard defense
        ai.towerDefenseActive = false;

        for (const u of military) {
            let nearestSite: AttackSite | null = null;
            let nearestSiteDist = Infinity;
            for (const [site] of threatsBySite) {
                const d = Math.hypot(u.x - site.x, u.y - site.y);
                if (d < nearestSiteDist) {
                    nearestSiteDist = d;
                    nearestSite = site;
                }
            }

            if (!nearestSite) continue;

            const threatsAtSite = threatsBySite.get(nearestSite)!;
            let closestEnemy = threatsAtSite[0];
            let closestEnemyDist = Infinity;
            for (const t of threatsAtSite) {
                const d = Math.hypot(u.x - t.x, u.y - t.y);
                if (d < closestEnemyDist) {
                    closestEnemyDist = d;
                    closestEnemy = t;
                }
            }

            ai.defendingUnits.add(u.id);

            // === TOWER LURE: Try to pull enemy into tower range ===
            if (towerLureDefense(ai, u, closestEnemy)) {
                continue; // Successfully luring enemy toward tower
            }

            // === Standard defense (no tower nearby) ===
            if (u.state === UnitState.Attacking && u.attackTarget && u.attackTarget.alive) {
                const isTargetingThreat = allThreats.some(t => t === u.attackTarget);
                if (!isTargetingThreat) {
                    u.attackUnit(closestEnemy);
                }
            } else {
                u.attackUnit(closestEnemy);
            }
        }
        return;
    } else {
        ai.lastDefenseEnemyCount = 0;

        // === NO ACTIVE THREATS: Rally defenders FORWARD instead of camping ===
        if (ai.defendingUnits.size > 0) {
            for (const u of military) {
                if (!ai.defendingUnits.has(u.id)) continue;
                ai.defendingUnits.delete(u.id);

                // Send to rally point instead of barracks/TC
                if (u.state !== UnitState.Attacking) {
                    const rallyX = ai.rallyX || (ownBuildings[0]?.x ?? 0);
                    const rallyY = ai.rallyY || (ownBuildings[0]?.y ?? 0);
                    ai.safeMoveTo(u,
                        rallyX + (Math.random() - 0.5) * TILE_SIZE * 6,
                        rallyY + (Math.random() - 0.5) * TILE_SIZE * 6
                    );
                }
            }
            ai.log(`🏠 Hết mối đe dọa! Lính tập kết sẵn sàng tấn công.`, '#44ff88');
        }

        // Gradually relax stance if no threats — go all the way to Peaceful
        if (ai.defenseStance === DefenseStance.Fortress && !ai.earlyWarningActive) {
            ai.defenseStance = DefenseStance.Alert;
        } else if (ai.defenseStance === DefenseStance.Alert && !ai.earlyWarningActive) {
            ai.defenseStance = DefenseStance.Peaceful;
        }
    }

    // ===== ALLY BASE UNDER ATTACK (with pincer flanking!) =====
    if (damagedAllyBuildings.length > 0) {
        const worstAlly = damagedAllyBuildings.reduce((a, b) =>
            (a.hp / a.maxHp) < (b.hp / b.maxHp) ? a : b
        );
        const severity = Math.min(1.0, 1.0 - (worstAlly.hp / worstAlly.maxHp) + 0.3);
        ai.reportThreat(worstAlly.x, worstAlly.y, severity, worstAlly.team);

        const allyThreats: Unit[] = [];
        for (const u of ai.entityManager.units) {
            if (!u.alive || !ai.entityManager.isEnemy(ai.team, u.team)) continue;
            const d = Math.hypot(u.x - worstAlly.x, u.y - worstAlly.y);
            if (d < TILE_SIZE * 15) allyThreats.push(u);
        }
        if (allyThreats.length === 0) return;

        // PINCER ATTACK
        let enemyCX = 0, enemyCY = 0;
        for (const t of allyThreats) { enemyCX += t.x; enemyCY += t.y; }
        enemyCX /= allyThreats.length;
        enemyCY /= allyThreats.length;

        const flankAngle = Math.atan2(enemyCY - worstAlly.y, enemyCX - worstAlly.x);
        const flankX = enemyCX + Math.cos(flankAngle) * TILE_SIZE * 5;
        const flankY = enemyCY + Math.sin(flankAngle) * TILE_SIZE * 5;

        const defendCount = Math.max(3, Math.ceil(military.length * Math.min(1, severity + 0.3)));
        let sent = 0;

        for (const u of military) {
            if (sent >= defendCount) break;

            if (u.state === UnitState.Attacking) {
                const distToThreat = Math.hypot(u.x - enemyCX, u.y - enemyCY);
                if (distToThreat < TILE_SIZE * 8) continue;
            }

            if (sent < defendCount / 2) {
                const distToFlank = Math.hypot(u.x - flankX, u.y - flankY);
                if (distToFlank > TILE_SIZE * 6) {
                    ai.safeMoveTo(u, flankX + (Math.random() - 0.5) * TILE_SIZE * 3,
                        flankY + (Math.random() - 0.5) * TILE_SIZE * 3);
                } else {
                    const nearest = ai.findNearestEnemyUnit(u.x, u.y, TILE_SIZE * 10);
                    if (nearest) u.attackUnit(nearest);
                }
            } else {
                const nearest = allyThreats.reduce((a, b) =>
                    Math.hypot(a.x - u.x, a.y - u.y) < Math.hypot(b.x - u.x, b.y - u.y) ? a : b
                );
                u.attackUnit(nearest);
            }
            sent++;
        }

        if (sent > 0) {
            ai.log(`🔱 Tấn công gọng kìm! ${sent} lính bao vây địch tại căn cứ đồng minh!`, '#00ffaa');
        }
    }
}

// ===================================================================
//  COUNTER-ATTACK: After successful defense, push into enemy territory
//  TIER-1: Uses attack history to target the direction enemy came from
// ===================================================================
export function initiateCounterAttack(ai: AIContext, military: Unit[], lastAttackedBuilding: Building): void {
    const enemyBuildings = ai.getScoutedEnemyBuildings();

    let targetX: number, targetY: number;
    if (enemyBuildings.length > 0) {
        let nearest = enemyBuildings[0];
        let nearestDist = Infinity;
        for (const b of enemyBuildings) {
            const d = Math.hypot(b.x - lastAttackedBuilding.x, b.y - lastAttackedBuilding.y);
            if (d < nearestDist) { nearestDist = d; nearest = b; }
        }
        targetX = nearest.x;
        targetY = nearest.y;

        if (ai.defenseSuccessStreak >= 2) {
            const enemyTC = enemyBuildings.find(b => b.type === BuildingType.TownCenter);
            if (enemyTC) {
                targetX = enemyTC.x;
                targetY = enemyTC.y;
            }
        }
    } else if (ai.threatDirectionConfidence > 0.3) {
        // === TIER-1: Use attack memory to push in the direction attacks came from! ===
        targetX = lastAttackedBuilding.x + Math.cos(ai.primaryThreatDirection) * TILE_SIZE * 25;
        targetY = lastAttackedBuilding.y + Math.sin(ai.primaryThreatDirection) * TILE_SIZE * 25;
        ai.log(`🧠 Dùng trí nhớ tấn công: phản công về hướng ${getDirectionName(ai.primaryThreatDirection)}!`, '#aa88ff');
    } else {
        targetX = lastAttackedBuilding.x + (Math.random() - 0.5) * TILE_SIZE * 20;
        targetY = lastAttackedBuilding.y + (Math.random() - 0.5) * TILE_SIZE * 20;
    }

    ai.counterAttackTarget = { x: targetX, y: targetY };
    ai.counterAttackTimer = 25;
    ai.waveState = 'counterattack';
    ai.waveResetTimer = 25;

    for (const u of military) {
        if (u.state === UnitState.Attacking && u.attackTarget?.alive) continue;
        const enemy = ai.findNearestEnemyUnit(targetX, targetY, TILE_SIZE * 20);
        if (enemy) {
            u.attackUnit(enemy);
        } else {
            const enemyBldg = ai.findNearestEnemyBuilding(targetX, targetY, TILE_SIZE * 20);
            if (enemyBldg) {
                u.attackBuilding(enemyBldg);
            } else {
                ai.safeMoveTo(u, targetX + (Math.random() - 0.5) * TILE_SIZE * 4,
                    targetY + (Math.random() - 0.5) * TILE_SIZE * 4);
            }
        }
    }

    const streak = ai.defenseSuccessStreak >= 2 ? ' (PHẢN CÔNG MẠNH!)' : '';
    ai.log(`🔥 PHẢN CÔNG! ${military.length} lính xông vào căn cứ địch!${streak}`, '#ff6600');
}

// ===================================================================
//  TIER-2: ENHANCED ATTACK PATTERN RECORDING
//  Records full composition, timing, army size of each attack wave
//  Calculates average attack intervals & predicts next attack
// ===================================================================
export function recordAttackPattern(
    ai: AIContext,
    enemies: Unit[],
    direction: number,
    wasDefeated: boolean
): void {
    const now = sharedIntel.gameTime;

    // Analyze composition of this attack wave
    let melee = 0, ranged = 0, cavalry = 0, heroes = 0;
    for (const e of enemies) {
        if (!e.alive) continue;
        if (e.isHero) heroes++;
        else if (isCavalryType(e.type)) cavalry++;
        else if (isRangedType(e.type) || e.type === UnitType.Archer) ranged++;
        else if (!e.isVillager) melee++;
    }
    const armySize = melee + ranged + cavalry + heroes;
    if (armySize === 0) return;

    const severity = Math.min(1.0, armySize / 12);

    const record: AttackPatternRecord = {
        time: now,
        direction,
        armySize,
        composition: { melee, ranged, cavalry, heroes },
        severity,
        wasDefeated,
    };
    ai.attackPatterns.push(record);

    // Trim old records
    if (ai.attackPatterns.length > ATTACK_PATTERN_MAX) {
        ai.attackPatterns = ai.attackPatterns.slice(-ATTACK_PATTERN_MAX);
    }

    // Calculate average attack interval
    if (ai.lastAttackTime > 0) {
        const interval = now - ai.lastAttackTime;
        if (ai.averageAttackInterval === 0) {
            ai.averageAttackInterval = interval;
        } else {
            // Exponential moving average
            ai.averageAttackInterval = ai.averageAttackInterval * 0.6 + interval * 0.4;
        }
        ai.predictedNextAttackTime = now + ai.averageAttackInterval;
    }
    ai.lastAttackTime = now;

    // Update defense training priorities based on patterns
    updateDefenseTrainingPriority(ai);

    ai.log(
        `📊 Ghi nhớ đợt tấn công #${ai.attackPatterns.length}: ` +
        `${armySize} quân (${melee}M/${ranged}R/${cavalry}C/${heroes}H) ` +
        `từ ${getDirectionName(direction)}. ` +
        `Dự đoán đợt tiếp: ~${Math.round(ai.averageAttackInterval)}s`,
        '#aa88ff'
    );
}

// ===================================================================
//  TIER-2: ADAPTIVE DEFENSE TRAINING PRIORITY
//  Analyzes attack patterns to recommend counter-unit training
//  Triangle: Melee > Cavalry > Ranged > Melee
// ===================================================================
function updateDefenseTrainingPriority(ai: AIContext): void {
    const now = sharedIntel.gameTime;
    const recentPatterns = ai.attackPatterns.filter(
        p => now - p.time < 180 // Last 3 minutes
    );
    if (recentPatterns.length === 0) {
        ai.defenseTrainingPriority = {
            needAntiMelee: 0, needAntiRanged: 0, needAntiCavalry: 0,
            needMoreTowers: false, suggestedUnitType: null, lastUpdate: now,
        };
        return;
    }

    // Weighted average of enemy compositions (recent attacks weighted more)
    let totalMelee = 0, totalRanged = 0, totalCavalry = 0, totalHeroes = 0;
    let totalWeight = 0;
    for (const p of recentPatterns) {
        const recency = 1 - (now - p.time) / 180;
        const weight = p.severity * recency * (p.wasDefeated ? 0.7 : 1.3); // Undefeated attacks matter more
        totalMelee += p.composition.melee * weight;
        totalRanged += p.composition.ranged * weight;
        totalCavalry += p.composition.cavalry * weight;
        totalHeroes += p.composition.heroes * weight;
        totalWeight += weight;
    }

    if (totalWeight === 0) return;

    const avgMelee = totalMelee / totalWeight;
    const avgRanged = totalRanged / totalWeight;
    const avgCavalry = totalCavalry / totalWeight;
    const total = avgMelee + avgRanged + avgCavalry + 0.01; // avoid /0

    // Calculate counter-needs (0-1)
    const needAntiMelee = Math.min(1.0, (avgMelee / total) * 1.5);   // Counter with Archers
    const needAntiRanged = Math.min(1.0, (avgRanged / total) * 1.5);  // Counter with Cavalry
    const needAntiCavalry = Math.min(1.0, (avgCavalry / total) * 1.5); // Counter with Spearmen

    // Suggest the most needed unit type
    let suggestedUnitType: string | null = null;
    const maxNeed = Math.max(needAntiMelee, needAntiRanged, needAntiCavalry);
    if (maxNeed > 0.3) {
        if (maxNeed === needAntiMelee) suggestedUnitType = UnitType.Archer;
        else if (maxNeed === needAntiRanged) suggestedUnitType = UnitType.Knight;
        else suggestedUnitType = UnitType.Spearman;
    }

    // Should we build more towers?
    // If enemy sends big armies (avg 8+) or attacks frequently (interval < 40s)
    const avgArmySize = recentPatterns.reduce((s, p) => s + p.armySize, 0) / recentPatterns.length;
    const needMoreTowers = avgArmySize >= 8 || ai.averageAttackInterval < 40;

    ai.defenseTrainingPriority = {
        needAntiMelee,
        needAntiRanged,
        needAntiCavalry,
        needMoreTowers,
        suggestedUnitType,
        lastUpdate: now,
    };
}

// ===================================================================
//  TIER-2: PROACTIVE DEFENSE STANCE (based on timing prediction)
//  If we know roughly WHEN the next attack will come,
//  auto-escalate to Alert before it arrives
// ===================================================================
export function proactiveDefenseStance(ai: AIContext): void {
    if (ai.predictedNextAttackTime <= 0 || ai.averageAttackInterval <= 0) return;
    const now = sharedIntel.gameTime;
    const timeUntilAttack = ai.predictedNextAttackTime - now;

    // Window: 15 seconds before predicted attack → go to Alert
    if (timeUntilAttack > 0 && timeUntilAttack < 15 && ai.defenseStance === DefenseStance.Peaceful) {
        ai.defenseStance = DefenseStance.Alert;
        ai.log(
            `⏰ Dự đoán đợt tấn công tiếp trong ~${Math.round(timeUntilAttack)}s! Chuyển ALERT!`,
            '#ffcc00'
        );
        // Pre-position garrison toward threat direction
        const ownBuildings = ai.entityManager.buildings.filter(
            b => b.alive && b.team === ai.team && b.built
        );
        const aiTC = ownBuildings.find(b => b.type === BuildingType.TownCenter);
        if (aiTC && ai.threatDirectionConfidence > 0.3) {
            positionGarrisonForIntercept(ai, ai.primaryThreatDirection, aiTC.x, aiTC.y);
        }
    }

    // If predicted time has passed without attack, extend prediction
    if (timeUntilAttack < -20) {
        ai.predictedNextAttackTime = now + ai.averageAttackInterval * 0.7;
    }
}

// ===================================================================
//  TIER-3: CHOKEPOINT SCANNER
//  Scans terrain in radial directions from base. Measures walkable
//  width at each point. Narrow passages (1-4 tiles) = chokepoints.
//  Only runs ONCE per game (expensive operation).
// ===================================================================
export function scanForChokepoints(ai: AIContext): void {
    if (ai.chokepointScanDone) return;
    ai.chokepointScanDone = true;

    const ownBuildings = ai.entityManager.buildings.filter(
        b => b.alive && b.team === ai.team && b.built
    );
    const aiTC = ownBuildings.find(b => b.type === BuildingType.TownCenter);
    if (!aiTC) return;

    const map = ai.entityManager.map;
    const baseCol = Math.floor(aiTC.x / TILE_SIZE);
    const baseRow = Math.floor(aiTC.y / TILE_SIZE);
    const chokepoints: Chokepoint[] = [];

    // Scan in 8 directions from base
    const directions = [
        { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
        { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
        { dx: 1, dy: 1 }, { dx: -1, dy: -1 },
        { dx: 1, dy: -1 }, { dx: -1, dy: 1 },
    ];

    for (const dir of directions) {
        // Walk outward from base, check walkable width every 3 tiles
        for (let dist = 6; dist <= 22; dist += 3) {
            const checkCol = baseCol + dir.dx * dist;
            const checkRow = baseRow + dir.dy * dist;

            if (checkCol < 2 || checkCol >= MAP_COLS - 2 ||
                checkRow < 2 || checkRow >= MAP_ROWS - 2) continue;

            // Measure walkable width PERPENDICULAR to the direction
            const perpDx = -dir.dy; // perpendicular
            const perpDy = dir.dx;

            let walkableWidth = 0;
            // Check both sides from center
            for (let offset = -6; offset <= 6; offset++) {
                const c = checkCol + perpDx * offset;
                const r = checkRow + perpDy * offset;
                if (c >= 0 && c < MAP_COLS && r >= 0 && r < MAP_ROWS &&
                    map.isWalkable(c, r)) {
                    walkableWidth++;
                }
            }

            // Narrow passage = chokepoint (1-4 tiles wide)
            if (walkableWidth >= 1 && walkableWidth <= 4) {
                const facingAngle = Math.atan2(dir.dy, dir.dx);
                // Score: narrower passages closer to base = better
                const distScore = 1 - (dist - 6) / 16; // closer = higher
                const widthScore = 1 - (walkableWidth - 1) / 3; // narrower = higher
                const defenseScore = distScore * 0.4 + widthScore * 0.6;

                // Check not too close to existing chokepoint
                const tooClose = chokepoints.some(
                    cp => Math.hypot(cp.tileCol - checkCol, cp.tileRow - checkRow) < 5
                );
                if (!tooClose) {
                    chokepoints.push({
                        x: checkCol * TILE_SIZE + TILE_SIZE / 2,
                        y: checkRow * TILE_SIZE + TILE_SIZE / 2,
                        tileCol: checkCol,
                        tileRow: checkRow,
                        width: walkableWidth,
                        facingAngle,
                        defenseScore,
                    });
                }
            }
        }
    }

    // Sort by score (best first)
    chokepoints.sort((a, b) => b.defenseScore - a.defenseScore);
    ai.knownChokepoints = chokepoints.slice(0, 5); // Keep top 5

    if (ai.knownChokepoints.length > 0) {
        const best = ai.knownChokepoints[0];
        ai.log(
            `🞤 Phát hiện ${ai.knownChokepoints.length} điểm hẹp! ` +
            `Tốt nhất: ${best.width} tiles rộng tại hướng ${getDirectionName(best.facingAngle)} ` +
            `(score: ${best.defenseScore.toFixed(2)})`,
            '#ff88ff'
        );
    }
}

// ===================================================================
//  TIER-3: CHOKEPOINT DEFENSE
//  When enemies approach through a known chokepoint, position
//  defenders AT the chokepoint for maximum advantage.
//  Narrow passages force enemies into a killzone.
// ===================================================================
export function handleChokepointDefense(ai: AIContext): boolean {
    if (ai.knownChokepoints.length === 0) return false;
    if (!ai.earlyWarningActive || ai.earlyWarningEnemies.length < 3) return false;

    const ownBuildings = ai.entityManager.buildings.filter(
        b => b.alive && b.team === ai.team && b.built
    );
    const aiTC = ownBuildings.find(b => b.type === BuildingType.TownCenter);
    if (!aiTC) return false;

    // Find the chokepoint between base and approaching enemies
    let avgEX = 0, avgEY = 0;
    for (const e of ai.earlyWarningEnemies) { avgEX += e.x; avgEY += e.y; }
    avgEX /= ai.earlyWarningEnemies.length;
    avgEY /= ai.earlyWarningEnemies.length;

    const approachAngle = Math.atan2(avgEY - aiTC.y, avgEX - aiTC.x);

    // Find chokepoint that's between us and the enemy
    let bestChokepoint: Chokepoint | null = null;
    let bestScore = -Infinity;
    for (const cp of ai.knownChokepoints) {
        const cpAngle = Math.atan2(cp.y - aiTC.y, cp.x - aiTC.x);
        const angleDiff = Math.abs(normalizeAngle(cpAngle - approachAngle));

        // Chokepoint must be roughly in direction of enemy (within 45°)
        if (angleDiff > Math.PI / 4) continue;

        // Must be BETWEEN base and enemy (not behind base)
        const cpDist = Math.hypot(cp.x - aiTC.x, cp.y - aiTC.y);
        const enemyDist = Math.hypot(avgEX - aiTC.x, avgEY - aiTC.y);
        if (cpDist > enemyDist) continue;

        const score = cp.defenseScore * (1 - angleDiff / (Math.PI / 4));
        if (score > bestScore) {
            bestScore = score;
            bestChokepoint = cp;
        }
    }

    if (!bestChokepoint || bestScore < 0.2) return false;

    ai.activeChokepointDefense = bestChokepoint;

    // Position garrison AT the chokepoint
    const garrison = ai.forceAllocation.garrisonUnits;
    if (garrison.length === 0) return false;

    const cp = bestChokepoint;
    const cpAngle = Math.atan2(cp.y - aiTC.y, cp.x - aiTC.x);
    const perpAngle = cpAngle + Math.PI / 2;

    // Classify units for layered chokepoint defense
    const melee = garrison.filter(u => !isRangedType(u.type) && u.type !== UnitType.Archer && !isCavalryType(u.type));
    const ranged = garrison.filter(u => isRangedType(u.type) || u.type === UnitType.Archer || u.isHero);
    const cavalry = garrison.filter(u => isCavalryType(u.type));

    // Melee: Block the chokepoint mouth
    for (let i = 0; i < melee.length; i++) {
        const u = melee[i];
        if (u.state === UnitState.Attacking) continue;
        const offset = (i - melee.length / 2) * TILE_SIZE * 1.5;
        const tx = cp.x + Math.cos(perpAngle) * offset;
        const ty = cp.y + Math.sin(perpAngle) * offset;
        ai.safeMoveTo(u, tx, ty);
        ai.defendingUnits.add(u.id);
    }

    // Ranged: Behind chokepoint (safe DPS)
    for (let i = 0; i < ranged.length; i++) {
        const u = ranged[i];
        if (u.state === UnitState.Attacking) continue;
        const offset = (i - ranged.length / 2) * TILE_SIZE * 2;
        const tx = cp.x - Math.cos(cpAngle) * TILE_SIZE * 4 + Math.cos(perpAngle) * offset;
        const ty = cp.y - Math.sin(cpAngle) * TILE_SIZE * 4 + Math.sin(perpAngle) * offset;
        ai.safeMoveTo(u, tx, ty);
        ai.defendingUnits.add(u.id);
    }

    // Cavalry: Hide on flanks for pincer when enemy is stuck
    for (let i = 0; i < cavalry.length; i++) {
        const u = cavalry[i];
        if (u.state === UnitState.Attacking) continue;
        const side = i % 2 === 0 ? 1 : -1;
        const tx = cp.x + Math.cos(perpAngle) * TILE_SIZE * 8 * side
            + Math.cos(cpAngle) * TILE_SIZE * 3;
        const ty = cp.y + Math.sin(perpAngle) * TILE_SIZE * 8 * side
            + Math.sin(cpAngle) * TILE_SIZE * 3;
        ai.safeMoveTo(u, tx, ty);
        ai.defendingUnits.add(u.id);
    }

    ai.log(
        `🞤 PHÒNG THỦ ĐIỂM HẸP! ${melee.length}M chặn cửa | ${ranged.length}R phía sau | ` +
        `${cavalry.length}C phục kích (rộng ${cp.width} tiles)`, '#ff88ff'
    );
    return true;
}

// ===================================================================
//  TIER-3: BAIT & TRAP SYSTEM
//  Uses a fast/tanky unit as bait to lure enemies into tower killzone.
//  Ambush units wait hidden nearby and spring the trap when enemies
//  are committed to the killzone.
//  Phases: baiting → springing → complete
// ===================================================================
export function handleBaitAndTrap(ai: AIContext): void {
    const now = sharedIntel.gameTime;

    if (ai.trapCooldown > 0) {
        ai.trapCooldown -= 0.5;
        return;
    }

    // === ACTIVE TRAP: manage state machine ===
    if (ai.trapState) {
        manageTrapState(ai);
        return;
    }

    // === INITIATE NEW TRAP ===
    // Conditions: enemies in early warning zone, we have towers, enough units
    if (!ai.earlyWarningActive || ai.earlyWarningEnemies.length < 2) return;
    if (ai.defenseStance === DefenseStance.Fortress) return; // Too dangerous for traps

    const towers = ai.getOwnTowers();
    if (towers.length === 0) return;

    const garrison = ai.forceAllocation.garrisonUnits;
    if (garrison.length < 4) return; // Need at least 4 units (1 bait + 3 ambush)

    const ownBuildings = ai.entityManager.buildings.filter(
        b => b.alive && b.team === ai.team && b.built
    );
    const aiTC = ownBuildings.find(b => b.type === BuildingType.TownCenter);
    if (!aiTC) return;

    // Find enemies to lure
    const enemies = ai.earlyWarningEnemies;
    let avgEX = 0, avgEY = 0;
    for (const e of enemies) { avgEX += e.x; avgEY += e.y; }
    avgEX /= enemies.length;
    avgEY /= enemies.length;

    // Find the tower closest to the enemy direction
    const approachAngle = Math.atan2(avgEY - aiTC.y, avgEX - aiTC.x);
    let bestTower: Building | null = null;
    let bestTowerScore = -Infinity;
    for (const t of towers) {
        const tAngle = Math.atan2(t.y - aiTC.y, t.x - aiTC.x);
        const diff = Math.abs(normalizeAngle(tAngle - approachAngle));
        const score = (Math.PI - diff) / Math.PI;
        if (score > bestTowerScore) {
            bestTowerScore = score;
            bestTower = t;
        }
    }
    if (!bestTower || bestTowerScore < 0.3) return;

    const ageIdx = Math.min(ai.aiState.age, TOWER_ATTACK_DATA.length - 1);
    const towerRange = TOWER_ATTACK_DATA[ageIdx].range;

    // Killzone: right at the edge of tower range (lure enemies INTO range)
    const killzoneX = bestTower.x + Math.cos(approachAngle) * (towerRange * 0.6);
    const killzoneY = bestTower.y + Math.sin(approachAngle) * (towerRange * 0.6);

    // Select bait unit: prefer cavalry (fast), or tanky unit
    let baitUnit: Unit | null = null;
    for (const u of garrison) {
        if (isCavalryType(u.type)) { baitUnit = u; break; }
    }
    if (!baitUnit) {
        // Fallback: use the unit with highest HP
        baitUnit = garrison.reduce((a, b) => a.hp > b.hp ? a : b);
    }

    // Select ambush units (everyone except bait)
    const ambushUnits = garrison.filter(u => u.id !== baitUnit!.id).slice(0, 6);
    if (ambushUnits.length < 2) return;

    // Position ambush units BEHIND tower (hidden from enemy view)
    const perpAngle = approachAngle + Math.PI / 2;
    for (let i = 0; i < ambushUnits.length; i++) {
        const u = ambushUnits[i];
        const side = i % 2 === 0 ? 1 : -1;
        const hideDist = TILE_SIZE * 5;
        const tx = bestTower.x - Math.cos(approachAngle) * TILE_SIZE * 4
            + Math.cos(perpAngle) * hideDist * side * (Math.floor(i / 2) + 1) * 0.5;
        const ty = bestTower.y - Math.sin(approachAngle) * TILE_SIZE * 4
            + Math.sin(perpAngle) * hideDist * side * (Math.floor(i / 2) + 1) * 0.5;
        ai.safeMoveTo(u, tx, ty);
    }

    // Create trap state
    ai.trapState = {
        phase: 'baiting',
        baitUnitId: baitUnit.id,
        killzoneX,
        killzoneY,
        ambushUnitIds: ambushUnits.map(u => u.id),
        nearestTowerId: bestTower.id,
        startTime: now,
        targetEnemyIds: enemies.map(e => e.id),
    };

    // Send bait TOWARD enemies (it will fall back to killzone)
    const baitTargetX = avgEX - Math.cos(approachAngle) * TILE_SIZE * 3;
    const baitTargetY = avgEY - Math.sin(approachAngle) * TILE_SIZE * 3;
    ai.safeMoveTo(baitUnit, baitTargetX, baitTargetY);

    ai.log(
        `🎣 BẫđY BẮĐ ĐẦU! Mồi: ${baitUnit.type} | Phục kích: ${ambushUnits.length} lính | ` +
        `Killzone gần tower`, '#ff4488'
    );
}

// Manage the active trap state machine
function manageTrapState(ai: AIContext): void {
    const trap = ai.trapState!;
    const now = sharedIntel.gameTime;

    // Safety timeout
    if (now - trap.startTime > 30) {
        ai.log(`❌ Bẫđy hết thời gian. Hủy tất cả.`, '#ff6666');
        resetTrap(ai);
        return;
    }

    const baitUnit = ai.entityManager.units.find(u => u.id === trap.baitUnitId && u.alive);
    if (!baitUnit) {
        ai.log(`❌ Mồi nhử đã chết! Hủy bẫđy.`, '#ff6666');
        resetTrap(ai);
        return;
    }

    const tower = ai.entityManager.buildings.find(b => b.id === trap.nearestTowerId && b.alive);
    if (!tower) { resetTrap(ai); return; }

    const ageIdx = Math.min(ai.aiState.age, TOWER_ATTACK_DATA.length - 1);
    const towerRange = TOWER_ATTACK_DATA[ageIdx].range;

    // Check how many target enemies are NEAR the killzone
    let enemiesInKillzone = 0;
    for (const eid of trap.targetEnemyIds) {
        const e = ai.entityManager.units.find(u => u.id === eid && u.alive);
        if (e && Math.hypot(e.x - trap.killzoneX, e.y - trap.killzoneY) < towerRange * 1.2) {
            enemiesInKillzone++;
        }
    }

    if (trap.phase === 'baiting') {
        // Bait is out — check if enemies are chasing
        const baitDist = Math.hypot(baitUnit.x - trap.killzoneX, baitUnit.y - trap.killzoneY);

        // If bait is far from killzone, pull it back
        if (baitDist > TILE_SIZE * 3 || now - trap.startTime > 8) {
            ai.safeMoveTo(baitUnit, trap.killzoneX, trap.killzoneY);
        }

        // If enemies followed bait into killzone → SPRING THE TRAP!
        if (enemiesInKillzone >= 2 || (enemiesInKillzone >= 1 && now - trap.startTime > 10)) {
            trap.phase = 'springing';
            ai.log(
                `💥 BẫĐY KÍCH HOẠT! ${enemiesInKillzone} địch trong killzone! XUẤT KÍCH!`,
                '#ff0044'
            );
        }
    }

    if (trap.phase === 'springing') {
        // All ambush units: ATTACK enemies in killzone!
        for (const uid of trap.ambushUnitIds) {
            const u = ai.entityManager.units.find(uu => uu.id === uid && uu.alive);
            if (!u) continue;

            // Find nearest enemy in killzone
            let nearestEnemy: Unit | null = null;
            let nearestDist = Infinity;
            for (const eid of trap.targetEnemyIds) {
                const e = ai.entityManager.units.find(uu => uu.id === eid && uu.alive);
                if (!e) continue;
                const d = Math.hypot(e.x - u.x, e.y - u.y);
                if (d < nearestDist) { nearestDist = d; nearestEnemy = e; }
            }

            if (nearestEnemy) {
                u.attackUnit(nearestEnemy);
            }
        }

        // Bait unit also fights now
        const nearestE = ai.findNearestEnemyUnit(baitUnit.x, baitUnit.y, TILE_SIZE * 10);
        if (nearestE) baitUnit.attackUnit(nearestE);

        // Check if trap is complete (all target enemies dead or fled)
        const aliveTargets = trap.targetEnemyIds.filter(
            eid => ai.entityManager.units.some(u => u.id === eid && u.alive)
        );
        if (aliveTargets.length === 0 || enemiesInKillzone === 0) {
            trap.phase = 'complete';
            ai.log(`✅ Bẫđy thành công! ${trap.targetEnemyIds.length - aliveTargets.length} địch bị tiêu diệt!`, '#44ff88');
            resetTrap(ai);
        }
    }
}

function resetTrap(ai: AIContext): void {
    ai.trapState = null;
    ai.trapCooldown = 45; // 45s cooldown between traps
}

// ===================================================================
//  UTILITY: Direction name helper
// ===================================================================
function getDirectionName(angle: number): string {
    const deg = ((angle * 180 / Math.PI) % 360 + 360) % 360;
    if (deg < 22.5 || deg >= 337.5) return 'Đông';
    if (deg < 67.5) return 'Đông-Nam';
    if (deg < 112.5) return 'Nam';
    if (deg < 157.5) return 'Tây-Nam';
    if (deg < 202.5) return 'Tây';
    if (deg < 247.5) return 'Tây-Bắc';
    if (deg < 292.5) return 'Bắc';
    return 'Đông-Bắc';
}

function normalizeAngle(a: number): number {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
}
