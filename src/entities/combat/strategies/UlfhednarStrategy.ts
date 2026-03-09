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
        const { unit, particles } = context;

        // Berserker Dual-Axe furious slashes
        // Chém hai lưỡi Rìu chéo nhau (Criss-cross axe swings)
        const isRaging = unit.ulfhednarRageActive;
        const slashColors = isRaging ? ['#ff2200', '#ff6600', '#ffaa00'] : ['#cccccc', '#ffffff', '#aaaaaa'];
        const axSpread = isRaging ? 0.3 : 0.15; // Wider more savage swings when raging

        // Axe slash 1 (Left to right)
        for (let i = 0; i < 4; i++) {
            const sa1 = atkAngle - 0.5 + i * axSpread;
            particles.emit({
                x: target.x, y: target.y - 4, count: 1, spread: 2,
                speed: [100 + i * 15, 200], angle: [sa1 - 0.05, sa1 + 0.05],
                life: [0.1, 0.25], size: [2, 5], colors: slashColors, gravity: 5, shape: 'rect'
            });
        }
        // Axe slash 2 (Right to left)
        for (let i = 0; i < 4; i++) {
            const sa2 = atkAngle + 0.5 - i * axSpread;
            particles.emit({
                x: target.x, y: target.y - 2, count: 1, spread: 2,
                speed: [100 + i * 15, 200], angle: [sa2 - 0.05, sa2 + 0.05],
                life: [0.1, 0.25], size: [2, 5], colors: slashColors, gravity: 5, shape: 'rect'
            });
        }

        // Visceral blood splash
        const bloodColors = isRaging ? ['#880000', '#ee0000', '#ff4444'] : ['#990000', '#cc0000'];
        particles.emit({
            x: target.x, y: target.y - 4,
            count: isRaging ? 12 : 6, spread: 8,
            speed: [50, 140], angle: [0, Math.PI * 2],
            life: [0.2, 0.5], size: [1.5, 4],
            colors: bloodColors, gravity: 80, shape: 'circle'
        });

        // Bone crushing sparks if raging
        if (isRaging) {
            particles.emit({
                x: target.x, y: target.y - 6,
                count: 4, spread: 4,
                speed: [80, 160], angle: [-Math.PI * 0.8, -Math.PI * 0.2],
                life: [0.1, 0.3], size: [2, 4],
                colors: ['#fff', '#ffccaa'], gravity: 20, shape: 'star'
            });
        }
    }
}
