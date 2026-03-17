import { BaseCombatStrategy } from "../../BaseCombatStrategy";
import { CombatContext } from "../../CombatTypes";
import { Unit } from "../../../Unit";
import { ParticleSystem } from "../../../../effects/ParticleSystem";
import { HeroSkillUtils } from "./HeroSkillUtils";
import { audioSystem } from "../../../../systems/AudioSystem";

export class ZarathustraStrategy extends BaseCombatStrategy {

    public castHeroSkill(unit: Unit, skillIndex: number, particles: ParticleSystem, findNearestEnemy?: (x: number, y: number, team: number, range: number) => Unit | null, findNearestEnemyBuilding?: (x: number, y: number, team: number, range: number) => import("../../../Building").Building | null): void {
        const skills = unit.heroSkills;
        const skill = skills[skillIndex];
        const aoeRange = 80;
        if (!skill) return;

        const sid = skill.skillId;

        // Uses _findEnemy and _findEnemyBuilding bound references injected from context in update loop
        // However, for immediate casting, we can rely on the nearest enemy logic in cast handler if needed,
        // or just use a local radius search over all units since skills are rare events.
        switch (sid) {
            case 'batu_w0': // Giáp Rakhsh — golden shield aura
                HeroSkillUtils.buffVfx(unit, particles, ['#ffd700', '#ffee88', '#fff', '#daa520']);
                particles.emit({ x: unit.x, y: unit.y, count: 30, spread: 4, speed: [80, 200], angle: [0, Math.PI * 2], life: [0.4, 0.8], size: [3, 6], colors: ['#ffd70088', '#ffee8866', '#daa52066'], gravity: 0, shape: 'circle' });
                particles.emit({ x: unit.x, y: unit.y - 12, count: 16, spread: 8, speed: [30, 80], angle: [-Math.PI * 0.9, -Math.PI * 0.1], life: [0.6, 1.2], size: [2, 4], colors: ['#ffd700', '#fff'], gravity: -50, shape: 'star' });
                break;
            case 'batu_w1': // Hào Quang Vua — royal aura burst
                particles.emit({ x: unit.x, y: unit.y, count: 48, spread: 6, speed: [100, 260], angle: [0, Math.PI * 2], life: [0.5, 1.2], size: [3, 8], colors: ['#ffd700', '#ff8c00', '#ffee88', '#fff'], gravity: -20, shape: 'star' });
                for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; particles.emit({ x: unit.x + Math.cos(a) * 30, y: unit.y + Math.sin(a) * 20, count: 3, spread: 2, speed: [20, 50], angle: [a - 0.3, a + 0.3], life: [0.8, 1.5], size: [2, 4], colors: ['#ffd700', '#fff'], gravity: -15, shape: 'star' }); }
                particles.emit({ x: unit.x, y: unit.y - 20, count: 8, spread: 3, speed: [10, 40], angle: [-Math.PI * 0.9, -Math.PI * 0.1], life: [1.0, 2.0], size: [4, 7], colors: ['#ffd700'], gravity: -30, shape: 'star' });
                break;
            case 'batu_w2': // Bất Tử Rostam — heal 60%
                HeroSkillUtils.healFx(unit, particles, 0.6, ['#ffd700', '#ffee88', '#ff8c00', '#fff']);
                particles.emit({ x: unit.x, y: unit.y, count: 20, spread: 10, speed: [40, 100], angle: [0, Math.PI * 2], life: [0.6, 1.4], size: [4, 8], colors: ['#ffd70066', '#ffee8844'], gravity: 0, shape: 'circle' });
                particles.emit({ x: unit.x, y: unit.y - 8, count: 12, spread: 4, speed: [60, 140], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.8, 1.6], size: [3, 6], colors: ['#ffd700', '#fff'], gravity: -60, shape: 'star' });
                break;
            case 'batu_m0': { // Xuyên Thấu — 3 rapid piercing flaming arrows
                const arrowCount = 3;
                const delayMs = 150; // 150ms between shots

                for (let step = 0; step < arrowCount; step++) {
                    setTimeout(() => {
                        // Check if unit is still alive to shoot
                        if (!unit.alive) return;

                        const maxRange = Math.max(unit.civRange * 1.5, 250);
                        let t = unit.attackTarget;

                        // If target exists but is too far, drop it
                        if (t && t.alive) {
                            const dist = Math.hypot(t.x - unit.x, t.y - unit.y);
                            if (dist > maxRange) {
                                t = null;
                            }
                        }

                        // Find a new target within range if necessary
                        if (!t || !t.alive) {
                            if (findNearestEnemy) t = findNearestEnemy(unit.x, unit.y, unit.team, maxRange);
                        }

                        const arrowX = unit.x + (unit.facingRight ? 10 : -10);
                        const arrowY = unit.y - 12;

                        if (t && t.alive) {
                            // Damage
                            t.hp -= (unit.attack * 1.2); // 120% attack damage per arrow
                            if (t.hp <= 0) unit.addHeroXp(Math.max(10, Math.floor(t.maxHp * 0.3)));

                            // Angle
                            const fa = Math.atan2(t.y - unit.y, t.x - unit.x);

                            // Projectile
                            audioSystem.playArrowSound(unit.x, unit.y);
                            particles.emit({ x: arrowX, y: arrowY, count: 1, spread: 0, speed: [650, 750], angle: [fa, fa], life: [0.35, 0.45], size: [16, 20], colors: ['#ffd700', '#ffee88', '#fff'], gravity: 0, shape: 'flaming_arrow' });

                            // Hit explosion
                            particles.emit({ x: t.x, y: t.y, count: 12, spread: 6, speed: [60, 180], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.2, 0.5], size: [2, 5], colors: ['#ff4400', '#ff8800', '#fff'], gravity: 30, shape: 'star' });
                        } else {
                            // Shoot forward blindly if no target
                            const fa = unit.facingRight ? 0 : Math.PI;
                            audioSystem.playArrowSound(unit.x, unit.y);
                            particles.emit({ x: arrowX, y: arrowY, count: 1, spread: 0, speed: [650, 750], angle: [fa, fa], life: [0.35, 0.45], size: [16, 20], colors: ['#ffd700', '#ffee88', '#fff'], gravity: 0, shape: 'flaming_arrow' });
                        }
                    }, step * delayMs);
                }
                break;
            }
            case 'batu_m1': { // Thiêu Đốt — DOT 8/s 5s
                const hs = new Set<number>();
                for (let i = 0; i < 18 && hs.size < 6; i++) {
                    const e = findNearestEnemy ? findNearestEnemy(unit.x, unit.y, unit.team, aoeRange) : null;
                    if (e && !hs.has(e.id)) {
                        hs.add(e.id);
                        let t = 0;
                        const iv = setInterval(() => { if (e.alive && t < 5) { e.hp -= 8; t++; particles.emit({ x: e.x, y: e.y - 4, count: 6, spread: 4, speed: [20, 60], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.2, 0.5], size: [2, 4], colors: ['#ff4400', '#ff6600', '#ffaa00'], gravity: -40, shape: 'circle' }); } else clearInterval(iv); }, 1000);
                    }
                }
                particles.emit({ x: unit.x, y: unit.y + 4, count: 40, spread: 35, speed: [20, 70], angle: [0, Math.PI * 2], life: [0.5, 1.5], size: [3, 9], colors: ['#ff2200', '#ff4400', '#ff660088'], gravity: -10, shape: 'circle' });
                particles.emit({ x: unit.x, y: unit.y, count: 28, spread: 12, speed: [50, 130], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.4, 1.0], size: [2, 5], colors: ['#ffaa00', '#ffcc00', '#fff'], gravity: -70, shape: 'circle' });
                particles.emit({ x: unit.x, y: unit.y - 10, count: 12, spread: 20, speed: [10, 30], angle: [-Math.PI * 0.9, -Math.PI * 0.1], life: [0.8, 2.0], size: [6, 12], colors: ['#22222288', '#33333366'], gravity: -15, shape: 'circle' });
                break;
            }
            case 'batu_m2': { // Ngọn Lửa Vĩnh Cửu — 80 massive AOE
                HeroSkillUtils.aoeDamage(unit, 80, aoeRange * 1.5, 10, findNearestEnemy);
                const t2 = unit.attackTarget; const fx2 = t2 ? t2.x : unit.x + (unit.facingRight ? 60 : -60); const fy2 = t2 ? t2.y : unit.y;
                HeroSkillUtils.explodeVfx(fx2, fy2, particles, ['#ff0000', '#ff2200', '#ff4400', '#ff6600']);
                particles.emit({ x: fx2, y: fy2, count: 36, spread: 30, speed: [80, 250], angle: [-Math.PI * 0.85, -Math.PI * 0.15], life: [0.5, 1.5], size: [3, 9], colors: ['#6B4226', '#8B5A2B', '#D2691E'], gravity: 130, shape: 'rect' });
                particles.emit({ x: fx2, y: fy2, count: 24, spread: 30, speed: [15, 50], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [1.0, 2.5], size: [8, 18], colors: ['#22222288', '#33333388', '#44444466'], gravity: -25, shape: 'circle' });
                for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; particles.emit({ x: fx2 + Math.cos(a) * 40, y: fy2 + Math.sin(a) * 25, count: 6, spread: 5, speed: [20, 60], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.4, 1.0], size: [3, 6], colors: ['#ff4400', '#ff6600', '#ffaa00'], gravity: -30, shape: 'circle' }); }
                break;
            }
            case 'batu_r0': { // Mũi Tên Arash 
                if (unit.attackTarget) {
                    const e = unit.attackTarget; e.hp -= 50 + unit.heroLevel * 4;
                    if (e.hp <= 0 && e.alive) unit.addHeroXp(Math.max(10, Math.floor(e.maxHp * 0.3)));
                    const a = Math.atan2(e.y - unit.y, e.x - unit.x);
                    particles.emit({ x: unit.x, y: unit.y - 8, count: 4, spread: 1, speed: [450, 560], angle: [a - 0.015, a + 0.015], life: [0.06, 0.18], size: [5, 10], colors: ['#ffd700', '#fff', '#ffee88'], gravity: 0, shape: 'rect' });
                    particles.emit({ x: unit.x, y: unit.y - 8, count: 10, spread: 2, speed: [300, 420], angle: [a - 0.06, a + 0.06], life: [0.1, 0.3], size: [2, 4], colors: ['#ffd70088', '#ffaa0066'], gravity: 0, shape: 'circle' });
                    particles.emit({ x: e.x, y: e.y, count: 18, spread: 10, speed: [50, 150], angle: [0, Math.PI * 2], life: [0.2, 0.6], size: [2, 6], colors: ['#ffd700', '#ff6600', '#fff'], gravity: 30, shape: 'star' });
                }
                break;
            }
            case 'batu_r1': // Gió Sa Mạc
                unit.speed = Math.round(unit._baseSpeed * 1.8);
                HeroSkillUtils.buffVfx(unit, particles, ['#c9a84c', '#dab86c', '#e8d4a0', '#fff'], 'circle');
                particles.emit({ x: unit.x, y: unit.y + 4, count: 24, spread: 15, speed: [60, 160], angle: [unit.facingRight ? -0.3 : Math.PI - 0.3, unit.facingRight ? 0.3 : Math.PI + 0.3], life: [0.3, 0.8], size: [2, 5], colors: ['#c9a84c88', '#dab86c66', '#e8d4a044'], gravity: 10, shape: 'circle' });
                break;
            case 'batu_r2': { // Mưa Tên Thần
                HeroSkillUtils.multiShot(unit, 8, 12, unit.civRange * 1.5, ['#ffd700', '#ffaa00', '#ff8800'], particles, findNearestEnemy);
                const rx = unit.x + (unit.facingRight ? 50 : -50);
                particles.emit({ x: rx, y: unit.y - 60, count: 24, spread: 50, speed: [140, 300], angle: [Math.PI * 0.35, Math.PI * 0.65], life: [0.15, 0.45], size: [3, 6], colors: ['#ffd700', '#ffaa00'], gravity: 110, shape: 'rect' });
                particles.emit({ x: rx, y: unit.y, count: 16, spread: 40, speed: [20, 60], angle: [0, Math.PI * 2], life: [0.3, 0.7], size: [2, 4], colors: ['#ffd700', '#fff44f88'], gravity: -10, shape: 'star' });
                break;
            }
        }
    }

    protected executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void {
        const { unit, particles } = context;

        // Flaming Arrow Projectile
        const arrowX = unit.x + (unit.facingRight ? 10 : -10);
        const arrowY = unit.y - 12;

        audioSystem.playArrowSound(unit.x, unit.y);
        particles.emit({
            x: arrowX,
            y: arrowY, count: 1, spread: 0,
            speed: [550, 650], // Fast physical arrow
            angle: [atkAngle, atkAngle],
            life: [0.35, 0.45], size: [14, 16], // Size mapped to arrow scaling and life stretched for range
            colors: ['#ffd700', '#ffee88', '#ffffff'], // Golden glowing arrow
            gravity: 0, shape: 'flaming_arrow', // Realistic flaming arrow shape
        });

        // Fire trail burst at launch point
        particles.emit({
            x: arrowX, y: arrowY, count: 6, spread: 4,
            speed: [100, 200],
            angle: [atkAngle - 0.2, atkAngle + 0.2],
            life: [0.15, 0.3], size: [2, 4],
            colors: ['#ff4400', '#ff8800', '#ffd700'],
            gravity: 10, shape: 'circle',
        });

        // Flaming impact upon hitting target
        particles.emit({
            x: target.x, y: target.y - 5, count: 15, spread: 6,
            speed: [40, 160], angle: [-Math.PI * 0.8, -Math.PI * 0.2], // Upward splash
            life: [0.2, 0.5], size: [2, 5],
            colors: ['#ff4400', '#ff8800', '#ffd700', '#ffffff'],
            gravity: 30, shape: 'star',
        });

        // Ground ember ring
        particles.emit({
            x: target.x, y: target.y + 4, count: 8, spread: 10,
            speed: [30, 80], angle: [0, Math.PI * 2],
            life: [0.2, 0.4], size: [1.5, 3],
            colors: ['#cc4400', '#ff6600'],
            gravity: 50, shape: 'circle',
        });
    }
}
