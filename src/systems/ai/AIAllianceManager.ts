// ============================================================
//  AI Alliance Manager — Ally support, coordination, threat sharing
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

// ===================================================================
//  ALLY SUPPORT: Monitor and help allied teams
// ===================================================================
export function checkAllyStatus(ai: AIContext): void {
    const myMilitary = ai.entityManager.units.filter(
        u => u.alive && u.team === ai.team && !u.isVillager
    );
    if (myMilitary.length < 1) return;

    // Check if own base is under attack (but don't SKIP ally help entirely)
    const ownBaseUnderAttack = ai.entityManager.buildings.some(
        b => b.alive && b.team === ai.team && b.built && b.hp < b.maxHp * 0.9
    );

    // ==== PROACTIVE SCAN: Detect player/ally units being attacked ====
    const allyTeams = ai.entityManager.getAllyTeams(ai.team);
    let highestSeverity = 0;

    for (const allyTeam of allyTeams) {
        // Check ally units taking damage
        const allyUnits = ai.entityManager.units.filter(
            u => u.alive && u.team === allyTeam
        );
        for (const au of allyUnits) {
            if (au.hp < au.maxHp) {
                const enemyNearAlly = ai.findNearestEnemyUnit(au.x, au.y, TILE_SIZE * 10);
                if (enemyNearAlly) {
                    const sev = Math.min(1.0, 1.0 - (au.hp / au.maxHp) + 0.2);
                    ai.reportThreat(enemyNearAlly.x, enemyNearAlly.y, sev, allyTeam);
                    highestSeverity = Math.max(highestSeverity, sev);
                }
            }

            // Also detect ally units that are attacking — join their fight!
            if (au.state === UnitState.Attacking && au.attackTarget) {
                const target = au.attackTarget;
                if (target.alive && ai.entityManager.isEnemy(ai.team, target.team)) {
                    // Ally is fighting nearby enemies — join in!
                    ai.reportThreat(target.x, target.y, 0.4, allyTeam);
                }
            }
        }

        // Check ally buildings taking damage (higher severity)
        const allyBuildings = ai.entityManager.buildings.filter(
            b => b.alive && b.team === allyTeam && b.built && b.hp < b.maxHp
        );
        for (const ab of allyBuildings) {
            const enemyNearBldg = ai.findNearestEnemyUnit(ab.x, ab.y, TILE_SIZE * 12);
            if (enemyNearBldg) {
                const sev = Math.min(1.0, 1.0 - (ab.hp / ab.maxHp) + 0.3);
                ai.reportThreat(enemyNearBldg.x, enemyNearBldg.y, sev, allyTeam);
                highestSeverity = Math.max(highestSeverity, sev);
            }
        }
    }

    // ==== PROACTIVE PATROL: Send support units near ally base ====
    // DISABLED (TIER-1 FIX): This feature makes units run back and forth aimlessly during peacetime,
    // cluttering the map and causing pathing lag. Units will now stay home until an emergency is reported.
    /*
    if (ai.waveState === 'gathering' && !ownBaseUnderAttack && ai.forceAllocation.supportUnits.length > 0) {
        // Find nearest ally TC/building
        ...
    }
    */

    // ==== GUARD SUPPORT TARGET ====
    if (ai.waveState === 'supporting' && ai.supportTarget) {
        const idleSupporters = ai.forceAllocation.supportUnits.filter(u => u.state === UnitState.Idle);
        for (let i = 0; i < idleSupporters.length; i++) {
            const u = idleSupporters[i];
            const distToTarget = Math.hypot(u.x - ai.supportTarget.x, u.y - ai.supportTarget.y);
            if (distToTarget > TILE_SIZE * 12) {
                // Move towards support target (wide spread to avoid clumping while traveling)
                const spread = (Math.random() - 0.5) * TILE_SIZE * 15;
                ai.safeMoveTo(u,
                    ai.supportTarget.x + Math.cos(i) * spread,
                    ai.supportTarget.y + Math.sin(i) * spread
                );
            } else if (distToTarget > TILE_SIZE * 3) {
                // Active patrol
                const patrolSpread = (Math.random() - 0.5) * Math.PI * 2;
                ai.safeMoveTo(u,
                    ai.supportTarget.x + Math.cos(patrolSpread) * TILE_SIZE * (7 + Math.random() * 7),
                    ai.supportTarget.y + Math.sin(patrolSpread) * TILE_SIZE * (7 + Math.random() * 7)
                );
            }
        }
    }

    // ==== React to shared threat intel ====
    const now = sharedIntel.gameTime;
    const relevantThreats = sharedIntel.threats.filter(t => {
        if (t.targetTeam === ai.team) return false;
        if (!ai.entityManager.isAlly(ai.team, t.targetTeam)) return false;
        if (now - t.timestamp > 30) return false; // Increased from 20s to 30s to remember threats longer
        if (t.severity < 0.10) return false; // Decreased from 0.15 to react to minor skirmishes
        return true;
    });

    if (relevantThreats.length === 0) return;

    // Find the most severe/recent threat
    const worstThreat = relevantThreats.reduce((a, b) =>
        (b.severity * (1 - (now - b.timestamp) / 30)) > (a.severity * (1 - (now - a.timestamp) / 30)) ? b : a
    );

    // Determine if this is a new threat area
    let isNewThreatArea = true;
    if (ai.waveState === 'supporting' && ai.supportTimer > 0 && ai.supportTarget) {
        const distToNewThreat = Math.hypot(ai.supportTarget.x - worstThreat.x, ai.supportTarget.y - worstThreat.y);
        if (distToNewThreat < TILE_SIZE * 15) {
            isNewThreatArea = false;
        }
    }

    // ==== EMERGENCY: If ally severely threatened AND own base safe, send more troops ====
    const isEmergency = worstThreat.severity > 0.6 && !ownBaseUnderAttack; // lowered from 0.8
    const isCritical = worstThreat.severity > 0.35; // lowered from 0.5

    // Build support pool: support units + attack units for critical, + garrison for emergency
    const supportPool = [
        ...ai.forceAllocation.supportUnits,
        ...(isCritical ? ai.forceAllocation.attackUnits : []),
        ...(isEmergency ? ai.forceAllocation.garrisonUnits.slice(0, Math.floor(ai.forceAllocation.garrisonUnits.length * 0.5)) : []),
    ];
    const availableMilitary = supportPool.filter(
        u => u.alive && (u.state === UnitState.Idle || u.state === UnitState.Moving ||
            (isCritical && u.state === UnitState.Attacking))
    );

    let sent = 0;
    for (const u of availableMilitary) {
        const dist = Math.hypot(u.x - worstThreat.x, u.y - worstThreat.y);

        // Skip units already engaged near the threat
        if (u.state === UnitState.Attacking && dist < TILE_SIZE * 15) continue;

        // Prevent stuttering: skip units already moving toward the threat area
        if (u.state === UnitState.Moving && u.pathWaypoints && u.pathWaypoints.length > 0) {
            const dest = u.pathWaypoints[u.pathWaypoints.length - 1];
            if (Math.hypot(dest.x - worstThreat.x, dest.y - worstThreat.y) < TILE_SIZE * 15) {
                // If they are moving toward it, just check for enemies on the way to be safe
                const enemyOnTheWay = ai.findNearestEnemyUnit(u.x, u.y, TILE_SIZE * 10);
                if (enemyOnTheWay) u.attackUnit(enemyOnTheWay);
                continue;
            }
        }

        const enemyNearThreat = ai.findNearestEnemyUnit(worstThreat.x, worstThreat.y, TILE_SIZE * 15);
        if (enemyNearThreat) {
            u.attackUnit(enemyNearThreat);
        } else {
            // ATTACK-MOVE Logic
            const enemyOnTheWay = ai.findNearestEnemyUnit(u.x, u.y, TILE_SIZE * 10);
            if (enemyOnTheWay) {
                u.attackUnit(enemyOnTheWay);
            } else {
                ai.safeMoveTo(u,
                    worstThreat.x + (Math.random() - 0.5) * TILE_SIZE * 6,
                    worstThreat.y + (Math.random() - 0.5) * TILE_SIZE * 6
                );
            }
        }
        sent++;
    }

    if (sent > 0) {
        ai.waveState = 'supporting';
        ai.supportTarget = { x: worstThreat.x, y: worstThreat.y };
        ai.supportTimer = 45;
        // STATE LOCK: Prevent gathering or base defense from immediately pulling these units back
        ai.waveResetTimer = 25;

        if (isNewThreatArea || sent >= 4 || isEmergency) {
            const urgency = isEmergency ? '🚨 KHẨN CẤP' : (isCritical ? '⚠️ GẤP' : '🚑');
            ai.log(`${urgency} Cử thêm ${sent} lính cứu đồng minh! (Giữ nhà: ${ai.forceAllocation.garrisonUnits.length})`, "#00ffcc");
        }
    }

    // ===== SUPPORT → COUNTER-ATTACK TRANSITION =====
    if (ai.waveState === 'supporting' && ai.supportTarget) {
        const enemiesNearSupport = ai.entityManager.units.filter(
            u => u.alive && ai.entityManager.isEnemy(ai.team, u.team) &&
                Math.hypot(u.x - ai.supportTarget!.x, u.y - ai.supportTarget!.y) < TILE_SIZE * 12
        );
        if (enemiesNearSupport.length === 0 && myMilitary.length >= 4) {
            const nearbyMilitary = myMilitary.filter(
                u => Math.hypot(u.x - ai.supportTarget!.x, u.y - ai.supportTarget!.y) < TILE_SIZE * 15
            );
            if (nearbyMilitary.length >= 3) {
                const enemyBldgs = ai.getScoutedEnemyBuildings();
                if (enemyBldgs.length > 0) {
                    const closest = enemyBldgs.reduce((a, b) =>
                        Math.hypot(a.x - ai.supportTarget!.x, a.y - ai.supportTarget!.y) <
                            Math.hypot(b.x - ai.supportTarget!.x, b.y - ai.supportTarget!.y) ? a : b
                    );
                    ai.counterAttackTarget = { x: closest.x, y: closest.y };
                    ai.waveState = 'counterattack';
                    ai.waveResetTimer = 25;
                    for (const u of nearbyMilitary) {
                        u.attackBuilding(closest);
                    }
                    ai.log(`⚡ Chi viện xong! Phản công ${nearbyMilitary.length} lính!`, '#ffaa00');
                }
            }
        }
    }
}

// ===================================================================
//  COORDINATION: Sync attack waves with allied AIs
// ===================================================================
export function coordinateWithAllies(ai: AIContext): void {
    // Check if any ally has initiated a coordinated attack
    const now = sharedIntel.gameTime;
    const activeCoord = sharedIntel.coordinatedAttacks.find(c => {
        // Must be from an ally
        if (!ai.entityManager.isAlly(ai.team, c.initiatorTeam)) return false;
        // Must not be from us
        if (c.initiatorTeam === ai.team) return false;
        // Must be recent
        if (now - c.timestamp > 30) return false;
        // We haven't joined yet
        return !c.participating.has(ai.team);
    });

    if (activeCoord && (ai.waveState === 'gathering' || ai.waveState === 'supporting')) {
        // We have enough troops to join? (at least 40% of wave size — be aggressive)
        const military = ai.entityManager.units.filter(
            u => u.alive && u.team === ai.team && !u.isVillager &&
                (u.state === UnitState.Idle || u.state === UnitState.Moving)
        );
        if (military.length >= Math.max(3, ai.attackWaveSize * 0.4)) {
            // JOIN THE COORDINATED ATTACK!
            activeCoord.participating.add(ai.team);

            // Target the same building if still alive, otherwise pick nearby
            let target: Building | null = activeCoord.targetBuilding;
            if (!target || !target.alive) {
                target = ai.findNearestEnemyBuilding(
                    activeCoord.targetX, activeCoord.targetY, TILE_SIZE * 20
                ) as Building | null;
            }

            if (target) {
                for (const u of military) {
                    u.attackBuilding(target);
                }
            } else {
                // No building? Attack enemy units near the target area
                for (const u of military) {
                    const enemy = ai.findNearestEnemyUnit(
                        activeCoord.targetX, activeCoord.targetY, TILE_SIZE * 15
                    );
                    if (enemy) {
                        u.attackUnit(enemy);
                    } else {
                        ai.safeMoveTo(u,
                            activeCoord.targetX + (Math.random() - 0.5) * TILE_SIZE * 5,
                            activeCoord.targetY + (Math.random() - 0.5) * TILE_SIZE * 5
                        );
                    }
                }
            }

            ai.waveState = 'attacking';
            ai.waveResetTimer = 30;
            ai.log(`⚔️ Tham gia tấn công phối hợp với đồng minh! Mở cuộc tổng tấn công!`, "#ff4444");
        }
    }

    // === PROACTIVE COORDINATED ATTACK: Initiate joint attack if conditions are met ===
    if (ai.waveState === 'gathering' && !activeCoord) {
        const myMilitary = ai.entityManager.units.filter(
            u => u.alive && u.team === ai.team && !u.isVillager &&
                (u.state === UnitState.Idle || u.state === UnitState.Moving)
        );
        // Only initiate if we have a decent army
        if (myMilitary.length >= ai.attackWaveSize) {
            // Check if allies also have troops ready
            const allyTeams = ai.entityManager.getAllyTeams(ai.team);
            let totalAllyTroops = 0;
            for (const allyTeam of allyTeams) {
                totalAllyTroops += ai.entityManager.units.filter(
                    u => u.alive && u.team === allyTeam && !u.isVillager &&
                        (u.state === UnitState.Idle || u.state === UnitState.Moving)
                ).length;
            }

            // If we + allies have enough troops, broadcast coordinated attack
            if (totalAllyTroops >= 3 && ai.hasScoutedEnemy()) {
                const enemyBuildings = ai.getScoutedEnemyBuildings();
                if (enemyBuildings.length > 0) {
                    // Pick nearest enemy building as target
                    let nearest = enemyBuildings[0];
                    let nearestDist = Infinity;
                    for (const b of enemyBuildings) {
                        const d = Math.hypot(b.x - ai.baseX, b.y - ai.baseY);
                        if (d < nearestDist) { nearestDist = d; nearest = b; }
                    }

                    // Broadcast coordinated attack
                    sharedIntel.coordinatedAttacks.push({
                        targetX: nearest.x,
                        targetY: nearest.y,
                        targetBuilding: nearest,
                        initiatorTeam: ai.team,
                        timestamp: now,
                        participating: new Set([ai.team]),
                    });

                    // Send our troops
                    for (const u of myMilitary) {
                        u.attackBuilding(nearest);
                    }
                    ai.waveState = 'attacking';
                    ai.wavesSent++;
                    ai.waveResetTimer = 25;
                    ai.log(`🚀 Phát động tấn công phối hợp! ${myMilitary.length} quân + ${totalAllyTroops} quân đồng minh!`, '#ff8800');
                }
            }
        }
    }
}

// ===================================================================
//  TACTICAL REASSESSMENT: Adapt strategy based on game state
// ===================================================================
export function tacticalReassessment(ai: AIContext): void {
    const myUnits = ai.entityManager.units.filter(u => u.alive && u.team === ai.team);
    const myMilitary = myUnits.filter(u => !u.isVillager);
    const myBuildings = ai.entityManager.buildings.filter(b => b.alive && b.team === ai.team);

    // Count allied military strength
    const allyMilitary = ai.entityManager.units.filter(
        u => u.alive && u.team !== ai.team && ai.entityManager.isAlly(ai.team, u.team) && !u.isVillager
    );

    // Count enemy military
    const enemyMilitary = ai.entityManager.units.filter(
        u => u.alive && ai.entityManager.isEnemy(ai.team, u.team) && !u.isVillager
    );

    const totalAllyStrength = myMilitary.length + allyMilitary.length;
    const enemyStrength = enemyMilitary.length;

    // Adaptive wave size based on relative strength
    if (totalAllyStrength > enemyStrength * 1.5) {
        // We're stronger — be more aggressive, smaller wave threshold
        ai.attackWaveSize = Math.max(
            Math.max(3, ai.params.startingWaveSize - 3),
            ai.attackWaveSize - 1
        );
    } else if (enemyStrength > totalAllyStrength * 2.0) {
        // Enemy is MUCH stronger — slightly increase wave size, but cap it
        ai.attackWaveSize = Math.min(
            ai.params.maxWaveSize,
            ai.attackWaveSize + 1
        );
    }

    // If we have idle military near allies who are fighting, help them
    for (const u of myMilitary) {
        if (u.state !== UnitState.Idle) continue;

        // Check if any ally unit is fighting nearby
        const ally = ai.findAllyInCombat(u.x, u.y, TILE_SIZE * 10);
        if (ally) {
            const enemy = ai.findNearestEnemyUnit(ally.x, ally.y, TILE_SIZE * 8);
            if (enemy) {
                u.attackUnit(enemy);
            }
        }
    }
}

// ===================================================================
//  THREAT REPORTING: Share enemy positions with allies
// ===================================================================
export function reportThreat(ai: AIContext, x: number, y: number, severity: number, targetTeam?: number): void {
    const effectiveTargetTeam = targetTeam ?? ai.team;
    // Don't spam reports for the same location
    const now = sharedIntel.gameTime;
    const existing = sharedIntel.threats.find(
        t => t.reporterTeam === ai.team &&
            Math.hypot(t.x - x, t.y - y) < TILE_SIZE * 5 &&
            now - t.timestamp < 10 &&
            t.targetTeam === effectiveTargetTeam
    );
    if (existing) {
        // Update existing report
        existing.severity = Math.max(existing.severity, severity);
        existing.timestamp = now;
        return;
    }

    sharedIntel.threats.push({
        x, y, severity, timestamp: now,
        reporterTeam: ai.team,
        targetTeam: effectiveTargetTeam,
    });
}

export function cleanupIntel(ai: AIContext): void {
    const now = sharedIntel.gameTime;
    // Remove old threats (> 20 seconds)
    sharedIntel.threats = sharedIntel.threats.filter(t => now - t.timestamp < 20);
    // Remove old coordinated attacks (> 45 seconds)
    sharedIntel.coordinatedAttacks = sharedIntel.coordinatedAttacks.filter(c => now - c.timestamp < 45);
    // Remove old known enemy positions (> 30 seconds)
    for (const [id, pos] of ai.knownEnemyPositions) {
        if (now - pos.time > 30) ai.knownEnemyPositions.delete(id);
    }
    // Clean stale scouted enemy units (> 60 seconds since last seen)
    for (const [id, info] of ai.scoutedEnemyUnits) {
        if (now - info.time > 60) ai.scoutedEnemyUnits.delete(id);
    }
    // Mark scouted buildings as dead if we can see they're gone
    for (const [id, info] of ai.scoutedEnemyBuildings) {
        if (ai.isPositionVisible(info.x, info.y)) {
            const stillExists = ai.entityManager.buildings.some(
                b => b.alive && Math.hypot(b.x - info.x, b.y - info.y) < TILE_SIZE * 2
            );
            if (!stillExists) {
                ai.scoutedEnemyBuildings.delete(id);
            }
        }
    }
    // Clean dead units from defending set
    for (const id of ai.defendingUnits) {
        const unit = ai.entityManager.units.find(u => u.id === id);
        if (!unit || !unit.alive) {
            ai.defendingUnits.delete(id);
        }
    }
}
