import { BaseCombatStrategy } from "../BaseCombatStrategy";
import { CombatContext } from "../CombatTypes";
import { Unit } from "../../Unit";
import { ParticleSystem } from "../../../effects/ParticleSystem";

export class CenturionStrategy extends BaseCombatStrategy {

    protected shouldSkipStandardAttack(context: CombatContext): boolean {
        const { unit } = context;
        if (unit.centurionMode === 'spear') {
            let dist = 999;
            if (unit.attackTarget) dist = Math.hypot(unit.attackTarget.x - unit.x, unit.attackTarget.y - unit.y);
            else if (unit.attackBuildingTarget) dist = Math.hypot(unit.attackBuildingTarget.x - unit.x, unit.attackBuildingTarget.y - unit.y);

            // Nếu kẻ địch ở xa (>40px), bỏ qua cận chiến để chờ ném Đinh Ba
            // Nếu kẻ địch ở gần (<=40px), thực hiện đâm cận chiến bình thường
            return dist > 40;
        }
        return false;
    }

    protected applyPreDamageModifiers(context: CombatContext, target: Unit, baseDamage: number): number {
        const { unit, particles } = context;

        // Centurion: Sword mode — every 4th melee hit → AOE explosion
        if (unit.centurionMode === 'sword') {
            unit.centurionMeleeHits++;
            if (unit.centurionMeleeHits >= 4) {
                unit.centurionMeleeHits = 0;
                const expX = target.x, expY = target.y;

                // 💥 GROUND EXPLOSION
                particles.emit({ x: expX, y: expY - 3, count: 16, spread: 6, speed: [40, 120], angle: [0, Math.PI * 2], life: [0.3, 0.6], size: [3, 6], colors: ['#ff4400', '#ff8800', '#ffcc00', '#fff'], gravity: -15, shape: 'star' });
                particles.emit({ x: expX, y: expY, count: 10, spread: 8, speed: [30, 80], angle: [0, Math.PI * 2], life: [0.2, 0.5], size: [2, 4], colors: ['#888', '#aaa', '#c9a84c'], gravity: 50, shape: 'rect' });
                particles.emit({ x: expX, y: expY - 4, count: 8, spread: 10, speed: [8, 30], angle: [0, Math.PI * 2], life: [0.4, 0.9], size: [4, 7], colors: ['#333', '#555', '#777'], gravity: -8, shape: 'circle' });

                // AOE damage
                const explDmg = 20, explRange = 50;
                for (const enemy of unit._allUnits) {
                    if (!enemy.alive || enemy.team === unit.team) continue;
                    const edx = enemy.x - expX, edy = enemy.y - expY;
                    if (edx * edx + edy * edy <= explRange * explRange) {
                        const finalExpl = enemy.applyPassiveDefense(explDmg, particles);
                        enemy.hp -= finalExpl;
                        particles.emit({ x: enemy.x, y: enemy.y - 4, count: 3, spread: 3, speed: [20, 50], angle: [0, Math.PI * 2], life: [0.1, 0.25], size: [2, 3], colors: ['#ff6600', '#ffaa00'], gravity: 15, shape: 'star' });
                    }
                }
            }
        }
        return baseDamage;
    }

    protected handlePostDamageEffects(context: CombatContext, target: Unit, damageDealt: number): void {
        super.handlePostDamageEffects(context, target, damageDealt);
        const { unit, particles } = context;

        // Kill → buff nearby allies +15% ATK for 5s
        if (target.hp <= 0 && target.alive) {
            unit.passiveBuffTimer = 5;
            particles.emit({ x: unit.x, y: unit.y - 10, count: 12, spread: 5, speed: [30, 80], angle: [0, Math.PI * 2], life: [0.5, 1.0], size: [3, 6], colors: ['#ffd700', '#ff4400', '#fff'], gravity: -15, shape: 'star' });
        }
    }

    public applyPassiveDefense(unit: Unit, incomingDmg: number, particles: ParticleSystem, pierceBlock: boolean = false): number {
        // Scutum Block — trigger on first hit when cooldown ready
        // pierceBlock bypasses this entirely (e.g. Ulfhednar rage attack)
        if (!pierceBlock) {
            if (unit.centurionBlockActive) {
                // BLOCK ALL DAMAGE during shield phase
                particles.emit({ x: unit.x + (unit.facingRight ? -6 : 6), y: unit.y - 6, count: 4, spread: 4, speed: [30, 70], angle: [0, Math.PI * 2], life: [0.15, 0.3], size: [2, 4], colors: ['#ffd700', '#ffaa00', '#fff'], gravity: 0, shape: 'star' });
                return 0; // blocked!
            }
            if (!unit.centurionBlockActive && unit.centurionBlockCooldown <= 0) {
                // First hit triggers block!
                unit.centurionBlockActive = true;
                unit.centurionBlockTimer = 1.0; // 1s block
                unit.centurionShielding = true;
                // Shield raise visual
                particles.emit({ x: unit.x, y: unit.y - 4, count: 12, spread: 8, speed: [20, 60], angle: [0, Math.PI * 2], life: [0.3, 0.6], size: [2, 5], colors: ['#ffd700', '#ffaa00', '#cc4444', '#fff'], gravity: -10, shape: 'star' });
                return 0; // first hit also blocked
            }
        }
        return super.applyPassiveDefense(unit, incomingDmg, particles, pierceBlock);
    }

    protected executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void {
        const { unit, particles } = context;

        // Bách Phu đâm ngọn giáo cực nặng
        // Tia chớp xé gió của ngọn giáo (Lúc này là cây Đinh Ba)
        particles.emit({
            x: unit.x + (unit.facingRight ? 12 : -12),
            y: unit.y - 6,
            count: 1, spread: 0,
            speed: [250, 300], angle: [atkAngle - 0.01, atkAngle + 0.01],
            life: [0.15, 0.25], size: [2, 3], colors: ['#aaa', '#fff'],
            gravity: 0, shape: 'trident',
            rotation: atkAngle, rotSpeed: 0
        });

        // Cú đâm nảy lửa tứa máu/tia lửa
        particles.emit({ x: target.x, y: target.y - 6, count: 8, spread: 5, speed: [50, 100], angle: [atkAngle - 0.8, atkAngle + 0.8], life: [0.15, 0.35], size: [2, 4], colors: ['#ff3300', '#ffccee', '#ddd'], gravity: 15, shape: 'star' });

        // Bụi mù dưới đất do lực đâm sấn tới
        particles.emit({ x: target.x, y: target.y, count: 5, spread: 6, speed: [20, 50], angle: [-0.5, 0.5], life: [0.2, 0.4], size: [2, 5], colors: ['#8a7a60', '#aa9a80', '#554433'], gravity: 30, shape: 'circle' });
    }
}
