import { BaseCombatStrategy } from "../BaseCombatStrategy";
import { CombatContext } from "../CombatTypes";
import { Unit } from "../../Unit";
import { ParticleSystem } from "../../../effects/ParticleSystem";
import { audioSystem } from "../../../systems/AudioSystem";
import { TILE_SIZE, UnitState } from "../../../config/GameConfig";
import { Building } from "../../Building";

export class EquitesStrategy extends BaseCombatStrategy {

    public doAttack(context: CombatContext): void {
        const { unit, dt, particles, tileMap, findNearestEnemy, findNearestEnemyBuilding } = context;
        const leashRange = unit.data.sight * TILE_SIZE * 1.5;

        // ---- BUILDING ATTACK ----
        if (unit.attackBuildingTarget) {
            super.doAttack(context);
            return;
        }

        // ---- UNIT ATTACK ----
        if (!unit.attackTarget || !unit.attackTarget.alive || unit.attackTarget.hp <= 0) {
            unit.attackTarget = null;
            unit.manualAttackCommand = false;

            // Regenerate abilities when idle
            unit.passiveCooldown = Math.max(0, unit.passiveCooldown - dt);
            unit.centurionBlockCooldown = Math.max(0, unit.centurionBlockCooldown - dt);

            if (findNearestEnemy) {
                const aggroRange = unit.data.sight * TILE_SIZE * 0.8;
                const next = findNearestEnemy(unit.x, unit.y, unit.team, aggroRange);
                if (next) unit.attackTarget = next;
                else {
                    if (findNearestEnemyBuilding) {
                        const bldg = findNearestEnemyBuilding(unit.x, unit.y, unit.team, aggroRange);
                        if (bldg) { unit.attackBuilding(bldg); return; }
                    }
                    unit.state = UnitState.Idle; return;
                }
            } else { unit.state = UnitState.Idle; return; }
        }

        const target = unit.attackTarget!;
        const dx = target.x - unit.x;
        const dy = target.y - unit.y;
        const dist = Math.hypot(dx, dy);

        // Hybrid Combat: Pilum Throw vs Melee
        const pilumReady = unit.passiveCooldown <= 0;
        const range = pilumReady ? 130 : unit.civRange;

        // Leash
        if (!unit.manualAttackCommand && dist > leashRange) {
            unit.attackTarget = null;
            unit.state = UnitState.Idle;
            return;
        }

        unit.facingRight = dx > 0;

        // Chase
        if (dist > range) {
            unit.chaseMove(dx, dy, dist, dt, tileMap);
            unit.passiveCooldown = Math.max(0, unit.passiveCooldown - dt); // tick cooldown even while chasing
            unit.centurionBlockCooldown = Math.max(0, unit.centurionBlockCooldown - dt);
            return;
        }

        // Custom checks to block standard attack loop
        if (this.shouldSkipStandardAttack(context)) return;

        // Attack when cooldown ready
        if (unit.attackCooldown <= 0) {
            let atkSpeedMod = this.calculateAttackSpeedModifier(unit);
            unit.attackCooldown = unit.civAttackSpeed * atkSpeedMod;
            let dmg = unit.attack;
            const atkAngle = Math.atan2(dy, dx);

            if (pilumReady) {
                // PILUM THROW
                unit.passiveCooldown = 8; // 8s cooldown for Pilum
                dmg = Math.round(dmg * 1.5);

                audioSystem.playArrowSound(unit.x, unit.y);

                particles.emit({
                    x: unit.x + (unit.facingRight ? 12 : -12), y: unit.y - 6,
                    count: 1, spread: 0, speed: [250, 300],
                    angle: [atkAngle - 0.05, atkAngle + 0.05],
                    life: [0.2, 0.4], size: [3, 5],
                    colors: ['#a8a8a8', '#ffffff'], gravity: 15, shape: 'spear'
                });

                // Pilum hit effect
                setTimeout(() => {
                    if (target.alive) {
                        const actualDmg = target.applyPassiveDefense(dmg, particles, true);
                        target.hp -= actualDmg;
                        this.handlePostDamageEffects(context, target, actualDmg);
                        particles.emit({
                            x: target.x, y: target.y - 4, count: 5, spread: 8,
                            speed: [30, 80], angle: [-Math.PI, 0],
                            life: [0.2, 0.4], size: [2, 4],
                            colors: ['#ff0000', '#aaaaaa'], gravity: 30, shape: 'star'
                        });
                    }
                }, 100);

            } else {
                // STANDARD MELEE
                unit.passiveHitCounter++;
                dmg = this.applyPreDamageModifiers(context, target, dmg);
                dmg = target.applyPassiveDefense(dmg, particles, this.shouldPierceBlock(unit));
                target.hp -= dmg;
                this.handlePostDamageEffects(context, target, dmg);
                this.executeUnitAttackFx(context, target, atkAngle, dmg);
            }
        } else {
            // Tick cooldowns
            unit.passiveCooldown = Math.max(0, unit.passiveCooldown - dt);
            unit.centurionBlockCooldown = Math.max(0, unit.centurionBlockCooldown - dt);
        }
    }

    public applyPassiveDefense(unit: Unit, incomingDmg: number, particles: ParticleSystem, pierceBlock: boolean = false): number {
        // Absolute block every 12 seconds
        if (!pierceBlock && unit.centurionBlockCooldown <= 0) {
            unit.centurionBlockCooldown = 12;

            // Shield spark effect
            particles.emit({
                x: unit.x + (unit.facingRight ? 6 : -6), y: unit.y - 8, count: 6, spread: 5,
                speed: [20, 50], angle: [0, Math.PI * 2],
                life: [0.2, 0.4], size: [2, 4],
                colors: ['#d6d6d6', '#aaaaaa', '#ffffff'], gravity: 10, shape: 'star'
            });

            audioSystem.playSlashSound(unit.x, unit.y);
            return 0;
        }

        return super.applyPassiveDefense(unit, incomingDmg, particles, pierceBlock);
    }

    protected executeUnitAttackFx(context: CombatContext, target: Unit, atkAngle: number, damageDealt: number): void {
        const { unit, particles } = context;

        audioSystem.playSpearStab(unit.x, unit.y);

        particles.emit({
            x: target.x, y: target.y - 5, count: 5, spread: 6,
            speed: [40, 90], angle: [0, Math.PI * 2],
            life: [0.2, 0.4], size: [2, 4],
            colors: ['#ffdd00', '#ffffff', '#ffaa00'],
            gravity: 20, shape: 'circle',
        });

        particles.emit({
            x: unit.x + (unit.facingRight ? 10 : -10),
            y: unit.y - 6, count: 3, spread: 2,
            speed: [150, 220],
            angle: [atkAngle - 0.1, atkAngle + 0.1],
            life: [0.1, 0.25], size: [2, 4],
            colors: ['#cccccc', '#ffffff'],
            gravity: 0, shape: 'rect',
        });
    }
}
