import { BaseCombatStrategy } from "../../BaseCombatStrategy";
import { CombatContext } from "../../CombatTypes";
import { Unit } from "../../../Unit";
import { ParticleSystem } from "../../../../effects/ParticleSystem";
import { audioSystem } from "../../../../systems/AudioSystem";

export abstract class MeleeHeroStrategy extends BaseCombatStrategy {

    protected executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void {
        const { particles } = context;

        // Hero sword slash sound
        audioSystem.playSFXWithPitch('/musics/daviddumaisaudio-sword-slash-and-swing-185432_GYwhZ0VB.mp3', 0.6 + Math.random() * 0.2, 0.85 + Math.random() * 0.2, context.unit.x, context.unit.y);

        // Epic sword slash — wide flame arc
        for (let i = 0; i < 14; i++) {
            const sa = atkAngle - 1.8 + i * 0.26;
            particles.emit({
                x: target.x, y: target.y - 4, count: 1, spread: 2,
                speed: [100, 220],
                angle: [sa - 0.08, sa + 0.08],
                life: [0.12, 0.35], size: [2.5, 5.5],
                colors: ['#ff2222', '#ff6600', '#ffaa00', '#ffd700', '#fff'],
                gravity: 8, shape: 'rect',
            });
        }

        // Ground shockwave ring
        particles.emit({
            x: target.x, y: target.y + 4, count: 16, spread: 8,
            speed: [70, 180], angle: [0, Math.PI * 2],
            life: [0.2, 0.45], size: [2.5, 5],
            colors: ['#ff4444', '#ff6600', '#ffaa00'],
            gravity: 40, shape: 'circle',
        });

        // Afterglow embers rising
        particles.emit({
            x: target.x, y: target.y - 2, count: 8, spread: 10,
            speed: [15, 50], angle: [-Math.PI * 0.8, -Math.PI * 0.2],
            life: [0.4, 0.9], size: [1.5, 3],
            colors: ['#ff4400', '#ff6600', '#ffcc00'],
            gravity: -35, shape: 'circle',
        });

        // Blood splash
        particles.emit({
            x: target.x, y: target.y - 6, count: 8, spread: 8,
            speed: [50, 140], angle: [-Math.PI, Math.PI],
            life: [0.2, 0.5], size: [2, 4],
            colors: ['#cc0000', '#ff3333', '#990000', '#ff1111'],
            gravity: 120, shape: 'circle',
        });
    }
}
