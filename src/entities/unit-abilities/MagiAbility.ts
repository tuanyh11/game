// ============================================================
//  MagiAbility — Bất Tử Quân: Quicksand Trap + Desert Sun Heal
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

                    // ⏳ QUICKSAND (Freeze): Find up to 3 enemies in range and trap them in golden sand
                    const freezeRange = 220;
                    const freezeDuration = 3; // 3 seconds
                    let frozen = 0;

                    // Trap the nearest enemy first
                    if (nearEnemy.alive && frozen < 3) {
                        nearEnemy.frozenTimer = freezeDuration;
                        unit.magiFreezeTargets.push(nearEnemy);
                        frozen++;
                        // ⏳ Golden Quicksand burst on target
                        particles.emit({
                            x: nearEnemy.x, y: nearEnemy.y + 4, count: 14, spread: 8,
                            speed: [10, 40], angle: [-Math.PI, 0], // Swirling around feet
                            life: [0.6, 1.2], size: [2, 4],
                            colors: ['#e5b13a', '#d4af37', '#8a6608', '#ffcc00'],
                            gravity: 5, shape: 'circle',
                        });
                        // Sand rising up
                        particles.emit({
                            x: nearEnemy.x, y: nearEnemy.y - 5, count: 8, spread: 5,
                            speed: [30, 70], angle: [-Math.PI * 0.7, -Math.PI * 0.3],
                            life: [0.4, 0.8], size: [1.5, 3],
                            colors: ['#ffe55c', '#d4af37'],
                            gravity: -10, shape: 'rect',
                        });
                    }

                    // Try to trap 2 more nearby enemies
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
                                x: extraEnemy.x, y: extraEnemy.y + 4, count: 10, spread: 6,
                                speed: [10, 30], angle: [-Math.PI, 0],
                                life: [0.5, 1.0], size: [1.5, 3.5],
                                colors: ['#e5b13a', '#d4af37', '#ffcc00'],
                                gravity: 5, shape: 'circle',
                            });
                            particles.emit({
                                x: extraEnemy.x, y: extraEnemy.y - 5, count: 5, spread: 4,
                                speed: [25, 60], angle: [-Math.PI * 0.7, -Math.PI * 0.3],
                                life: [0.3, 0.7], size: [1.5, 3],
                                colors: ['#ffe55c', '#d4af37'],
                                gravity: -10, shape: 'rect',
                            });
                        }
                    }

                    // ☀️ HEAL: DESERT SUN - Heal nearby allies +10 HP
                    healNearbyAllies(unit, 100, 4, 1.0, particles, ctx.allUnits);

                    // Healing aura visual on self (Warm Crimson/Gold glow)
                    particles.emit({
                        x: unit.x, y: unit.y - 4, count: 18, spread: 12,
                        speed: [20, 60], angle: [0, Math.PI * 2],
                        life: [0.6, 1.2], size: [2.5, 5],
                        colors: ['#ff4444', '#ffaa00', '#ffd700', '#ffffff'],
                        gravity: -15, shape: 'circle',
                    });

                    // Cast animation: Golden Runic Magic Circle on ground
                    particles.emit({
                        x: unit.x, y: unit.y + 8, count: 20, spread: 16,
                        speed: [30, 80], angle: [0, Math.PI * 2],
                        life: [0.4, 0.7], size: [2, 4],
                        colors: ['#d4af37', '#ffcc00', '#ffaa00'],
                        gravity: 0, shape: 'rect',
                    });
                    // Sandstorm wave radiating outward
                    particles.emit({
                        x: unit.x, y: unit.y, count: 15, spread: 8,
                        speed: [40, 100], angle: [0, Math.PI * 2],
                        life: [0.3, 0.6], size: [2.5, 5.5],
                        colors: ['#8a6608', '#e5b13a', '#ffcc00', '#ffffff'],
                        gravity: -5, shape: 'circle',
                    });
                }
            }
        } else {
            unit.magiCastTimer += dt;
            // Ongoing desert sun heal aura particles
            if (Math.random() < 0.25) {
                particles.emit({
                    x: unit.x + (Math.random() - 0.5) * 18,
                    y: unit.y - 4 + (Math.random() - 0.5) * 12,
                    count: 1, spread: 3,
                    speed: [10, 25], angle: [-Math.PI * 0.8, -Math.PI * 0.2],
                    life: [0.4, 0.7], size: [2, 3.5],
                    colors: ['#ff4444', '#ffaa00'],
                    gravity: -15, shape: 'circle',
                });
            }
            // ☀️ Continuous heal: +3 HP/s to nearby allies during cast (tick every 0.5s)
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

// ---- Helper: heal allies in range (Desert Sun style) ----
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
            // Heal particles on ally (Golden/Crimson warmth)
            if (healAmount >= 1 || Math.random() < 0.5) {
                particles?.emit({
                    x: ally.x, y: ally.y - (healAmount >= 1 ? 8 : 6),
                    count: healAmount >= 1 ? 5 : 2, spread: healAmount >= 1 ? 4 : 3,
                    speed: [healAmount >= 1 ? 12 : 8, healAmount >= 1 ? 40 : 25],
                    angle: [-Math.PI * 0.8, -Math.PI * 0.2],
                    life: [0.3, healAmount >= 1 ? 0.8 : 0.5],
                    size: [healAmount >= 1 ? 2.5 : 1.5, healAmount >= 1 ? 4.5 : 3.5],
                    colors: ['#ff4444', '#ffaa00', '#ffd700'],
                    gravity: -healAmount >= 1 ? 20 : 15, shape: 'circle',
                });
            }
        }
    }
}
