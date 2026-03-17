import { visualRng } from "../../utils/VisualRng";
// ============================================================
//  UlfhednarAbility — Cuồng Sói rage + lightning bolts
//  Extracted from Unit.update() lines 938-1042
// ============================================================

import type { EliteAbility, AbilityContext } from "../../types/AbilityTypes";
import type { Unit } from "../Unit";
import { UnitType, UNIT_DATA, TILE_SIZE } from "../../config/GameConfig";

export const UlfhednarAbility: EliteAbility = {
    update(unit: Unit, dt: number, ctx: AbilityContext): void {
        const { particles, findNearestEnemy } = ctx;

        if (unit.ulfhednarRageActive) {
            // Rage is active — count up
            unit.ulfhednarRageTimer += dt;

            // Speed boost during rage (+50% move, +50% attack speed)
            unit.speedBonus = 0.5;

            // 🛡️ ABSOLUTE INVINCIBILITY — force-restore HP every frame
            if (unit.hp < unit.ulfhednarRageHP) {
                unit.hp = unit.ulfhednarRageHP;
            }

            // ⚡ LIGHTNING BOLTS — fire 3 bolts during rage (every ~1.3s)
            unit.ulfhednarLightningTimer += dt;
            if (unit.ulfhednarLightningCount < 3 && unit.ulfhednarLightningTimer >= 1.3) {
                unit.ulfhednarLightningTimer = 0;
                unit.ulfhednarLightningCount++;
                if (findNearestEnemy) {
                    const lightTarget = findNearestEnemy(unit.x, unit.y, unit.team, 120);
                    if (lightTarget && lightTarget.alive) {
                        fireLightningBolt(unit, lightTarget, particles);
                    }
                }
            }

            // Rage aura particles (continuous — wolf howl fire effect)
            if (visualRng() < 0.4) {
                particles.emit({
                    x: unit.x + (visualRng() - 0.5) * 14,
                    y: unit.y - 6 + (visualRng() - 0.5) * 8,
                    count: 1, spread: 2,
                    speed: [15, 40], angle: [-Math.PI * 0.8, -Math.PI * 0.2],
                    life: [0.2, 0.4], size: [2, 4],
                    colors: ['#ff4444', '#ff8844', '#ffcc44', '#fff'],
                    gravity: -35, shape: 'circle',
                });
            }
            // Electric crackling
            if (visualRng() < 0.15) {
                particles.emit({
                    x: unit.x + (visualRng() - 0.5) * 16,
                    y: unit.y - 10 + visualRng() * 12,
                    count: 2, spread: 3,
                    speed: [20, 60], angle: [0, Math.PI * 2],
                    life: [0.1, 0.25], size: [1, 2.5],
                    colors: ['#ff6644', '#ffaa44', '#fff'],
                    gravity: 0, shape: 'star',
                });
            }

            // Rage ends after 2s
            if (unit.ulfhednarRageTimer >= 2.0) {
                unit.ulfhednarRageActive = false;
                unit.ulfhednarRageReady = false;
                unit.ulfhednarRageCooldown = 5.0; // 5s cooldown
                unit.speedBonus = 0;
                // Rage end exhale
                particles.emit({
                    x: unit.x, y: unit.y - 6, count: 10, spread: 6,
                    speed: [20, 60], angle: [0, Math.PI * 2],
                    life: [0.3, 0.6], size: [2, 4],
                    colors: ['#ff444488', '#ff884488', '#33333344'],
                    gravity: -15, shape: 'circle',
                });
            }
        } else if (!unit.ulfhednarRageReady) {
            // Cooldown phase — count down
            unit.ulfhednarRageCooldown -= dt;
            if (unit.ulfhednarRageCooldown <= 0) {
                unit.ulfhednarRageReady = true;
                unit.ulfhednarRageCooldown = 0;
                // Ready flash
                particles.emit({
                    x: unit.x, y: unit.y - 8, count: 8, spread: 5,
                    speed: [20, 50], angle: [0, Math.PI * 2],
                    life: [0.3, 0.5], size: [2, 4],
                    colors: ['#ff4444', '#ff8844', '#ffcc44'],
                    gravity: -20, shape: 'star',
                });
            }
        } else if (unit.ulfhednarRageReady && !unit.ulfhednarRageActive) {
            // Check if enemy is within sight range → auto-activate rage
            if (findNearestEnemy) {
                const detectRange = UNIT_DATA[UnitType.Ulfhednar].sight * TILE_SIZE;
                const nearEnemy = findNearestEnemy(unit.x, unit.y, unit.team, detectRange);
                if (nearEnemy) {
                    // ACTIVATE RAGE!
                    unit.ulfhednarRageActive = true;
                    unit.ulfhednarRageTimer = 0;
                    unit.ulfhednarRageReady = false;
                    unit.ulfhednarLightningCount = 0;
                    unit.ulfhednarLightningTimer = 0;
                    unit.ulfhednarRageHP = unit.hp; // snapshot HP for invincibility
                    // 🔥 RAGE ACTIVATION — fire burst!
                    particles.emit({
                        x: unit.x, y: unit.y - 8, count: 22, spread: 8,
                        speed: [50, 140], angle: [0, Math.PI * 2],
                        life: [0.4, 0.8], size: [3, 7],
                        colors: ['#ff4444', '#ff8844', '#ffcc44', '#fff'],
                        gravity: -30, shape: 'star',
                    });
                    // Ground fire ring
                    particles.emit({
                        x: unit.x, y: unit.y + 2, count: 14, spread: 12,
                        speed: [70, 160], angle: [0, Math.PI * 2],
                        life: [0.2, 0.5], size: [2, 5],
                        colors: ['#ff4444', '#ff8844', '#ffcc44'],
                        gravity: 0, shape: 'rect',
                    });
                }
            }
        }
    },
};

// ---- Lightning bolt visual + damage ----
function fireLightningBolt(unit: Unit, target: Unit, particles: any): void {
    const lightDmg = Math.floor(unit.attack * 1.5);
    const finalLightDmg = target.applyPassiveDefense(lightDmg, particles);
    target.hp -= finalLightDmg;
    const tx = target.x, ty = target.y;
    const skyY = ty - 120;
    const boltSteps = 10;

    // Flash at sky origin
    particles?.emit({
        x: tx + (visualRng() - 0.5) * 20, y: skyY,
        count: 6, spread: 8,
        speed: [30, 80], angle: [0, Math.PI * 2],
        life: [0.1, 0.3], size: [3, 6],
        colors: ['#fff', '#ddeeff', '#aaccff'],
        gravity: 0, shape: 'star',
    });

    // Zigzag bolt from sky to target
    let boltX = tx + (visualRng() - 0.5) * 10;
    for (let i = 0; i <= boltSteps; i++) {
        const t = i / boltSteps;
        const by = skyY + (ty - skyY) * t;
        const zigzag = (1 - t) * (visualRng() - 0.5) * 24;
        boltX = tx + zigzag;
        const segSize = 2 + (1 - t) * 3;
        particles?.emit({
            x: boltX, y: by, count: 2, spread: 2,
            speed: [5, 25], angle: [0, Math.PI * 2],
            life: [0.08, 0.25], size: [segSize, segSize + 2],
            colors: ['#fff', '#ccddff', '#88bbff', '#4488ff'],
            gravity: 0, shape: 'rect',
        });
        if (i % 2 === 0) {
            particles?.emit({
                x: boltX, y: by, count: 1, spread: 4,
                speed: [10, 40], angle: [0, Math.PI * 2],
                life: [0.05, 0.15], size: [4, 7],
                colors: ['#4488ff44', '#88ccff66'],
                gravity: 0, shape: 'circle',
            });
        }
        if (i > 1 && i < boltSteps - 1 && visualRng() < 0.4) {
            const branchDir = visualRng() < 0.5 ? -1 : 1;
            for (let b = 0; b < 3; b++) {
                particles?.emit({
                    x: boltX + branchDir * (6 + b * 5), y: by + b * 4,
                    count: 1, spread: 1,
                    speed: [3, 15], angle: [0, Math.PI * 2],
                    life: [0.05, 0.15], size: [1, 2.5],
                    colors: ['#88ccff', '#fff', '#aaddff'],
                    gravity: 0, shape: 'rect',
                });
            }
        }
    }
    // Ground impact
    particles?.emit({
        x: tx, y: ty - 2, count: 16, spread: 6,
        speed: [60, 160], angle: [0, Math.PI * 2],
        life: [0.2, 0.5], size: [3, 7],
        colors: ['#fff', '#88ccff', '#4488ff', '#ddeeff'],
        gravity: -10, shape: 'star',
    });
    particles?.emit({
        x: tx, y: ty, count: 10, spread: 4,
        speed: [40, 100], angle: [0, Math.PI * 2],
        life: [0.15, 0.4], size: [1.5, 3],
        colors: ['#fff', '#aaddff', '#4488ff'],
        gravity: 50, shape: 'rect',
    });
}
