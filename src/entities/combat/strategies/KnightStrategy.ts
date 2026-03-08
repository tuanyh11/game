import { BaseCombatStrategy } from "../BaseCombatStrategy";
import { CombatContext } from "../CombatTypes";
import { Unit } from "../../Unit";
import { ParticleSystem } from "../../../effects/ParticleSystem";
import { CivilizationType } from "../../../config/GameConfig";

export class KnightStrategy extends BaseCombatStrategy {

    protected applyPreDamageModifiers(context: CombatContext, target: Unit, baseDamage: number): number {
        const { unit, particles, findNearestEnemy } = context;
        let dmg = baseDamage;
        const civ = unit.civilization;

        switch (civ) {
            case CivilizationType.BaTu:
                // Xung Phong Sa Mạc: first hit after moving = 2x dmg
                if (unit.passiveChargeReady) {
                    dmg *= 2;
                    unit.passiveChargeReady = false;
                    particles.emit({ x: target.x, y: target.y, count: 8, spread: 6, speed: [60, 140], angle: [0, Math.PI * 2], life: [0.3, 0.6], size: [3, 6], colors: ['#ffd700', '#ff8c00'], gravity: -20, shape: 'star' });
                }
                break;
            case CivilizationType.DaiMinh:
                // Thiết Kỵ: stun for 0.5s (CD 8s)
                if (unit.passiveCooldown <= 0) {
                    unit.passiveCooldown = 8;
                    const os = target.speed;
                    target.speed = 0;
                    setTimeout(() => { if (target.alive) target.speed = os; }, 500);
                    particles.emit({ x: target.x, y: target.y - 6, count: 6, spread: 3, speed: [20, 50], angle: [0, Math.PI * 2], life: [0.3, 0.7], size: [2, 5], colors: ['#ffcc00', '#fff'], gravity: 0, shape: 'star' });
                }
                break;
            case CivilizationType.LaMa:
                // Equites: 30% splash to nearby enemies
                if (findNearestEnemy) {
                    const splash = Math.round(dmg * 0.3);
                    const nearby = findNearestEnemy(target.x, target.y, unit.team, 30);
                    if (nearby && nearby.id !== target.id) {
                        nearby.hp -= splash;
                        particles.emit({ x: nearby.x, y: nearby.y, count: 4, spread: 4, speed: [30, 80], angle: [0, Math.PI * 2], life: [0.2, 0.4], size: [2, 4], colors: ['#ff6600', '#ffaa00'], gravity: 30, shape: 'circle' });
                    }
                }
                break;
        }

        return dmg;
    }

    protected handlePostDamageEffects(context: CombatContext, target: Unit, damageDealt: number): void {
        super.handlePostDamageEffects(context, target, damageDealt);
        const { unit, particles } = context;

        // Yamato Knight: Banzai - kill → heal 20 HP
        if (unit.civilization === CivilizationType.Yamato && target.hp <= 0 && target.alive) {
            unit.hp = Math.min(unit.maxHp, unit.hp + 20);
            particles.emit({ x: unit.x, y: unit.y - 6, count: 8, spread: 4, speed: [20, 60], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.3, 0.7], size: [2, 4], colors: ['#44ff44', '#88ff88'], gravity: -30, shape: 'star' });
        }
    }

    public applyPassiveIdle(unit: Unit, dt: number, particles: ParticleSystem): void {
        super.applyPassiveIdle(unit, dt, particles);

        // Viking Knight: Odin's Steed - +20% speed
        if (unit.civilization === CivilizationType.Viking) {
            if (unit.speed < Math.round(unit._baseSpeed * 1.2)) {
                unit.speed = Math.round(unit._baseSpeed * 1.2);
            }
        }
    }

    public applyPassiveDefense(unit: Unit, incomingDmg: number, particles: ParticleSystem, pierceBlock: boolean = false): number {
        // Viking Knight: Odin's Steed - 10% dodge
        if (unit.civilization === CivilizationType.Viking) {
            if (Math.random() < 0.10) {
                particles.emit({ x: unit.x, y: unit.y - 4, count: 3, spread: 4, speed: [20, 50], angle: [0, Math.PI * 2], life: [0.2, 0.4], size: [1, 3], colors: ['#88ddff', '#fff'], gravity: 0, shape: 'circle' });
                return 0; // Dodged!
            }
        }
        return super.applyPassiveDefense(unit, incomingDmg, particles, pierceBlock);
    }

    protected executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void {
        const { unit, particles } = context;
        const age = unit.age;

        // Cavalry charge impact — big shockwave
        particles.emit({
            x: target.x, y: target.y, count: age >= 4 ? 10 : 6, spread: 8,
            speed: [60, 140], angle: [0, Math.PI * 2],
            life: [0.2, 0.5], size: [2, 5],
            colors: age >= 4 ? ['#ffd700', '#ffaa00', '#fff', '#ddd'] : ['#ff6600', '#ffcc00', '#fff', '#aaa'],
            gravity: 40, shape: 'circle',
        });
        // Lance/sword thrust
        particles.emit({
            x: unit.x + (unit.facingRight ? 12 : -12),
            y: unit.y - 6, count: 3, spread: 2,
            speed: [150, 220],
            angle: [atkAngle - 0.1, atkAngle + 0.1],
            life: [0.1, 0.25], size: [2, 4],
            colors: age >= 4 ? ['#ffd700', '#fff'] : ['#ccc', '#aaa'],
            gravity: 0, shape: 'rect',
        });
        // Ground dust
        particles.emit({
            x: target.x, y: target.y + 8, count: 4, spread: 10,
            speed: [20, 50], angle: [-0.5, 0.5],
            life: [0.3, 0.6], size: [3, 6],
            colors: ['#8a7a60', '#6a5a40', '#aa9a80'],
            gravity: 30, shape: 'circle',
        });
    }
}
