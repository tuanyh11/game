import { BaseCombatStrategy } from "../BaseCombatStrategy";
import { CombatContext } from "../CombatTypes";
import { Unit } from "../../Unit";
import { audioSystem } from "../../../systems/AudioSystem";

export class BearRiderStrategy extends BaseCombatStrategy {

    protected calculateAttackSpeedModifier(unit: Unit): number {
        let mod = super.calculateAttackSpeedModifier(unit);
        // Berserker Rage: At < 30% HP, attack much faster
        if (unit.hp < unit.maxHp * 0.3) {
            mod *= 0.6;
        }
        return mod;
    }

    protected applyPreDamageModifiers(context: CombatContext, target: Unit, baseDamage: number): number {
        const { unit, particles } = context;
        let dmg = baseDamage;

        const isRaging = unit.hp < unit.maxHp * 0.3;

        // Berserker Rage Damage Bonus
        if (isRaging) {
            dmg = Math.round(dmg * 1.5);
        }

        // Terrifying Roar (Every 8 seconds)
        if (unit.passiveCooldown <= 0) {
            unit.passiveCooldown = 8;

            // Slow target and reduce their attack briefly (simulated by slow + particles)
            if (!target.isUnstoppable) {
                const os = target.speed;
                if (os > 0) {
                    target.speed = Math.max(1, Math.floor(os * 0.3)); // 70% slow
                    setTimeout(() => { if (target.alive) target.speed = os; }, 3000); // 3s slow
                }
            }

            audioSystem.playDeathSound(); // Low roar-like groan sound

            // Roar VFX
            particles.emit({
                x: unit.x + (unit.facingRight ? 10 : -10), y: unit.y - 12, count: 12, spread: 20,
                speed: [30, 80], angle: [-0.5, 0.5],
                life: [0.3, 0.6], size: [3, 6],
                colors: ['#cccccc', '#888888', '#555555'], gravity: 0, shape: 'circle'
            });

            // Rage VFX if low HP
            if (isRaging) {
                particles.emit({
                    x: unit.x, y: unit.y, count: 10, spread: 10,
                    speed: [20, 50], angle: [0, Math.PI * 2],
                    life: [0.4, 0.8], size: [2, 5],
                    colors: ['#ff0000', '#ff5500'], gravity: -20, shape: 'star'
                });
            }
        }

        return dmg;
    }

    protected executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void {
        const { unit, particles } = context;

        audioSystem.playSlashSound();

        const isRaging = unit.hp < unit.maxHp * 0.3;

        // Axe / Claws impact
        particles.emit({
            x: target.x, y: target.y - 6, count: isRaging ? 10 : 6, spread: 5,
            speed: [50, 100], angle: [0, Math.PI * 2],
            life: [0.2, 0.4], size: [2, 5],
            colors: isRaging ? ['#ff4444', '#ffffff'] : ['#dddddd', '#ffffff'],
            gravity: 20, shape: 'circle',
        });
    }
}
