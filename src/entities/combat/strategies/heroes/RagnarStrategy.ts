import { MeleeHeroStrategy } from "./MeleeHeroStrategy";
import { Unit } from "../../../Unit";
import { ParticleSystem } from "../../../../effects/ParticleSystem";
import { HeroSkillUtils } from "./HeroSkillUtils";

export class RagnarStrategy extends MeleeHeroStrategy {

    public castHeroSkill(unit: Unit, skillIndex: number, particles: ParticleSystem, findNearestEnemy?: (x: number, y: number, team: number, range: number) => Unit | null, findNearestEnemyBuilding?: (x: number, y: number, team: number, range: number) => import("../../../Building").Building | null): void {
        const skills = unit.heroSkills;
        const skill = skills[skillIndex];
        if (!skill) return;

        const sid = skill.skillId;
        const aoeRange = 80;

        switch (sid) {
            case 'viking_w0': { // Berserkergang 
                const pct = unit.hp / unit.maxHp;
                const bonus = pct < 0.25 ? 1.0 : (pct < 0.5 ? 0.5 : 0.25);
                unit.attack = Math.round(unit._baseAttack * (1 + bonus));
                const n = bonus > 0.5 ? 60 : 36;
                particles.emit({ x: unit.x, y: unit.y, count: n, spread: 6, speed: [100, 260], angle: [0, Math.PI * 2], life: [0.3, 0.9], size: [3, 8], colors: ['#ff0000', '#cc0000', '#ff2200', '#ff4400'], gravity: -15, shape: 'circle' });
                particles.emit({ x: unit.x, y: unit.y - 8, count: 20, spread: 6, speed: [60, 160], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.5, 1.2], size: [4, 9], colors: ['#ff0000', '#ff4400', '#ffaa00', '#fff'], gravity: -60, shape: 'star' });
                particles.emit({ x: unit.x, y: unit.y + 6, count: 14, spread: 15, speed: [40, 100], angle: [0, Math.PI * 2], life: [0.4, 0.8], size: [3, 6], colors: ['#6B422688', '#8B5A2B66'], gravity: 20, shape: 'rect' });
                break;
            }
            case 'viking_w1': { // Mjölnir Hạ Thần — Ice blast + freeze
                HeroSkillUtils.aoeDamage(unit, 30, aoeRange, 8, findNearestEnemy);
                // Ice spray outward in all directions
                particles.emit({ x: unit.x, y: unit.y, count: 60, spread: 4, speed: [180, 400], angle: [0, Math.PI * 2], life: [0.3, 0.8], size: [3, 7], colors: ['#88ddff', '#aaeeff', '#ccf4ff', '#fff'], gravity: -10, shape: 'star' });
                // Ice crystal shards
                for (let i = 0; i < 12; i++) {
                    const a = (i / 12) * Math.PI * 2;
                    particles.emit({ x: unit.x + Math.cos(a) * 20, y: unit.y + Math.sin(a) * 12, count: 4, spread: 2, speed: [100, 240], angle: [a - 0.2, a + 0.2], life: [0.15, 0.4], size: [2, 6], colors: ['#88ddff', '#fff', '#e0ffff'], gravity: 0, shape: 'rect' });
                }
                // Ground freeze ring
                particles.emit({ x: unit.x, y: unit.y + 6, count: 30, spread: 35, speed: [20, 60], angle: [0, Math.PI * 2], life: [0.8, 1.5], size: [4, 8], colors: ['#88ddff44', '#aaeeff33', '#e0ffff22'], gravity: 0, shape: 'circle' });
                // Ice burst from center upward
                particles.emit({ x: unit.x, y: unit.y - 10, count: 16, spread: 3, speed: [80, 200], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.5, 1.2], size: [3, 8], colors: ['#88ddff', '#aaeeff', '#fff'], gravity: -40, shape: 'star' });
                // Freeze enemies within range for 2s
                if (findNearestEnemy) {
                    const frozen = new Set<number>();
                    for (let i = 0; i < 20 && frozen.size < 8; i++) {
                        const e = findNearestEnemy(unit.x, unit.y, unit.team, aoeRange);
                        if (e && !frozen.has(e.id)) {
                            frozen.add(e.id);
                            const os = e.speed;
                            e.speed = 0;
                            e.frozenUntil = Date.now() + 2000;
                            setTimeout(() => { if (e.alive) e.speed = os; }, 2000);
                            // Ice crystals on each frozen enemy
                            particles.emit({ x: e.x, y: e.y, count: 12, spread: 3, speed: [20, 60], angle: [0, Math.PI * 2], life: [1.0, 2.0], size: [3, 7], colors: ['#88ddff', '#aaeeff', '#e0ffff', '#fff'], gravity: -5, shape: 'star' });
                            particles.emit({ x: e.x, y: e.y, count: 8, spread: 2, speed: [5, 15], angle: [0, Math.PI * 2], life: [1.5, 2.5], size: [5, 10], colors: ['#88ddff33', '#aaeeff22'], gravity: 0, shape: 'circle' });
                        }
                    }
                }
                break;
            }
            case 'viking_w2': // Valhalla — invincible 4s
                particles.emit({ x: unit.x, y: unit.y, count: 50, spread: 6, speed: [80, 240], angle: [0, Math.PI * 2], life: [0.6, 1.8], size: [4, 10], colors: ['#ffd700', '#ffee88', '#fff', '#ff6600'], gravity: -35, shape: 'star' });
                particles.emit({ x: unit.x, y: unit.y - 20, count: 20, spread: 3, speed: [40, 120], angle: [-Math.PI * 0.6, -Math.PI * 0.4], life: [0.8, 2.0], size: [3, 6], colors: ['#ffd700', '#fff'], gravity: -60, shape: 'rect' });
                particles.emit({ x: unit.x, y: unit.y, count: 28, spread: 4, speed: [100, 220], angle: [0, Math.PI * 2], life: [0.3, 0.6], size: [2, 5], colors: ['#ffd70088', '#ff444466'], gravity: 0, shape: 'circle' });
                break;
            case 'viking_m0': { // Rune Thiên Lôi — 35 AOE 
                HeroSkillUtils.aoeDamage(unit, 35, aoeRange, 6, findNearestEnemy);
                for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; particles.emit({ x: unit.x + Math.cos(a) * 28, y: unit.y + Math.sin(a) * 16, count: 4, spread: 2, speed: [10, 30], angle: [a + Math.PI * 0.4, a + Math.PI * 0.6], life: [0.8, 1.6], size: [3, 6], colors: ['#88ccff', '#aaddff', '#fff'], gravity: 0, shape: 'star' }); }
                HeroSkillUtils.explodeVfx(unit.x, unit.y, particles, ['#4488ff', '#88aaff', '#aaccff', '#fff']);
                particles.emit({ x: unit.x, y: unit.y - 50, count: 8, spread: 2, speed: [400, 600], angle: [Math.PI * 0.45, Math.PI * 0.55], life: [0.03, 0.1], size: [3, 10], colors: ['#fff', '#88ccff', '#aaddff'], gravity: 0, shape: 'rect' });
                if (findNearestEnemy) { const hs = new Set<number>(); for (let i = 0; i < 18 && hs.size < 6; i++) { const e = findNearestEnemy(unit.x, unit.y, unit.team, aoeRange); if (e && !hs.has(e.id)) { hs.add(e.id); const os = e.speed; e.speed = 0; e.frozenUntil = Date.now() + 1000; setTimeout(() => { if (e.alive) e.speed = os; }, 1000); } } }
                particles.emit({ x: unit.x, y: unit.y, count: 12, spread: 8, speed: [15, 40], angle: [0, Math.PI * 2], life: [0.8, 1.8], size: [3, 6], colors: ['#88ccff66', '#aaddff44'], gravity: 0, shape: 'circle' });
                break;
            }
            case 'viking_m1': { // Triệu Hồi Sói — wolf summon burst
                for (let w = 0; w < 2; w++) {
                    const wx = unit.x + (w === 0 ? -30 : 30);
                    particles.emit({ x: wx, y: unit.y + 10, count: 24, spread: 8, speed: [40, 120], angle: [0, Math.PI * 2], life: [0.3, 0.9], size: [3, 8], colors: ['#555', '#777', '#999', '#bbb'], gravity: -15, shape: 'circle' });
                    particles.emit({ x: wx, y: unit.y + 2, count: 6, spread: 3, speed: [10, 30], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.8, 1.5], size: [2, 4], colors: ['#88ccff', '#fff', '#aaddff'], gravity: -20, shape: 'star' });
                    particles.emit({ x: wx, y: unit.y + 12, count: 8, spread: 6, speed: [20, 50], angle: [0, Math.PI * 2], life: [0.3, 0.6], size: [2, 4], colors: ['#8B735588', '#a0907066'], gravity: 15, shape: 'circle' });
                }
                HeroSkillUtils.aoeDamage(unit, 24, aoeRange * 1.2, 4, findNearestEnemy);
                break;
            }
            case 'viking_m2': { // Phong Ấn Băng — freeze 1 enemy 3s
                if (findNearestEnemy) {
                    const e = findNearestEnemy(unit.x, unit.y, unit.team, aoeRange * 1.5);
                    if (e) {
                        const os = e.speed; e.speed = 0; e.frozenUntil = Date.now() + 3000; setTimeout(() => { if (e.alive) e.speed = os; }, 3000);
                        particles.emit({ x: e.x, y: e.y, count: 30, spread: 4, speed: [40, 100], angle: [0, Math.PI * 2], life: [0.6, 1.4], size: [4, 10], colors: ['#88ddff', '#aaeeff', '#fff', '#ccf4ff'], gravity: 5, shape: 'star' });
                        particles.emit({ x: e.x, y: e.y, count: 16, spread: 3, speed: [10, 25], angle: [0, Math.PI * 2], life: [1.5, 3.0], size: [6, 14], colors: ['#88ddff44', '#aaeeff33', '#fff22'], gravity: 0, shape: 'circle' });
                        for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; particles.emit({ x: e.x + Math.cos(a) * 12, y: e.y + Math.sin(a) * 8, count: 3, spread: 1, speed: [5, 15], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [1.0, 2.0], size: [3, 5], colors: ['#88ddff', '#fff'], gravity: -10, shape: 'star' }); }
                    }
                }
                particles.emit({ x: unit.x, y: unit.y, count: 16, spread: 6, speed: [80, 200], angle: [0, Math.PI * 2], life: [0.2, 0.5], size: [3, 6], colors: ['#88ddff88', '#aaeeff66'], gravity: 0, shape: 'circle' });
                break;
            }
            case 'viking_r0': { // Rìu Băng
                if (unit.attackTarget) {
                    const e = unit.attackTarget; const dmg = 30 + unit.heroLevel * 3 + Math.floor(e.armor * 0.5);
                    e.hp -= dmg; if (e.hp <= 0 && e.alive) unit.addHeroXp(Math.max(10, Math.floor(e.maxHp * 0.3)));
                    const a = Math.atan2(e.y - unit.y, e.x - unit.x);
                    particles.emit({ x: unit.x, y: unit.y - 6, count: 4, spread: 1, speed: [300, 420], angle: [a - 0.04, a + 0.04], life: [0.1, 0.3], size: [5, 9], colors: ['#888', '#aaa', '#ccc'], gravity: 8, shape: 'rect' });
                    particles.emit({ x: unit.x, y: unit.y - 6, count: 8, spread: 2, speed: [200, 340], angle: [a - 0.08, a + 0.08], life: [0.1, 0.25], size: [2, 4], colors: ['#88ddff66', '#aaeeff44'], gravity: 0, shape: 'circle' });
                    particles.emit({ x: e.x, y: e.y, count: 16, spread: 10, speed: [50, 130], angle: [0, Math.PI * 2], life: [0.2, 0.6], size: [2, 6], colors: ['#88ddff', '#888', '#fff'], gravity: 25, shape: 'star' });
                }
                break;
            }
            case 'viking_r1': // Ullr's Gale 
                unit.speed = Math.floor(unit._baseSpeed * 1.3);
                HeroSkillUtils.buffVfx(unit, particles, ['#4db6ac', '#80cbc4', '#b2dfdb', '#fff'], 'circle');
                particles.emit({ x: unit.x, y: unit.y, count: 16, spread: 10, speed: [60, 140], angle: [unit.facingRight ? -0.3 : Math.PI - 0.3, unit.facingRight ? 0.3 : Math.PI + 0.3], life: [0.3, 0.7], size: [2, 5], colors: ['#88ddff88', '#aaeeff66', '#fff44f44'], gravity: 5, shape: 'circle' });
                break;
            case 'viking_r2': { // Fimbulvetr 
                HeroSkillUtils.multiShot(unit, 6, 15, unit.civRange * 1.5, ['#88ddff', '#aaeeff', '#ccf4ff'], particles, findNearestEnemy);
                HeroSkillUtils.slowFx(unit, 0.3, unit.civRange * 1.5, 3000, 6, findNearestEnemy);
                const rx5 = unit.x + (unit.facingRight ? 50 : -50);
                particles.emit({ x: rx5, y: unit.y - 55, count: 22, spread: 45, speed: [130, 290], angle: [Math.PI * 0.35, Math.PI * 0.65], life: [0.12, 0.4], size: [3, 6], colors: ['#88ddff', '#aaeeff', '#fff'], gravity: 110, shape: 'rect' });
                particles.emit({ x: rx5, y: unit.y + 2, count: 16, spread: 40, speed: [15, 40], angle: [0, Math.PI * 2], life: [0.5, 1.2], size: [2, 5], colors: ['#88ddff88', '#aaeeff66', '#fff8'], gravity: -5, shape: 'star' });
                break;
            }
        }
    }
}
