import { BaseCombatStrategy } from "../BaseCombatStrategy";
import { CombatContext } from "../CombatTypes";
import { Unit } from "../../Unit";
import { Building } from "../../Building";
import { audioSystem } from "../../../systems/AudioSystem";
import { TILE_SIZE, UnitState } from "../../../config/GameConfig";

export class YabusameStrategy extends BaseCombatStrategy {

    public doAttack(context: CombatContext): void {
        const { unit, dt, particles, tileMap, findNearestEnemy, findNearestEnemyBuilding } = context;
        const leashRange = unit.data.sight * TILE_SIZE * 1.5;

        // ---- BUILDING ATTACK (Simplified, rarely kiting buildings) ----
        if (unit.attackBuildingTarget) {
            super.doAttack(context);
            return;
        }

        // ---- UNIT ATTACK ----
        if (!unit.attackTarget || !unit.attackTarget.alive || unit.attackTarget.hp <= 0) {
            unit.attackTarget = null;
            unit.manualAttackCommand = false;
            if (findNearestEnemy) {
                const aggroRange = unit.data.sight * TILE_SIZE * 0.8;
                const next = findNearestEnemy(unit.x, unit.y, unit.team, aggroRange);
                if (next) {
                    unit.attackTarget = next;
                } else {
                    if (findNearestEnemyBuilding) {
                        const bldg = findNearestEnemyBuilding(unit.x, unit.y, unit.team, aggroRange);
                        if (bldg) { unit.attackBuilding(bldg); return; }
                    }
                    unit.state = UnitState.Idle;
                    return;
                }
            } else { unit.state = UnitState.Idle; return; }
        }

        const target = unit.attackTarget!;
        const dx = target.x - unit.x;
        const dy = target.y - unit.y;
        const dist = Math.hypot(dx, dy);
        const range = unit.civRange;

        // Leash
        if (!unit.manualAttackCommand && dist > leashRange) {
            unit.attackTarget = null;
            unit.state = UnitState.Idle;
            return;
        }

        unit.facingRight = dx > 0;

        // KITING LOGIC: Yabusame always tries to shoot while moving!
        let isMoving = false;

        if (dist > range) {
            // Chase towards
            unit.chaseMove(dx, dy, dist, dt, tileMap);
            isMoving = true;
        } else if (dist < range * 0.7) {
            // Kite away from melee
            unit.chaseMove(-dx, -dy, dist, dt, tileMap);
            isMoving = true;
        } else {
            // Within optimal range, stand still or pace slightly
            unit.state = UnitState.Attacking;
        }

        // FIRE WHILE MOVING! Don't return if `dist > range` if we're technically in range... 
        // wait, if we are > range we can't hit yet. Only fire if dist <= range.
        if (dist <= range && unit.attackCooldown <= 0) {
            // Re-calc attack speed
            let atkSpeedMod = this.calculateAttackSpeedModifier(unit);
            unit.attackCooldown = unit.civAttackSpeed * atkSpeedMod;

            let dmg = unit.attack;
            unit.passiveHitCounter++;

            // Yabusame Passive: 15% chance to shoot a critical piercing arrow (2x damage)
            if (Math.random() < 0.15) {
                dmg *= 2;
                particles.emit({
                    x: target.x, y: target.y - 8, count: 8, spread: 5,
                    speed: [50, 120], angle: [0, Math.PI * 2],
                    life: [0.2, 0.5], size: [2, 5],
                    colors: ['#ff0000', '#ff4444', '#fff'], gravity: -10, shape: 'star'
                });
            }

            dmg = this.applyPreDamageModifiers(context, target, dmg);

            const pierceBlock = this.shouldPierceBlock(unit);
            dmg = target.applyPassiveDefense(dmg, particles, pierceBlock);
            target.hp -= dmg;

            this.handlePostDamageEffects(context, target, dmg);

            const atkAngle = Math.atan2(dy, dx);
            this.executeUnitAttackFx(context, target, atkAngle, dmg);
        }
    }

    protected executeBuildingAttack(context: CombatContext, target: Building, dx: number, dy: number): void {
        const { unit, particles } = context;
        audioSystem.playArrowSound();

        const atkAngle = Math.atan2(dy, dx);
        particles.emit({
            x: unit.x + (unit.facingRight ? 10 : -10),
            y: unit.y - 8, count: 1, spread: 0,
            speed: [280, 320],
            angle: [atkAngle - 0.02, atkAngle + 0.02],
            life: [0.15, 0.35], size: [3, 4],
            colors: unit.age >= 4 ? ['#ffd700'] : ['#cc3333'],
            gravity: 15, shape: 'arrow',
        });
    }

    protected executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void {
        const { unit, particles } = context;
        const age = unit.age;

        audioSystem.playArrowSound();

        // Arrow projectile
        particles.emit({
            x: unit.x + (unit.facingRight ? 10 : -10),
            y: unit.y - 8, count: 1, spread: 0,
            speed: [350, 400],
            angle: [atkAngle - 0.02, atkAngle + 0.02],
            life: [0.15, 0.35], size: [3, 4],
            colors: age >= 4 ? ['#ffd700'] : ['#cc3333'],
            gravity: 15, shape: 'arrow',
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
