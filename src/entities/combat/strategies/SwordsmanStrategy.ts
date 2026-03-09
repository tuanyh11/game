import { BaseCombatStrategy } from "../BaseCombatStrategy";
import { CombatContext } from "../CombatTypes";
import { Unit } from "../../Unit";
import { ParticleSystem } from "../../../effects/ParticleSystem";
import { CivilizationType } from "../../../config/GameConfig";
import { audioSystem } from "../../../systems/AudioSystem";

export class SwordsmanStrategy extends BaseCombatStrategy {

    protected applyPreDamageModifiers(context: CombatContext, target: Unit, baseDamage: number): number {
        const { unit, particles } = context;
        let dmg = baseDamage;
        const civ = unit.civilization;

        // Custom civ modifiers
        switch (civ) {
            case CivilizationType.Yamato:
                // Bushidō: below 30% HP → +50% ATK
                if (unit.hp < unit.maxHp * 0.3) dmg = Math.round(dmg * 1.5);
                break;
            case CivilizationType.Viking:
                // Berserker: +25% dmg dealt
                dmg = Math.round(dmg * 1.25);
                break;
        }

        // Ba Tư Swordsman: Cuồng Chiến - kill → +30% ATK for 4s
        if (civ === CivilizationType.BaTu && target.hp - dmg <= 0 && target.alive) {
            unit.passiveBuffTimer = 4;
            particles.emit({ x: unit.x, y: unit.y - 8, count: 10, spread: 5, speed: [40, 100], angle: [0, Math.PI * 2], life: [0.4, 0.8], size: [3, 6], colors: ['#ff4400', '#ffaa00', '#fff'], gravity: -30, shape: 'star' });
        }
        if (civ === CivilizationType.BaTu && unit.passiveBuffTimer > 0) {
            dmg = Math.round(dmg * 1.3);
        }

        return dmg;
    }

    public applyPassiveDefense(unit: Unit, incomingDmg: number, particles: ParticleSystem, pierceBlock: boolean = false): number {
        let dmg = incomingDmg;
        const civ = unit.civilization;

        // Đại Minh Swordsman: Võ Thuật - 20% dodge
        if (civ === CivilizationType.DaiMinh) {
            if (Math.random() < 0.20) {
                particles.emit({ x: unit.x, y: unit.y - 6, count: 4, spread: 5, speed: [30, 70], angle: [0, Math.PI * 2], life: [0.2, 0.4], size: [2, 3], colors: ['#fff', '#aaddff'], gravity: 0, shape: 'circle' });
                return 0; // dodged!
            }
        }

        // Viking Swordsman: Berserker - take 15% more dmg
        if (civ === CivilizationType.Viking) {
            dmg = Math.round(dmg * 1.15);
        }

        return super.applyPassiveDefense(unit, dmg, particles, pierceBlock);
    }

    protected executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void {
        const { unit, particles } = context;
        const age = unit.age;

        // Play synthetic slash sound
        audioSystem.playSlashSound();

        // Heavy sword slash — wide arc sparks
        for (let i = 0; i < (age >= 3 ? 6 : 4); i++) {
            const sa = atkAngle - 1.0 + i * 0.5;
            particles.emit({
                x: target.x, y: target.y - 3, count: 1, spread: 2,
                speed: [60, 120],
                angle: [sa - 0.1, sa + 0.1],
                life: [0.1, 0.3], size: [2, 4],
                colors: age >= 4 ? ['#ffd700', '#fff'] : ['#ddd', '#aaa', '#fff'],
                gravity: 20, shape: 'rect',
            });
        }
        // Impact sparks
        particles.emit({
            x: target.x, y: target.y - 5, count: age >= 3 ? 6 : 4, spread: 6,
            speed: [40, 100], angle: [-Math.PI, Math.PI],
            life: [0.15, 0.4], size: [1.5, 3],
            colors: ['#ff6600', '#ffcc00', '#fff'],
            gravity: 60, shape: 'circle',
        });
    }
}
