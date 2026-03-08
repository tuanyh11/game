import { BaseCombatStrategy } from "../BaseCombatStrategy";
import { CombatContext } from "../CombatTypes";
import { Unit } from "../../Unit";

export class ChuKoNuStrategy extends BaseCombatStrategy {

    protected executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void {
        const { unit, particles } = context;

        // Cẩm Y Vệ normal slash (Ming Jian - straight sword) + Cửu Tịch charge indicator
        const isComboReady = unit.camYVeCooldown <= 0 && !unit.camYVeComboActive;
        const slashColors = isComboReady
            ? ['#8b0000', '#ff0044', '#dd2222']  // dark crimson glow when charged
            : ['#dd3333', '#ffd700', '#fff'];     // normal Jian flash

        // Jian straight piercing slash/thrust geometry (thinner, faster, longer)
        for (let sw = 0; sw < 5; sw++) {
            const sa = atkAngle - 0.4 + sw * 0.2; // tighter arc than a dao
            particles.emit({ x: target.x, y: target.y - 4, count: 1, spread: 2, speed: [100 + sw * 20, 200], angle: [sa - 0.05, sa + 0.05], life: [0.1, 0.25], size: [1.5, 6], colors: slashColors, gravity: 0, shape: 'rect' });
        }

        // Sparks (crimson when charged, gold normally)
        const sparkColors = isComboReady
            ? ['#ff0044', '#8b0000', '#ff3333']
            : ['#ffd700', '#fff', '#c9a84c'];
        particles.emit({ x: target.x, y: target.y - 4, count: 5, spread: 4, speed: [40, 90], angle: [0, Math.PI * 2], life: [0.1, 0.3], size: [1.5, 3], colors: sparkColors, gravity: 50, shape: 'circle' });

        // Crimson aura flicker when charged
        if (isComboReady) {
            particles.emit({ x: unit.x, y: unit.y - 8, count: 4, spread: 3, speed: [10, 30], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.3, 0.6], size: [2, 4], colors: ['#8b0000', '#aa2222', '#ff0044'], gravity: -20, shape: 'circle' });
        }
    }
}
