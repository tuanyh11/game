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
    if (ai.waveState === 'gathering' && !ownBaseUnderAttack && ai.forceAllocation.supportUnits.length > 0) {
        // Find nearest ally TC/building
        const allyTC = ai.entityManager.buildings.find(
            b => b.alive && b.built && b.type === BuildingType.TownCenter &&
                b.team !== ai.team && ai.entityManager.isAlly(ai.team, b.team)
        );
        if (allyTC) {
            const idleSupporters = ai.forceAllocation.supportUnits.filter(
                u => u.state === UnitState.Idle
            );

            // Calculate the threat vector for the ally (where are enemies most likely coming from?)
            // We use the center of the map as a generic threat direction if no specific threat is known.
            const mapCenterX = (MAP_COLS * TILE_SIZE) / 2;
            const mapCenterY = (MAP_ROWS * TILE_SIZE) / 2;
            const allyThreatAngle = Math.atan2(mapCenterY - allyTC.y, mapCenterX - allyTC.x);

            // Patrol around ally base, biased towards the threat direction
            for (let i = 0; i < Math.min(3, idleSupporters.length); i++) {
                const u = idleSupporters[i];
                const distToAlly = Math.hypot(u.x - allyTC.x, u.y - allyTC.y);

                // We want them to stand in front of the ally TC, facing the enemy
                const patrolX = allyTC.x + Math.cos(allyThreatAngle) * TILE_SIZE * 8;
                const patrolY = allyTC.y + Math.sin(allyThreatAngle) * TILE_SIZE * 8;

                if (distToAlly > TILE_SIZE * 20) {
                    // Move toward ally base front line
                    const spread = (Math.random() - 0.5) * TILE_SIZE * 4;
                    ai.safeMoveTo(u,
                        patrolX + Math.cos(allyThreatAngle + Math.PI / 2) * spread,
                        patrolY + Math.sin(allyThreatAngle + Math.PI / 2) * spread
                    );
                } else if (distToAlly > TILE_SIZE * 5) {
                    // Patrol slightly if already near the front line
                    const patrolSpread = (Math.random() - 0.5) * Math.PI / 2; // Fan out
                    ai.safeMoveTo(u,
                        allyTC.x + Math.cos(allyThreatAngle + patrolSpread) * TILE_SIZE * (6 + Math.random() * 4),
                        allyTC.y + Math.sin(allyThreatAngle + patrolSpread) * TILE_SIZE * (6 + Math.random() * 4)
                    );
                }
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

    // Allow re-support if new threat is more severe than current support target
    if (ai.waveState === 'supporting' && ai.supportTimer > 0) {
        if (ai.supportTarget) {
            const distToNewThreat = Math.hypot(ai.supportTarget.x - worstThreat.x, ai.supportTarget.y - worstThreat.y);
            if (distToNewThreat < TILE_SIZE * 15) return;
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
        if (u.state === UnitState.Attacking && dist < TILE_SIZE * 10) continue;

        const enemyNearThreat = ai.findNearestEnemyUnit(worstThreat.x, worstThreat.y, TILE_SIZE * 15);
        if (enemyNearThreat) {
            u.attackUnit(enemyNearThreat);
        } else {
            ai.safeMoveTo(u,
                worstThreat.x + (Math.random() - 0.5) * TILE_SIZE * 4,
                worstThreat.y + (Math.random() - 0.5) * TILE_SIZE * 4
            );
        }
        sent++;
    }

    if (sent > 0) {
        ai.waveState = 'supporting';
        ai.supportTarget = { x: worstThreat.x, y: worstThreat.y };
        ai.supportTimer = 45;
        ai.waveResetTimer = 45;
        const urgency = isEmergency ? '🚨 KHẨN CẤP' : (isCritical ? '⚠️ GẤP' : '🚑');
        ai.log(`${urgency} Chi viện đồng minh ${sent} lính! (giữ nhà: ${ai.forceAllocation.garrisonUnits.length})`, "#00ffcc");
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

    if (activeCoord && ai.waveState === 'gathering') {
        // We have enough troops to join? (at least 60% of wave size)
        const military = ai.entityManager.units.filter(
            u => u.alive && u.team === ai.team && !u.isVillager &&
                (u.state === UnitState.Idle || u.state === UnitState.Moving)
        );
        if (military.length >= ai.attackWaveSize * 0.6) {
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
            ai.waveResetTimer = 40;
            ai.log(`⚔️ Tham gia tấn công phối hợp với đồng minh! Mở cuộc tổng tấn công!`, "#ff4444");
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
