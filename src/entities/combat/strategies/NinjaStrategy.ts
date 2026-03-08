import { BaseCombatStrategy } from "../BaseCombatStrategy";
import { CombatContext } from "../CombatTypes";
import { Unit } from "../../Unit";
import { ParticleSystem } from "../../../effects/ParticleSystem";

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

        // Katana slash wave — wide purple arc
        for (let sw = 0; sw < 6; sw++) {
            const sa = atkAngle - 1.0 + sw * 0.35;
            particles.emit({ x: target.x, y: target.y - 4, count: 1, spread: 2, speed: [80 + sw * 15, 160], angle: [sa - 0.05, sa + 0.05], life: [0.12, 0.35], size: [2, 4], colors: ['#aa44ff', '#8800ff', '#ddd'], gravity: 5, shape: 'rect' });
        }

        // Shadow dash trail from attacker to target
        const midX = (unit.x + target.x) / 2;
        const midY = (unit.y + target.y) / 2;
        particles.emit({ x: midX, y: midY - 4, count: 6, spread: 4, speed: [50, 100], angle: [atkAngle - 0.2, atkAngle + 0.2], life: [0.1, 0.3], size: [2, 4], colors: ['#1a1a2e', '#2a2a4e', '#4400aa'], gravity: 0, shape: 'rect' });

        // Impact sparks on target
        particles.emit({ x: target.x, y: target.y - 6, count: 5, spread: 4, speed: [40, 90], angle: [0, Math.PI * 2], life: [0.1, 0.3], size: [1.5, 3], colors: ['#fff', '#ddd', '#aaa'], gravity: 50, shape: 'circle' });

        // Purple impact burst
        particles.emit({ x: target.x, y: target.y - 4, count: 10, spread: 6, speed: [60, 150], angle: [0, Math.PI * 2], life: [0.2, 0.5], size: [2, 5], colors: ['#8800ff', '#6600cc', '#aa44ff', '#ff00ff'], gravity: 15, shape: 'star' });
    }
}
