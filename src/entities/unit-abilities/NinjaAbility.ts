// ============================================================
//  NinjaAbility — Độn Thổ dash + armor penetration
//  Extracted from Unit.update() lines 479-506
// ============================================================

import type { EliteAbility, AbilityContext } from "../../types/AbilityTypes";
import type { Unit } from "../Unit";

export const NinjaAbility: EliteAbility = {
    update(unit: Unit, dt: number, ctx: AbilityContext): void {
        const { particles } = ctx;

        unit.ninjaDashCooldown = Math.max(0, unit.ninjaDashCooldown - dt);

        // Armor penetration timer countdown
        if (unit.ninjaPierceTimer > 0) {
            unit.ninjaPierceTimer = Math.max(0, unit.ninjaPierceTimer - dt);
            // Purple aura during pierce mode
            if (Math.random() < 0.3) {
                particles.emit({
                    x: unit.x + (Math.random() - 0.5) * 10, y: unit.y - 6,
                    count: 1, spread: 2,
                    speed: [10, 30], angle: [-Math.PI * 0.8, -Math.PI * 0.2],
                    life: [0.15, 0.3], size: [1.5, 3],
                    colors: ['#8800ff', '#aa44ff'],
                    gravity: -20, shape: 'circle',
                });
            }
        }

        // During Độn Thổ dash animation
        if (unit.isStealthed && unit.ninjaDashTimer > 0) {
            unit.ninjaDashTimer -= dt;
            // Lerp position during dash (0.3s total)
            const progress = 1 - (unit.ninjaDashTimer / 0.3);
            unit.x = unit.ninjaDashStartX + (unit.ninjaDashTargetX - unit.ninjaDashStartX) * Math.min(progress, 1);
            unit.y = unit.ninjaDashStartY + (unit.ninjaDashTargetY - unit.ninjaDashStartY) * Math.min(progress, 1);
            // Dash complete → appear and attack
            if (unit.ninjaDashTimer <= 0) {
                unit.isStealthed = false;
                unit.ninjaDashTimer = 0;
                unit.ninjaPierceTimer = 2.0; // 2s armor penetration after dash
                // Smoke burst on arrival
                particles.emit({
                    x: unit.x, y: unit.y - 4, count: 12, spread: 8,
                    speed: [40, 100], angle: [0, Math.PI * 2],
                    life: [0.3, 0.6], size: [3, 6],
                    colors: ['#333', '#555', '#888'],
                    gravity: -20, shape: 'circle',
                });
                // Purple pierce glow
                particles.emit({
                    x: unit.x, y: unit.y - 6, count: 8, spread: 5,
                    speed: [20, 50], angle: [0, Math.PI * 2],
                    life: [0.4, 0.8], size: [2, 5],
                    colors: ['#8800ff', '#aa44ff', '#ff00ff'],
                    gravity: -15, shape: 'star',
                });
            }
        }
    },
};
