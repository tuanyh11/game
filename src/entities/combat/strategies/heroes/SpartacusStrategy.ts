import { MeleeHeroStrategy } from "./MeleeHeroStrategy";
import { Unit } from "../../../Unit";
import { ParticleSystem } from "../../../../effects/ParticleSystem";
import { HeroSkillUtils } from "./HeroSkillUtils";

export class SpartacusStrategy extends MeleeHeroStrategy {

    public castHeroSkill(unit: Unit, skillIndex: number, particles: ParticleSystem, findNearestEnemy?: (x: number, y: number, team: number, range: number) => Unit | null, findNearestEnemyBuilding?: (x: number, y: number, team: number, range: number) => import("../../../Building").Building | null): void {
        const skills = unit.heroSkills;
        const skill = skills[skillIndex];
        if (!skill) return;

        const sid = skill.skillId;
        const aoeRange = 80;

        switch (sid) {
            case 'lama_w0': // Gladius Fúria
                HeroSkillUtils.buffVfx(unit, particles, ['#c62828', '#ef5350', '#ffcdd2', '#fff']);
                particles.emit({ x: unit.x, y: unit.y - 6, count: 18, spread: 6, speed: [80, 180], angle: [0, Math.PI * 2], life: [0.3, 0.7], size: [3, 6], colors: ['#c62828', '#ef5350', '#fff'], gravity: -35, shape: 'star' });
                particles.emit({ x: unit.x, y: unit.y + 4, count: 12, spread: 10, speed: [30, 80], angle: [0, Math.PI * 2], life: [0.4, 0.8], size: [3, 5], colors: ['#8B735588', '#a0907066'], gravity: 15, shape: 'circle' });
                break;
            case 'lama_w1': // Testudo
                for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; particles.emit({ x: unit.x + Math.cos(a) * 25, y: unit.y + Math.sin(a) * 15, count: 3, spread: 2, speed: [10, 30], angle: [a - 0.3, a + 0.3], life: [0.8, 1.5], size: [4, 7], colors: ['#8b0000', '#daa520', '#fff'], gravity: 0, shape: 'rect' }); }
                particles.emit({ x: unit.x, y: unit.y - 10, count: 20, spread: 6, speed: [40, 100], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.5, 1.0], size: [3, 6], colors: ['#ffd700', '#daa520', '#fff'], gravity: -30, shape: 'star' });
                particles.emit({ x: unit.x, y: unit.y, count: 16, spread: 4, speed: [40, 100], angle: [0, Math.PI * 2], life: [0.3, 0.6], size: [2, 4], colors: ['#8b000066', '#daa52044'], gravity: 0, shape: 'circle' });
                break;
            case 'lama_w2': // Bất Tử Legion — heal 50%
                HeroSkillUtils.healFx(unit, particles, 0.5, ['#c62828', '#ef5350', '#ffd700', '#fff']);
                particles.emit({ x: unit.x, y: unit.y - 12, count: 16, spread: 6, speed: [40, 100], angle: [-Math.PI * 0.9, -Math.PI * 0.1], life: [0.8, 1.6], size: [3, 6], colors: ['#ffd700', '#daa520'], gravity: -50, shape: 'star' });
                break;
            case 'lama_m0': { // Gương Chết — solar beam 40 AOE
                const t4 = unit.attackTarget; const fx4 = t4 ? t4.x : unit.x + (unit.facingRight ? 60 : -60); const fy4 = t4 ? t4.y : unit.y;
                HeroSkillUtils.aoeDamage(unit, 40, aoeRange, 6, findNearestEnemy);
                const fa4 = Math.atan2(fy4 - unit.y, fx4 - unit.x);
                particles.emit({ x: unit.x, y: unit.y - 8, count: 14, spread: 2, speed: [250, 420], angle: [fa4 - 0.06, fa4 + 0.06], life: [0.06, 0.18], size: [3, 8], colors: ['#ffd700', '#fff', '#ffee88'], gravity: 0, shape: 'rect' });
                for (let i = 0; i < 5; i++) { const p = i / 5; particles.emit({ x: unit.x + (fx4 - unit.x) * p, y: unit.y + (fy4 - unit.y) * p - 4, count: 3, spread: 3, speed: [10, 30], angle: [0, Math.PI * 2], life: [0.2, 0.5], size: [2, 4], colors: ['#ffd70066', '#fff44f44'], gravity: 0, shape: 'circle' }); }
                HeroSkillUtils.explodeVfx(fx4, fy4, particles, ['#ffd700', '#ffee88', '#fff', '#ff8c00']);
                break;
            }
            case 'lama_m1': // Eureka! — slow with gears
                HeroSkillUtils.slowFx(unit, 0.5, aoeRange * 1.2, 4000, 8, findNearestEnemy);
                for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; particles.emit({ x: unit.x + Math.cos(a) * 30, y: unit.y + Math.sin(a) * 18, count: 4, spread: 3, speed: [15, 40], angle: [a + Math.PI * 0.3, a + Math.PI * 0.7], life: [0.6, 1.2], size: [3, 6], colors: ['#78909c', '#b0bec5', '#daa520'], gravity: 5, shape: 'star' }); }
                particles.emit({ x: unit.x, y: unit.y, count: 24, spread: 5, speed: [50, 140], angle: [0, Math.PI * 2], life: [0.3, 0.7], size: [3, 7], colors: ['#78909c', '#b0bec5', '#ffd700', '#fff'], gravity: -5, shape: 'star' });
                break;
            case 'lama_m2': // Fulmen Jovis — 55 AOE + shield
                HeroSkillUtils.aoeDamage(unit, 55, aoeRange, 8, findNearestEnemy);
                unit.hp = Math.min(unit.maxHp, unit.hp + 50);
                particles.emit({ x: unit.x, y: unit.y - 60, count: 12, spread: 3, speed: [400, 600], angle: [Math.PI * 0.4, Math.PI * 0.6], life: [0.03, 0.1], size: [3, 10], colors: ['#fff', '#ffd700', '#ffee88'], gravity: 0, shape: 'rect' });
                HeroSkillUtils.explodeVfx(unit.x, unit.y, particles, ['#ffd700', '#fff', '#88bbff', '#aaddff']);
                for (let i = 0; i < 6; i++) { const a = Math.random() * Math.PI * 2; particles.emit({ x: unit.x + Math.cos(a) * 20, y: unit.y + Math.sin(a) * 12, count: 3, spread: 1, speed: [80, 160], angle: [a + Math.PI * 0.8, a + Math.PI * 1.2], life: [0.05, 0.15], size: [2, 6], colors: ['#88bbff', '#fff'], gravity: 0, shape: 'rect' }); }
                break;
            case 'lama_r0': { // Mưa Tên Bạc — 5 silver arrows
                HeroSkillUtils.multiShot(unit, 5, 15, unit.civRange * 1.5, ['#c0c0c0', '#e0e0e0', '#fff'], particles, findNearestEnemy);
                const rx4 = unit.x + (unit.facingRight ? 50 : -50);
                particles.emit({ x: rx4, y: unit.y - 55, count: 18, spread: 35, speed: [130, 270], angle: [Math.PI * 0.35, Math.PI * 0.65], life: [0.12, 0.38], size: [3, 6], colors: ['#c0c0c0', '#e0e0e0'], gravity: 105, shape: 'rect' });
                particles.emit({ x: rx4, y: unit.y, count: 12, spread: 30, speed: [15, 40], angle: [0, Math.PI * 2], life: [0.4, 0.8], size: [2, 4], colors: ['#c0c0c066', '#ffd70044'], gravity: -5, shape: 'star' });
                break;
            }
            case 'lama_r1': { // Tên Bạc Nữ Thần
                if (unit.attackTarget) {
                    const e = unit.attackTarget; e.hp -= 25 + unit.heroLevel * 3;
                    if (e.hp <= 0 && e.alive) unit.addHeroXp(Math.max(10, Math.floor(e.maxHp * 0.3)));
                    let t = 0; const iv = setInterval(() => { if (e.alive && t < 3) { e.hp -= 5; t++; particles.emit({ x: e.x, y: e.y - 4, count: 4, spread: 3, speed: [15, 40], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.2, 0.5], size: [2, 3], colors: ['#c0c0c0', '#ffd700'], gravity: -30, shape: 'star' }); } else clearInterval(iv); }, 1000);
                    const a = Math.atan2(e.y - unit.y, e.x - unit.x);
                    particles.emit({ x: unit.x, y: unit.y - 8, count: 4, spread: 1, speed: [380, 480], angle: [a - 0.02, a + 0.02], life: [0.08, 0.25], size: [4, 8], colors: ['#c0c0c0', '#e0e0e0', '#fff'], gravity: 0, shape: 'rect' });
                    particles.emit({ x: unit.x, y: unit.y - 8, count: 8, spread: 2, speed: [260, 380], angle: [a - 0.05, a + 0.05], life: [0.1, 0.3], size: [2, 3], colors: ['#c0c0c066', '#ffd70044'], gravity: 0, shape: 'circle' });
                    particles.emit({ x: e.x, y: e.y, count: 14, spread: 8, speed: [40, 100], angle: [0, Math.PI * 2], life: [0.3, 0.6], size: [2, 5], colors: ['#c0c0c0', '#ffd700', '#fff'], gravity: -15, shape: 'star' });
                }
                break;
            }
            case 'lama_r2': { // Mắt Nữ Thần
                const origR = unit.civRange;
                unit.civRange = Math.round(unit.civRange * 1.3);
                setTimeout(() => { unit.civRange = origR; }, 8000);
                HeroSkillUtils.buffVfx(unit, particles, ['#c0c0c0', '#e0e0e0', '#ffd700', '#fff'], 'circle');
                particles.emit({ x: unit.x, y: unit.y - 8, count: 16, spread: 4, speed: [60, 140], angle: [0, Math.PI * 2], life: [0.5, 1.0], size: [3, 6], colors: ['#c0c0c088', '#ffd70066'], gravity: 0, shape: 'circle' });
                break;
            }
        }
    }
}
