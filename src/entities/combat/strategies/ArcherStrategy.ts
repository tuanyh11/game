import { BaseCombatStrategy } from "../BaseCombatStrategy";
import { CombatContext } from "../CombatTypes";
import { Unit } from "../../Unit";
import { Building } from "../../Building";
import { CivilizationType, TILE_SIZE } from "../../../config/GameConfig";

export class ArcherStrategy extends BaseCombatStrategy {

    protected applyPreDamageModifiers(context: CombatContext, target: Unit, baseDamage: number): number {
        const { unit, particles } = context;
        let dmg = baseDamage;
        const civ = unit.civilization;

        switch (civ) {
            case CivilizationType.BaTu:
                // Tên Lửa: 20% fire arrow (+5 burn dmg over 2s)
                if (Math.random() < 0.20) {
                    const e = target;
                    let t = 0;
                    const iv = setInterval(() => {
                        if (e.alive && t < 2) {
                            e.hp -= 5;
                            t++;
                            particles.emit({ x: e.x, y: e.y - 4, count: 3, spread: 3, speed: [15, 40], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.2, 0.4], size: [2, 3], colors: ['#ff4400', '#ff6600'], gravity: -30, shape: 'circle' });
                        } else {
                            clearInterval(iv);
                        }
                    }, 1000);
                }
                break;
            case CivilizationType.DaiMinh:
                // Nỏ Liên Châu: every 4th hit = 2x dmg
                if (unit.passiveHitCounter % 4 === 0) {
                    dmg *= 2;
                    particles.emit({ x: target.x, y: target.y - 4, count: 6, spread: 4, speed: [40, 100], angle: [0, Math.PI * 2], life: [0.2, 0.5], size: [2, 4], colors: ['#4488ff', '#88bbff', '#fff'], gravity: -15, shape: 'star' });
                }
                break;
            case CivilizationType.Yamato:
                // Kyūdō: 15% critical hit (2x dmg)
                if (Math.random() < 0.15) {
                    dmg *= 2;
                    particles.emit({ x: target.x, y: target.y - 8, count: 8, spread: 5, speed: [50, 120], angle: [0, Math.PI * 2], life: [0.2, 0.5], size: [2, 5], colors: ['#ff0000', '#ff4444', '#fff'], gravity: -10, shape: 'star' });
                }
                break;
            case CivilizationType.LaMa:
                // Plumbata: slow enemy 20% for 2s
                const origSpd1 = target._baseSpeed;
                target.speed = Math.round(origSpd1 * 0.8);
                setTimeout(() => { if (target.alive) target.speed = origSpd1; }, 2000);
                break;
            case CivilizationType.Viking:
                // Frost Arrow: 20% slow 30% for 2s
                if (Math.random() < 0.20) {
                    const origSpd2 = target._baseSpeed;
                    target.speed = Math.round(origSpd2 * 0.7);
                    setTimeout(() => { if (target.alive) target.speed = origSpd2; }, 2000);
                    particles.emit({ x: target.x, y: target.y, count: 5, spread: 4, speed: [20, 50], angle: [0, Math.PI * 2], life: [0.3, 0.7], size: [2, 4], colors: ['#88ddff', '#aaeeff'], gravity: -5, shape: 'star' });
                }
                break;
        }
        return dmg;
    }

    protected executeBuildingAttack(context: CombatContext, target: Building, dx: number, dy: number): void {
        const { unit, particles } = context;
        const atkAngle = Math.atan2(dy, dx);
        // Arrow hitting wall
        particles.emit({
            x: unit.x + (unit.facingRight ? 10 : -10),
            y: unit.y - 8, count: 1, spread: 0,
            speed: [280, 320],
            angle: [atkAngle - 0.02, atkAngle + 0.02],
            life: [0.15, 0.35], size: [3, 4],
            colors: unit.age >= 4 ? ['#ffd700'] : ['#cc3333'], // Red fletching for default, gold for age 4
            gravity: 15, shape: 'arrow',
        });
    }

    protected executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void {
        const { unit, particles } = context;
        const age = unit.age;

        // Arrow projectile
        particles.emit({
            x: unit.x + (unit.facingRight ? 10 : -10),
            y: unit.y - 8, count: 1, spread: 0,
            speed: [280, 320],
            angle: [atkAngle - 0.02, atkAngle + 0.02],
            life: [0.15, 0.35], size: [3, 4],
            colors: age >= 4 ? ['#ffd700'] : ['#cc3333'],
            gravity: 15, shape: 'arrow',
        });
        // Arrow trail
        particles.emit({
            x: unit.x + (unit.facingRight ? 8 : -8),
            y: unit.y - 8, count: age >= 3 ? 2 : 1, spread: 2,
            speed: [60, 120],
            angle: [atkAngle - 0.05, atkAngle + 0.05],
            life: [0.1, 0.25], size: [1, 2],
            colors: age >= 4 ? ['#ffd700', '#ffaa00'] : ['#ddd', '#fff'],
            gravity: 0, shape: 'rect',
        });
        // Hit impact
        particles.emit({
            x: target.x, y: target.y - 5, count: 3, spread: 5,
            speed: [20, 60], angle: [-Math.PI, 0],
            life: [0.15, 0.4], size: [1, 2.5],
            colors: ['#ff4444', '#ff8800', '#fff'],
            gravity: 60, shape: 'circle',
        });
    }
}
