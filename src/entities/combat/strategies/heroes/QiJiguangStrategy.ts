import { visualRng } from "../../../../utils/VisualRng";
import { MeleeHeroStrategy } from "./MeleeHeroStrategy";
import { CombatContext } from "../../CombatTypes";
import { Unit } from "../../../Unit";
import { ParticleSystem } from "../../../../effects/ParticleSystem";
import { HeroSkillUtils } from "./HeroSkillUtils";
import { Building } from "../../../Building";
import { audioSystem } from "../../../../systems/AudioSystem";

export class QiJiguangStrategy extends MeleeHeroStrategy {

    protected applyPreDamageModifiers(context: CombatContext, target: Unit, baseDamage: number): number {
        let dmg = super.applyPreDamageModifiers(context, target, baseDamage);
        const { unit } = context;
        // HeroQiJiguang piercing buff: double damage
        if (unit.heroSkillActive[2] > 0) dmg *= 2;
        return dmg;
    }

    protected executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void {
        const { unit, particles } = context;

        // Sword slash sound
        audioSystem.playSFXWithPitch('/musics/daviddumaisaudio-sword-slash-and-swing-185432_GYwhZ0VB.mp3', 0.6 + Math.random() * 0.2, 0.85 + Math.random() * 0.2, unit.x, unit.y);
        // Overhead chop — particles fly downward
        const downAngle = Math.PI * 0.5;
        for (let i = 0; i < 8; i++) {
            const sa = downAngle - 0.6 + i * 0.15;
            particles.emit({
                x: unit.x + (unit.facingRight ? 4 : -4),
                y: unit.y - 12, count: 1, spread: 3,
                speed: [80, 160],
                angle: [sa - 0.05, sa + 0.05],
                life: [0.1, 0.25], size: [2, 4],
                colors: ['#fff', '#e0e0e0', '#aa2222', '#ffaa00'],
                gravity: 30, shape: 'rect',
            });
        }

        // Blood and spark impact at target
        particles.emit({
            x: target.x, y: target.y - 6, count: 6, spread: 4,
            speed: [40, 90], angle: [0, Math.PI * 2],
            life: [0.15, 0.35], size: [2, 3.5],
            colors: ['#cc0000', '#ff0000', '#ffd700'],
            gravity: 40, shape: 'circle',
        });

        // Cuồng Phong — dark storm tornado + lightning
        if (unit.heroSkillActive[0] > 0) {
            const dir = unit.facingRight ? 1 : -1;
            const tx = target.x, ty = target.y;

            // Dark tornado funnel — 4 layers stacking upward, widening
            for (let layer = 0; layer < 4; layer++) {
                const layerY = ty - 4 - layer * 10;
                const layerR = 3 + layer * 5;
                const count = 10 + layer * 4;

                for (let i = 0; i < count; i++) {
                    const a = (i / count) * Math.PI * 2;
                    particles.emit({
                        x: tx + Math.cos(a) * layerR,
                        y: layerY + Math.sin(a) * layerR * 0.3,
                        count: 1, spread: 1,
                        speed: [15 + layer * 8, 40 + layer * 12],
                        angle: [a + Math.PI * 0.35, a + Math.PI * 0.65],
                        life: [0.5 + layer * 0.2, 1.0 + layer * 0.2],
                        size: [3 + layer, 6 + layer * 2],
                        colors: ['#2a2a3a', '#3d3d5c', '#4a4a6a', '#555577'],
                        gravity: -15 - layer * 5, shape: 'circle'
                    });
                }
            }

            // Lightning bolts — bright electric flashes in the tornado
            for (let bolt = 0; bolt < 4; bolt++) {
                const bx = tx + (Math.random() - 0.5) * 16;
                const by = ty - 8 - Math.random() * 25;
                particles.emit({
                    x: bx, y: by, count: 3, spread: 1,
                    speed: [60, 180],
                    angle: [Math.PI * 0.3, Math.PI * 0.7],
                    life: [0.05, 0.15], size: [2, 5],
                    colors: ['#ffffff', '#aaccff', '#6688ff'],
                    gravity: 40, shape: 'rect'
                });
            }

            // Dark wind stream from hero to target
            const dx = tx - unit.x, dy = ty - unit.y;
            const flyAng = Math.atan2(dy, dx);
            particles.emit({
                x: unit.x + dir * 8, y: unit.y - 6,
                count: 20, spread: 4,
                speed: [100, 250],
                angle: [flyAng - 0.3, flyAng + 0.3],
                life: [0.2, 0.5], size: [3, 7],
                colors: ['#2a2a3a', '#3d3d5c', '#555577', '#aaccff'],
                gravity: -10, shape: 'circle'
            });

            // Dark central funnel column
            particles.emit({
                x: tx, y: ty, count: 15, spread: 3,
                speed: [40, 120],
                angle: [-Math.PI * 0.7, -Math.PI * 0.3],
                life: [0.5, 1.2], size: [4, 10],
                colors: ['#1a1a2a88', '#2a2a3a66', '#3d3d5c44'],
                gravity: -60, shape: 'circle'
            });

            // Lightning flash at base
            particles.emit({
                x: tx, y: ty - 5, count: 6, spread: 3,
                speed: [80, 200], angle: [0, Math.PI * 2],
                life: [0.03, 0.1], size: [4, 8],
                colors: ['#ffffff', '#aaccff'],
                gravity: 0, shape: 'star'
            });

            // Ground dust ring
            particles.emit({
                x: tx, y: ty + 4, count: 12, spread: 8,
                speed: [30, 80], angle: [0, Math.PI * 2],
                life: [0.3, 0.6], size: [3, 6],
                colors: ['#3a3a3a', '#555555', '#777777'],
                gravity: 10, shape: 'circle'
            });
        }
    }

    public castHeroSkill(unit: Unit, skillIndex: number, particles: ParticleSystem, findNearestEnemy?: (x: number, y: number, team: number, range: number) => Unit | null, findNearestEnemyBuilding?: (x: number, y: number, team: number, range: number) => import("../../../Building").Building | null): void {
        const skills = unit.heroSkills;
        const skill = skills[skillIndex];
        if (!skill) return;

        const sid = skill.skillId;
        const aoeRange = 80;

        switch (sid) {
            // case 'daiminh_w0': // Long Đảm Thương
            //     HeroSkillUtils.aoeDamage(unit, 40, aoeRange * 0.6, 8, findNearestEnemy);
            //     HeroSkillUtils.explodeVfx(unit.x, unit.y, particles, ['#2196f3', '#64b5f6', '#bbdefb', '#fff']);
            //     for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + unit.animTimer * 4; particles.emit({ x: unit.x + Math.cos(a) * 20, y: unit.y + Math.sin(a) * 12 - 4, count: 3, spread: 2, speed: [30, 80], angle: [a - 0.5, a + 0.5], life: [0.3, 0.7], size: [2, 4], colors: ['#2196f3', '#64b5f6'], gravity: -15, shape: 'circle' }); }
            //     particles.emit({ x: unit.x + (unit.facingRight ? 10 : -10), y: unit.y - 16, count: 8, spread: 3, speed: [20, 60], angle: [unit.facingRight ? Math.PI : 0, unit.facingRight ? Math.PI + 0.5 : 0.5], life: [0.3, 0.6], size: [2, 3], colors: ['#cc2222', '#ff4444'], gravity: 10, shape: 'rect' });
            //     break;
            // case 'daiminh_w1': // Đơn Kỵ Phá Trận
            //     particles.emit({ x: unit.x, y: unit.y, count: 40, spread: 8, speed: [80, 220], angle: [0, Math.PI * 2], life: [0.4, 1.0], size: [3, 7], colors: ['#2196f3', '#64b5f6', '#fff', '#ffd700'], gravity: -20, shape: 'star' });
            //     particles.emit({ x: unit.x, y: unit.y + 6, count: 16, spread: 12, speed: [40, 100], angle: [0, Math.PI * 2], life: [0.3, 0.6], size: [3, 6], colors: ['#8B7355', '#a09070', '#c0b09088'], gravity: 20, shape: 'circle' });
            //     particles.emit({ x: unit.x - (unit.facingRight ? 20 : -20), y: unit.y - 6, count: 8, spread: 2, speed: [100, 200], angle: [unit.facingRight ? -0.1 : Math.PI - 0.1, unit.facingRight ? 0.1 : Math.PI + 0.1], life: [0.1, 0.3], size: [2, 16], colors: ['#64b5f688', '#fff8'], gravity: 0, shape: 'rect' });
            //     break;
            // case 'daiminh_w2': // Bất Bại Trường Bản
            //     HeroSkillUtils.buffVfx(unit, particles, ['#2196f3', '#64b5f6', '#bbdefb', '#fff']);
            //     particles.emit({ x: unit.x, y: unit.y, count: 36, spread: 6, speed: [100, 240], angle: [0, Math.PI * 2], life: [0.4, 0.9], size: [3, 8], colors: ['#2196f388', '#64b5f666'], gravity: 0, shape: 'circle' });
            //     particles.emit({ x: unit.x, y: unit.y - 10, count: 16, spread: 8, speed: [20, 60], angle: [-Math.PI * 0.9, -Math.PI * 0.1], life: [0.8, 1.8], size: [3, 5], colors: ['#ffd700', '#ffee8888'], gravity: -40, shape: 'star' });
            //     break;
            // case 'daiminh_m0': // Bát Trận Đồ
            //     HeroSkillUtils.slowFx(unit, 0.5, aoeRange * 1.2, 4000, 8, findNearestEnemy);
            //     for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const r = 30 + Math.sin(i * 1.5) * 10; particles.emit({ x: unit.x + Math.cos(a) * r, y: unit.y + Math.sin(a) * r * 0.6, count: 5, spread: 3, speed: [15, 40], angle: [a + Math.PI * 0.4, a + Math.PI * 0.6], life: [0.8, 1.5], size: [3, 6], colors: ['#9c27b0', '#ce93d8', '#e1bee7', '#fff'], gravity: -5, shape: 'star' }); }
            //     particles.emit({ x: unit.x, y: unit.y, count: 24, spread: 5, speed: [40, 120], angle: [0, Math.PI * 2], life: [0.5, 1.0], size: [3, 7], colors: ['#4caf50', '#81c784', '#a5d6a7', '#fff'], gravity: -10, shape: 'star' });
            //     particles.emit({ x: unit.x, y: unit.y, count: 16, spread: 30, speed: [10, 30], angle: [0, Math.PI * 2], life: [1.0, 2.5], size: [6, 14], colors: ['#9c27b044', '#4caf5044', '#e1bee733'], gravity: 0, shape: 'circle' });
            //     break;
            // case 'daiminh_m1': // Thất Tinh Đàn 
            //     HeroSkillUtils.healFx(unit, particles, 0.3, ['#44ff44', '#88ff88', '#aaffaa', '#66ff99']);
            //     for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 - Math.PI * 0.5; particles.emit({ x: unit.x + Math.cos(a) * 24, y: unit.y + Math.sin(a) * 16 - 8, count: 4, spread: 2, speed: [10, 30], angle: [-Math.PI * 0.9, -Math.PI * 0.1], life: [0.8, 1.8], size: [3, 5], colors: ['#ffd700', '#fff', '#88ff88'], gravity: -25, shape: 'star' }); }
            //     particles.emit({ x: unit.x, y: unit.y, count: 16, spread: 6, speed: [30, 80], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.6, 1.2], size: [3, 6], colors: ['#44aa66', '#66cc88', '#88eebb'], gravity: -40, shape: 'circle' });
            //     break;
            // case 'daiminh_m2': { // Tá Đông Phong — 60 AOE + team ATK buff
            //     HeroSkillUtils.aoeDamage(unit, 60, aoeRange, 8, findNearestEnemy);
            //     for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const r = 20 + i * 2; particles.emit({ x: unit.x + Math.cos(a) * r, y: unit.y + Math.sin(a) * r * 0.5, count: 3, spread: 2, speed: [40, 100], angle: [a + Math.PI * 0.3, a + Math.PI * 0.7], life: [0.3, 0.7], size: [2, 5], colors: ['#4caf50', '#81c784', '#fff'], gravity: -15, shape: 'rect' }); }
            //     particles.emit({ x: unit.x, y: unit.y - 50, count: 10, spread: 3, speed: [350, 550], angle: [Math.PI * 0.4, Math.PI * 0.6], life: [0.04, 0.12], size: [3, 8], colors: ['#fff', '#ffd700'], gravity: 0, shape: 'rect' });
            //     HeroSkillUtils.explodeVfx(unit.x, unit.y, particles, ['#4caf50', '#81c784', '#ffd700', '#fff']);
            //     particles.emit({ x: unit.x, y: unit.y, count: 20, spread: 20, speed: [60, 160], angle: [0, Math.PI * 2], life: [0.5, 1.0], size: [2, 4], colors: ['#ffd700', '#ffee88'], gravity: -10, shape: 'star' });
            //     break;
            // }
            case 'qijiguang_w0': { // Cuồng Phong — Super transformation
                // Massive energy explosion burst
                HeroSkillUtils.buffVfx(unit, particles, ['#44ffaa', '#88ffcc', '#ffffff', '#aaffdd']);
                // Expanding energy ring
                for (let i = 0; i < 20; i++) {
                    const a = (i / 20) * Math.PI * 2;
                    particles.emit({
                        x: unit.x + Math.cos(a) * 8, y: unit.y + Math.sin(a) * 4,
                        count: 2, spread: 2, speed: [100, 250],
                        angle: [a - 0.1, a + 0.1],
                        life: [0.3, 0.6], size: [3, 7],
                        colors: ['#44ffaa', '#88ffcc', '#ffffff'],
                        gravity: -5, shape: 'circle'
                    });
                }
                // Upward energy column
                particles.emit({
                    x: unit.x, y: unit.y - 10, count: 30, spread: 4,
                    speed: [120, 300], angle: [-Math.PI * 0.7, -Math.PI * 0.3],
                    life: [0.3, 0.8], size: [2, 6],
                    colors: ['#ffffff', '#aaffdd', '#44ffaa'],
                    gravity: -80, shape: 'rect'
                });
                // Ground shockwave
                particles.emit({
                    x: unit.x, y: unit.y + 6, count: 16, spread: 6,
                    speed: [80, 200], angle: [0, Math.PI * 2],
                    life: [0.2, 0.4], size: [2, 5],
                    colors: ['#8B7355', '#a09070', '#44ffaa88'],
                    gravity: 30, shape: 'circle'
                });
                // Electric sparks
                for (let i = 0; i < 6; i++) {
                    particles.emit({
                        x: unit.x + (Math.random() - 0.5) * 20,
                        y: unit.y - 8 + (Math.random() - 0.5) * 16,
                        count: 1, spread: 1, speed: [20, 60],
                        angle: [0, Math.PI * 2],
                        life: [0.1, 0.25], size: [1, 2],
                        colors: ['#ffffff', '#aaffee'],
                        gravity: 0, shape: 'rect'
                    });
                }
                break;
            }
            case 'qijiguang_w1': { // Hỏa Khí Phun
                const tDir = unit.facingRight ? 1 : -1;
                const fx = unit.x + tDir * 15;
                HeroSkillUtils.explodeVfx(fx, unit.y - 4, particles, ['#ff4400', '#ffaa00', '#444444', '#fff']);
                const aimAngle = tDir === 1 ? 0 : Math.PI;
                particles.emit({ x: fx, y: unit.y - 6, count: 25, spread: 8, speed: [100, 250], angle: [aimAngle - 0.4, aimAngle + 0.4], life: [0.2, 0.6], size: [4, 8], colors: ['#ff4400', '#ff8800', '#ffcc00', '#222'], gravity: 15, shape: 'rect' });

                // Cone damage! For simplicity we map to AoE here
                HeroSkillUtils.aoeDamage(unit, 40 + unit.heroLevel * 4, 60, 5, findNearestEnemy);
                break;
            }
            case 'qijiguang_w2': { // Trường Đao Phá Trận
                const aimAngle2 = unit.facingRight ? 0 : Math.PI;
                HeroSkillUtils.buffVfx(unit, particles, ['#aa2222', '#ff4400', '#fff']);
                for (let i = 0; i < 20; i++) {
                    const sa = aimAngle2 - 1.2 + i * 0.12;
                    particles.emit({ x: unit.x, y: unit.y - 4, count: 1, spread: 2, speed: [150, 300], angle: [sa - 0.1, sa + 0.1], life: [0.15, 0.3], size: [3, 10], colors: ['#fff', '#ff4400', '#ffaa00'], gravity: 0, shape: 'rect' });
                }
                particles.emit({ x: unit.x + (unit.facingRight ? 30 : -30), y: unit.y + 4, count: 15, spread: 20, speed: [40, 100], angle: [0, Math.PI * 2], life: [0.3, 0.6], size: [3, 6], colors: ['#666', '#888', '#aaa'], gravity: 20, shape: 'circle' });
                HeroSkillUtils.aoeDamage(unit, 80 + unit.heroLevel * 8, 80, 5, findNearestEnemy);
                break;
            }
        }
    }

    public updatePassive(unit: Unit, dt: number, particles: ParticleSystem, getNearbyUnits: (x: number, y: number, range: number) => Unit[]): void {
        super.updatePassive(unit, dt, particles, getNearbyUnits);
    }

    public onAttackImpact(unit: Unit, target: Unit | Building, damage: number, particles: ParticleSystem, getNearbyUnits: (x: number, y: number, range: number) => Unit[]): number {
        let finalDamage = super.onAttackImpact(unit, target, damage, particles, getNearbyUnits);

        // Cuồng Phong — tornado projectiles on attack
        if (unit.heroSkillActive[0] > 0) {
            // Scale tornado count by hero level: lv1=1, lv3=2, lv5+=3
            const tornadoCount = unit.heroLevel >= 5 ? 3 : unit.heroLevel >= 3 ? 2 : 1;

            const nearby = getNearbyUnits(unit.x, unit.y, 100)
                .filter(u => u.team !== unit.team && u.alive)
                .slice(0, tornadoCount);

            for (const nt of nearby) {
                // Tornado damage
                nt.hp -= 15;
                if (nt.hp <= 0 && nt.alive) unit.addHeroXp(Math.max(5, Math.floor(nt.maxHp * 0.1)));

                // Wind trail FROM hero TO target — visible projectile path
                const dx = nt.x - unit.x, dy = nt.y - unit.y;
                const dist = Math.hypot(dx, dy);
                const flyAngle = Math.atan2(dy, dx);
                const steps = Math.max(6, Math.floor(dist / 8));
                for (let s = 0; s < steps; s++) {
                    const t = s / steps;
                    const px = unit.x + dx * t;
                    const py = unit.y + dy * t - Math.sin(t * Math.PI) * 12;
                    particles.emit({
                        x: px, y: py, count: 2, spread: 3,
                        speed: [20, 60],
                        angle: [flyAngle + Math.PI * 0.3, flyAngle + Math.PI * 0.7],
                        life: [0.15 + t * 0.3, 0.3 + t * 0.3],
                        size: [2 + t * 3, 4 + t * 4],
                        colors: ['#2a2a3a', '#3d3d5c', '#aaccff'],
                        gravity: -20, shape: 'circle'
                    });
                }

                // Dark tornado burst at target
                for (let ring = 0; ring < 3; ring++) {
                    const ringR = 5 + ring * 7;
                    for (let i = 0; i < 8; i++) {
                        const a = (i / 8) * Math.PI * 2 + ring * 0.5;
                        particles.emit({
                            x: nt.x + Math.cos(a) * ringR,
                            y: nt.y - 4 - ring * 8 + Math.sin(a) * ringR * 0.3,
                            count: 2, spread: 2,
                            speed: [30, 70],
                            angle: [a + Math.PI * 0.3, a + Math.PI * 0.7],
                            life: [0.4, 0.8], size: [3, 6],
                            colors: ['#2a2a3a', '#3d3d5c', '#4a4a6a', '#555577'],
                            gravity: -35, shape: 'circle'
                        });
                    }
                }
                // Dark debris column
                particles.emit({
                    x: nt.x, y: nt.y, count: 10, spread: 5,
                    speed: [50, 120],
                    angle: [-Math.PI * 0.8, -Math.PI * 0.2],
                    life: [0.3, 0.7], size: [2, 4],
                    colors: ['#3a3a3a', '#555555', '#2a2a3a'],
                    gravity: -50, shape: 'rect'
                });
                // Lightning impact flash
                particles.emit({
                    x: nt.x, y: nt.y - 6, count: 8, spread: 2,
                    speed: [60, 140], angle: [0, Math.PI * 2],
                    life: [0.05, 0.15], size: [3, 6],
                    colors: ['#ffffff', '#aaccff', '#6688ff'],
                    gravity: 0, shape: 'star'
                });
            }
        }

        return finalDamage;
    }
}

