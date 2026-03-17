import { visualRng } from "../../../../utils/VisualRng";
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
            case 'lama_w0': { // Lôi Thần
                // Duration scales with hero level: 6s → 10s (in seconds, dt is seconds)
                const baseDuration = 6;
                const bonusDuration = Math.min(4, (unit.heroLevel - 1) * 0.8); // +0.8s per level, max +4s
                unit.lamaJupiterTimer = baseDuration + bonusDuration;
                HeroSkillUtils.buffVfx(unit, particles, ['#ffffff', '#00ffff', '#8888ff', '#ffff00']);
                // Big initial thunder strike — multiple bolts
                for (let i = 0; i < 3; i++) {
                    const ox = (visualRng() - 0.5) * 30;
                    particles.emit({ x: unit.x + ox, y: unit.y - 80 - visualRng() * 40, count: 1, spread: 0, speed: [0, 0], angle: [0, 0], life: [0.08, 0.2], size: [6 + visualRng() * 20, 50 + visualRng() * 40], colors: ['#ffffff', '#88ccff'], gravity: 0, shape: 'rect' });
                }
                HeroSkillUtils.explodeVfx(unit.x, unit.y, particles, ['#00ffff', '#ffffff', '#ffff00']);
                // Ground shock ring
                particles.emit({ x: unit.x, y: unit.y + 4, count: 20, spread: 8, speed: [80, 200], angle: [0, Math.PI * 2], life: [0.2, 0.5], size: [2, 5], colors: ['#00ccff', '#ffffff', '#88ddff'], gravity: 20, shape: 'circle' });
                break;
            }
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
                for (let i = 0; i < 6; i++) { const a = visualRng() * Math.PI * 2; particles.emit({ x: unit.x + Math.cos(a) * 20, y: unit.y + Math.sin(a) * 12, count: 3, spread: 1, speed: [80, 160], angle: [a + Math.PI * 0.8, a + Math.PI * 1.2], life: [0.05, 0.15], size: [2, 6], colors: ['#88bbff', '#fff'], gravity: 0, shape: 'rect' }); }
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

    public updatePassive(unit: Unit, dt: number, particles: ParticleSystem, getNearbyUnits: (x: number, y: number, range: number) => Unit[]): void {
        super.updatePassive(unit, dt, particles, getNearbyUnits);

        // Lôi Thần (Jupiter Transformation)
        if (unit.lamaJupiterTimer > 0) {
            unit.lamaJupiterTimer -= dt;
            
            // Electricity aura particles
            if (visualRng() < 0.2) {
                particles.emit({
                    x: unit.x + (visualRng() - 0.5) * 20,
                    y: unit.y - 10 + (visualRng() - 0.5) * 20,
                    count: 1, spread: 0, speed: [0, 0], angle: [0, 0], life: [0.1, 0.3], size: [2, 5], colors: ['#ffffff', '#00ffff'], gravity: 0, shape: 'star'
                });
            }

            // Random lightning strikes around him every ~0.3s
            if (!unit.passiveData) unit.passiveData = { strikeTimer: 0 };
            unit.passiveData.strikeTimer += dt;
            if (unit.passiveData.strikeTimer >= 0.3) { // 0.3 seconds
                unit.passiveData.strikeTimer = 0;
                
                // Find random enemy within 100px
                const nearby = getNearbyUnits(unit.x, unit.y, 100).filter(u => u.team !== unit.team && u.alive);
                if (nearby.length > 0) {
                    const target = nearby[Math.floor(visualRng() * nearby.length)];
                    // Deal 15 true damage
                    target.hp -= 15;
                    if (target.hp <= 0 && target.alive) unit.addHeroXp(Math.max(5, Math.floor(target.maxHp * 0.1)));
                    
                    // Lightning strike VFX
                    particles.emit({ x: target.x, y: target.y - 60, count: 1, spread: 0, speed: [0, 0], angle: [0, 0], life: [0.05, 0.15], size: [10, 25], colors: ['#ffffff', '#00ffff'], gravity: 0, shape: 'rect' });
                    particles.emit({ x: target.x, y: target.y, count: 6, spread: 4, speed: [30, 80], angle: [0, Math.PI * 2], life: [0.2, 0.4], size: [2, 4], colors: ['#ffffff', '#00ffff'], gravity: 0, shape: 'circle' });
                }
            }
        } else {
            if (unit.passiveData) unit.passiveData.strikeTimer = 0;
        }
    }

    public onAttackImpact(unit: Unit, target: Unit | import("../../../Building").Building, damage: number, particles: ParticleSystem, getNearbyUnits: (x: number, y: number, range: number) => Unit[]): number {
        let finalDamage = super.onAttackImpact(unit, target, damage, particles, getNearbyUnits);

        // Chain lightning during Lôi Thần
        if (unit.lamaJupiterTimer > 0) {
            // ===== ELECTRIFY PRIMARY TARGET =====
            // Big electric burst on hit
            particles.emit({ x: target.x, y: target.y - 8, count: 16, spread: 8, speed: [50, 140], angle: [0, Math.PI * 2], life: [0.15, 0.4], size: [3, 6], colors: ['#00ffff', '#ffffff', '#88eeff', '#44aaff'], gravity: 0, shape: 'star' });
            // Electric sparks shooting upward
            particles.emit({ x: target.x, y: target.y - 12, count: 10, spread: 4, speed: [40, 100], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.2, 0.5], size: [2, 4], colors: ['#ffffff', '#00eeff'], gravity: -60, shape: 'rect' });
            // Ground shock ring
            particles.emit({ x: target.x, y: target.y + 2, count: 12, spread: 6, speed: [60, 120], angle: [0, Math.PI * 2], life: [0.1, 0.25], size: [2, 3], colors: ['#00ccff44', '#ffffff44'], gravity: 15, shape: 'circle' });
            // Apply freeze/stun to primary target
            if (target instanceof Unit) target.frozenTimer = Math.max(target.frozenTimer, 0.25);

            // ===== CHAIN LIGHTNING =====
            const maxBounce = unit.heroLevel >= 5 ? 3 : 2;
            const range = 90;
            const nearby = getNearbyUnits(target.x, target.y, range)
                .filter(u => u.team !== unit.team && u.alive && u.id !== target.id)
                .sort((a, b) => Math.hypot(a.x - target.x, a.y - target.y) - Math.hypot(b.x - target.x, b.y - target.y))
                .slice(0, maxBounce);

            let currentPoint = { x: target.x, y: target.y - 8 };
            
            for (const nextTarget of nearby) {
                const bounceDmg = 20; 
                nextTarget.hp -= bounceDmg;
                if (nextTarget.hp <= 0 && nextTarget.alive) unit.addHeroXp(Math.max(5, Math.floor(nextTarget.maxHp * 0.15)));
                nextTarget.frozenTimer = Math.max(nextTarget.frozenTimer, 0.2);
                
                const tx = nextTarget.x, ty = nextTarget.y - 8;
                const chainAngle = Math.atan2(ty - currentPoint.y, tx - currentPoint.x);
                const chainDist = Math.hypot(tx - currentPoint.x, ty - currentPoint.y);
                
                // ===== THICK ZIGZAG LIGHTNING BOLT =====
                const segments = 10;
                for (let i = 0; i <= segments; i++) {
                    const p = i / segments;
                    const perpX = -(ty - currentPoint.y);
                    const perpY = (tx - currentPoint.x);
                    const len = Math.hypot(perpX, perpY) || 1;
                    // Alternating zigzag with random-ish amplitude
                    const zigzag = ((i % 3) - 1) * (3 + (i % 2) * 3);
                    const px = currentPoint.x + Math.cos(chainAngle) * chainDist * p + perpX / len * zigzag;
                    const py = currentPoint.y + Math.sin(chainAngle) * chainDist * p + perpY / len * zigzag;
                    
                    // White core (bright, thin)
                    particles.emit({
                        x: px, y: py,
                        count: 2, spread: 1, speed: [0, 8], angle: [0, Math.PI * 2],
                        life: [0.06, 0.15], size: [3, 5],
                        colors: ['#ffffff'], gravity: 0, shape: 'rect'
                    });
                    // Cyan glow (wider, softer)
                    particles.emit({
                        x: px, y: py,
                        count: 1, spread: 2, speed: [0, 12], angle: [0, Math.PI * 2],
                        life: [0.08, 0.2], size: [4, 7],
                        colors: ['#00ccff', '#44ddff'], gravity: 0, shape: 'circle'
                    });
                }
                
                // ===== IMPACT EXPLOSION ON BOUNCED TARGET =====
                // Big electric burst
                particles.emit({ x: tx, y: ty, count: 14, spread: 6, speed: [40, 120], angle: [0, Math.PI * 2], life: [0.15, 0.4], size: [3, 6], colors: ['#ffffff', '#00ffff', '#88eeff', '#ffff44'], gravity: 0, shape: 'star' });
                // Rising electric embers
                particles.emit({ x: tx, y: ty - 4, count: 8, spread: 3, speed: [30, 70], angle: [-Math.PI * 0.8, -Math.PI * 0.2], life: [0.2, 0.5], size: [2, 3], colors: ['#00eeff', '#ffffff'], gravity: -50, shape: 'rect' });
                // Lingering electric aura around target
                for (let s = 0; s < 6; s++) {
                    const sa = (s / 6) * Math.PI * 2;
                    particles.emit({ x: tx + Math.cos(sa) * 8, y: ty + Math.sin(sa) * 6, count: 1, spread: 1, speed: [5, 15], angle: [sa, sa + 0.5], life: [0.3, 0.6], size: [2, 4], colors: ['#00ccff88', '#ffffff66'], gravity: 0, shape: 'star' });
                }
                
                currentPoint = { x: tx, y: ty };
            }
        }

        return finalDamage;
    }
}
