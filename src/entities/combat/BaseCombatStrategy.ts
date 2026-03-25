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
import { getEquipBonuses } from "../unit-abilities/EquipmentSystem";

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

            // NOTE: No interrupt to chase enemy units while committed to a building attack
            // This prevents infinite loop when attacking walls blocking path to an enemy

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
            // Invulnerability shield (second chance)
            if (target.invulnerableTimer > 0) {
                unit.attackTarget = null;
                return;
            }
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
        // ---- HERO AURA: Attack Speed buff (e.g. Ragnar's Berserker Fury) ----
        if (unit.auraBuffType === 'atkSpeed' && unit.auraBuffValue > 0) {
            atkSpeedMod *= (1 - unit.auraBuffValue);
        }
        // ---- EQUIPMENT: Attack Speed bonus (e.g. Dragonbone Sword) ----
        const eb = getEquipBonuses(unit);
        if (eb.atkSpeedBonus > 0) {
            atkSpeedMod *= (1 - eb.atkSpeedBonus);
        }
        return atkSpeedMod;
    }

    protected applyPreDamageModifiers(context: CombatContext, target: Unit, baseDamage: number): number {
        return baseDamage; // Default no change
    }

    protected shouldPierceBlock(unit: Unit): boolean {
        return unit.type === UnitType.Ulfhednar && unit.ulfhednarRageActive;
    }

    protected handlePostDamageEffects(context: CombatContext, target: Unit, damageDealt: number): void {
        const { unit, particles } = context;
        if (unit.isHero) {
            unit.addHeroXp(Math.max(1, Math.floor(damageDealt * 0.15)));
            if (target.hp <= 0 && target.alive) {
                const xpGain = Math.max(5, Math.floor((target.maxHp + target.data.attack * 2) * 0.3));
                unit.addHeroXp(xpGain);
            }

            // ---- EQUIPMENT: Lifesteal (Blood Ring) ----
            const eb = getEquipBonuses(unit);
            if (eb.hasLifesteal && eb.lifestealValue > 0) {
                const healAmt = Math.max(1, Math.floor(damageDealt * eb.lifestealValue));
                unit.hp = Math.min(unit.hp + healAmt, unit.maxHp);
                // Visual: red healing particles
                particles.emit({
                    x: unit.x, y: unit.y - 8, count: 2, spread: 3,
                    speed: [10, 30], angle: [-Math.PI * 0.8, -Math.PI * 0.2],
                    life: [0.2, 0.4], size: [1, 2],
                    colors: ['#ef4444', '#fca5a5', '#fff'],
                    gravity: -20, shape: 'circle',
                });
            }

            // ---- EQUIPMENT: Splash (War Axe) ----
            if (eb.hasSplash && eb.splashValue > 0 && target.alive) {
                const splashDmg = Math.max(1, Math.floor(damageDealt * eb.splashValue));
                // Find 1 nearby enemy (not the primary target)
                const allUnits = unit._allUnits;
                let closestSplash: Unit | null = null;
                let closestDistSq = 50 * 50; // 50px splash radius
                for (let i = 0; i < allUnits.length; i++) {
                    const su = allUnits[i];
                    if (!su.alive || su.team === unit.team || su.id === target.id) continue;
                    const sdx = su.x - target.x, sdy = su.y - target.y;
                    const sdSq = sdx * sdx + sdy * sdy;
                    if (sdSq < closestDistSq) { closestDistSq = sdSq; closestSplash = su; }
                }
                if (closestSplash) {
                    closestSplash.hp -= splashDmg;
                    particles.emit({
                        x: closestSplash.x, y: closestSplash.y - 4, count: 4, spread: 5,
                        speed: [30, 80], angle: [0, Math.PI * 2],
                        life: [0.1, 0.25], size: [1.5, 3],
                        colors: ['#ff6600', '#ffcc00', '#fff'],
                        gravity: 60, shape: 'circle',
                    });
                }
            }

            // ---- EQUIPMENT: Slow on hit (Frost Hammer) ----
            if (eb.hasSlow && eb.slowValue > 0 && target.alive) {
                target.slowTimer = 2.0; // 2s slow
                target.slowAmount = eb.slowValue;
                // Visual: frost particles on target
                particles.emit({
                    x: target.x, y: target.y - 6, count: 3, spread: 4,
                    speed: [15, 40], angle: [-Math.PI * 0.8, -Math.PI * 0.2],
                    life: [0.3, 0.6], size: [1.5, 3],
                    colors: ['#60a5fa', '#93c5fd', '#dbeafe', '#fff'],
                    gravity: -10, shape: 'circle',
                });
            }

            // ---- EQUIPMENT: Anti-Heal on hit (Cursed Blade) ----
            if (eb.hasAntiHeal && eb.antiHealValue > 0 && target.alive) {
                target.healReductionTimer = 4.0; // 4s anti-heal
                target.antiHealAmount = eb.antiHealValue;
                // Visual: purple debuff particles on target
                particles.emit({
                    x: target.x, y: target.y - 6, count: 2, spread: 3,
                    speed: [10, 25], angle: [-Math.PI * 0.8, -Math.PI * 0.2],
                    life: [0.3, 0.5], size: [1, 2],
                    colors: ['#a855f7', '#7c3aed', '#4c1d95'],
                    gravity: -15, shape: 'circle',
                });
            }
        }
    }

    protected abstract executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void;

    public castHeroSkill(unit: Unit, skillIndex: number, particles: ParticleSystem, findNearestEnemy?: (x: number, y: number, team: number, range: number) => Unit | null, findNearestEnemyBuilding?: (x: number, y: number, team: number, range: number) => import("../Building").Building | null): void {
        // Base units don't cast hero skills.
    }

    public applyPassiveDefense(unit: Unit, damage: number, particles: ParticleSystem, pierceBlock: boolean = false): number {
        // Base armor implementation (armor stat already includes equipment bonus)
        let finalDamage = Math.max(1, damage - unit.armor);
        // ---- HERO AURA: Armor buff (e.g. Spartacus's Phalanx Spirit) ----
        if (unit.auraBuffType === 'armor' && unit.auraBuffValue > 0) {
            finalDamage = Math.max(1, Math.floor(finalDamage * (1 - unit.auraBuffValue)));
        }
        // ---- HERO AURA: Armor debuff (e.g. Ragnar's Berserker Fury -10% defense) ----
        if (unit.auraDebuffType === 'armor' && unit.auraDebuffValue < 0) {
            finalDamage = Math.ceil(finalDamage * (1 + Math.abs(unit.auraDebuffValue)));
        }
        // ---- EQUIPMENT: Damage Reflect (Dragon Scale) ----
        const eb = getEquipBonuses(unit);
        if (eb.hasReflect && eb.reflectValue > 0) {
            const reflected = Math.max(1, Math.floor(damage * eb.reflectValue));
            // Visual: purple spark on the unit being hit
            particles.emit({
                x: unit.x, y: unit.y - 8, count: 3, spread: 4,
                speed: [20, 60], angle: [0, Math.PI * 2],
                life: [0.15, 0.3], size: [1, 2.5],
                colors: ['#a855f7', '#c084fc', '#fff'],
                gravity: 40, shape: 'circle',
            });
            // Deal reflect damage back — find the closest enemy unit attacking us
            const allUnits = unit._allUnits;
            if (allUnits) {
                for (let i = 0; i < allUnits.length; i++) {
                    const attacker = allUnits[i];
                    if (attacker.alive && attacker.team !== unit.team && attacker.attackTarget === unit) {
                        attacker.hp -= reflected;
                        particles.emit({
                            x: attacker.x, y: attacker.y - 6, count: 2, spread: 3,
                            speed: [15, 40], angle: [0, Math.PI * 2],
                            life: [0.1, 0.2], size: [1, 2],
                            colors: ['#a855f7', '#fff'],
                            gravity: 30, shape: 'circle',
                        });
                        break; // reflect to only 1 attacker per hit
                    }
                }
            }
        }
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
