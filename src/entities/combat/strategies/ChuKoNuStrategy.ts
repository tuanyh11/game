import { BaseCombatStrategy } from "../BaseCombatStrategy";
import { CombatContext } from "../CombatTypes";
import { Unit } from "../../Unit";

export class ChuKoNuStrategy extends BaseCombatStrategy {

    protected executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void {
        const { unit, particles } = context;

        // Cẩm Y Vệ (ChuKoNu) - Tú Xuân Đao (Xiu Chun Dao)
        const isComboReady = unit.camYVeCooldown <= 0 && !unit.camYVeComboActive;
        const slashColors = isComboReady
            ? ['#8b0000', '#ff0033', '#ffffff']  // Dark blood crimson glow when charged
            : ['#dd2222', '#ff8800', '#ffffff']; // Normal brutal slash

        // Lưỡi đao chém phập mạn sườn (Thick, brutal arc)
        for (let sw = 0; sw < 6; sw++) {
            const sa = atkAngle - 0.6 + sw * 0.25;
            particles.emit({
                x: target.x, y: target.y - 4,
                count: 1, spread: 2,
                speed: [100 + sw * 15, 200],
                angle: [sa - 0.05, sa + 0.05],
                life: [0.15, 0.3],
                size: [2, 5],
                colors: slashColors,
                gravity: 10, shape: 'rect'
            });
        }

        // Máu me văng tung tóe (Bloody sparks)
        const sparkColors = isComboReady
            ? ['#ff0033', '#8b0000', '#550000']
            : ['#ff4444', '#dd2222', '#ffcc00'];
        particles.emit({
            x: target.x, y: target.y - 4,
            count: 8, spread: 6,
            speed: [40, 110], angle: [0, Math.PI * 2],
            life: [0.15, 0.4],
            size: [1.5, 4],
            colors: sparkColors,
            gravity: 60, shape: 'circle'
        });

        // Crimson aura flicker when charged
        if (isComboReady) {
            particles.emit({ x: unit.x, y: unit.y - 8, count: 4, spread: 3, speed: [10, 30], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.3, 0.6], size: [2, 4], colors: ['#8b0000', '#aa2222', '#ff0044'], gravity: -20, shape: 'circle' });
        }
    }
}
