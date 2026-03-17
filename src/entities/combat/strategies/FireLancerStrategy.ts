import { BaseCombatStrategy } from "../BaseCombatStrategy";
import { CombatContext } from "../CombatTypes";
import { Unit } from "../../Unit";
import { audioSystem } from "../../../systems/AudioSystem";

export class FireLancerStrategy extends BaseCombatStrategy {
    protected applyPreDamageModifiers(context: CombatContext, target: Unit, baseDamage: number): number {
        const { unit, particles } = context;
        let dmg = baseDamage;

        // Gunpowder Charge: The very first attack against an enemy triggers an explosion
        if (unit.passiveChargeReady) {
            dmg = Math.round(dmg * 2.5); // Devastating burst

            // Stun target briefly to simulate heavy knockback from explosion
            if (!target.isUnstoppable) {
                const os = target.speed;
                if (os > 0) {
                    target.speed = 0;
                    setTimeout(() => { if (target.alive) target.speed = os; }, 1500); // 1.5s stun
                }
            }
        }
        return dmg;
    }

    protected executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void {
        const { unit, particles } = context;

        if (unit.passiveChargeReady) {
            // EXPLOSION FX
            audioSystem.playExplosionSound(unit.x, unit.y);

            // Massive cluster of fire particles
            particles.emit({
                x: target.x, y: target.y, count: 25, spread: 25,
                speed: [60, 180], angle: [0, Math.PI * 2],
                life: [0.3, 0.8], size: [4, 10],
                colors: ['#ff8c00', '#ff2222', '#ffff00', '#ffffff'],
                gravity: -10, shape: 'star'
            });

            // Shockwave dust
            particles.emit({
                x: target.x, y: target.y + 10, count: 12, spread: 20,
                speed: [30, 80], angle: [-0.6, 0.6],
                life: [0.4, 0.9], size: [3, 8],
                colors: ['#6a5a40', '#4a3a20', '#aa9a80'],
                gravity: 20, shape: 'circle',
            });

            unit.passiveChargeReady = false; // Mark as exhausted after the fx triggers
        } else {
            // Standard Melee FX
            audioSystem.playSpearStab(unit.x, unit.y);

            particles.emit({
                x: target.x, y: target.y, count: 6, spread: 8,
                speed: [40, 100],
                angle: [atkAngle - 0.2, atkAngle + 0.2],
                life: [0.2, 0.4], size: [2, 5],
                colors: ['#ffdd00', '#ff4400'],
                gravity: -10, shape: 'circle',
            });
        }
    }
}
