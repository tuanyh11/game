import { Unit } from "../../../Unit";
import { ParticleSystem } from "../../../../effects/ParticleSystem";
import { Building } from "../../../Building";

export class HeroSkillUtils {

    public static aoeDamage(
        unit: Unit,
        damage: number,
        range: number,
        maxTargets: number,
        findNearestEnemy?: (x: number, y: number, team: number, range: number) => Unit | null
    ): void {
        if (!findNearestEnemy) return;
        const hitSet = new Set<number>();
        for (let attempt = 0; attempt < maxTargets * 3 && hitSet.size < maxTargets; attempt++) {
            const enemy = findNearestEnemy(
                unit.x + (Math.random() - 0.5) * 10,
                unit.y + (Math.random() - 0.5) * 10,
                unit.team, range
            );
            if (enemy && !hitSet.has(enemy.id)) {
                hitSet.add(enemy.id);
                enemy.hp -= damage + unit.heroLevel * 3;
                if (enemy.hp <= 0 && enemy.alive) {
                    unit.addHeroXp(Math.max(10, Math.floor(enemy.maxHp * 0.3)));
                }
            }
        }
    }

    public static multiShot(
        unit: Unit,
        count: number,
        dmgPerArrow: number,
        range: number,
        colors: string[],
        particles: ParticleSystem,
        findNearestEnemy?: (x: number, y: number, team: number, range: number) => Unit | null
    ): void {
        if (!findNearestEnemy) return;
        const hitSet = new Set<number>();
        for (let attempt = 0; attempt < count * 4 && hitSet.size < count; attempt++) {
            const enemy = findNearestEnemy(unit.x, unit.y, unit.team, range);
            if (enemy && !hitSet.has(enemy.id)) {
                hitSet.add(enemy.id);
                enemy.hp -= dmgPerArrow + unit.heroLevel * 2;
                if (enemy.hp <= 0 && enemy.alive) unit.addHeroXp(Math.max(10, Math.floor(enemy.maxHp * 0.3)));
                const a = Math.atan2(enemy.y - unit.y, enemy.x - unit.x);
                particles.emit({ x: unit.x, y: unit.y - 8, count: 2, spread: 1, speed: [320, 420], angle: [a - 0.03, a + 0.03], life: [0.1, 0.3], size: [3, 6], colors, gravity: 5, shape: 'rect' });
                particles.emit({ x: enemy.x, y: enemy.y - 4, count: 5, spread: 6, speed: [30, 80], angle: [0, Math.PI * 2], life: [0.15, 0.35], size: [1.5, 3], colors: [...colors, '#fff'], gravity: 40, shape: 'circle' });
            }
        }
    }

    public static buffVfx(unit: Unit, particles: ParticleSystem, colors: string[], shape: 'star' | 'circle' = 'star'): void {
        particles.emit({ x: unit.x, y: unit.y, count: 24, spread: 6, speed: [60, 160], angle: [0, Math.PI * 2], life: [0.3, 0.7], size: [3, 6], colors, gravity: -20, shape });
    }

    public static explodeVfx(fx: number, fy: number, particles: ParticleSystem, colors: string[]): void {
        particles.emit({ x: fx, y: fy, count: 40, spread: 10, speed: [80, 260], angle: [0, Math.PI * 2], life: [0.2, 0.6], size: [3, 9], colors, gravity: -10, shape: 'circle' });
        particles.emit({ x: fx, y: fy, count: 14, spread: 4, speed: [20, 70], angle: [0, Math.PI * 2], life: [0.3, 0.6], size: [5, 11], colors: ['#fff', '#ffee88'], gravity: -5, shape: 'circle' });
    }

    public static healFx(unit: Unit, particles: ParticleSystem, pct: number, colors: string[]): void {
        unit.hp = Math.min(unit.maxHp, unit.hp + Math.floor(unit.maxHp * pct));
        particles.emit({ x: unit.x, y: unit.y, count: 24, spread: 8, speed: [40, 120], angle: [0, Math.PI * 2], life: [0.5, 1.2], size: [3, 7], colors, gravity: -40, shape: 'star' });
        particles.emit({ x: unit.x, y: unit.y, count: 16, spread: 4, speed: [50, 130], angle: [0, Math.PI * 2], life: [0.2, 0.5], size: [2, 4], colors: ['#fff8', '#ffee8866'], gravity: 0, shape: 'circle' });
    }

    public static slowFx(unit: Unit, pct: number, range: number, ms: number, max: number, findNearestEnemy?: (x: number, y: number, team: number, range: number) => Unit | null): void {
        if (!findNearestEnemy) return;
        const hitSet = new Set<number>();
        for (let i = 0; i < max * 3 && hitSet.size < max; i++) {
            const e = findNearestEnemy(unit.x, unit.y, unit.team, range);
            if (e && !hitSet.has(e.id)) {
                hitSet.add(e.id);
                const os = e.data.speed;
                e.speed *= (1 - pct);
                setTimeout(() => { if (e.alive) e.speed = os; }, ms);
            }
        }
    }
}
