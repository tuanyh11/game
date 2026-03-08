// ============================================================
//  CamYVeAbility — Cẩm Y Vệ: Tịch Tà Kiếm Phổ combo
//  Extracted from Unit.update() lines 600-691
// ============================================================

import type { EliteAbility, AbilityContext } from "../../types/AbilityTypes";
import type { Unit } from "../Unit";
import { UnitState } from "../../config/GameConfig";

export const CamYVeAbility: EliteAbility = {
    update(unit: Unit, dt: number, ctx: AbilityContext): void {
        const { particles } = ctx;

        // Cooldown countdown
        if (unit.camYVeCooldown > 0 && !unit.camYVeComboActive) {
            unit.camYVeCooldown -= dt;
        }

        // Auto-trigger: when attacking, cooldown ready, AND within attack range
        const comboTarget = unit.attackTarget;
        const comboDist = comboTarget ? Math.hypot(comboTarget.x - unit.x, comboTarget.y - unit.y) : Infinity;
        if (!unit.camYVeComboActive && unit.camYVeCooldown <= 0
            && unit.state === UnitState.Attacking && comboTarget && comboTarget.alive
            && comboDist <= unit.civRange + 10) {
            unit.camYVeComboActive = true;
            unit.camYVeComboTimer = 0;
            unit.camYVeComboPhase = -1;
            unit.camYVeOrigX = unit.x;
            unit.camYVeOrigY = unit.y;
            unit.camYVeComboTargetX = comboTarget.x;
            unit.camYVeComboTargetY = comboTarget.y;
            unit.camYVeVisible = false; // disappear first
            // Randomize 3 slash angles
            const baseAngle = Math.atan2(comboTarget.y - unit.y, comboTarget.x - unit.x);
            unit.camYVeSlashAngles = [
                baseAngle + Math.PI + 0.4,    // behind-right
                baseAngle + Math.PI - 0.8,    // behind-left
                baseAngle + Math.PI + Math.PI, // front
            ];
            // Disappear smoke (crimson + dark gold)
            particles.emit({
                x: unit.x, y: unit.y - 4, count: 10, spread: 5,
                speed: [20, 70], angle: [0, Math.PI * 2],
                life: [0.2, 0.5], size: [2, 4],
                colors: ['#8b0000', '#aa2222', '#c9a84c'],
                gravity: -15, shape: 'circle',
            });
        }

        // Combo animation
        if (unit.camYVeComboActive) {
            unit.camYVeComboTimer += dt;
            const phaseTime = 0.2;        // time per slash
            const hideTime = 0.08;         // invisible between slashes
            const currentPhase = Math.floor(unit.camYVeComboTimer / phaseTime);
            const phaseProgress = (unit.camYVeComboTimer % phaseTime) / phaseTime;

            // Flicker visibility: invisible during first part, visible during slash
            unit.camYVeVisible = phaseProgress > (hideTime / phaseTime);

            if (currentPhase !== unit.camYVeComboPhase && currentPhase < 3) {
                unit.camYVeComboPhase = currentPhase;
                // Update target position if target moved
                if (unit.attackTarget && unit.attackTarget.alive) {
                    unit.camYVeComboTargetX = unit.attackTarget.x;
                    unit.camYVeComboTargetY = unit.attackTarget.y;
                }
                // Dash to new position around target
                const angle = unit.camYVeSlashAngles[currentPhase];
                const dashDist = 30 + Math.random() * 10;
                unit.x = unit.camYVeComboTargetX + Math.cos(angle) * dashDist;
                unit.y = unit.camYVeComboTargetY + Math.sin(angle) * dashDist;
                unit.facingRight = unit.x < unit.camYVeComboTargetX;

                // Deal damage
                const slashDmg = Math.floor(unit.attack * 1.5);
                if (unit.attackTarget && unit.attackTarget.alive) {
                    unit.attackTarget.hp -= slashDmg;
                }

                // Thrust / Piercing fx instead of wide arcs
                const slashAngle = Math.atan2(
                    unit.camYVeComboTargetY - unit.y,
                    unit.camYVeComboTargetX - unit.x,
                );
                for (let sw = 0; sw < 7; sw++) {
                    const sa = slashAngle - 0.2 + sw * 0.05; // very narrow piercing spread
                    particles.emit({
                        x: unit.camYVeComboTargetX, y: unit.camYVeComboTargetY - 6,
                        count: 2, spread: 3,
                        speed: [150 + sw * 25, 250],
                        angle: [sa - 0.02, sa + 0.02],
                        life: [0.1, 0.3], size: [1.5, 6],
                        colors: ['#8b0000', '#ff0044', '#ffd700'],
                        gravity: 0, shape: 'rect',
                    });
                }
                // Crimson energy burst
                particles.emit({
                    x: unit.camYVeComboTargetX, y: unit.camYVeComboTargetY - 4,
                    count: 8, spread: 5,
                    speed: [40, 100], angle: [0, Math.PI * 2],
                    life: [0.2, 0.5], size: [2, 5],
                    colors: ['#8b0000', '#dd2222', '#ffaa00'],
                    gravity: -10, shape: 'star',
                });
                // Appear smoke at dash position
                particles.emit({
                    x: unit.x, y: unit.y - 4, count: 4, spread: 3,
                    speed: [15, 40], angle: [0, Math.PI * 2],
                    life: [0.15, 0.3], size: [2, 3],
                    colors: ['#8b0000', '#c9a84c'],
                    gravity: -10, shape: 'circle',
                });
            }

            // Combo finished
            if (unit.camYVeComboTimer >= phaseTime * 3 + 0.05) {
                unit.camYVeComboActive = false;
                unit.camYVeVisible = true;
                unit.camYVeCooldown = 4; // 4s cooldown
                unit.x = unit.camYVeOrigX;
                unit.y = unit.camYVeOrigY;
                // Final burst (Ming Gold/Crimson)
                particles.emit({
                    x: unit.camYVeComboTargetX, y: unit.camYVeComboTargetY - 6,
                    count: 14, spread: 6,
                    speed: [80, 180], angle: [0, Math.PI * 2],
                    life: [0.3, 0.6], size: [3, 6],
                    colors: ['#8b0000', '#ff3333', '#ffd700', '#fff'],
                    gravity: -15, shape: 'star',
                });
                // Reappear smoke
                particles.emit({
                    x: unit.x, y: unit.y - 4, count: 6, spread: 4,
                    speed: [15, 50], angle: [0, Math.PI * 2],
                    life: [0.2, 0.4], size: [2, 4],
                    colors: ['#8b0000', '#c9a84c'],
                    gravity: -15, shape: 'circle',
                });
            }
        }
    },
};
