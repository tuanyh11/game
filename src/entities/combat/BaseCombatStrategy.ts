import { visualRng } from "../../utils/VisualRng";
// ============================================================
//  BaseCombatStrategy — Core loop for targeting and chasing
// ============================================================

import { ICombatStrategy, CombatContext } from "./CombatTypes";
import { Unit } from "../Unit";
import { ParticleSystem } from "../../effects/ParticleSystem";
import { CivilizationType, UnitType, TerrainType, TILE_SIZE, UnitState } from "../../config/GameConfig";
import { Building } from "../Building";
import { audioSystem } from "../../systems/AudioSystem";

export abstract class BaseCombatStrategy implements ICombatStrategy {

    public doAttack(context: CombatContext): void {
        const { unit, dt, particles, findNearestEnemy, tileMap, findNearestEnemyBuilding } = context;
        const leashRange = unit.data.sight * TILE_SIZE * 1.5;

        // ---- BUILDING ATTACK ----
        if (unit.attackBuildingTarget) {
            const bldg = unit.attackBuildingTarget;
            if (!bldg.alive || bldg.hp <= 0) {
                unit.attackBuildingTarget = null;
                unit.manualAttackCommand = false;
                unit.state = UnitState.Idle;
                return;
            }

            const dx = bldg.x - unit.x;
            const dy = bldg.y - unit.y;
            const dist = Math.hypot(dx, dy);
            const range = unit.civRange + bldg.tileW * TILE_SIZE * 0.4;

            // Interrupt: switch to enemy unit if closer
            if (findNearestEnemy) {
                const nearbyEnemy = findNearestEnemy(unit.x, unit.y, unit.team, unit.data.sight * TILE_SIZE + TILE_SIZE * 2);
                if (nearbyEnemy) {
                    unit.attackBuildingTarget = null;
                    unit.attackUnit(nearbyEnemy);
                    return;
                }
            }

            // Face target
            unit.facingRight = dx > 0;

            // Chase if out of range
            if (dist > range) {
                unit.chaseMove(dx, dy, dist, dt, tileMap);
                return;
            }

            // Execute Attack when cooldown ready
            if (unit.attackCooldown <= 0) {
                unit.attackCooldown = unit.civAttackSpeed;
                bldg.takeDamage(unit.attack, particles);
                if (unit.isHero) unit.addHeroXp(Math.max(1, Math.floor(unit.attack * 0.2)));

                this.executeBuildingAttack(context, bldg, dx, dy);
            }
            return;
        }

        // ---- UNIT ATTACK ----
        if (!unit.attackTarget || !unit.attackTarget.alive || unit.attackTarget.hp <= 0) {
            unit.attackTarget = null;
            unit.manualAttackCommand = false;
            if (findNearestEnemy) {
                // Expanded aggroRange when chaining kills
                const aggroRange = unit.data.sight * TILE_SIZE * 1.5;
                const next = findNearestEnemy(unit.x, unit.y, unit.team, aggroRange);
                if (next) {
                    unit.attackTarget = next;
                } else {
                    if (!unit.isVillager && findNearestEnemyBuilding) {
                        const bldg = findNearestEnemyBuilding(unit.x, unit.y, unit.team, aggroRange);
                        if (bldg) {
                            unit.attackBuilding(bldg);
                            return;
                        }
                    }
                    unit.state = UnitState.Idle;
                    return;
                }
            } else {
                unit.state = UnitState.Idle;
                return;
            }
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

        // Pre-attack movement handling (e.g. Ninja dash hook)
        if (this.handlePreAttackMovement(context, target, dx, dy, dist, range)) {
            return;
        }

        // Chase
        if (dist > range) {
            unit.chaseMove(dx, dy, dist, dt, tileMap);
            return;
        }

        // Custom checks to block standard attack loop (e.g Centurion Pilum)
        if (this.shouldSkipStandardAttack(context)) return;

        // Attack when cooldown ready
        if (unit.attackCooldown <= 0) {
            let atkSpeedMod = this.calculateAttackSpeedModifier(unit);
            unit.attackCooldown = unit.civAttackSpeed * atkSpeedMod;

            let dmg = unit.attack;

            // Passives & Modifiers calculations
            unit.passiveHitCounter++;
            dmg = this.applyPreDamageModifiers(context, target, dmg);

            // Apply Target Defense
            const pierceBlock = this.shouldPierceBlock(unit);
            dmg = target.applyPassiveDefense(dmg, particles, pierceBlock);
            target.hp -= dmg;

            // Post-damage logic (XP, Lifesteal, on-kill buffs)
            this.handlePostDamageEffects(context, target, dmg);

            // Specific visual effects
            const atkAngle = Math.atan2(dy, dx);
            this.executeUnitAttackFx(context, target, atkAngle, dmg);

            // Hook for post-hit effects like Chain Lightning
            if (this.onAttackImpact && context.findNearestEnemy) {
                // To support onAttackImpact, we pass getNearbyUnits hook
                const getNearbyUnits = (x: number, y: number, r: number) => {
                    const allUnits = context.tileMap?.getAllUnits() || [];
                    return allUnits.filter(u => Math.hypot(u.x - x, u.y - y) <= r);
                };
                dmg = this.onAttackImpact(unit, target, dmg, particles, getNearbyUnits);
            }
        }
    }

    /** Hook to override building attack particle effects */
    protected executeBuildingAttack(context: CombatContext, target: Building, dx: number, dy: number): void {
        const { unit, particles } = context;
        const atkAngle = Math.atan2(dy, dx);
        const hitX = target.x + (visualRng() - 0.5) * target.tileW * TILE_SIZE * 0.4;
        const hitY = target.y + (visualRng() - 0.5) * target.tileH * TILE_SIZE * 0.3;

        audioSystem.playSlashSound(unit.x, unit.y);

        particles.emit({
            x: hitX, y: hitY, count: 5, spread: 6,
            speed: [40, 100], angle: [atkAngle - 0.6, atkAngle + 0.6],
            life: [0.1, 0.3], size: [1.5, 3],
            colors: ['#ff6600', '#ffcc00', '#fff', '#aaa'],
            gravity: 80, shape: 'circle',
        });
    }

    /** Hook for custom approach mechanics (Ninja dash) */
    protected handlePreAttackMovement(context: CombatContext, target: Unit, dx: number, dy: number, dist: number, range: number): boolean {
        return false;
    }

    protected shouldSkipStandardAttack(context: CombatContext): boolean {
        return false;
    }

    protected calculateAttackSpeedModifier(unit: Unit): number {
        // Shared generic buffs
        const isMeleeHero = unit.type === UnitType.HeroSpartacus || unit.type === UnitType.HeroMusashi || unit.type === UnitType.HeroRagnar;
        let atkSpeedMod = (unit.isHero && unit.heroSkillActive[0] > 0 && isMeleeHero) ? 0.5 : 1;
        // Qi Jiguang Cuồng Phong: +20% attack speed
        if (unit.type === UnitType.HeroQiJiguang && unit.heroSkillActive[0] > 0) atkSpeedMod *= 0.8;
        // Ulfhednar Cuồng Sói: +50% attack speed during rage
        if (unit.type === UnitType.Ulfhednar && unit.ulfhednarRageActive) atkSpeedMod *= 0.5;
        // La Mã Gladius: Swordsman +20% attack speed
        if (!unit.isHero && unit.civilization === CivilizationType.LaMa && unit.type === UnitType.Swordsman) atkSpeedMod *= 0.8;
        return atkSpeedMod;
    }

    protected applyPreDamageModifiers(context: CombatContext, target: Unit, baseDamage: number): number {
        return baseDamage; // Default no change
    }

    protected shouldPierceBlock(unit: Unit): boolean {
        return unit.type === UnitType.Ulfhednar && unit.ulfhednarRageActive;
    }

    protected handlePostDamageEffects(context: CombatContext, target: Unit, damageDealt: number): void {
        const { unit } = context;
        if (unit.isHero) {
            unit.addHeroXp(Math.max(1, Math.floor(damageDealt * 0.15)));
            if (target.hp <= 0 && target.alive) {
                const xpGain = Math.max(5, Math.floor((target.maxHp + target.data.attack * 2) * 0.3));
                unit.addHeroXp(xpGain);
            }
        }
    }

    protected abstract executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void;

    public castHeroSkill(unit: Unit, skillIndex: number, particles: ParticleSystem, findNearestEnemy?: (x: number, y: number, team: number, range: number) => Unit | null, findNearestEnemyBuilding?: (x: number, y: number, team: number, range: number) => import("../Building").Building | null): void {
        // Base units don't cast hero skills.
    }

    public applyPassiveDefense(unit: Unit, damage: number, particles: ParticleSystem, pierceBlock: boolean = false): number {
        // Base armor implementation
        let finalDamage = Math.max(1, damage - unit.armor);
        return finalDamage;
    }

    public applyPassiveIdle(unit: Unit, dt: number, particles: ParticleSystem): void {
        // Default no-op
    }

    public updatePassive(unit: Unit, dt: number, particles: ParticleSystem, getNearbyUnits: (x: number, y: number, range: number) => Unit[]): void {
        // Default no-op
    }

    public onAttackImpact(unit: Unit, target: Unit | Building, damage: number, particles: ParticleSystem, getNearbyUnits: (x: number, y: number, range: number) => Unit[]): number {
        return damage; // Default no change
    }
}
