import { CivilizationType } from "../../../config/GameConfig";
import { ParticleSystem } from "../../../effects/ParticleSystem";

import { BaseCombatStrategy } from "../BaseCombatStrategy";
import { CombatContext } from "../CombatTypes";
import { Unit } from "../../Unit";
import { audioSystem } from "../../../systems/AudioSystem";

export class WarElephantStrategy extends BaseCombatStrategy {

    protected applyPreDamageModifiers(context: CombatContext, target: Unit, baseDamage: number): number {
        const { unit, particles, findNearestEnemy } = context;
        let dmg = baseDamage;

        // War Elephant: Trample (Heavy splash damage)
        if (findNearestEnemy) {
            const splashRadius = 40;
            const splashDmg = Math.round(dmg * 0.5);

            // Since we don't have getNearbyEnemies, we'll hit the nearest enemy.
            // If it supports it, we could do more, but for now we splash the nearest one that isn't the primary target.
            const nearby = findNearestEnemy(target.x, target.y, unit.team, splashRadius);
            // In a real scenario we'd get all enemies in radius, but this is a simple approximation.
            if (nearby && nearby.id !== target.id) {
                nearby.hp -= splashDmg;
                particles.emit({
                    x: nearby.x, y: nearby.y, count: 8, spread: 12,
                    speed: [30, 80], angle: [0, Math.PI * 2],
                    life: [0.3, 0.6], size: [4, 6],
                    colors: ['#8b0000', '#ff2222', '#550000'], gravity: 30, shape: 'circle'
                });
            }
        }

        return dmg;
    }

    protected executeBuildingAttack(context: CombatContext, target: import("../../Building").Building, dx: number, dy: number): void {
        const { unit, particles } = context;
        audioSystem.playArrowSound(unit.x, unit.y);

        const atkAngle = Math.atan2(dy, dx);
        // Arrow projectile hitting building
        particles.emit({
            x: unit.x + (unit.facingRight ? 10 : -10),
            y: unit.y - 12, count: 1, spread: 0,
            speed: [250, 300],
            angle: [atkAngle - 0.02, atkAngle + 0.02],
            life: [0.2, 0.4], size: [3, 4],
            colors: ['#cc3333'],
            gravity: 15, shape: 'arrow',
        });

        // Siege bonus damage to buildings
        const extraDamage = context.unit.attack * 1.5;
        target.takeDamage(extraDamage, context.particles);
    }

    protected executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void {
        const { unit, particles } = context;

        audioSystem.playArrowSound(unit.x, unit.y);

        // Arrow projectile flying to target
        particles.emit({
            x: unit.x + (unit.facingRight ? 10 : -10),
            y: unit.y - 12, count: 1, spread: 0,
            speed: [250, 300],
            angle: [atkAngle - 0.03, atkAngle + 0.03],
            life: [0.2, 0.4], size: [3, 5],
            colors: ['#cc3333'],
            gravity: 15, shape: 'arrow',
        });

        // Arrow trail
        particles.emit({
            x: unit.x + (unit.facingRight ? 8 : -8),
            y: unit.y - 12, count: 2, spread: 2,
            speed: [60, 120],
            angle: [atkAngle - 0.05, atkAngle + 0.05],
            life: [0.1, 0.25], size: [1, 2],
            colors: ['#ddd', '#fff'],
            gravity: 0, shape: 'rect',
        });

        // Hit impact on target
        particles.emit({
            x: target.x, y: target.y - 5, count: 4, spread: 6,
            speed: [20, 60], angle: [-Math.PI, 0],
            life: [0.15, 0.4], size: [1, 3],
            colors: ['#ff4444', '#ff8800', '#fff'],
            gravity: 60, shape: 'circle',
        });
    }
}
