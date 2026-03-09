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
        super.executeBuildingAttack(context, target, dx, dy);

        // Siege Engine: Deal massive bonus damage to buildings
        const extraDamage = context.unit.attack * 2.5;
        target.takeDamage(extraDamage, context.particles);

        // Extra heavy impact fx on building
        context.particles.emit({
            x: target.x, y: target.y + 10, count: 15, spread: 30,
            speed: [20, 60], angle: [-0.8, 0.8],
            life: [0.5, 0.9], size: [5, 10],
            colors: ['#6a5a40', '#4a3a20', '#aa9a80'],
            gravity: 25, shape: 'circle',
        });
    }

    protected executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void {
        const { particles } = context;

        // Heavy attack sound
        audioSystem.playSlashSound();

        // Massive impact shockwave
        particles.emit({
            x: target.x, y: target.y, count: 12, spread: 15,
            speed: [40, 100], angle: [0, Math.PI * 2],
            life: [0.3, 0.7], size: [4, 8],
            colors: ['#aaddff', '#fff', '#ddd'],
            gravity: 10, shape: 'circle',
        });

        // Ground shake dust
        particles.emit({
            x: target.x, y: target.y + 10, count: 10, spread: 20,
            speed: [10, 40], angle: [-0.6, 0.6],
            life: [0.4, 0.8], size: [4, 7],
            colors: ['#6a5a40', '#4a3a20', '#aa9a80'],
            gravity: 20, shape: 'circle',
        });
    }
}
