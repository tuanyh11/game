import { BaseCombatStrategy } from "../BaseCombatStrategy";
import { CombatContext } from "../CombatTypes";
import { Unit } from "../../Unit";
import { ParticleSystem } from "../../../effects/ParticleSystem";

export class UlfhednarStrategy extends BaseCombatStrategy {

    protected calculateAttackSpeedModifier(unit: Unit): number {
        // Cuồng Sói: +50% attack speed during rage
        return unit.ulfhednarRageActive ? 0.5 : super.calculateAttackSpeedModifier(unit);
    }

    protected shouldPierceBlock(unit: Unit): boolean {
        // Ulfhednar attacks pierce Centurion blocks during rage
        return unit.ulfhednarRageActive;
    }

    protected applyPreDamageModifiers(context: CombatContext, target: Unit, baseDamage: number): number {
        const { unit, particles } = context;
        let dmg = baseDamage;

        // Ulfhednar: Cuồng Sói — +30% ATK during rage
        if (unit.ulfhednarRageActive) {
            dmg = Math.round(dmg * 1.3);
            // Electric spark on hit during rage
            particles.emit({ x: target.x, y: target.y - 6, count: 5, spread: 4, speed: [30, 80], angle: [0, Math.PI * 2], life: [0.15, 0.35], size: [2, 4], colors: ['#4488ff', '#88ccff', '#fff'], gravity: -15, shape: 'star' });
        }

        return dmg;
    }

    public applyPassiveDefense(unit: Unit, incomingDmg: number, particles: ParticleSystem, pierceBlock: boolean = false): number {
        // Cuồng Sói — invincible during rage
        if (unit.ulfhednarRageActive) {
            particles.emit({ x: unit.x + (Math.random() - 0.5) * 10, y: unit.y - 8, count: 3, spread: 4, speed: [25, 60], angle: [0, Math.PI * 2], life: [0.1, 0.25], size: [2, 4], colors: ['#ff4444', '#ff8844', '#ffcc44', '#fff'], gravity: -20, shape: 'star' });
            return 0; // BẤT TỬ!
        }
        return super.applyPassiveDefense(unit, incomingDmg, particles, pierceBlock);
    }

    protected executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void {
        const { particles } = context;

        // Berserker dual-axe — red flame trails
        for (let i = 0; i < 8; i++) {
            const sa = atkAngle - 1.5 + i * 0.4;
            particles.emit({ x: target.x, y: target.y - 3, count: 1, spread: 2, speed: [70, 150], angle: [sa - 0.08, sa + 0.08], life: [0.12, 0.3], size: [2, 4], colors: ['#ff2200', '#ff6600', '#ffaa00'], gravity: 15, shape: 'rect' });
        }

        // Blood splash
        particles.emit({ x: target.x, y: target.y - 5, count: 5, spread: 5, speed: [40, 90], angle: [0, Math.PI * 2], life: [0.15, 0.4], size: [1.5, 3], colors: ['#cc0000', '#880000', '#ff4444'], gravity: 60, shape: 'circle' });
    }
}
