import { visualRng } from "../../../utils/VisualRng";
import { BaseCombatStrategy } from "../BaseCombatStrategy";
import { CombatContext } from "../CombatTypes";
import { Unit } from "../../Unit";
import { ParticleSystem } from "../../../effects/ParticleSystem";

export class ImmortalStrategy extends BaseCombatStrategy {

    public applyPassiveIdle(unit: Unit, dt: number, particles: ParticleSystem): void {
        super.applyPassiveIdle(unit, dt, particles);

        // Bất Tử Quân: aura shimmer when spell ready (Golden Sand/Mirage glow)
        if (unit.magiCooldown <= 0 && !unit.magiCastActive) {
            if (visualRng() < dt * 1.5) {
                particles.emit({ x: unit.x + (visualRng() - 0.5) * 10, y: unit.y - 8, count: 1, spread: 3, speed: [5, 15], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.4, 0.8], size: [1.5, 3], colors: ['#ffd700', '#ffaa00', '#ffeb99'], gravity: -10, shape: 'circle' });
            }
        }
    }

    protected executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void {
        const { unit, particles } = context;

        // Bất Tử Quân (Immortal) - Heavy Kopis slash
        // Vết chém dao bầu cong (Kopis) màu vàng huỳnh quang lấp lánh cát sa mạc
        const slashColors = ['#ffd700', '#ffaa00', '#ffffff'];
        for (let sw = 0; sw < 5; sw++) {
            const sa = atkAngle - 0.5 + sw * 0.25;
            particles.emit({
                x: target.x, y: target.y - 4,
                count: 1, spread: 2,
                speed: [80 + sw * 15, 180],
                angle: [sa - 0.05, sa + 0.05],
                life: [0.15, 0.3],
                size: [2, 6],
                colors: slashColors,
                gravity: 0, shape: 'rect'
            });
        }

        // Sparks / Cát sa mạc văng vãi khi va đập
        particles.emit({
            x: target.x, y: target.y - 4,
            count: 6, spread: 5,
            speed: [50, 100], angle: [0, Math.PI * 2],
            life: [0.1, 0.3],
            size: [1.5, 3],
            colors: ['#c9a84c', '#fff', '#8a6f3e'],
            gravity: 40, shape: 'circle'
        });
    }
}
