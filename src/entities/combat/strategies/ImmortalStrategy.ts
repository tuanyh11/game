import { BaseCombatStrategy } from "../BaseCombatStrategy";
import { CombatContext } from "../CombatTypes";
import { Unit } from "../../Unit";
import { ParticleSystem } from "../../../effects/ParticleSystem";

export class ImmortalStrategy extends BaseCombatStrategy {

    public applyPassiveIdle(unit: Unit, dt: number, particles: ParticleSystem): void {
        super.applyPassiveIdle(unit, dt, particles);

        // Phù Thuỷ Tối Thượng: aura shimmer when spell ready
        if (unit.magiCooldown <= 0 && !unit.magiCastActive) {
            if (Math.random() < dt * 1.5) {
                particles.emit({ x: unit.x + (Math.random() - 0.5) * 10, y: unit.y - 8, count: 1, spread: 3, speed: [5, 15], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.4, 0.8], size: [1.5, 3], colors: ['#88ddff', '#44ff88', '#aaeeff'], gravity: -20, shape: 'star' });
            }
        }
    }

    protected executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void {
        const { unit, particles } = context;

        // Arcane bolt impact — magical sparks
        particles.emit({ x: target.x, y: target.y - 5, count: 8, spread: 5, speed: [40, 100], angle: [0, Math.PI * 2], life: [0.2, 0.5], size: [2, 4], colors: ['#8866cc', '#aa88dd', '#44ddff', '#fff'], gravity: -15, shape: 'star' });

        // Magic bolt trail from caster to target
        const boltCount = 4;
        for (let b = 0; b < boltCount; b++) {
            const t = b / boltCount;
            const bx = unit.x + (target.x - unit.x) * t + (Math.random() - 0.5) * 6;
            const by = unit.y - 8 + (target.y - 4 - (unit.y - 8)) * t + (Math.random() - 0.5) * 4;
            particles.emit({ x: bx, y: by, count: 1, spread: 2, speed: [5, 20], angle: [0, Math.PI * 2], life: [0.1, 0.25], size: [1.5, 3], colors: ['#8866cc', '#aa88dd'], gravity: 0, shape: 'circle' });
        }
    }
}
