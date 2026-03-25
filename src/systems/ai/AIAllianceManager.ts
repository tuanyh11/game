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
//  INTEL CONSTANTS — Consistent timeouts across all intel systems
// ===================================================================
const THREAT_DECAY_SECONDS = 20;         // How long threat reports remain relevant
const COORDINATION_DECAY_SECONDS = 45;    // How long coordinated attacks remain joinable
const ENEMY_POSITION_DECAY = 30;          // Known enemy position staleness
const SCOUTED_UNIT_DECAY = 60;            // Scouted enemy unit staleness
const SUPPORT_GUARD_RANGE = TILE_SIZE * 15; // Range to gather units for guarding support target (was 25)

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

        // Check ally buildings — PROACTIVE: detect enemies NEAR buildings BEFORE damage!
        const allyBuildings = ai.entityManager.buildings.filter(
            b => b.alive && b.team === allyTeam && b.built
        );
        for (const ab of allyBuildings) {
            const enemyNearBldg = ai.findNearestEnemyUnit(ab.x, ab.y, TILE_SIZE * 15);
            if (enemyNearBldg) {
                // Severity based on building damage state (no expensive unit count scan)
                const hpRatio = ab.hp / ab.maxHp;
                const sev = ab.hp < ab.maxHp
                    ? Math.min(1.0, 1.0 - hpRatio + 0.3)
                    : 0.5; // Enemy approaching undamaged building

                ai.reportThreat(enemyNearBldg.x, enemyNearBldg.y, sev, allyTeam);
                highestSeverity = Math.max(highestSeverity, sev);
            }
        }
    }

    // ===== SUPPORT SQUAD COMBAT: Keep squad moving toward target =====
    if (ai.supportSquad.size > 0 && ai.supportSquadTarget) {
        for (const id of ai.supportSquad) {
            const u = ai.entityManager.units.find(unit => unit.id === id);
            if (!u || !u.alive) continue;

            const distToTarget = Math.hypot(u.x - ai.supportSquadTarget.x, u.y - ai.supportSquadTarget.y);
            const isNearTarget = distToTarget < TILE_SIZE * 12;

            if (isNearTarget) {
                // ARRIVED: Engage enemies in the area
                const nearbyEnemy = ai.findNearestEnemyUnit(u.x, u.y, TILE_SIZE * 15);
                if (nearbyEnemy) {
                    u.attackUnit(nearbyEnemy);
                } else if (u.state === UnitState.Idle) {
                    // Patrol around target
                    const angle = Math.random() * Math.PI * 2;
                    ai.safeMoveTo(u,
                        ai.supportSquadTarget.x + Math.cos(angle) * TILE_SIZE * 6,
                        ai.supportSquadTarget.y + Math.sin(angle) * TILE_SIZE * 6
                    );
                }
            } else {
                // EN ROUTE: March to target area — DO NOT chase distant enemies!
                // Only fight if enemy is blocking the path (very close)
                const blockingEnemy = ai.findNearestEnemyUnit(u.x, u.y, TILE_SIZE * 5);
                if (blockingEnemy) {
                    u.attackUnit(blockingEnemy);
                } else if (u.state !== UnitState.Moving) {
                    // Not moving? Issue march order!
                    ai.safeMoveTo(u,
                        ai.supportSquadTarget.x + (Math.random() - 0.5) * TILE_SIZE * 6,
                        ai.supportSquadTarget.y + (Math.random() - 0.5) * TILE_SIZE * 6
                    );
                }
            }
        }
    }

    // ===== DETECT NEW THREATS & DISPATCH SUPPORT SQUAD =====
    const hasActiveSquad = ai.supportSquad.size > 0;
    const now = sharedIntel.gameTime;
    const relevantThreats = sharedIntel.threats.filter(t => {
        if (t.targetTeam === ai.team) return false;
        if (!ai.entityManager.isAlly(ai.team, t.targetTeam)) return false;
        if (now - t.timestamp > THREAT_DECAY_SECONDS) return false;
        if (t.severity < 0.10) return false;
        return true;
    });

    // Also check DIRECT enemy presence near ally buildings (bypass threat pipeline delay)
    if (relevantThreats.length === 0 && !hasActiveSquad && highestSeverity >= 0.4) {
        // Proactive scan found enemies near ally but reportThreat hasn't propagated yet
        // Find the nearest ally building under threat and dispatch directly
        for (const allyTeam of allyTeams) {
            const allyBuildings = ai.entityManager.buildings.filter(
                b => b.alive && b.team === allyTeam && b.built
            );
            for (const ab of allyBuildings) {
                const enemyNear = ai.findNearestEnemyUnit(ab.x, ab.y, TILE_SIZE * 15);
                if (enemyNear) {
                    relevantThreats.push({
                        x: enemyNear.x, y: enemyNear.y,
                        severity: highestSeverity,
                        timestamp: now,
                        reporterTeam: ai.team,
                        targetTeam: allyTeam
                    });
                    break;
                }
            }
            if (relevantThreats.length > 0) break;
        }
    }
    if (relevantThreats.length === 0) return;

    const worstThreat = relevantThreats.reduce((a, b) =>
        (b.severity * (1 - (now - b.timestamp) / THREAT_DECAY_SECONDS)) > (a.severity * (1 - (now - a.timestamp) / THREAT_DECAY_SECONDS)) ? b : a
    );

    // Check if this is a new threat area vs current squad target
    // COMMIT TO TARGET: Don't oscillate between multiple threats!
    let isNewThreatArea = true;
    if (hasActiveSquad && ai.supportSquadTarget) {
        const dist = Math.hypot(ai.supportSquadTarget.x - worstThreat.x, ai.supportSquadTarget.y - worstThreat.y);
        if (dist < TILE_SIZE * 15) {
            isNewThreatArea = false;
        } else {
            const lastRedirect = (ai as any)._lastSquadRedirectTime || 0;
            const redirectCooldown = now - lastRedirect > 15;
            const currentAreaEnemies = ai.entityManager.units.filter(
                u => u.alive && ai.entityManager.isEnemy(ai.team, u.team) &&
                    Math.hypot(u.x - ai.supportSquadTarget!.x, u.y - ai.supportSquadTarget!.y) < TILE_SIZE * 15
            ).length;

            if (redirectCooldown && worstThreat.severity > 0.7 && currentAreaEnemies <= 1) {
                ai.supportSquadTarget = { x: worstThreat.x, y: worstThreat.y };
                ai.supportTarget = ai.supportSquadTarget;
                ai.supportSquadTimer = Math.max(ai.supportSquadTimer, 30);
                (ai as any)._lastSquadRedirectTime = now;
                ai.log(`🔄 Support Squad chuyển hướng: mục tiêu mới nghiêm trọng hơn!`, '#ffcc00');
            }
            isNewThreatArea = false;
        }
    }
    if (hasActiveSquad && !isNewThreatArea) return;

    // ==== DISPATCH: Build squad from available troops ====
    const isEmergency = worstThreat.severity > 0.6 && !ownBaseUnderAttack;
    const isCritical = worstThreat.severity > 0.35;
    const candidatePool = [
        ...ai.forceAllocation.supportUnits,
        ...ai.forceAllocation.attackUnits,
        ...(isEmergency ? ai.forceAllocation.garrisonUnits.slice(0, Math.floor(ai.forceAllocation.garrisonUnits.length * 0.5)) : []),
    ].filter(u => u.alive && !ai.supportSquad.has(u.id) &&
        (u.state === UnitState.Idle || u.state === UnitState.Moving || u.state === UnitState.Attacking)
    );

    const maxSquadSize = Math.max(3, Math.floor(myMilitary.length * 0.4));
    const canAdd = Math.max(0, maxSquadSize - ai.supportSquad.size);
    let sent = 0;
    for (const u of candidatePool) {
        if (sent >= canAdd) break;
        const dist = Math.hypot(u.x - worstThreat.x, u.y - worstThreat.y);
        if (u.state === UnitState.Attacking && dist < TILE_SIZE * 15) continue;
        if (u.state === UnitState.Moving && u.pathWaypoints && u.pathWaypoints.length > 0) {
            const dest = u.pathWaypoints[u.pathWaypoints.length - 1];
            if (Math.hypot(dest.x - worstThreat.x, dest.y - worstThreat.y) < TILE_SIZE * 15) continue;
        }
        ai.supportSquad.add(u.id);
        // ALWAYS move to the AREA, never attackUnit on a far target
        ai.safeMoveTo(u,
            worstThreat.x + (Math.random() - 0.5) * TILE_SIZE * 6,
            worstThreat.y + (Math.random() - 0.5) * TILE_SIZE * 6
        );
        sent++;
    }

    if (sent > 0) {
        ai.supportSquadTarget = { x: worstThreat.x, y: worstThreat.y };
        ai.supportTarget = ai.supportSquadTarget;
        ai.supportSquadTimer = 40;
        ai.supportTimer = 45;
        const urgency = isEmergency ? '🚨 KHẨN CẤP' : (isCritical ? '⚠️ GẤP' : '🚑');
        ai.log(`${urgency} Support Squad: +${sent} (total: ${ai.supportSquad.size}/${maxSquadSize}). Main army intact!`, '#00ffcc');
    }

    // ===== SUPPORT SQUAD COMBAT: units already in squad engage enemies =====
    if (ai.supportSquad.size > 0 && ai.supportSquadTarget) {
        let aliveCount = 0;
        let arrivedCount = 0;
        const enemiesNearTarget = ai.entityManager.units.filter(
            u => u.alive && ai.entityManager.isEnemy(ai.team, u.team) &&
                Math.hypot(u.x - ai.supportSquadTarget!.x, u.y - ai.supportSquadTarget!.y) < TILE_SIZE * 15
        );

        for (const id of ai.supportSquad) {
            const u = ai.entityManager.units.find(u => u.id === id);
            if (!u || !u.alive) continue;
            aliveCount++;

            const distToTarget = Math.hypot(u.x - ai.supportSquadTarget.x, u.y - ai.supportSquadTarget.y);
            const hasArrived = distToTarget < SUPPORT_GUARD_RANGE;
            if (hasArrived) arrivedCount++;

            // If idle and not at target, keep moving!
            if (u.state === UnitState.Idle && !hasArrived) {
                // Find enemies on the way
                const enemyOnWay = ai.findNearestEnemyUnit(u.x, u.y, TILE_SIZE * 10);
                if (enemyOnWay) {
                    u.attackUnit(enemyOnWay);
                } else {
                    // Keep moving to target
                    ai.safeMoveTo(u,
                        ai.supportSquadTarget.x + (Math.random() - 0.5) * TILE_SIZE * 6,
                        ai.supportSquadTarget.y + (Math.random() - 0.5) * TILE_SIZE * 6
                    );
                }
            } else if (u.state === UnitState.Idle && hasArrived) {
                // Arrived at target: attack nearby enemies if any
                if (enemiesNearTarget.length > 0) {
                    const closest = enemiesNearTarget.reduce((a, b) =>
                        Math.hypot(a.x - u.x, a.y - u.y) < Math.hypot(b.x - u.x, b.y - u.y) ? a : b
                    );
                    u.attackUnit(closest);
                } else {
                    // Patrol around target
                    const angle = Math.random() * Math.PI * 2;
                    ai.safeMoveTo(u,
                        ai.supportSquadTarget.x + Math.cos(angle) * TILE_SIZE * 4,
                        ai.supportSquadTarget.y + Math.sin(angle) * TILE_SIZE * 4
                    );
                }
            }
        }

        // ===== SUPPORT SQUAD → COUNTER-ATTACK TRANSITION =====
        if (aliveCount >= 3 && ai.supportSquadTimer < 20 && enemiesNearTarget.length === 0) {
            // Target is clear, and we have enough arrived units -> Counter-attack
            if (arrivedCount >= 3) {
                const enemyBldgs = ai.getScoutedEnemyBuildings();
                if (enemyBldgs.length > 0) {
                    const squadUnits = ai.entityManager.units.filter(u => u.alive && ai.supportSquad.has(u.id));
                    const targetBldg = enemyBldgs.reduce((a, b) =>
                        Math.hypot(a.x - ai.supportSquadTarget!.x, a.y - ai.supportSquadTarget!.y) <
                            Math.hypot(b.x - ai.supportSquadTarget!.x, b.y - ai.supportSquadTarget!.y) ? a : b
                    );
                    for (const u of squadUnits) u.attackBuilding(targetBldg);
                    ai.supportSquad.clear();
                    ai.supportSquadTarget = null;
                    ai.supportTarget = null;
                    ai.log(`⚡ Support Squad dọn dẹp xong! Phản công lại ${enemyBldgs.length} công trình địch!`, '#ffaa00');
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
        if (now - c.timestamp > COORDINATION_DECAY_SECONDS) return false;
        // We haven't joined yet
        return !c.participating.has(ai.team);
    });

    if (activeCoord && ai.waveState === 'gathering') {
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
        // FIX #6: Also count units that just finished attacking (they're available for coordination)
        const myMilitary = ai.entityManager.units.filter(
            u => u.alive && u.team === ai.team && !u.isVillager &&
                (u.state === UnitState.Idle || u.state === UnitState.Moving ||
                 (u.state === UnitState.Attacking && !u.attackTarget?.alive))
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
        const ally = ai.findAllyInCombat(u.x, u.y, TILE_SIZE * 15);
        if (ally) {
            const enemy = ai.findNearestEnemyUnit(ally.x, ally.y, TILE_SIZE * 15);
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
    // FIX #9: Use consistent timeout constants
    sharedIntel.threats = sharedIntel.threats.filter(t => now - t.timestamp < THREAT_DECAY_SECONDS);
    sharedIntel.coordinatedAttacks = sharedIntel.coordinatedAttacks.filter(c => now - c.timestamp < COORDINATION_DECAY_SECONDS);
    for (const [id, pos] of ai.knownEnemyPositions) {
        if (now - pos.time > ENEMY_POSITION_DECAY) ai.knownEnemyPositions.delete(id);
    }
    // Clean stale scouted enemy units
    for (const [id, info] of ai.scoutedEnemyUnits) {
        if (now - info.time > SCOUTED_UNIT_DECAY) ai.scoutedEnemyUnits.delete(id);
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
