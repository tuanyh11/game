import { MeleeHeroStrategy } from "./MeleeHeroStrategy";
import { CombatContext } from "../../CombatTypes";
import { Unit } from "../../../Unit";
import { ParticleSystem } from "../../../../effects/ParticleSystem";
import { HeroSkillUtils } from "./HeroSkillUtils";

export class MusashiStrategy extends MeleeHeroStrategy {

    protected applyPreDamageModifiers(context: CombatContext, target: Unit, baseDamage: number): number {
        let dmg = super.applyPreDamageModifiers(context, target, baseDamage);
        const { unit } = context;
        // HeroMusashi skill 3: double damage
        if (unit.heroSkillActive[2] > 0) dmg *= 2;
        return dmg;
    }

    public castHeroSkill(unit: Unit, skillIndex: number, particles: ParticleSystem, findNearestEnemy?: (x: number, y: number, team: number, range: number) => Unit | null, findNearestEnemyBuilding?: (x: number, y: number, team: number, range: number) => import("../../../Building").Building | null): void {
        const skills = unit.heroSkills;
        const skill = skills[skillIndex];
        if (!skill) return;

        const sid = skill.skillId;
        const aoeRange = 80;

        switch (sid) {
            case 'yamato_w0': { // Zan-Tetsu-Ken — dash slash
                const dd = 80; const dir = unit.facingRight ? 1 : -1; const ox = unit.x;
                unit.x += dir * dd;
                if (findNearestEnemy) { const hs = new Set<number>(); for (let i = 0; i < 20 && hs.size < 6; i++) { const e = findNearestEnemy((ox + unit.x) / 2, unit.y, unit.team, dd); if (e && !hs.has(e.id)) { hs.add(e.id); e.hp -= 30 + unit.heroLevel * 2; if (e.hp <= 0 && e.alive) unit.addHeroXp(Math.max(10, Math.floor(e.maxHp * 0.3))); } } }
                particles.emit({ x: (ox + unit.x) / 2, y: unit.y - 4, count: 16, spread: dd / 2, speed: [10, 40], angle: [-Math.PI * 0.9, -Math.PI * 0.1], life: [0.2, 0.5], size: [2, 12], colors: ['#e0e0ff88', '#fff8', '#b0bec566'], gravity: 0, shape: 'rect' });
                for (let i = 0; i < 4; i++) { const p = i / 4; particles.emit({ x: ox + (unit.x - ox) * p, y: unit.y, count: 6, spread: 4, speed: [20, 60], angle: [0, Math.PI * 2], life: [0.15, 0.35], size: [2, 4], colors: ['#607d8b66', '#90a4ae44'], gravity: 0, shape: 'circle' }); }
                particles.emit({ x: unit.x, y: unit.y, count: 20, spread: 8, speed: [80, 200], angle: [0, Math.PI * 2], life: [0.15, 0.4], size: [2, 5], colors: ['#fff', '#e0e0ff', '#607d8b'], gravity: 15, shape: 'star' });
                break;
            }
            case 'yamato_w1': { // Kage Bunshin — Shadow Clone (level-scaled)
                // Clone count: lvl 3-4 = 1, lvl 5 = 2, lvl 6 (max) = 3
                const cloneCount = unit.heroLevel >= 6 ? 3 : unit.heroLevel >= 5 ? 2 : 1;

                // Smoke burst at Musashi
                particles.emit({ x: unit.x, y: unit.y, count: 25, spread: 12, speed: [60, 180], angle: [0, Math.PI * 2], life: [0.4, 1.0], size: [6, 14], colors: ['#8ab4f8', '#607d8b', '#ffffff', '#b0c4de'], gravity: -30, shape: 'circle' });

                if (unit._spawnClone) {
                    const offsets = [
                        { dx: -50, dy: 10 },
                        { dx: 50, dy: -10 },
                        { dx: 0, dy: -40 },
                    ];
                    for (let i = 0; i < cloneCount; i++) {
                        const off = offsets[i];
                        const cx = unit.x + off.dx;
                        const cy = unit.y + off.dy;
                        const clone = unit._spawnClone(unit, cx, cy, 5);
                        if (clone) {
                            particles.emit({ x: cx, y: cy, count: 20, spread: 10, speed: [40, 120], angle: [0, Math.PI * 2], life: [0.3, 0.8], size: [5, 12], colors: ['#8ab4f8', '#ffffff', '#b0c4de'], gravity: -20, shape: 'circle' });
                            particles.emit({ x: cx, y: cy - 8, count: 12, spread: 6, speed: [20, 60], angle: [0, Math.PI * 2], life: [0.4, 0.8], size: [3, 6], colors: ['#8ab4f8', '#fff', '#607d8b'], gravity: -10, shape: 'star' });
                        }
                    }
                }
                break;
            }
            case 'yamato_w2': // Musashi Tuyệt Kỹ — 3x next hit
                HeroSkillUtils.buffVfx(unit, particles, ['#4a148c', '#7b1fa2', '#ce93d8', '#fff']);
                particles.emit({ x: unit.x, y: unit.y - 10, count: 16, spread: 6, speed: [40, 100], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.6, 1.4], size: [3, 6], colors: ['#4a148c', '#7b1fa2', '#fff'], gravity: -45, shape: 'star' });
                particles.emit({ x: unit.x, y: unit.y + 4, count: 12, spread: 10, speed: [10, 30], angle: [0, Math.PI * 2], life: [0.8, 1.5], size: [5, 10], colors: ['#1a002a88', '#2a004466'], gravity: 0, shape: 'circle' });
                break;
            case 'yamato_m0': { // Thức Thần — summon shikigami, reduce armor
                for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; particles.emit({ x: unit.x + Math.cos(a) * 25, y: unit.y + Math.sin(a) * 15, count: 4, spread: 2, speed: [10, 30], angle: [a + Math.PI * 0.4, a + Math.PI * 0.6], life: [0.8, 1.5], size: [3, 6], colors: ['#7b1fa2', '#ce93d8', '#fff'], gravity: -5, shape: 'star' }); }
                particles.emit({ x: unit.x, y: unit.y - 8, count: 16, spread: 6, speed: [60, 160], angle: [0, Math.PI * 2], life: [0.4, 0.9], size: [3, 8], colors: ['#f0e8d0', '#cc2222', '#fff'], gravity: 10, shape: 'rect' });
                particles.emit({ x: unit.x, y: unit.y, count: 20, spread: 8, speed: [30, 90], angle: [0, Math.PI * 2], life: [0.5, 1.2], size: [4, 8], colors: ['#9c27b044', '#7b1fa266'], gravity: 0, shape: 'circle' });
                if (findNearestEnemy) { const hs = new Set<number>(); for (let i = 0; i < 20 && hs.size < 6; i++) { const e = findNearestEnemy(unit.x, unit.y, unit.team, aoeRange); if (e && !hs.has(e.id)) { hs.add(e.id); const oa = e.armor; e.armor = Math.floor(e.armor * 0.7); setTimeout(() => { if (e.alive) e.armor = oa; }, 6000); } } }
                break;
            }
            case 'yamato_m1': // Bách Quỷ Dạ Hành — 30 AOE dark parade
                HeroSkillUtils.aoeDamage(unit, 30, aoeRange, 8, findNearestEnemy);
                for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const r = 20 + i * 3; particles.emit({ x: unit.x + Math.cos(a) * r, y: unit.y + Math.sin(a) * r * 0.5, count: 4, spread: 3, speed: [20, 60], angle: [a + Math.PI * 0.3, a + Math.PI * 0.7], life: [0.6, 1.4], size: [4, 9], colors: ['#220044', '#440066', '#660088'], gravity: -8, shape: 'circle' }); }
                HeroSkillUtils.explodeVfx(unit.x, unit.y, particles, ['#220044', '#440066', '#660088', '#8800aa']);
                particles.emit({ x: unit.x, y: unit.y, count: 16, spread: 35, speed: [10, 30], angle: [0, Math.PI * 2], life: [1.0, 2.5], size: [6, 14], colors: ['#11002288', '#22004488', '#44006644'], gravity: -8, shape: 'circle' });
                break;
            case 'yamato_m2': { // Shi-ryō no Noroi — DOT curse 6%HP/s
                if (findNearestEnemy) {
                    const e = findNearestEnemy(unit.x, unit.y, unit.team, aoeRange * 1.5);
                    if (e) {
                        const dd = Math.floor(e.maxHp * 0.06); let t = 0;
                        const iv = setInterval(() => { if (e.alive && t < 8) { e.hp -= dd; t++; particles.emit({ x: e.x, y: e.y - 6, count: 5, spread: 4, speed: [15, 40], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.3, 0.7], size: [2, 5], colors: ['#00ff0088', '#44ff4466'], gravity: -25, shape: 'star' }); } else clearInterval(iv); }, 1000);
                        particles.emit({ x: e.x, y: e.y - 10, count: 20, spread: 8, speed: [20, 60], angle: [0, Math.PI * 2], life: [0.6, 1.4], size: [3, 7], colors: ['#00ff00', '#44ff44', '#88ff88'], gravity: -20, shape: 'star' });
                        particles.emit({ x: e.x, y: e.y, count: 10, spread: 3, speed: [10, 25], angle: [0, Math.PI * 2], life: [1.5, 3.0], size: [6, 12], colors: ['#00ff0033', '#44ff4422'], gravity: 0, shape: 'circle' });
                    }
                }
                particles.emit({ x: unit.x, y: unit.y - 8, count: 16, spread: 6, speed: [30, 80], angle: [0, Math.PI * 2], life: [0.5, 1.0], size: [2, 5], colors: ['#1a002a', '#2a0044', '#4a0066'], gravity: -25, shape: 'star' });
                break;
            }
            case 'yamato_r0': // Yabusame
                HeroSkillUtils.multiShot(unit, 3, 18, unit.civRange * 1.2, ['#f44336', '#ef5350', '#e57373'], particles, findNearestEnemy);
                particles.emit({ x: unit.x, y: unit.y - 10, count: 12, spread: 10, speed: [20, 60], angle: [0, Math.PI * 2], life: [0.8, 1.6], size: [2, 4], colors: ['#ffb7c5', '#ff8fa3', '#ffc0cb88'], gravity: 15, shape: 'star' });
                break;
            case 'yamato_r1': // Kazaguruma
                unit.speed = Math.round(unit._baseSpeed * 1.6);
                HeroSkillUtils.buffVfx(unit, particles, ['#607d8b', '#90a4ae', '#cfd8dc', '#fff'], 'circle');
                for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; particles.emit({ x: unit.x + Math.cos(a) * 15, y: unit.y + Math.sin(a) * 10, count: 3, spread: 2, speed: [40, 100], angle: [a + Math.PI * 0.3, a + Math.PI * 0.7], life: [0.3, 0.6], size: [2, 4], colors: ['#e0e0e088', '#fff8'], gravity: 0, shape: 'rect' }); }
                break;
            case 'yamato_r2': { // Ogiya no Ya 
                if (unit.attackTarget) {
                    const e = unit.attackTarget; e.hp -= Math.floor(unit.attack * 2) + unit.heroLevel * 4;
                    if (e.hp <= 0 && e.alive) unit.addHeroXp(Math.max(10, Math.floor(e.maxHp * 0.3)));
                    const a = Math.atan2(e.y - unit.y, e.x - unit.x);
                    particles.emit({ x: unit.x, y: unit.y - 8, count: 5, spread: 1, speed: [480, 600], angle: [a - 0.01, a + 0.01], life: [0.05, 0.15], size: [5, 12], colors: ['#f44336', '#ff1744', '#fff'], gravity: 0, shape: 'rect' });
                    particles.emit({ x: unit.x, y: unit.y - 8, count: 12, spread: 2, speed: [320, 460], angle: [a - 0.05, a + 0.05], life: [0.08, 0.25], size: [2, 4], colors: ['#f4433688', '#ff174466'], gravity: 0, shape: 'circle' });
                    particles.emit({ x: e.x, y: e.y, count: 22, spread: 12, speed: [60, 180], angle: [0, Math.PI * 2], life: [0.2, 0.6], size: [3, 6], colors: ['#f44336', '#ffd700', '#fff'], gravity: 25, shape: 'star' });
                }
                break;
            }
        }
    }
}
