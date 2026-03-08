// ============================================================
//  CenturionAbility — Dual-mode Spear/Sword + Pilum + Scutum
//  Extracted from Unit.update() lines 692-937
// ============================================================

import type { EliteAbility, AbilityContext } from "../../types/AbilityTypes";
import type { Unit } from "../Unit";
import type { Building } from "../Building";
import { UnitState, TILE_SIZE } from "../../config/GameConfig";
export const CenturionAbility: EliteAbility = {
    update(unit: Unit, dt: number, ctx: AbilityContext): void {
        const { particles } = ctx;

        unit.centurionBlockCooldown = Math.max(0, unit.centurionBlockCooldown - dt);
        unit.centurionPilumCooldown = Math.max(0, unit.centurionPilumCooldown - dt);

        // === MODE SWITCHING ===
        updateModeSwitch(unit, particles);

        // === SPEAR MODE: Pilum Throw every 3s (vs UNITS) ===
        if (unit.centurionMode === 'spear' && unit.centurionPilumCooldown <= 0
            && unit.state === UnitState.Attacking && unit.attackTarget && unit.attackTarget.alive) {
            throwPilumAtUnit(unit, particles, ctx.allUnits);
        }

        // === SPEAR MODE: Pilum Throw every 3s (vs BUILDINGS) ===
        if (unit.centurionMode === 'spear' && unit.centurionPilumCooldown <= 0
            && unit.state === UnitState.Attacking && !unit.attackTarget
            && unit.attackBuildingTarget && unit.attackBuildingTarget.alive) {
            throwPilumAtBuilding(unit, particles, ctx.allUnits);
        }

        // === SCUTUM BLOCK (still active in both modes) ===
        if (unit.centurionBlockActive) {
            unit.centurionBlockTimer -= dt;
            unit.centurionShielding = true;
            if (Math.random() < 0.3) {
                particles.emit({
                    x: unit.x + (unit.facingRight ? -6 : 6), y: unit.y - 4,
                    count: 1, spread: 3,
                    speed: [10, 30], angle: [0, Math.PI * 2],
                    life: [0.2, 0.4], size: [1.5, 3],
                    colors: ['#ffd700', '#ffaa00', '#fff'],
                    gravity: 0, shape: 'star',
                });
            }
            if (unit.centurionBlockTimer <= 0) {
                unit.centurionBlockActive = false;
                unit.centurionShielding = false;
                unit.centurionBlockCooldown = 8;
            }
        }
    },
};

// ---- Mode switching logic ----
function updateModeSwitch(unit: Unit, particles: any): void {
    if (unit.state === UnitState.Attacking) {
        let targetDist = Infinity;
        if (unit.attackTarget && unit.attackTarget.alive) {
            targetDist = Math.hypot(unit.attackTarget.x - unit.x, unit.attackTarget.y - unit.y);
        } else if (unit.attackBuildingTarget && (unit.attackBuildingTarget as any).alive) {
            targetDist = Math.hypot(unit.attackBuildingTarget.x - unit.x, unit.attackBuildingTarget.y - unit.y);
        }
        // Switch to SWORD only when target is within melee range
        if (targetDist <= unit.centurionSwordRange + 10 && unit.centurionMode === 'spear') {
            unit.centurionMode = 'sword';
            unit.civRange = unit.centurionSwordRange;
            unit.centurionMeleeHits = 0;
            particles?.emit({
                x: unit.x, y: unit.y - 6, count: 5, spread: 4,
                speed: [15, 40], angle: [0, Math.PI * 2],
                life: [0.2, 0.4], size: [2, 3],
                colors: ['#ccc', '#ffd700', '#fff'],
                gravity: 0, shape: 'star',
            });
        } else if (targetDist > unit.centurionSwordRange + 20 && unit.centurionMode === 'sword') {
            unit.centurionMode = 'spear';
            unit.civRange = unit.centurionSpearRange;
        }
    } else {
        // Not attacking — default to spear mode
        if (unit.centurionMode === 'sword') {
            unit.centurionMode = 'spear';
            unit.civRange = unit.centurionSpearRange;
        }
    }
}

// ---- Pilum throw at unit ----
function throwPilumAtUnit(unit: Unit, particles: any, allUnits: Unit[]): void {
    const target = unit.attackTarget!;
    const dx = target.x - unit.x, dy = target.y - unit.y;
    const dist = Math.hypot(dx, dy);
    if (dist > unit.centurionSpearRange) return;

    unit.centurionPilumCooldown = 3.0;
    if (target.x > unit.x) unit.facingRight = true;
    else unit.facingRight = false;

    // Lock the impact coordinates at the time of the throw
    const impactX = target.x;
    const impactY = target.y;

    launchPilumProjectile(unit, particles, allUnits, impactX, impactY, false);
}

// ---- Pilum throw at building ----
function throwPilumAtBuilding(unit: Unit, particles: any, allUnits: Unit[]): void {
    const bldg = unit.attackBuildingTarget!;
    const dx = bldg.x - unit.x, dy = bldg.y - unit.y;
    const dist = Math.hypot(dx, dy);
    const bldgRange = unit.centurionSpearRange + bldg.tileW * TILE_SIZE * 0.4;
    if (dist > bldgRange) return;

    unit.centurionPilumCooldown = 3.0;
    if (bldg.x > unit.x) unit.facingRight = true;
    else unit.facingRight = false;

    const impactX = bldg.x;
    const impactY = bldg.y;

    launchPilumProjectile(unit, particles, allUnits, impactX, impactY, true, bldg);
}

// ---- Shared: launch Parabolic Pilum Projectile ----
function launchPilumProjectile(
    unit: Unit, particles: any, allUnits: Unit[],
    impactX: number, impactY: number,
    isBuilding: boolean, targetBldg?: Building
): void {
    const startX = unit.x + (unit.facingRight ? 8 : -8);
    const startY = unit.y - 12;
    const dx = impactX - startX;
    const dy = impactY - startY;
    const totalDist = Math.hypot(dx, dy);

    const flightSpeed = 250; // px/s horizontal speed (slowed down for weighty realism)
    const flightTime = totalDist / flightSpeed;

    // Throw animation — arm raise sparks
    const throwAngle = Math.atan2(dy, dx);
    particles?.emit({
        x: startX, y: startY,
        count: 5, spread: 3,
        speed: [20, 50], angle: [throwAngle - 0.3, throwAngle + 0.3],
        life: [0.1, 0.25], size: [1.5, 3],
        colors: ['#c9a84c', '#ffd700', '#fff'],
        gravity: 0, shape: 'star',
    });

    let elapsed = 0;
    const intervalMs = 30; // 33 fps tick for projectile
    const capturedTeam = unit.team;

    // Parabola height control (higher arc for longer throws)
    const maxZ = Math.min(150, totalDist * 0.4);

    const projInterval = setInterval(() => {
        elapsed += intervalMs / 1000;

        if (elapsed >= flightTime) {
            clearInterval(projInterval);
            // IMPACT REACHED
            handlePilumImpact(particles, allUnits, impactX, impactY, capturedTeam, isBuilding, targetBldg);
            return;
        }

        // Calculate current position
        const t = elapsed / flightTime; // 0.0 to 1.0 progress
        const currX = startX + dx * t;
        const currY = startY + dy * t;

        // Parabolic Z arc (height): inverted parabola 4 * maxZ * t * (1 - t)
        const currZ = 4 * maxZ * t * (1 - t);

        // Calculate tangent angle for rotation (derivative of parabola)
        // dz/dt = 4 * maxZ * (1 - 2t)
        const dz = 4 * maxZ * (1 - 2 * t);

        // Exact 2D screen velocity vector for flawless parabolic alignment
        const velX = dx / flightTime;
        const velY = (dy / flightTime) - (dz / flightTime); // Y goes down on screen when Z goes up

        // Use the exact trajectory angle so it flies straight like an arrow
        const renderAngle = Math.atan2(velY, velX);

        // Render the Pilum mid-air using particles with exactly 1 tick lifespan
        particles?.emit({
            x: currX, y: currY - currZ,
            count: 1, spread: 0,
            speed: [0, 0], angle: [renderAngle, renderAngle],
            life: [intervalMs / 1000, intervalMs / 1000 + 0.02],
            size: [3, 4], colors: ['#8B6914'],
            gravity: 0, shape: 'spear',
        });

        // Motion blur / trail
        particles?.emit({
            x: currX, y: currY - currZ,
            count: 1, spread: 0.5,
            speed: [0, 0], angle: [renderAngle, renderAngle],
            life: [0.1, 0.15],
            size: [1.5, 2.5], colors: ['#a08030', '#c9a84c', 'rgba(255,255,255,0.4)'],
            gravity: 0, shape: 'rect',
        });

        // Shadow on ground
        particles?.emit({
            x: currX, y: currY + 4,
            count: 1, spread: 0,
            speed: [0, 0], angle: [renderAngle, renderAngle],
            life: [intervalMs / 1000, intervalMs / 1000 + 0.02],
            size: [2 + (currZ / 30), 3 + (currZ / 30)], // Shadow grows as it gets higher
            colors: ['rgba(0,0,0,0.15)'],
            gravity: 0, shape: 'circle',
        });

    }, intervalMs);
}

function handlePilumImpact(
    particles: any, allUnits: Unit[],
    impactX: number, impactY: number,
    capturedTeam: number, isBuilding: boolean, targetBldg?: Building
) {
    emitImpactExplosion(particles, impactX, impactY);

    const aoeDmg = 25, splashDmg = 15, aoeRange = 60;

    if (isBuilding && targetBldg) {
        // Direct hit on building
        if (targetBldg.alive) {
            targetBldg.takeDamage(aoeDmg, particles!);
        }
    }

    // AOE damage to any enemy caught in the blast radius
    // This allows dodging! If target unit moved away, they won't be caught here.
    for (const enemy of allUnits) {
        if (!enemy.alive || enemy.team === capturedTeam) continue;
        const edx = enemy.x - impactX, edy = enemy.y - impactY;

        // Direct hit range (very close to center) takes full dmg, others take splash
        const distSq = edx * edx + edy * edy;
        if (distSq <= 20 * 20) {
            // Direct hit on unit
            const finalDmg = enemy.applyPassiveDefense(aoeDmg, particles);
            enemy.hp -= finalDmg;
            if (finalDmg > 0) {
                enemy.slowTimer = 2.0;
                enemy.healReductionTimer = 2.0;
            }
        } else if (distSq <= aoeRange * aoeRange) {
            // Splash drop-off
            const finalSplash = enemy.applyPassiveDefense(splashDmg, particles);
            enemy.hp -= finalSplash;
            if (finalSplash > 0) {
                enemy.slowTimer = 2.0;
                enemy.healReductionTimer = 2.0;
            }
            particles?.emit({
                x: enemy.x, y: enemy.y - 4, count: 4, spread: 3,
                speed: [20, 50], angle: [0, Math.PI * 2],
                life: [0.15, 0.3], size: [2, 3],
                colors: ['#ff6600', '#ffaa00'],
                gravity: 20, shape: 'star',
            });
        }
    }
}

// ---- Shared: emit pilum projectile particles ----
function emitPilumProjectile(unit: Unit, particles: any, jAngle: number, flightSpeed: number, flightTime: number): void {
    const arcAngle = jAngle - 0.5;
    const arcSpeed = flightSpeed * 1.3;
    const arcGravity = 350;

    // Throw animation — arm raise
    particles?.emit({
        x: unit.x + (unit.facingRight ? 6 : -6), y: unit.y - 12,
        count: 3, spread: 2,
        speed: [15, 35], angle: [jAngle - 0.3, jAngle + 0.3],
        life: [0.1, 0.2], size: [1.5, 2.5],
        colors: ['#c9a84c', '#ffd700'],
        gravity: 0, shape: 'star',
    });
    // Main javelin body
    particles?.emit({
        x: unit.x + (unit.facingRight ? 8 : -8), y: unit.y - 12,
        count: 1, spread: 0,
        speed: [arcSpeed - 10, arcSpeed + 10],
        angle: [arcAngle - 0.02, arcAngle + 0.02],
        life: [flightTime * 1.1, flightTime * 1.3],
        size: [3, 4], colors: ['#8B6914'],
        gravity: arcGravity, shape: 'spear',
    });
    // Shaft trail
    particles?.emit({
        x: unit.x + (unit.facingRight ? 4 : -4), y: unit.y - 11,
        count: 3, spread: 1,
        speed: [arcSpeed * 0.85, arcSpeed * 0.95],
        angle: [arcAngle - 0.06, arcAngle + 0.06],
        life: [flightTime * 0.5, flightTime * 0.8],
        size: [1.5, 2.5], colors: ['#a08030', '#c9a84c'],
        gravity: arcGravity, shape: 'rect',
    });
    // Wind streaks
    particles?.emit({
        x: unit.x + (unit.facingRight ? 6 : -6), y: unit.y - 10,
        count: 4, spread: 2,
        speed: [arcSpeed * 0.4, arcSpeed * 0.7],
        angle: [arcAngle - 0.1, arcAngle + 0.1],
        life: [0.06, 0.14],
        size: [1, 1.5], colors: ['#fff', '#ddd'],
        gravity: 0, shape: 'rect',
    });
    // Shadow on ground
    particles?.emit({
        x: unit.x, y: unit.y + 8,
        count: 2, spread: 2,
        speed: [flightSpeed * 0.9, flightSpeed * 1.1],
        angle: [jAngle - 0.03, jAngle + 0.03],
        life: [flightTime * 0.8, flightTime * 1.1],
        size: [2, 3], colors: ['rgba(0,0,0,0.15)'],
        gravity: 0, shape: 'circle',
    });
}

// ---- Shared: emit impact explosion particles ----
function emitImpactExplosion(particles: any, impactX: number, impactY: number): void {
    particles?.emit({
        x: impactX, y: impactY - 5, count: 22, spread: 10,
        speed: [50, 160], angle: [0, Math.PI * 2],
        life: [0.3, 0.8], size: [3, 8],
        colors: ['#ff4400', '#ff8800', '#ffcc00', '#fff'],
        gravity: -25, shape: 'star',
    });
    particles?.emit({
        x: impactX, y: impactY - 3, count: 14, spread: 8,
        speed: [40, 130], angle: [0, Math.PI * 2],
        life: [0.2, 0.6], size: [2, 5],
        colors: ['#888', '#aaa', '#8B6914'],
        gravity: 60, shape: 'rect',
    });
    particles?.emit({
        x: impactX, y: impactY - 6, count: 12, spread: 12,
        speed: [10, 45], angle: [0, Math.PI * 2],
        life: [0.5, 1.3], size: [5, 10],
        colors: ['#333', '#555', '#777', '#444'],
        gravity: -12, shape: 'circle',
    });
    particles?.emit({
        x: impactX, y: impactY + 2, count: 18, spread: 16,
        speed: [30, 70], angle: [0, Math.PI * 2],
        life: [0.2, 0.5], size: [2, 4],
        colors: ['#ff6600', '#ffaa00'],
        gravity: 0, shape: 'circle',
    });
    // Shockwave ring
    particles?.emit({
        x: impactX, y: impactY, count: 20, spread: 1,
        speed: [80, 120], angle: [0, Math.PI * 2],
        life: [0.15, 0.3], size: [1.5, 2.5],
        colors: ['#ff8800', '#ffcc00'],
        gravity: 0, shape: 'circle',
    });
    // Pilum stuck in ground
    particles?.emit({
        x: impactX, y: impactY - 2, count: 1, spread: 0,
        speed: [0, 0], angle: [0, 0],
        life: [0.8, 1.2], size: [4, 5],
        colors: ['#8B6914'],
        gravity: 0, shape: 'rect',
    });
    particles?.emit({
        x: impactX, y: impactY - 6, count: 1, spread: 0,
        speed: [0, 0], angle: [0, 0],
        life: [0.6, 1.0], size: [3, 4],
        colors: ['#ccc'],
        gravity: 0, shape: 'rect',
    });
}
