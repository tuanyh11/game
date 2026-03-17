import { BaseCombatStrategy } from "../BaseCombatStrategy";
import { CombatContext } from "../CombatTypes";
import { Unit } from "../../Unit";
import { ParticleSystem } from "../../../effects/ParticleSystem";
import { audioSystem } from "../../../systems/AudioSystem";

export class NinjaStrategy extends BaseCombatStrategy {

    protected handlePreAttackMovement(context: CombatContext, target: Unit, dx: number, dy: number, dist: number, range: number): boolean {
        const { unit, particles } = context;

        // Ninja Độn Thổ: use anytime cooldown is ready and within skill range (250)
        if (unit.ninjaDashCooldown <= 0 && dist < 250 && !unit.isStealthed) {
            // Activate Độn Thổ!
            unit.isStealthed = true;
            unit.ninjaDashTimer = 0.3; // 0.3s dash duration
            unit.ninjaDashStartX = unit.x;
            unit.ninjaDashStartY = unit.y;

            // Dash to near the target (within melee range)
            const dashDist = Math.max(0, dist - range * 0.5);
            if (dist > 0) {
                unit.ninjaDashTargetX = unit.x + (dx / dist) * dashDist;
                unit.ninjaDashTargetY = unit.y + (dy / dist) * dashDist;
            } else {
                unit.ninjaDashTargetX = unit.x;
                unit.ninjaDashTargetY = unit.y;
            }

            unit.ninjaDashCooldown = 4; // 4s cooldown

            // Smoke puff at departure
            particles.emit({ x: unit.x, y: unit.y - 4, count: 10, spread: 6, speed: [30, 80], angle: [0, Math.PI * 2], life: [0.3, 0.6], size: [3, 6], colors: ['#333', '#555', '#888', '#222'], gravity: -20, shape: 'circle' });
            return true; // Replaces normal chase this frame
        }

        return false;
    }

    protected applyPreDamageModifiers(context: CombatContext, target: Unit, baseDamage: number): number {
        const { unit, particles } = context;
        let dmg = baseDamage;

        // Dash + Assassinate
        if (unit.isStealthed || unit.ninjaDashTimer > 0) {
            // Just finished Độn Thổ dash → ASSASSINATION! 4x damage
            dmg *= 4;
            // Massive purple slash explosion
            particles.emit({ x: target.x, y: target.y - 6, count: 20, spread: 8, speed: [80, 200], angle: [0, Math.PI * 2], life: [0.3, 0.7], size: [3, 7], colors: ['#8800ff', '#aa44ff', '#fff', '#ff00ff'], gravity: -20, shape: 'star' });
            // X-slash marks
            particles.emit({ x: target.x, y: target.y - 8, count: 8, spread: 2, speed: [50, 120], angle: [-Math.PI * 0.7, -Math.PI * 0.3], life: [0.2, 0.5], size: [2, 4], colors: ['#fff', '#ddd'], gravity: 0, shape: 'rect' });
            particles.emit({ x: target.x, y: target.y - 8, count: 8, spread: 2, speed: [50, 120], angle: [Math.PI * 0.3, Math.PI * 0.7], life: [0.2, 0.5], size: [2, 4], colors: ['#fff', '#ddd'], gravity: 0, shape: 'rect' });
            // Smoke puff at ninja
            particles.emit({ x: unit.x, y: unit.y - 4, count: 6, spread: 6, speed: [20, 60], angle: [0, Math.PI * 2], life: [0.3, 0.5], size: [3, 5], colors: ['#333', '#555'], gravity: -15, shape: 'circle' });

            unit.isStealthed = false;
        }

        // Armor penetration during pierce window (2s after dash)
        if (unit.ninjaPierceTimer > 0) {
            dmg += target.armor; // ignore armor by adding it as bonus damage
            // Purple pierce glow on hit
            particles.emit({ x: target.x, y: target.y - 6, count: 3, spread: 3, speed: [20, 50], angle: [0, Math.PI * 2], life: [0.15, 0.3], size: [2, 4], colors: ['#8800ff', '#aa44ff', '#fff'], gravity: -10, shape: 'star' });
        }

        return dmg;
    }

    protected executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void {
        const { unit, particles } = context;

        // Ninja slash sound on every attack
        audioSystem.playSFXWithPitch('/musics/daviddumaisaudio-sword-slash-and-swing-185432_GYwhZ0VB.mp3', 0.5 + Math.random() * 0.2, 1.1 + Math.random() * 0.3, unit.x, unit.y);

        // Ninja Reverse-grip fast slashes
        const slashColors = ['#aa44ff', '#8800ff', '#1a1a2e', '#ffffff'];
        // Vết chém vòng cung mượt và gắt (fast curve arc)
        for (let sw = 0; sw < 5; sw++) {
            const sa = atkAngle - 0.8 + sw * 0.4;
            particles.emit({
                x: target.x, y: target.y - 4,
                count: 1, spread: 3,
                speed: [120 + sw * 10, 220],
                angle: [sa - 0.05, sa + 0.05],
                life: [0.1, 0.25],
                size: [1.5, 4],
                colors: slashColors,
                gravity: 0, shape: 'rect'
            });
        }
        // Xoẹt kiếm mỏng cực nhanh (X-cut)
        particles.emit({ x: target.x, y: target.y - 4, count: 2, spread: 1, speed: [180, 250], angle: [atkAngle - 0.3, atkAngle + 0.3], life: [0.05, 0.15], size: [1, 8], colors: ['#fff', '#ddbbff'], gravity: 0, shape: 'rect' });

        // Tàn ảnh bóng tối vỡ ra nát vụn (Shadow spark shatter)
        particles.emit({ x: target.x, y: target.y - 6, count: 6, spread: 5, speed: [40, 100], angle: [0, Math.PI * 2], life: [0.2, 0.4], size: [2, 4], colors: ['#1a1a2e', '#2a2a4e', '#8800ff'], gravity: -10, shape: 'star' });
    }
}
