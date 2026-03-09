// ============================================================
//  AI Combat Manager — Combat, retreat, focus fire, micro
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
import { sharedIntel } from "./AIConfig";

// All methods receive AIContext (the AIController instance)

// ===================================================================
//  COMBAT: Improved AI combat with ally awareness
// ===================================================================
export function handleCombat(ai: AIContext): void {
    // === TACTICAL RETREAT EVALUATION ===
    // Check if our attacking force is outmatched and should retreat
    ai.evaluateBattlefield();

    const aiUnits = ai.entityManager.units.filter(
        u => u.alive && u.team === ai.team
    );
    const isAttacking = ai.waveState === 'attacking';
    const isSupporting = ai.waveState === 'supporting';
    const isCounterAttacking = ai.waveState === 'counterattack';
    const isPursuing = ai.waveState === 'pursuit';
    const isRetreating = ai.waveState === 'retreating';
    const isAggressive = isAttacking || isSupporting || isCounterAttacking || isPursuing;

    for (const u of aiUnits) {
        // Skip building villagers
        if (u.state === UnitState.Building) continue;
        if (u.state === UnitState.Gathering) continue;

        // --- VILLAGER BEHAVIOR ---
        if (u.isVillager) {
            ai.handleVillagerCombat(u);
            continue;
        }

        // --- RETREATING BEHAVIOR ---
        // When retreating, only fight if enemy is very close, otherwise keep running
        if (isRetreating) {
            const veryCloseEnemy = ai.findNearestEnemyUnit(u.x, u.y, TILE_SIZE * 4);
            if (veryCloseEnemy && u.hp > u.maxHp * 0.3) {
                // Fight back only if close enough and healthy enough
                u.attackUnit(veryCloseEnemy);
            } else if (u.state === UnitState.Idle) {
                // Idle near rally? Hold position. Far from rally? Run to it.
                const distToRally = Math.hypot(u.x - ai.retreatRallyX, u.y - ai.retreatRallyY);
                if (distToRally > TILE_SIZE * 8) {
                    const angle = Math.random() * Math.PI * 2;
                    ai.safeMoveTo(u,
                        ai.retreatRallyX + Math.cos(angle) * TILE_SIZE * 3,
                        ai.retreatRallyY + Math.sin(angle) * TILE_SIZE * 3
                    );
                }
            }
            continue;
        }

        // --- MILITARY BEHAVIOR ---

        // === SCOUT DEDICATED BEHAVIOR (checked FIRST, before general combat) ===
        // Scouts have a primary mission: explore the ENTIRE map (excluding water)
        // Only after exploration is complete do they join the combat force
        if (u.type === UnitType.Scout) {
            // Check exploration status periodically
            ai.checkExplorationComplete();

            if (!ai.explorationComplete) {
                // EXPLORATION NOT DONE: Scout's #1 job is to explore
                // Only fight if enemy is very close (self-defense)
                const nearbyThreat = ai.findNearestEnemyUnit(u.x, u.y, TILE_SIZE * 5);
                if (nearbyThreat && u.hp > u.maxHp * 0.4) {
                    // Report enemy position then flee (scouts are not fighters)
                    ai.reportThreat(nearbyThreat.x, nearbyThreat.y, 0.9);
                    ai.knownEnemyPositions.set(
                        nearbyThreat.id ?? 0,
                        { x: nearbyThreat.x, y: nearbyThreat.y, time: sharedIntel.gameTime }
                    );
                    // Run away from enemy (opposite direction)
                    const fleeAngle = Math.atan2(u.y - nearbyThreat.y, u.x - nearbyThreat.x);
                    ai.safeMoveTo(u,
                        u.x + Math.cos(fleeAngle) * TILE_SIZE * 8,
                        u.y + Math.sin(fleeAngle) * TILE_SIZE * 8
                    );
                } else if (u.state === UnitState.Idle || u.state === UnitState.Attacking) {
                    // Keep exploring! (even if was attacking, disengage and explore)
                    ai.sendToExplore(u);
                }
                continue; // Don't do any other combat logic
            }

            // EXPLORATION COMPLETE: Scout joins the army
            // If idle, return to where military is grouped
            if (u.state === UnitState.Idle && !isAggressive) {
                ai.returnScoutToArmy(u);
                continue;
            }
            // Otherwise fall through to normal military behavior (attack with army)
        }

        // Already attacking? Apply smart combat logic
        if (u.state === UnitState.Attacking) {
            ai.handleActiveAttacker(u, aiUnits, isAggressive);
            continue;
        }

        // Sight range depends on phase, support status, and difficulty
        const baseSight = (isAggressive || isSupporting) ? TILE_SIZE * 20 : TILE_SIZE * 10;
        const sightRange = baseSight * ai.params.combatAwareness;

        // PRIORITY 1: Help nearby allied units in combat
        const alliedUnitInCombat = ai.findAllyInCombat(u.x, u.y, TILE_SIZE * 12); // Increased from 8 to 12
        if (alliedUnitInCombat) {
            // Find who's attacking our ally
            const allyAttacker = ai.findNearestEnemyUnit(
                alliedUnitInCombat.x, alliedUnitInCombat.y, TILE_SIZE * 8 // Increased from 6 to 8
            );
            if (allyAttacker) {
                u.attackUnit(allyAttacker);
                // Report threat to shared intel
                ai.reportThreat(allyAttacker.x, allyAttacker.y, 0.8, alliedUnitInCombat.team);
                continue;
            }
        }

        // PRIORITY 2: Engage nearest enemy unit
        const nearestEnemy = ai.findNearestEnemyUnit(u.x, u.y, sightRange);
        if (nearestEnemy) {
            // Smart target selection: pick weakest or most dangerous
            const bestTarget = ai.selectBestTarget(u, sightRange);
            u.attackUnit(bestTarget || nearestEnemy);

            // Remember enemy position
            ai.knownEnemyPositions.set(
                (bestTarget || nearestEnemy).id ?? 0,
                { x: nearestEnemy.x, y: nearestEnemy.y, time: sharedIntel.gameTime }
            );

            // FOCUS FIRE: nearby allies also attack same target
            if (isAggressive) {
                ai.callFocusFire(u, bestTarget || nearestEnemy, aiUnits);
            }
            continue;
        }

        // PRIORITY 3: Attack enemy buildings
        // Ensures units destroy ALL nearby buildings (including Farms) when attacking, or if they stumble too close while gathering
        if (u.state === UnitState.Idle || u.state === UnitState.Moving) {
            const buildingSightRange = isAggressive ? TILE_SIZE * 15 : TILE_SIZE * 8; // If not aggressive, only attack if very close
            const nearestEnemyBuilding = ai.findNearestEnemyBuilding(u.x, u.y, buildingSightRange);
            if (nearestEnemyBuilding) {
                u.attackBuilding(nearestEnemyBuilding);
                continue;
            } else if (isAttacking) {
                // No buildings in range? Move toward known enemy location
                ai.moveTowardEnemy(u);
            }
        }

        // PRIORITY 4: If idle and supporting, move toward support target OR attack nearby enemies
        if (isSupporting && ai.supportTarget && u.state === UnitState.Idle) {
            // Check for enemies near the support target first
            const enemyNearSupport = ai.findNearestEnemyUnit(u.x, u.y, TILE_SIZE * 15);
            if (enemyNearSupport) {
                u.attackUnit(enemyNearSupport);
                continue;
            }

            const dist = Math.hypot(u.x - ai.supportTarget.x, u.y - ai.supportTarget.y);
            if (dist > TILE_SIZE * 5) {
                ai.safeMoveTo(u,
                    ai.supportTarget.x + (Math.random() - 0.5) * TILE_SIZE * 3,
                    ai.supportTarget.y + (Math.random() - 0.5) * TILE_SIZE * 3
                );
            }
        }

        // PRIORITY 5: Pursuit — chase the retreating enemy
        if (isPursuing && ai.pursuitTarget && u.state === UnitState.Idle) {
            if (ai.pursuitTarget.alive) {
                u.attackUnit(ai.pursuitTarget);
            } else {
                // Pursuit target dead — find another nearby enemy
                const next = ai.findNearestEnemyUnit(u.x, u.y, TILE_SIZE * 12);
                if (next) {
                    ai.pursuitTarget = next;
                    u.attackUnit(next);
                }
            }
        }

        // PRIORITY 6: Counter-attack — push toward enemy base
        if (isCounterAttacking && ai.counterAttackTarget && u.state === UnitState.Idle) {
            const enemy = ai.findNearestEnemyUnit(u.x, u.y, TILE_SIZE * 12);
            if (enemy) {
                u.attackUnit(enemy);
            } else {
                const enemyBldg = ai.findNearestEnemyBuilding(u.x, u.y, TILE_SIZE * 15);
                if (enemyBldg) {
                    u.attackBuilding(enemyBldg);
                } else {
                    ai.safeMoveTo(u,
                        ai.counterAttackTarget.x + (Math.random() - 0.5) * TILE_SIZE * 4,
                        ai.counterAttackTarget.y + (Math.random() - 0.5) * TILE_SIZE * 4
                    );
                }
            }
        }

        // PRIORITY 7: PROACTIVE BASE DEFENSE — idle military near base auto-engage enemies
        // This prevents the "standing around" problem when returning to defend
        if (!isAggressive && (u.state === UnitState.Idle || u.state === UnitState.Moving)) {
            const aiTC = ai.entityManager.buildings.find(
                b => b.alive && b.team === ai.team && b.type === BuildingType.TownCenter
            );
            if (aiTC) {
                const distToBase = Math.hypot(u.x - aiTC.x, u.y - aiTC.y);
                // Units within 15 tiles of base actively scan for enemies
                if (distToBase < TILE_SIZE * 15) {
                    const enemyNearBase = ai.findNearestEnemyUnit(u.x, u.y, TILE_SIZE * 12);
                    if (enemyNearBase) {
                        u.attackUnit(enemyNearBase);
                        continue;
                    }
                    // Also check for enemy units near any of our buildings
                    const damagedBldg = ai.entityManager.buildings.find(
                        b => b.alive && b.team === ai.team && b.built && b.hp < b.maxHp
                    );
                    if (damagedBldg) {
                        const threatNearBldg = ai.findNearestEnemyUnit(
                            damagedBldg.x, damagedBldg.y, TILE_SIZE * 10
                        );
                        if (threatNearBldg) {
                            u.attackUnit(threatNearBldg);
                            continue;
                        }
                    }
                }
            }
        }
    }
}

// --- Smart Villager combat behavior (TIER-1 UPGRADE) ---
// Villagers flee to NEAREST safe building, avoid running into danger
export function handleVillagerCombat(ai: AIContext, u: Unit): void {
    const closeThreat = ai.findNearestEnemyUnit(u.x, u.y, TILE_SIZE * 5);
    if (!closeThreat) return;

    const distToThreat = Math.hypot(u.x - closeThreat.x, u.y - closeThreat.y);

    // If gathering and threat is far-ish (4-5 tiles), just report but keep working
    if (u.state === UnitState.Gathering && distToThreat > TILE_SIZE * 4) {
        ai.reportThreat(closeThreat.x, closeThreat.y, 0.5);
        return;
    }

    // Only interrupt idle, moving, or close threat while gathering
    if (u.state !== UnitState.Idle && u.state !== UnitState.Moving &&
        !(u.state === UnitState.Gathering && distToThreat <= TILE_SIZE * 4)) {
        return;
    }

    // Report threat immediately
    ai.reportThreat(closeThreat.x, closeThreat.y, 0.7);

    // === SMART FLEE: Find NEAREST safe building (not just TC!) ===
    // Safe buildings: TC, Market (Kho), Tower — any building that is behind us
    const ownBuildings = ai.entityManager.buildings.filter(
        b => b.alive && b.team === ai.team && b.built
    );

    // Direction AWAY from enemy
    const fleeAngle = Math.atan2(u.y - closeThreat.y, u.x - closeThreat.x);

    let bestShelter: Building | null = null;
    let bestScore = -Infinity;

    for (const b of ownBuildings) {
        const distToBldg = Math.hypot(u.x - b.x, u.y - b.y);

        // Score: prefer closer buildings that are IN THE OPPOSITE DIRECTION of enemy
        const angleToBldg = Math.atan2(b.y - u.y, b.x - u.x);
        const angleDiff = Math.abs(angleToBldg - fleeAngle);
        const directionScore = Math.cos(angleDiff); // 1 = same direction as flee, -1 = toward enemy

        // Don't run TOWARD the enemy!
        if (directionScore < -0.3 && distToBldg > TILE_SIZE * 5) continue;

        let score = 0;
        score += directionScore * 30;  // Prefer buildings away from threat
        score -= distToBldg / TILE_SIZE * 2; // Prefer closer buildings

        // Bonus for buildings that provide cover
        if (b.type === BuildingType.TownCenter) score += 15; // TC is safest
        if (b.type === BuildingType.Tower) score += 20;       // Tower gives fire support!
        if (b.type === BuildingType.Market) score += 5;        // Can hide behind market

        if (score > bestScore) {
            bestScore = score;
            bestShelter = b;
        }
    }

    if (bestShelter) {
        ai.safeMoveTo(u,
            bestShelter.x + (Math.random() - 0.5) * TILE_SIZE * 2,
            bestShelter.y + (Math.random() - 0.5) * TILE_SIZE * 2
        );
    } else {
        // No safe building found — just run away from enemy
        ai.safeMoveTo(u,
            u.x + Math.cos(fleeAngle) * TILE_SIZE * 8,
            u.y + Math.sin(fleeAngle) * TILE_SIZE * 8
        );
    }
}

// --- Smart combat for units already attacking ---
export function handleActiveAttacker(ai: AIContext, u: Unit, aiUnits: Unit[], isAggressive: boolean): void {
    // ADVANCED KITING: Ranged units maintain optimal range
    if (isRangedType(u.type) && u.attackTarget && u.attackTarget.alive) {
        const distToTarget = Math.hypot(u.x - u.attackTarget.x, u.y - u.attackTarget.y);
        const optimalRange = u.data.range * 0.8; // Stay at 80% max range

        // Step back if melee enemies get too close
        if (distToTarget < TILE_SIZE * 3.5) {
            const angleAway = Math.atan2(u.y - u.attackTarget.y, u.x - u.attackTarget.x);
            // Kite sideways slightly (not straight back) to avoid clumping
            const sideOffset = (Math.random() - 0.5) * 0.6;
            const safeX = u.x + Math.cos(angleAway + sideOffset) * TILE_SIZE * 4;
            const safeY = u.y + Math.sin(angleAway + sideOffset) * TILE_SIZE * 4;
            ai.safeMoveTo(u, safeX, safeY);
            return;
        }

        // If target is too close for optimal DPS, step back slightly
        if (!isRangedType(u.attackTarget.type) && distToTarget < optimalRange * 0.6) {
            const angleAway = Math.atan2(u.y - u.attackTarget.y, u.x - u.attackTarget.x);
            ai.safeMoveTo(u,
                u.x + Math.cos(angleAway) * TILE_SIZE * 2,
                u.y + Math.sin(angleAway) * TILE_SIZE * 2
            );
            return;
        }
    }

    // SURROUND LOGIC: Melee units try to surround target from different angles
    if (!isRangedType(u.type) && u.attackTarget && u.attackTarget.alive) {
        const distToTarget = Math.hypot(u.x - u.attackTarget.x, u.y - u.attackTarget.y);
        // If we're too far from target and idle, move to attack range
        if (distToTarget > u.data.range + TILE_SIZE * 2 && u.state !== UnitState.Attacking) {
            // Calculate approach angle to avoid clumping with other melee
            const alliesNearTarget = aiUnits.filter(
                a => a !== u && !a.isVillager && a.alive && a.attackTarget === u.attackTarget &&
                    Math.hypot(a.x - u.attackTarget!.x, a.y - u.attackTarget!.y) < TILE_SIZE * 4
            );
            if (alliesNearTarget.length >= 2) {
                // Approach from flanking angle
                const baseAngle = Math.atan2(u.y - u.attackTarget.y, u.x - u.attackTarget.x);
                const flankAngle = baseAngle + Math.PI + (Math.random() - 0.5) * Math.PI;
                const flankX = u.attackTarget.x + Math.cos(flankAngle) * u.data.range * 0.8;
                const flankY = u.attackTarget.y + Math.sin(flankAngle) * u.data.range * 0.8;
                ai.safeMoveTo(u, flankX, flankY);
                return;
            }
        }
    }

    // OUTNUMBERED CHECK: Proportional response
    const localRange = TILE_SIZE * 8;
    const nearbyFriendlies = aiUnits.filter(
        a => a !== u && !a.isVillager && a.alive &&
            Math.hypot(a.x - u.x, a.y - u.y) < localRange
    ).length;
    const nearbyEnemyCount = ai.entityManager.units.filter(
        e => e.alive && ai.entityManager.isEnemy(ai.team, e.team) &&
            Math.hypot(e.x - u.x, e.y - u.y) < localRange
    ).length;

    // If outnumbered 3:1 or worse, and HP < 50%, retreat this unit
    if (nearbyEnemyCount >= (nearbyFriendlies + 1) * 3 && u.hp < u.maxHp * 0.5 && !u.isHero) {
        const safeBldg = ai.findNearestAllyBuilding(u.x, u.y);
        if (safeBldg) {
            ai.safeMoveTo(u, safeBldg.x + (Math.random() - 0.5) * TILE_SIZE * 3,
                safeBldg.y + (Math.random() - 0.5) * TILE_SIZE * 3);
        }
        return;
    }

    // SMART HEALTH-BASED RETREAT: Injured units swap with fresh ones
    if (u.hp < u.maxHp * 0.35 && !isAggressive && !u.isHero) {
        // Find a healthy ally nearby who is idle — they take over
        const healthyReplacement = aiUnits.find(
            a => a !== u && !a.isVillager && a.alive && !a.isHero &&
                a.hp > a.maxHp * 0.7 && a.state === UnitState.Idle &&
                Math.hypot(a.x - u.x, a.y - u.y) < TILE_SIZE * 10
        );
        if (healthyReplacement && u.attackTarget) {
            healthyReplacement.attackUnit(u.attackTarget);
        }
        const safeBldg = ai.findNearestAllyBuilding(u.x, u.y);
        if (safeBldg) {
            ai.safeMoveTo(u, safeBldg.x, safeBldg.y);
        }
        return;
    }

    // HERO special: Heroes don't retreat as easily, they fight to 15%
    if (u.isHero && u.hp < u.maxHp * 0.15) {
        const safeBldg = ai.findNearestAllyBuilding(u.x, u.y);
        if (safeBldg) ai.safeMoveTo(u, safeBldg.x, safeBldg.y);
        return;
    }

    // SMART RETARGET: If current target is far/dead, find better target
    if (u.attackTarget && (!u.attackTarget.alive || Math.hypot(u.x - u.attackTarget.x, u.y - u.attackTarget.y) > TILE_SIZE * 8)) {
        const better = ai.selectBestTarget(u, TILE_SIZE * 8);
        if (better) {
            u.attackUnit(better);
        } else {
            const closer = ai.findNearestEnemyUnit(u.x, u.y, TILE_SIZE * 6);
            if (closer) u.attackUnit(closer);
        }
    }

    // FOCUS FIRE ENFORCEMENT: If many allies are attacking a different target nearby
    // and that target is about to die, help finish it off
    if (u.attackTarget && u.attackTarget.alive && isAggressive) {
        const nearbyAlliesAttacking = aiUnits.filter(
            a => a !== u && a.alive && !a.isVillager &&
                a.state === UnitState.Attacking && a.attackTarget && a.attackTarget.alive &&
                a.attackTarget !== u.attackTarget &&
                Math.hypot(a.x - u.x, a.y - u.y) < TILE_SIZE * 6
        );
        // Count how many are on the same target
        const targetCounts = new Map<Unit, number>();
        for (const a of nearbyAlliesAttacking) {
            const t = a.attackTarget!;
            targetCounts.set(t, (targetCounts.get(t) || 0) + 1);
        }
        // Find the most focused target
        let bestFocusTarget: Unit | null = null;
        let maxCount = 2; // Only join if 3+ are already on it
        for (const [target, count] of targetCounts) {
            if (count > maxCount && target.hp < target.maxHp * 0.5) {
                maxCount = count;
                bestFocusTarget = target;
            }
        }
        if (bestFocusTarget) {
            u.attackUnit(bestFocusTarget);
        }
    }
}

// ===================================================================
//  COMBAT POWER: Evaluate total combat strength of a group
// ===================================================================
export function calculateCombatPower(ai: AIContext, units: Unit[]): number {
    let power = 0;
    for (const u of units) {
        if (!u.alive) continue;
        // Power = (current HP) * (DPS estimate) + range bonus
        const dps = u.attack / (u.data.attackSpeed || 1.5);
        const rangeFactor = u.data.range > 80 ? 1.3 : 1.0; // ranged units are worth more
        const heroFactor = u.isHero ? 2.0 : 1.0;
        power += u.hp * dps * rangeFactor * heroFactor * 0.05;
    }
    return power;
}

// ===================================================================
//  BATTLEFIELD EVALUATION: Decide if attacking force should retreat
//  Called periodically during combat to check if we're losing
// ===================================================================
export function evaluateBattlefield(ai: AIContext): void {
    if (ai.waveState !== 'attacking' && ai.waveState !== 'counterattack') return;
    // Don't retreat too early — need at least 5s of combat
    if (ai.waveResetTimer > 30) return;

    // Find our attacking military (non-garrison, in combat or aggressive area)
    const ownMilitary = ai.entityManager.units.filter(
        u => u.alive && u.team === ai.team && !u.isVillager &&
            (u.state === UnitState.Attacking || u.state === UnitState.Moving)
    );
    if (ownMilitary.length < 2) return; // Too few to evaluate

    // Calculate center of our attacking force
    let avgX = 0, avgY = 0;
    for (const u of ownMilitary) { avgX += u.x; avgY += u.y; }
    avgX /= ownMilitary.length;
    avgY /= ownMilitary.length;

    // Find nearby enemies around our force center
    const battleRadius = TILE_SIZE * 15;
    const nearbyEnemies = ai.entityManager.units.filter(
        u => u.alive && ai.entityManager.isEnemy(ai.team, u.team) &&
            Math.hypot(u.x - avgX, u.y - avgY) < battleRadius
    );

    if (nearbyEnemies.length === 0) return; // No enemies nearby

    // Calculate combat power comparison
    const ownPower = ai.calculateCombatPower(ownMilitary);
    const enemyPower = ai.calculateCombatPower(nearbyEnemies);

    // Retreat if enemy is OVERWHELMINGLY stronger (>2x more powerful)
    // Higher difficulty AIs are braver (retreat at higher disadvantage)
    const retreatThreshold = ai.params.combatAwareness > 1.2 ? 2.5 : 2.0;

    if (enemyPower > ownPower * retreatThreshold && ownMilitary.length >= 3) {
        // Count units with low HP — if many units are injured, retreat faster
        const injuredCount = ownMilitary.filter(u => u.hp < u.maxHp * 0.5).length;
        const injuredRatio = injuredCount / ownMilitary.length;

        // Only retreat if truly losing badly
        if (enemyPower > ownPower * 1.8 || injuredRatio > 0.5) {
            ai.triggerRetreat(ownMilitary);
            ai.log(
                `🏃 RÚT LUI! Địch quá mạnh (${nearbyEnemies.length} địch vs ${ownMilitary.length} ta). Tập hợp lại...`,
                '#ff4444'
            );
        }
    }
}

// ===================================================================
//  RETREAT: Order units to fall back to nearest friendly base
// ===================================================================
export function triggerRetreat(ai: AIContext, units: Unit[]): void {
    // Find best rally point — nearest TC or building with most friendly units nearby
    const ownBuildings = ai.entityManager.buildings.filter(
        b => b.alive && b.team === ai.team && b.built
    );
    const tc = ownBuildings.find(b => b.type === BuildingType.TownCenter);
    const rallyBldg = tc || ownBuildings[0];

    if (!rallyBldg) return;

    ai.retreatRallyX = rallyBldg.x;
    ai.retreatRallyY = rallyBldg.y;

    // Command all units to retreat to rally point (with some spread)
    for (let i = 0; i < units.length; i++) {
        const u = units[i];
        // Spread units around rally point to avoid clumping (wider spread)
        const angle = (i / units.length) * Math.PI * 2;
        const spreadDist = TILE_SIZE * 6 + Math.random() * TILE_SIZE * 6;
        const tx = ai.retreatRallyX + Math.cos(angle) * spreadDist;
        const ty = ai.retreatRallyY + Math.sin(angle) * spreadDist;
        ai.safeMoveTo(u, tx, ty);
    }

    // Set state to retreating with regroup timer
    ai.waveState = 'retreating';
    ai.retreatRegroupTimer = 15; // Wait 15s before evaluating counter-attack
}

// ===================================================================
//  SMART TARGET SELECTION: Advanced threat-based targeting
//  Considers DPS, unit type, armor, and tactical priorities
// ===================================================================
export function selectBestTarget(ai: AIContext, attacker: Unit, range: number): Unit | null {
    const enemies: Unit[] = [];
    for (const u of ai.entityManager.units) {
        if (!u.alive || !ai.entityManager.isEnemy(ai.team, u.team)) continue;
        const d = Math.hypot(u.x - attacker.x, u.y - attacker.y);
        if (d < range) enemies.push(u);
    }
    if (enemies.length === 0) return null;

    const attackerIsRanged = isRangedType(attacker.type) || attacker.type === UnitType.Archer;
    const attackerIsMelee = !attackerIsRanged;

    let bestScore = -Infinity;
    let bestTarget: Unit | null = null;

    for (const e of enemies) {
        let score = 0;
        const dist = Math.hypot(e.x - attacker.x, e.y - attacker.y);

        // ===== KILLABLE BONUS: Can we finish this unit off? =====
        const estimatedDmg = attacker.attack * 2; // 2 hits estimate
        if (e.hp <= estimatedDmg) {
            score += 60; // HIGH priority: almost dead, finish them!
        } else {
            // Prefer low HP targets (can kill quickly)
            score += (1 - e.hp / e.maxHp) * 25;
        }

        // ===== THREAT SCORE: How dangerous is this enemy? =====
        const eDps = e.attack / (e.data.attackSpeed || 1.5);
        score += eDps * 3; // Higher DPS = higher priority

        // ===== PRIORITY: Enemies attacking our allies/heroes =====
        if (e.state === UnitState.Attacking && e.attackTarget) {
            if (ai.entityManager.isAlly(ai.team, e.attackTarget.team)) {
                score += 60; // Increased from 40 to heavily prioritize defending allies
                // Extra priority if attacking our hero
                if (e.attackTarget.isHero) score += 40; // Increased from 30
            }
        }

        // ===== UNIT TYPE PRIORITY =====
        // Kill mages/rangers first (glass cannons = high DPS, low HP)
        if (e.isHero) {
            score += 35; // All heroes are high value targets
            if (e.type === UnitType.HeroZarathustra) score += 20; // AoE mage is #1 threat
            if (e.type === UnitType.HeroQiJiguang) score += 10; // Sniper is high threat
        }
        if (e.type === UnitType.Archer || e.type === UnitType.Immortal) score += 30;

        // Ranged attackers should focus melee closing in (protect frontline)
        if (attackerIsRanged && !isRangedType(e.type) && dist < TILE_SIZE * 5) {
            score += 25; // Shoot the melee rushing at us!
        }

        // Melee attackers should preferentially go for squishy ranged units
        if (attackerIsMelee && (isRangedType(e.type) || e.type === UnitType.Archer)) {
            score += 20; // Close in on ranged units
        }

        // ===== DISTANCE PENALTY: Prefer closer targets =====
        score -= dist / TILE_SIZE * 3;

        // ===== ECONOMY DAMAGE: Villagers =====
        if (e.isVillager) {
            score += 20;
            // Extra priority during raids
            if (ai.raidActive || ai.waveState === 'attacking') {
                score += 15;
            }
        }

        // ===== FOCUS FIRE: Concentrate damage on the same target =====
        const alliesOnTarget = ai.entityManager.units.filter(
            u2 => u2.alive && ai.entityManager.isAlly(ai.team, u2.team) &&
                u2.state === UnitState.Attacking && u2.attackTarget === e
        ).length;
        // Diminishing returns on focus fire (cap at 4)
        if (alliesOnTarget > 0 && alliesOnTarget <= 4) {
            score += alliesOnTarget * 12;
        } else if (alliesOnTarget > 4) {
            score += 48; // capped; don't over-focus
        }

        // ===== ARMOR CONSIDERATION: Prefer low-armor targets =====
        const armor = e.armor || 0;
        if (armor < 3) score += 8;
        else if (armor > 6) score -= 10; // Heavily armored = discourage

        // ===== OVERKILL PREVENTION: Don't pile on almost-dead =====
        if (alliesOnTarget >= 3 && e.hp < e.maxHp * 0.2) {
            score -= 30; // Already dying, don't waste more units
        }

        if (score > bestScore) {
            bestScore = score;
            bestTarget = e;
        }
    }

    return bestTarget;
}

// ===================================================================
//  FOCUS FIRE: Command nearby allies to attack same target
//  Enhanced: wider range, smarter unit selection, reserves consideration
// ===================================================================
export function callFocusFire(ai: AIContext, caller: Unit, target: Unit, aiUnits: Unit[]): void {
    let assigned = 0;
    const maxFocusUnits = Math.min(5, Math.ceil(aiUnits.length * 0.4)); // Don't focus too many

    for (const ally of aiUnits) {
        if (assigned >= maxFocusUnits) break;
        if (ally === caller || ally.isVillager) continue;
        // Only redirect idle, moving, or attacking a different (low-priority) target
        if (ally.state === UnitState.Attacking && ally.attackTarget && ally.attackTarget.alive) {
            // Don't redirect if they're fighting a high-value target
            if (ally.attackTarget.isHero || ally.attackTarget.hp < ally.attackTarget.maxHp * 0.2) continue;
        }
        if (ally.state !== UnitState.Idle && ally.state !== UnitState.Moving &&
            !(ally.state === UnitState.Attacking && ally.attackTarget !== target)) continue;

        const allyDist = Math.hypot(ally.x - caller.x, ally.y - caller.y);
        if (allyDist < TILE_SIZE * 10) { // Increased from 6 to 10
            ally.attackUnit(target);
            assigned++;
        }
    }
}

// ===================================================================
//  ALLY FINDER: Find allied units in combat nearby
// ===================================================================
export function findAllyInCombat(ai: AIContext, x: number, y: number, range: number): Unit | null {
    let closest: Unit | null = null;
    let closestDist = range;

    for (const u of ai.entityManager.units) {
        if (!u.alive || u.team === ai.team) continue; // Skip own units
        if (!ai.entityManager.isAlly(ai.team, u.team)) continue; // Must be ally
        if (u.state !== UnitState.Attacking) continue; // Must be in combat
        if (u.isVillager) continue; // Skip villagers

        const d = Math.hypot(u.x - x, u.y - y);
        if (d < closestDist) {
            closestDist = d;
            closest = u;
        }
    }
    // Also check player units (team 0)
    if (ai.entityManager.isAlly(ai.team, 0)) {
        for (const u of ai.entityManager.units) {
            if (!u.alive || u.team !== 0) continue;
            // Player unit being attacked (has enemy attacker nearby)
            if (u.hp < u.maxHp * 0.8) { // Player unit is taking damage
                const d = Math.hypot(u.x - x, u.y - y);
                if (d < closestDist) {
                    closestDist = d;
                    closest = u;
                }
            }
        }
    }

    return closest;
}

// ===================================================================
//  ADVANCED MICRO: Real-time unit repositioning
//  - Ranged units position behind melee frontline
//  - Wounded units cycle to the back
//  - Aggressive flanking during attack waves
// ===================================================================
export function advancedMicro(ai: AIContext): void {
    if (ai.waveState !== 'attacking' && ai.waveState !== 'counterattack') return;

    const aiUnits = ai.entityManager.units.filter(
        u => u.alive && u.team === ai.team && !u.isVillager &&
            (u.state === UnitState.Attacking || u.state === UnitState.Moving || u.state === UnitState.Idle)
    );
    if (aiUnits.length < 3) return;

    // Find center of combat
    const inCombat = aiUnits.filter(u => u.state === UnitState.Attacking);
    if (inCombat.length === 0) return;

    let combatX = 0, combatY = 0;
    for (const u of inCombat) { combatX += u.x; combatY += u.y; }
    combatX /= inCombat.length;
    combatY /= inCombat.length;

    // Find enemy center
    const nearbyEnemies = ai.entityManager.units.filter(
        e => e.alive && ai.entityManager.isEnemy(ai.team, e.team) &&
            Math.hypot(e.x - combatX, e.y - combatY) < TILE_SIZE * 15
    );
    if (nearbyEnemies.length === 0) return;

    let enemyX = 0, enemyY = 0;
    for (const e of nearbyEnemies) { enemyX += e.x; enemyY += e.y; }
    enemyX /= nearbyEnemies.length;
    enemyY /= nearbyEnemies.length;

    const battleAngle = Math.atan2(enemyY - combatY, enemyX - combatX);

    // RANGED POSITIONING: Stay behind melee frontline
    for (const u of aiUnits) {
        if (!isRangedType(u.type) && u.type !== UnitType.Archer) continue;
        if (u.state !== UnitState.Idle) continue;

        const distToEnemyCenter = Math.hypot(u.x - enemyX, u.y - enemyY);

        // If ranged unit is closer to enemy than combat center, step back
        if (distToEnemyCenter < Math.hypot(combatX - enemyX, combatY - enemyY) - TILE_SIZE * 2) {
            const safeX = combatX - Math.cos(battleAngle) * TILE_SIZE * 4;
            const safeY = combatY - Math.sin(battleAngle) * TILE_SIZE * 4;
            ai.safeMoveTo(u, safeX + (Math.random() - 0.5) * TILE_SIZE * 2,
                safeY + (Math.random() - 0.5) * TILE_SIZE * 2);
        }

        // If idle and enemies nearby, find a target
        if (u.state === UnitState.Idle) {
            const target = ai.selectBestTarget(u, u.data.range + TILE_SIZE * 2);
            if (target) u.attackUnit(target);
        }
    }

    // WOUNDED UNIT CYCLING: Move injured melee units back
    for (const u of aiUnits) {
        if (isRangedType(u.type) || u.type === UnitType.Archer) continue;
        if (u.hp > u.maxHp * 0.25) continue;
        if (u.isHero) continue;
        if (u.state !== UnitState.Attacking) continue;

        // Find a healthy unit nearby who can take over
        const replacement = aiUnits.find(
            a => a !== u && !isRangedType(a.type) && a.alive &&
                a.hp > a.maxHp * 0.6 &&
                (a.state === UnitState.Idle || a.state === UnitState.Moving) &&
                Math.hypot(a.x - u.x, a.y - u.y) < TILE_SIZE * 8
        );
        if (replacement && u.attackTarget) {
            replacement.attackUnit(u.attackTarget);
            // Injured unit retreats behind frontline
            const retreatX = combatX - Math.cos(battleAngle) * TILE_SIZE * 6;
            const retreatY = combatY - Math.sin(battleAngle) * TILE_SIZE * 6;
            ai.safeMoveTo(u, retreatX, retreatY);
        }
    }

    // IDLE ENGAGEMENT: Any idle units near combat should join in
    for (const u of aiUnits) {
        if (u.state !== UnitState.Idle) continue;
        const distToCombat = Math.hypot(u.x - combatX, u.y - combatY);
        if (distToCombat < TILE_SIZE * 12) {
            const target = ai.selectBestTarget(u, TILE_SIZE * 10);
            if (target) u.attackUnit(target);
        }
    }
}
