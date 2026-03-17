import { BaseCombatStrategy } from "../BaseCombatStrategy";
import { CombatContext } from "../CombatTypes";
import { Unit } from "../../Unit";
import { audioSystem } from "../../../systems/AudioSystem";

export class ScoutStrategy extends BaseCombatStrategy {

    protected executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void {
        const { unit, particles } = context;
        const age = unit.age;

        audioSystem.playSlashSound(unit.x, unit.y);

        // Quick slash arc
        const slashDir = unit.facingRight ? 1 : -1;
        for (let i = 0; i < (age >= 3 ? 5 : 3); i++) {
            const sa = atkAngle - 0.8 + i * 0.4;
            particles.emit({
                x: unit.x + slashDir * 6, y: unit.y - 2, count: 1, spread: 1,
                speed: [80, 140],
                angle: [sa - 0.1, sa + 0.1],
                life: [0.08, 0.2], size: [1.5, 3],
                colors: age >= 4 ? ['#ffd700', '#fff', '#eee'] : ['#ddd', '#fff', '#ccc'],
                gravity: 0, shape: 'rect',
            });
        }

        // Speed slash lines
        if (age >= 3) {
            particles.emit({
                x: unit.x - slashDir * 8, y: unit.y, count: 3, spread: 4,
                speed: [40, 80],
                angle: [Math.PI + atkAngle - 0.3, Math.PI + atkAngle + 0.3],
                life: [0.05, 0.15], size: [1, 2],
                colors: ['rgba(255,255,255,0.5)'],
                gravity: 0, shape: 'rect',
            });
        }

        // Hit sparks
        particles.emit({
            x: target.x, y: target.y - 5, count: 3, spread: 4,
            speed: [50, 100], angle: [-Math.PI, Math.PI],
            life: [0.1, 0.3], size: [1, 2],
            colors: age >= 4 ? ['#ffd700', '#ffaa00', '#fff'] : ['#ff6600', '#ffcc00', '#fff'],
            gravity: 40, shape: 'circle',
        });
    }

}
