import { BaseCombatStrategy } from "../BaseCombatStrategy";
import { CombatContext } from "../CombatTypes";
import { Unit } from "../../Unit";
import { ParticleSystem } from "../../../effects/ParticleSystem";
import { CivilizationType, UnitState } from "../../../config/GameConfig";

export class SpearmanStrategy extends BaseCombatStrategy {

    public applyPassiveIdle(unit: Unit, dt: number, particles: ParticleSystem): void {
        super.applyPassiveIdle(unit, dt, particles);
        const civ = unit.civilization;

        // Viking Spearman: Shield Wall - regen 2 HP/s when HP < 50%
        if (civ === CivilizationType.Viking) {
            if (unit.hp < unit.maxHp * 0.5 && unit.hp > 0) {
                unit.hp = Math.min(unit.maxHp, unit.hp + 2 * dt);
                if (Math.random() < dt * 2) {
                    particles.emit({ x: unit.x, y: unit.y - 8, count: 2, spread: 3, speed: [10, 25], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.3, 0.6], size: [1, 2], colors: ['#44ff44', '#88ff88'], gravity: -20, shape: 'circle' });
                }
            }
        }

        // Ba Tư Spearman: Tường Bất Tử - when HP < 40%, activate defense buff (CD 15s)
        if (civ === CivilizationType.BaTu) {
            if (unit.hp < unit.maxHp * 0.4 && unit.passiveCooldown <= 0) {
                unit.passiveCooldown = 15;
                unit.passiveBuffTimer = 4; // 4s of 30% damage reduction
                particles.emit({ x: unit.x, y: unit.y, count: 10, spread: 4, speed: [30, 80], angle: [0, Math.PI * 2], life: [0.4, 0.8], size: [3, 6], colors: ['#ffd700', '#daa520', '#fff'], gravity: 0, shape: 'circle' });
            }
        }
    }

    public applyPassiveDefense(unit: Unit, incomingDmg: number, particles: ParticleSystem, pierceBlock: boolean = false): number {
        let dmg = incomingDmg;
        const civ = unit.civilization;

        // Ba Tư Spearman: Tường Bất Tử - 30% damage reduction when buff active
        if (civ === CivilizationType.BaTu && unit.passiveBuffTimer > 0) {
            return Math.round(dmg * 0.7);
        }

        // La Mã Spearman: Testudo - 25% damage reduction when idle (not moving)
        if (civ === CivilizationType.LaMa && unit.state !== UnitState.Moving) {
            return Math.round(dmg * 0.75);
        }

        return super.applyPassiveDefense(unit, dmg, particles, pierceBlock);
    }

    protected executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void {
        const { unit, particles } = context;
        const age = unit.age;

        // Spear thrust impact — sparks and blood
        particles.emit({
            x: target.x, y: target.y - 5, count: age >= 3 ? 6 : 4, spread: 4,
            speed: [40, 100], angle: [atkAngle - 0.4, atkAngle + 0.4],
            life: [0.2, 0.5], size: [1.5, 3],
            colors: ['#ff6600', '#ffcc00', '#fff', '#aaa'],
            gravity: 80, shape: 'circle',
        });
        // Thrust line effect
        particles.emit({
            x: unit.x + (unit.facingRight ? 8 : -8),
            y: unit.y - 4, count: 2, spread: 2,
            speed: [120, 180],
            angle: [atkAngle - 0.05, atkAngle + 0.05],
            life: [0.1, 0.2], size: [2, 4],
            colors: age >= 4 ? ['#ffd700', '#fff'] : ['#ccc', '#aaa'],
            gravity: 0, shape: 'rect',
        });
    }

}
