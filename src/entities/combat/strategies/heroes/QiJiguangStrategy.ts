import { MeleeHeroStrategy } from "./MeleeHeroStrategy";
import { CombatContext } from "../../CombatTypes";
import { Unit } from "../../../Unit";
import { ParticleSystem } from "../../../../effects/ParticleSystem";
import { HeroSkillUtils } from "./HeroSkillUtils";
import { Building } from "../../../Building";

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

        // Ming Changdao heavy cleave arc
        const aimAngle = atkAngle;
        for (let i = 0; i < 8; i++) {
            const sa = aimAngle - 0.8 + i * 0.2;
            particles.emit({
                x: unit.x + (unit.facingRight ? 4 : -4),
                y: unit.y - 6, count: 1, spread: 2,
                speed: [100, 180],
                angle: [sa - 0.05, sa + 0.05],
                life: [0.1, 0.25], size: [2, 4],
                colors: ['#fff', '#e0e0e0', '#aa2222', '#ffaa00'],
                gravity: 5, shape: 'rect',
            });
        }

        // Blood and spark impact
        particles.emit({
            x: target.x, y: target.y - 6, count: 6, spread: 4,
            speed: [40, 90], angle: [0, Math.PI * 2],
            life: [0.15, 0.35], size: [2, 3.5],
            colors: ['#cc0000', '#ff0000', '#ffd700'],
            gravity: 40, shape: 'circle',
        });
    }

    public castHeroSkill(unit: Unit, skillIndex: number, particles: ParticleSystem, findNearestEnemy?: (x: number, y: number, team: number, range: number) => Unit | null, findNearestEnemyBuilding?: (x: number, y: number, team: number, range: number) => import("../../../Building").Building | null): void {
        const skills = unit.heroSkills;
        const skill = skills[skillIndex];
        if (!skill) return;

        const sid = skill.skillId;
        const aoeRange = 80;

        switch (sid) {
            case 'daiminh_w0': // Long Đảm Thương
                HeroSkillUtils.aoeDamage(unit, 40, aoeRange * 0.6, 8, findNearestEnemy);
                HeroSkillUtils.explodeVfx(unit.x, unit.y, particles, ['#2196f3', '#64b5f6', '#bbdefb', '#fff']);
                for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + unit.animTimer * 4; particles.emit({ x: unit.x + Math.cos(a) * 20, y: unit.y + Math.sin(a) * 12 - 4, count: 3, spread: 2, speed: [30, 80], angle: [a - 0.5, a + 0.5], life: [0.3, 0.7], size: [2, 4], colors: ['#2196f3', '#64b5f6'], gravity: -15, shape: 'circle' }); }
                particles.emit({ x: unit.x + (unit.facingRight ? 10 : -10), y: unit.y - 16, count: 8, spread: 3, speed: [20, 60], angle: [unit.facingRight ? Math.PI : 0, unit.facingRight ? Math.PI + 0.5 : 0.5], life: [0.3, 0.6], size: [2, 3], colors: ['#cc2222', '#ff4444'], gravity: 10, shape: 'rect' });
                break;
            case 'daiminh_w1': // Đơn Kỵ Phá Trận
                particles.emit({ x: unit.x, y: unit.y, count: 40, spread: 8, speed: [80, 220], angle: [0, Math.PI * 2], life: [0.4, 1.0], size: [3, 7], colors: ['#2196f3', '#64b5f6', '#fff', '#ffd700'], gravity: -20, shape: 'star' });
                particles.emit({ x: unit.x, y: unit.y + 6, count: 16, spread: 12, speed: [40, 100], angle: [0, Math.PI * 2], life: [0.3, 0.6], size: [3, 6], colors: ['#8B7355', '#a09070', '#c0b09088'], gravity: 20, shape: 'circle' });
                particles.emit({ x: unit.x - (unit.facingRight ? 20 : -20), y: unit.y - 6, count: 8, spread: 2, speed: [100, 200], angle: [unit.facingRight ? -0.1 : Math.PI - 0.1, unit.facingRight ? 0.1 : Math.PI + 0.1], life: [0.1, 0.3], size: [2, 16], colors: ['#64b5f688', '#fff8'], gravity: 0, shape: 'rect' });
                break;
            case 'daiminh_w2': // Bất Bại Trường Bản
                HeroSkillUtils.buffVfx(unit, particles, ['#2196f3', '#64b5f6', '#bbdefb', '#fff']);
                particles.emit({ x: unit.x, y: unit.y, count: 36, spread: 6, speed: [100, 240], angle: [0, Math.PI * 2], life: [0.4, 0.9], size: [3, 8], colors: ['#2196f388', '#64b5f666'], gravity: 0, shape: 'circle' });
                particles.emit({ x: unit.x, y: unit.y - 10, count: 16, spread: 8, speed: [20, 60], angle: [-Math.PI * 0.9, -Math.PI * 0.1], life: [0.8, 1.8], size: [3, 5], colors: ['#ffd700', '#ffee8888'], gravity: -40, shape: 'star' });
                break;
            case 'daiminh_m0': // Bát Trận Đồ
                HeroSkillUtils.slowFx(unit, 0.5, aoeRange * 1.2, 4000, 8, findNearestEnemy);
                for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const r = 30 + Math.sin(i * 1.5) * 10; particles.emit({ x: unit.x + Math.cos(a) * r, y: unit.y + Math.sin(a) * r * 0.6, count: 5, spread: 3, speed: [15, 40], angle: [a + Math.PI * 0.4, a + Math.PI * 0.6], life: [0.8, 1.5], size: [3, 6], colors: ['#9c27b0', '#ce93d8', '#e1bee7', '#fff'], gravity: -5, shape: 'star' }); }
                particles.emit({ x: unit.x, y: unit.y, count: 24, spread: 5, speed: [40, 120], angle: [0, Math.PI * 2], life: [0.5, 1.0], size: [3, 7], colors: ['#4caf50', '#81c784', '#a5d6a7', '#fff'], gravity: -10, shape: 'star' });
                particles.emit({ x: unit.x, y: unit.y, count: 16, spread: 30, speed: [10, 30], angle: [0, Math.PI * 2], life: [1.0, 2.5], size: [6, 14], colors: ['#9c27b044', '#4caf5044', '#e1bee733'], gravity: 0, shape: 'circle' });
                break;
            case 'daiminh_m1': // Thất Tinh Đàn 
                HeroSkillUtils.healFx(unit, particles, 0.3, ['#44ff44', '#88ff88', '#aaffaa', '#66ff99']);
                for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 - Math.PI * 0.5; particles.emit({ x: unit.x + Math.cos(a) * 24, y: unit.y + Math.sin(a) * 16 - 8, count: 4, spread: 2, speed: [10, 30], angle: [-Math.PI * 0.9, -Math.PI * 0.1], life: [0.8, 1.8], size: [3, 5], colors: ['#ffd700', '#fff', '#88ff88'], gravity: -25, shape: 'star' }); }
                particles.emit({ x: unit.x, y: unit.y, count: 16, spread: 6, speed: [30, 80], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.6, 1.2], size: [3, 6], colors: ['#44aa66', '#66cc88', '#88eebb'], gravity: -40, shape: 'circle' });
                break;
            case 'daiminh_m2': { // Tá Đông Phong — 60 AOE + team ATK buff
                HeroSkillUtils.aoeDamage(unit, 60, aoeRange, 8, findNearestEnemy);
                for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const r = 20 + i * 2; particles.emit({ x: unit.x + Math.cos(a) * r, y: unit.y + Math.sin(a) * r * 0.5, count: 3, spread: 2, speed: [40, 100], angle: [a + Math.PI * 0.3, a + Math.PI * 0.7], life: [0.3, 0.7], size: [2, 5], colors: ['#4caf50', '#81c784', '#fff'], gravity: -15, shape: 'rect' }); }
                particles.emit({ x: unit.x, y: unit.y - 50, count: 10, spread: 3, speed: [350, 550], angle: [Math.PI * 0.4, Math.PI * 0.6], life: [0.04, 0.12], size: [3, 8], colors: ['#fff', '#ffd700'], gravity: 0, shape: 'rect' });
                HeroSkillUtils.explodeVfx(unit.x, unit.y, particles, ['#4caf50', '#81c784', '#ffd700', '#fff']);
                particles.emit({ x: unit.x, y: unit.y, count: 20, spread: 20, speed: [60, 160], angle: [0, Math.PI * 2], life: [0.5, 1.0], size: [2, 4], colors: ['#ffd700', '#ffee88'], gravity: -10, shape: 'star' });
                break;
            }
            case 'qijiguang_w0': { // Uyên Ương Trận — Falling swords AOE
                HeroSkillUtils.buffVfx(unit, particles, ['#ffd700', '#ffaa00', '#fff', '#e0e0e0']);
                const damage = 50 + unit.heroLevel * 5;
                const radius = 80;
                const hitMax = 8;
                if (findNearestEnemy || findNearestEnemyBuilding) {
                    const hitSet = new Set<number>();
                    for (let attempt = 0; attempt < hitMax * 3 && hitSet.size < hitMax; attempt++) {
                        const nx = unit.x + (Math.random() - 0.5) * 10;
                        const ny = unit.y + (Math.random() - 0.5) * 10;
                        let target: any | null = null;
                        if (findNearestEnemy) target = findNearestEnemy(nx, ny, unit.team, radius);
                        if (!target && findNearestEnemyBuilding) target = findNearestEnemyBuilding(nx, ny, unit.team, radius);

                        if (target && !hitSet.has(target.id)) {
                            hitSet.add(target.id);
                            particles.emit({ x: target.x, y: target.y - 150, count: 1, spread: 2, speed: [400, 600], angle: [Math.PI / 2, Math.PI / 2], life: [0.2, 0.3], size: [4, 16], colors: ['#e0e0e0', '#ffffff', '#ffd700'], gravity: 50, shape: 'sword' });
                            setTimeout(() => {
                                if (!target || !target.alive) return;
                                if ('takeDamage' in target && typeof target.takeDamage === 'function') {
                                    target.takeDamage(damage, particles);
                                } else {
                                    target.hp -= damage;
                                    if (target.hp <= 0 && target.alive) unit.addHeroXp(Math.max(10, Math.floor(target.maxHp * 0.3)));
                                }
                                HeroSkillUtils.explodeVfx(target.x, target.y, particles, ['#ffaa00', '#ffd700', '#ffffff', '#ff4400']);
                                particles.emit({ x: target.x, y: target.y, count: 12, spread: 8, speed: [40, 100], angle: [0, Math.PI * 2], life: [0.3, 0.6], size: [2, 5], colors: ['#ffd700', '#ffaa00', '#fff'], gravity: 15, shape: 'star' });
                                particles.emit({ x: target.x, y: target.y + 4, count: 6, spread: 10, speed: [10, 40], angle: [-Math.PI, 0], life: [0.2, 0.5], size: [2, 4], colors: ['#8B7355', '#a09070'], gravity: 20, shape: 'circle' });
                            }, 200);
                        }
                    }
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
}
