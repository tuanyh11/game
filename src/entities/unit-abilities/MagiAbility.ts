// ============================================================
//  MagiAbility — Phù Thuỷ Tối Thượng: Freeze + Heal aura
//  Extracted from Unit.update() lines 508-598
// ============================================================

import type { EliteAbility, AbilityContext } from "../../types/AbilityTypes";
import type { Unit } from "../Unit";

export const MagiAbility: EliteAbility = {
    update(unit: Unit, dt: number, ctx: AbilityContext): void {
        const { particles, findNearestEnemy } = ctx;

        if (!unit.magiCastActive) {
            unit.magiCooldown -= dt;
            if (unit.magiCooldown <= 0 && findNearestEnemy) {
                // Check for nearby enemy to trigger cast
                const nearEnemy = findNearestEnemy(unit.x, unit.y, unit.team, 220);
                if (nearEnemy && nearEnemy.alive) {
                    unit.magiCastActive = true;
                    unit.magiCastTimer = 0;
                    unit.magiFreezeTargets = [];

                    // ❄️ FREEZE: Find up to 3 enemies in range and freeze
                    const freezeRange = 220;
                    const freezeDuration = 3; // 3 seconds
                    let frozen = 0;
                    // Freeze the nearest enemy first
                    if (nearEnemy.alive && frozen < 3) {
                        nearEnemy.frozenTimer = freezeDuration;
                        unit.magiFreezeTargets.push(nearEnemy);
                        frozen++;
                        // ❄️ Ice block burst on target
                        particles.emit({
                            x: nearEnemy.x, y: nearEnemy.y - 6, count: 14, spread: 6,
                            speed: [20, 70], angle: [0, Math.PI * 2],
                            life: [0.5, 1.0], size: [2, 5],
                            colors: ['#88ddff', '#aaeeff', '#fff', '#4488cc'],
                            gravity: -15, shape: 'star',
                        });
                        // Ice shards flying up
                        particles.emit({
                            x: nearEnemy.x, y: nearEnemy.y - 10, count: 6, spread: 3,
                            speed: [40, 80], angle: [-Math.PI * 0.8, -Math.PI * 0.2],
                            life: [0.3, 0.6], size: [3, 6],
                            colors: ['#aaeeff', '#fff'],
                            gravity: -30, shape: 'rect',
                        });
                    }
                    // Try to freeze 2 more nearby enemies
                    for (let fi = 0; fi < 2 && frozen < 3; fi++) {
                        const extraEnemy = findNearestEnemy(
                            unit.x + (Math.random() - 0.5) * 60,
                            unit.y + (Math.random() - 0.5) * 60,
                            unit.team, freezeRange,
                        );
                        if (extraEnemy && extraEnemy.alive && !unit.magiFreezeTargets.includes(extraEnemy)) {
                            extraEnemy.frozenTimer = freezeDuration;
                            unit.magiFreezeTargets.push(extraEnemy);
                            frozen++;
                            particles.emit({
                                x: extraEnemy.x, y: extraEnemy.y - 6, count: 10, spread: 5,
                                speed: [15, 60], angle: [0, Math.PI * 2],
                                life: [0.4, 0.8], size: [2, 4],
                                colors: ['#88ddff', '#aaeeff', '#fff'],
                                gravity: -15, shape: 'star',
                            });
                            particles.emit({
                                x: extraEnemy.x, y: extraEnemy.y - 10, count: 4, spread: 3,
                                speed: [30, 60], angle: [-Math.PI * 0.8, -Math.PI * 0.2],
                                life: [0.2, 0.5], size: [2, 5],
                                colors: ['#aaeeff', '#fff'],
                                gravity: -30, shape: 'rect',
                            });
                        }
                    }

                    // 💚 HEAL: Heal nearby allies +10 HP
                    healNearbyAllies(unit, 100, 4, 1.0, particles, ctx.allUnits);

                    // Healing aura visual on self
                    particles.emit({
                        x: unit.x, y: unit.y - 4, count: 14, spread: 10,
                        speed: [15, 50], angle: [0, Math.PI * 2],
                        life: [0.5, 1.0], size: [2, 5],
                        colors: ['#44ff88', '#88ffaa', '#aaffcc', '#fff'],
                        gravity: -20, shape: 'circle',
                    });

                    // Cast animation: magic circle
                    particles.emit({
                        x: unit.x, y: unit.y + 2, count: 16, spread: 14,
                        speed: [40, 100], angle: [0, Math.PI * 2],
                        life: [0.3, 0.6], size: [2, 4],
                        colors: ['#4488ff', '#88ccff', '#aaeeff'],
                        gravity: 0, shape: 'rect',
                    });
                    // Frost wave outward
                    particles.emit({
                        x: unit.x, y: unit.y - 8, count: 12, spread: 6,
                        speed: [50, 120], angle: [0, Math.PI * 2],
                        life: [0.2, 0.5], size: [3, 6],
                        colors: ['#88ddff', '#fff', '#aaeeff', '#4488cc'],
                        gravity: -10, shape: 'star',
                    });
                }
            }
        } else {
            unit.magiCastTimer += dt;
            // Ongoing heal aura particles
            if (Math.random() < 0.2) {
                particles.emit({
                    x: unit.x + (Math.random() - 0.5) * 16,
                    y: unit.y - 4 + (Math.random() - 0.5) * 10,
                    count: 1, spread: 2,
                    speed: [5, 20], angle: [-Math.PI * 0.8, -Math.PI * 0.2],
                    life: [0.3, 0.5], size: [1.5, 3],
                    colors: ['#44ff88', '#88ffaa'],
                    gravity: -20, shape: 'circle',
                });
            }
            // 💚 Continuous heal: +3 HP/s to nearby allies during cast (tick every 0.5s)
            const healTick = Math.floor(unit.magiCastTimer / 0.5);
            const prevTick = Math.floor((unit.magiCastTimer - dt) / 0.5);
            if (healTick > prevTick) {
                healNearbyAllies(unit, 100, 0.5, 0.6, particles, ctx.allUnits);
            }
            // Cast ends after 2s
            if (unit.magiCastTimer >= 2.0) {
                unit.magiCastActive = false;
                unit.magiCooldown = 4; // 4s cooldown
                unit.magiFreezeTargets = [];
            }
        }
    },
};

// ---- Helper: heal allies in range ----
function healNearbyAllies(
    unit: Unit, healRange: number, healAmount: number,
    healVisualDuration: number, particles: any, allUnits: Unit[],
): void {
    for (const ally of allUnits) {
        if (!ally.alive || ally.team !== unit.team || ally === unit) continue;
        if (ally.healReductionTimer > 0) continue; // blocked by debuff
        const adx = ally.x - unit.x, ady = ally.y - unit.y;
        if (adx * adx + ady * ady <= healRange * healRange) {
            ally.hp = Math.min(ally.maxHp, ally.hp + healAmount);
            ally.healingTimer = healVisualDuration;
            // Heal particles on ally
            if (healAmount >= 1 || Math.random() < 0.5) {
                particles?.emit({
                    x: ally.x, y: ally.y - (healAmount >= 1 ? 8 : 6),
                    count: healAmount >= 1 ? 5 : 2, spread: healAmount >= 1 ? 4 : 3,
                    speed: [healAmount >= 1 ? 10 : 8, healAmount >= 1 ? 35 : 25],
                    angle: [-Math.PI * 0.8, -Math.PI * 0.2],
                    life: [0.3, healAmount >= 1 ? 0.8 : 0.5],
                    size: [healAmount >= 1 ? 2 : 1.5, healAmount >= 1 ? 4 : 3],
                    colors: ['#44ff88', '#88ffaa', '#aaffcc'],
                    gravity: -healAmount >= 1 ? 25 : 20, shape: 'circle',
                });
            }
        }
    }
}
