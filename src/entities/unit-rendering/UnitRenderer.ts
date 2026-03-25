// ============================================================
//  UnitRenderer — Core rendering pipeline
//  All draw methods are now in separate, focused modules:
//     shared.ts         → getCivColors, CivColors
//     draw-villager.ts  → drawVillager
//     draw-spearman.ts  → drawSpearman
//     draw-archer.ts    → drawArcher
//     draw-elites.ts    → drawChuKoNu, drawImmortal, drawNinja, drawCenturion, drawUlfhednar
//     draw-dispatchers.ts → drawScout, drawSwordsman
//     draw-knight-hero.ts → drawKnight, drawHero, getCivHeroVisuals
//     effects/AttackEffects.ts   → renderAttackWeapon, renderAttackEffects
//     effects/StatusOverlays.ts  → renderFrozenOverlay, renderHealingOverlay, renderHeroBuffAura, renderHeroLevelUp
//     civs/*Renderer.ts  → per-civ scout/swords draw functions
// ============================================================

import {
    UnitType, UnitState, CIVILIZATION_DATA,
    CivilizationType, C, TILE_SIZE,
    ResourceType, ResourceNodeType, isRangedType, isCivElite, isCivCavalry,
} from "../../config/GameConfig";
import type { Unit } from "../Unit";

// Re-export shared types for external consumers
export type { CivColors } from "./shared";
export { getCivColors } from "./shared";
import { getCivColors } from "./shared";

import { RenderCache } from "../RenderCache";

// Draw functions — imported from extracted modules
import { drawVillager } from "./draw-villager";
import { drawChuKoNu, drawImmortal, drawNinja, drawCenturion, drawUlfhednar } from "./draw-elites";
import { drawScout, drawSwordsman, drawSpearman, drawArcher } from "./draw-dispatchers";
import { drawKnight, drawHero, getCivHeroVisuals } from "./draw-knight-hero";
import { drawWarElephant, drawFireLancer, drawYabusame, drawBearRider, drawEquites } from "./draw-cavalry-unique";
import { drawTargetDummy } from "./draw-dummy";
import { drawCreep } from "./draw-creeps";

// Effects
import { renderAttackWeapon, renderAttackEffects } from "./effects/AttackEffects";
import { renderFrozenOverlay, renderHealingOverlay, renderHeroBuffAura, renderHeroLevelUp, renderAuraBuffIndicator, renderHeroAuraRadius } from "./effects/StatusOverlays";

// ============================================================
//  renderUnit — COMPLETE unit rendering pipeline
//  Extracted from Unit.render() for separation of concerns
//  Handles: shadow, body draw, tool/attack anims, overlays,
//           selection, HP bars, hero effects, status icons
// ============================================================
export function renderUnit(unit: Unit, ctx: CanvasRenderingContext2D): void {
    const x = Math.round(unit.renderX), y = Math.round(unit.renderY);
    const flip = unit.facingRight ? 1 : -1;
    const age = unit.age;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flip, 1);

    // Walking bob
    // Calculate distance moved since last frame using raw float coordinates to catch micro-movements
    const prevX = unit.lastX !== undefined ? unit.lastX : unit.x;
    const prevY = unit.lastY !== undefined ? unit.lastY : unit.y;
    const distMoved = Math.hypot(unit.x - prevX, unit.y - prevY);

    // Check if unit is actively moving its position OR in a moving/chasing state
    // In multiplayer, units in Attacking state chasing their target need walking animation too
    let isChasingTarget = false;
    if (unit.state === UnitState.Attacking) {
        const atkTarget = unit.attackTarget || unit.attackBuildingTarget;
        if (atkTarget) {
            const td = Math.hypot(atkTarget.x - unit.x, atkTarget.y - unit.y);
            const bldgR = unit.attackBuildingTarget ? unit.attackBuildingTarget.tileW * TILE_SIZE * 0.4 : 0;
            if (td > unit.civRange + bldgR) isChasingTarget = true;
        }
    }
    const isMoving = distMoved > 0.1 || unit.state === UnitState.Moving || unit.state === UnitState.Returning || isChasingTarget;
    const bob = isMoving ? Math.sin(unit.animTimer * 18) * 2 : 0;

    // Store current position for next frame
    unit.lastX = unit.x;
    unit.lastY = unit.y;

    // Building swing (up-down hammer motion)
    const buildSwing = unit.state === UnitState.Building
        ? Math.sin(unit.buildSwingTimer * 8) * 4 : 0;

    // Gather action bob
    const gatherSwing = unit.state === UnitState.Gathering
        ? Math.sin(unit.gatherEffectTimer * 14) * 3 : 0;

    // ---- IDLE ANIMATION ----
    const isIdle = unit.state === UnitState.Idle;
    const idleBreathe = isIdle ? Math.sin(unit.idleTimer * 2.5) * 0.8 : 0;
    const idleSway = isIdle ? Math.sin(unit.idleTimer * 1.8 + 0.5) * 0.3 : 0;

    const totalBob = bob + buildSwing + gatherSwing + idleBreathe;

    if (isIdle && Math.abs(idleSway) > 0.01) {
        ctx.translate(idleSway, 0);
    }

    // ===== ENHANCED 3D GROUND SHADOW =====
    const isCavalry = unit.type === UnitType.Scout || unit.type === UnitType.Knight;
    const isHero = unit.isHero;
    const shadowBaseW = isCavalry ? 12 : isHero ? 10 : 8;
    const shadowBaseH = isCavalry ? 5 : isHero ? 4 : 3;
    const shadowScale = isIdle ? 1 + Math.sin(unit.idleTimer * 2.5) * 0.06 : 1;

    // Directional shadow offset (sun from top-left)
    const shadowOffX = 2;
    const shadowOffY = isCavalry ? 14 : 11;

    // Use cached ground shadow to avoid extremely expensive vector path generation
    const shadowCanvas = RenderCache.getUnitShadow(shadowBaseW, shadowBaseH, shadowScale);
    ctx.drawImage(shadowCanvas, shadowOffX - shadowCanvas.width / 2, shadowOffY - shadowCanvas.height / 2);

    // ============================================================
    //  AGE-BASED UNIT RENDERING
    // ============================================================

    // Cẩm Y Vệ charge aura
    if (unit.type === UnitType.ChuKoNu && unit.camYVeCooldown <= 0 && !unit.camYVeComboActive) {
        ctx.globalAlpha = 0.12 + Math.sin(unit.animTimer * 8) * 0.06;
        ctx.fillStyle = '#4a0060';
        ctx.beginPath(); ctx.arc(0, 0 + totalBob, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8b0000';
        ctx.beginPath(); ctx.arc(0, -4 + totalBob, 12, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }
    // Cẩm Y Vệ combo visual
    if (unit.type === UnitType.ChuKoNu && unit.camYVeComboActive) {
        if (!unit.camYVeVisible) {
            ctx.globalAlpha = 0.06;
            ctx.fillStyle = '#4a0060';
            ctx.fillRect(-6, -14 + totalBob, 12, 24);
            ctx.globalAlpha = 1;
        } else {
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = '#1a0020';
            ctx.fillRect(-8, -18 + totalBob, 16, 32);
            ctx.fillStyle = '#8b0000';
            ctx.fillRect(-6, -14 + totalBob, 12, 24);
            const phase = unit.camYVeComboPhase;
            if (phase >= 0) {
                ctx.strokeStyle = '#ff0044';
                ctx.lineWidth = 3;
                ctx.globalAlpha = 0.7;
                const slashRot = phase * Math.PI * 0.4 + Math.PI * 0.2;
                ctx.beginPath();
                ctx.arc(0, -4 + totalBob, 14, slashRot - 1.2, slashRot + 1.2);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
    }
    // Ninja stealth visual
    // ======== GLOBAL MOVEMENT DUST EFFECT ========
    if (isMoving && !unit.isStealthed && unit.type !== UnitType.TargetDummy) {
        const civ = unit.civilization;
        let dustColor: string;
        let pColor: string;
        switch (civ) {
            case CivilizationType.BaTu: dustColor = '#c9a060'; pColor = '#e0c090'; break;
            case CivilizationType.Viking: dustColor = '#5a5a58'; pColor = '#7a7a78'; break; // slightly darker for viking snow/mud
            case CivilizationType.DaiMinh: dustColor = '#8a6a50'; pColor = '#a88a70'; break;
            case CivilizationType.Yamato: dustColor = '#7a7a60'; pColor = '#9a9a80'; break;
            default: dustColor = '#8a7a60'; pColor = '#a89a80';
        }

        ctx.save();
        // Shift dust behind the unit based on likely facing direction (assumed right/left)
        // Since we don't have perfect velocity vectors in the renderer easily, we just scatter it around the base
        ctx.translate(0, 16); // Move to unit's feet level

        // Number of dust particles depends on unit size (cavalry kicks up more dust)
        const isCav = unit.type === UnitType.Knight || unit.type === UnitType.Scout || unit.type === UnitType.Equites || unit.type === UnitType.FireLancer || unit.type === UnitType.BearRider || unit.type === UnitType.WarElephant || unit.type === UnitType.Yabusame;
        const numParticles = isCav ? 5 : 3;
        const spreadMultiplier = isCav ? 8 : 5;
        const liftMultiplier = isCav ? 12 : 8;

        ctx.globalAlpha = isCav ? 0.35 : 0.25;

        for (let i = 0; i < numParticles; i++) {
            const lift = (unit.animTimer * liftMultiplier + i * 5) % 8;
            const spreadX = Math.sin(unit.animTimer * 10 + i) * spreadMultiplier;
            const size = (isCav ? 3 : 2) - (lift / 4);

            if (size > 0.5) {
                ctx.fillStyle = i % 2 === 0 ? dustColor : pColor;
                ctx.beginPath();
                ctx.arc(-8 + spreadX + (i * 2), -lift, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    if (unit.isStealthed && unit.type === UnitType.Ninja) {
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#4400aa';
        ctx.fillRect(-6, -16 + totalBob, 12, 28);
        ctx.fillStyle = '#8800ff';
        ctx.fillRect(-4, -12 + totalBob, 8, 20);
    }

    let isInAttackRange = false;
    if (unit.state === UnitState.Attacking) {
        if (unit.attackTarget && unit.attackTarget.alive) {
            const td = Math.hypot(unit.attackTarget.x - unit.x, unit.attackTarget.y - unit.y);
            isInAttackRange = td <= unit.civRange;
        } else if (unit.attackBuildingTarget && unit.attackBuildingTarget.alive) {
            const bd = Math.hypot(unit.attackBuildingTarget.x - unit.x, unit.attackBuildingTarget.y - unit.y);
            isInAttackRange = bd <= unit.civRange + unit.attackBuildingTarget.tileW * TILE_SIZE * 0.4;
        }
    }

    // Draw unit body
    if (unit.isVillager) {
        drawVillager(unit, ctx, age, totalBob, isMoving);
    } else {
        switch (unit.type) {
            case UnitType.Spearman: drawSpearman(unit, ctx, age, totalBob, isMoving, isInAttackRange); break;
            case UnitType.Archer: drawArcher(unit, ctx, age, totalBob, isMoving, isInAttackRange); break;
            case UnitType.Scout: drawScout(unit, ctx, age, totalBob, isMoving, isInAttackRange); break;
            case UnitType.Swordsman: drawSwordsman(unit, ctx, age, totalBob, isMoving, isInAttackRange); break;
            case UnitType.Knight: drawKnight(unit, ctx, age, totalBob, isMoving, isInAttackRange); break;
            case UnitType.Immortal: drawImmortal(unit, ctx, age, totalBob, isMoving); break;
            case UnitType.ChuKoNu: drawChuKoNu(unit, ctx, age, totalBob, isMoving); break;
            case UnitType.Ninja: drawNinja(unit, ctx, age, totalBob, isMoving); break;
            case UnitType.Centurion: drawCenturion(unit, ctx, age, totalBob, isMoving); break;
            case UnitType.Ulfhednar: drawUlfhednar(unit, ctx, age, totalBob, isMoving); break;
            // Unique Cavalry
            case UnitType.WarElephant: drawWarElephant(unit, ctx, age, totalBob, isMoving, getCivColors(unit)); break;
            case UnitType.FireLancer: drawFireLancer(unit, ctx, age, totalBob, isMoving); break;
            case UnitType.Yabusame: drawYabusame(unit, ctx, age, totalBob, isMoving); break;
            case UnitType.Equites: drawEquites(unit, ctx, age, totalBob, isMoving); break;
            case UnitType.BearRider: drawBearRider(unit, ctx, age, totalBob, isMoving); break;
            // Neutral Creeps
            case UnitType.CreepWolf:
            case UnitType.CreepSkeleton:
            case UnitType.CreepOgre:
            case UnitType.CreepDragon:
            case UnitType.CreepDragonEast:
                drawCreep(ctx, unit.type, totalBob, unit.animTimer, isInAttackRange, unit.attackCooldown > 0 ? 1 - unit.attackCooldown / (unit.civAttackSpeed || 1) : 0, isMoving);
                break;
            case UnitType.TargetDummy: drawTargetDummy(unit, ctx, age, totalBob); break;
            case UnitType.HeroSpartacus:
            case UnitType.HeroZarathustra:
            case UnitType.HeroQiJiguang:
            case UnitType.HeroMusashi:
            case UnitType.HeroRagnar: {
                const hc = getCivHeroVisuals(unit);
                drawHero(unit, ctx, age, totalBob, isMoving, hc.color, hc.symbol);
                break;
            }
        }
    }

    // Reset ninja stealth alpha
    if (unit.isStealthed && unit.type === UnitType.Ninja) {
        ctx.globalAlpha = 1;
    }

    // ===== FIERCE DARK OVERLAY (Upgrade Level 3) =====
    // When units are fully upgraded at the blacksmith, they gain a dark, menacing appearance
    if (unit.upgradeLevel >= 3 && !unit.isVillager && !unit.isStealthed) {
        const civ = unit.civilization;
        const isCav = unit.type === UnitType.Scout || unit.type === UnitType.Knight;
        const t = unit.animTimer;

        // 1. DARK BODY TINT — semi-transparent dark overlay on the body
        ctx.globalAlpha = 0.18 + Math.sin(t * 2) * 0.04;
        ctx.fillStyle = '#0a0008';
        const bodyW = isCav ? 16 : 12;
        const bodyH = isCav ? 28 : 24;
        ctx.fillRect(-bodyW / 2, -14 + totalBob, bodyW, bodyH);
        ctx.globalAlpha = 1;

        // 2. CIV-SPECIFIC FIERCE AURA — menacing particles around the feet
        let auraColor1: string, auraColor2: string, glowColor: string;
        switch (civ) {
            case CivilizationType.BaTu:
                // Dark golden sandstorm wisps
                auraColor1 = '#4a3500'; auraColor2 = '#8a6a00'; glowColor = '#cc8800';
                break;
            case CivilizationType.DaiMinh:
                // Crimson fire embers
                auraColor1 = '#4a0000'; auraColor2 = '#8a1111'; glowColor = '#ff2222';
                break;
            case CivilizationType.Yamato:
                // Black/violet shadow wisps
                auraColor1 = '#1a0030'; auraColor2 = '#3a1060'; glowColor = '#7722cc';
                break;
            case CivilizationType.Viking:
                // Icy dark green mist
                auraColor1 = '#001a10'; auraColor2 = '#0a3a20'; glowColor = '#22aa55';
                break;
            default: // LaMa
                // Dark purple/maroon smoke
                auraColor1 = '#2a0018'; auraColor2 = '#5a1038'; glowColor = '#aa2255';
                break;
        }

        // Aura wisps rising from feet
        ctx.globalAlpha = 0.35;
        for (let i = 0; i < 4; i++) {
            const wx = Math.sin(t * 3 + i * 1.6) * 8;
            const wy = 8 + totalBob - Math.abs(Math.sin(t * 2.5 + i * 0.9)) * 12;
            const ws = 2.5 - Math.abs(Math.sin(t * 2.5 + i * 0.9)) * 1.5;
            if (ws > 0.5) {
                ctx.fillStyle = i % 2 === 0 ? auraColor1 : auraColor2;
                ctx.beginPath(); ctx.arc(wx, wy, ws, 0, Math.PI * 2); ctx.fill();
            }
        }
        ctx.globalAlpha = 1;

        // Dark ground glow ring
        ctx.globalAlpha = 0.12 + Math.sin(t * 3) * 0.05;
        ctx.fillStyle = auraColor1;
        ctx.beginPath();
        ctx.ellipse(0, 12, isCav ? 14 : 10, isCav ? 5 : 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // 3. GLOWING EYES — small fierce red/orange dots that pulse
        const eyePulse = 0.6 + Math.sin(t * 6) * 0.35;
        ctx.globalAlpha = eyePulse;
        ctx.fillStyle = glowColor;
        // Left eye
        ctx.beginPath(); ctx.arc(-2, -9 + totalBob, 1.2, 0, Math.PI * 2); ctx.fill();
        // Right eye
        ctx.beginPath(); ctx.arc(2, -9 + totalBob, 1.2, 0, Math.PI * 2); ctx.fill();
        // Eye glow bloom
        ctx.globalAlpha = eyePulse * 0.3;
        ctx.beginPath(); ctx.arc(-2, -9 + totalBob, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(2, -9 + totalBob, 3, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }

    // ===== RIM-LIGHT for 3D depth (top-left light) =====
    if (!unit.isStealthed) {
        const rimAlpha = unit.isHero ? 0.14 : 0.10;
        ctx.fillStyle = `rgba(255,255,240,${rimAlpha})`;
        // Top edge highlight (head/helmet area)
        ctx.fillRect(-4, -14 + totalBob, 8, 3);
        // Left edge highlight
        ctx.fillStyle = `rgba(255,255,240,${rimAlpha * 0.6})`;
        ctx.fillRect(-5, -10 + totalBob, 2, 14);
    }

    // ===== FREEZE VISUAL OVERLAY =====
    if (unit.frozenUntil > Date.now()) {
        // Blue ice tint over entire body
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#88ddff';
        ctx.fillRect(-7, -16 + totalBob, 14, 28);
        ctx.globalAlpha = 1;

        // Ice crystal layer
        const ft = Date.now() * 0.003;
        ctx.fillStyle = '#e0ffff';
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 6; i++) {
            const ix = Math.cos(ft + i * 1.05) * 6;
            const iy = -4 + Math.sin(ft * 0.7 + i * 0.8) * 8 + totalBob;
            ctx.fillRect(ix - 1, iy - 1, 2, 2);
        }
        ctx.globalAlpha = 1;

        // Frost border glow
        ctx.strokeStyle = '#88ddff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5 + Math.sin(ft * 2) * 0.15;
        ctx.strokeRect(-8, -17 + totalBob, 16, 30);
        ctx.globalAlpha = 1;
    }

    // ---- TOOL ANIMATION (villager only) ----
    if (unit.state === UnitState.Gathering || unit.state === UnitState.Building) {
        const swingAngle = unit.state === UnitState.Building
            ? Math.sin(unit.buildSwingTimer * 8) * 0.6
            : Math.sin(unit.gatherEffectTimer * 14) * 0.5;

        ctx.save();
        ctx.translate(6, -6 + totalBob);
        ctx.rotate(swingAngle - 0.3);

        if (unit.state === UnitState.Building) {
            ctx.fillStyle = '#8B5E3C';
            ctx.fillRect(0, -12, 2, 14);
            ctx.fillStyle = age >= 3 ? '#aaa' : '#888';
            ctx.fillRect(-3, -15, 8, 5);
        } else {
            if (unit.targetResource) {
                switch (unit.targetResource.nodeType) {
                    case ResourceNodeType.Tree:
                        ctx.fillStyle = '#8B5E3C';
                        ctx.fillRect(0, -12, 2, 14);
                        ctx.fillStyle = age >= 3 ? '#bbb' : '#aaa';
                        ctx.fillRect(-4, -14, 7, 4);
                        break;
                    case ResourceNodeType.GoldMine:
                        ctx.fillStyle = '#8B5E3C';
                        ctx.fillRect(0, -12, 2, 14);
                        ctx.fillStyle = age >= 3 ? '#aaa' : '#999';
                        ctx.fillRect(-5, -14, 10, 3);
                        ctx.fillRect(-5, -14, 2, 5);
                        break;
                }
            }
        }
        ctx.restore();
    }

    // ---- ATTACK ANIMATION (military units) ----
    if (isInAttackRange) {
        const swingT = unit.attackAnimTimer;
        const swingCycle = Math.sin(swingT * 10);
        const swingPhase = (swingT * 10) % (Math.PI * 2);

        // Heroes with custom renderers handle their own attack effects
        const hasCustomRenderer = unit.type === UnitType.HeroQiJiguang
            || unit.type === UnitType.HeroMusashi
            || unit.type === UnitType.HeroSpartacus
            || unit.type === UnitType.HeroRagnar;

        ctx.save();
        if (!hasCustomRenderer && !isCivElite(unit.type) && !isCivCavalry(unit.type) && unit.type !== UnitType.Archer && unit.type !== UnitType.Scout) {
            if (unit.isVillager) {
                // Villager attack: hammer swing
                const hammerSwing = swingCycle * 0.7;
                ctx.save();
                ctx.translate(7, -4 + totalBob);
                ctx.rotate(hammerSwing - 0.4);
                // Hammer handle
                ctx.fillStyle = '#8B5E3C';
                ctx.fillRect(0, -10, 2, 12);
                // Hammer head
                ctx.fillStyle = unit.isMilitia ? '#aaa' : '#888';
                ctx.fillRect(-3, -13, 8, 5);
                ctx.restore();
            } else {
                renderAttackWeapon(unit, ctx, totalBob, swingCycle, swingPhase);
            }
        }
        ctx.restore();

        // Visual slash & impact effects
        // const impactPhase = (unit.attackAnimTimer * 10) % (Math.PI * 2);
        // const impactMoment = Math.sin(impactPhase) > 0.85;
        // if (!hasCustomRenderer) {
        //     ctx.save();
        //     renderAttackEffects(unit, ctx, totalBob, impactPhase, impactMoment);
        //     ctx.restore();
        // }

        // // Impact flash for melee units (skip heroes with custom renderers)
        // if (impactMoment && !isRangedType(unit.type) && !hasCustomRenderer) {
        //     ctx.save();
        //     ctx.globalAlpha = 0.7;
        //     ctx.fillStyle = '#fff';
        //     ctx.beginPath(); ctx.arc(6, -3 + totalBob, 5, 0, Math.PI * 2); ctx.fill();
        //     ctx.globalAlpha = 0.3;
        //     ctx.fillStyle = '#ffffaa';
        //     ctx.beginPath(); ctx.arc(6, -3 + totalBob, 10, 0, Math.PI * 2); ctx.fill();
        //     ctx.restore();
        // }
        // // Safety: ensure globalAlpha is reset after attack animations
        // ctx.globalAlpha = 1;
    }

    // Carry indicator (showing the dominant resource)
    if (unit.isCarrying && unit.carriedType) {
        let carryColor = '#888';
        // Use the actual resource node type for correct color
        if (unit.targetResource) {
            switch (unit.targetResource.nodeType) {
                case ResourceNodeType.Tree: carryColor = C.wood; break;
                case ResourceNodeType.GoldMine: carryColor = C.gold; break;
            }
        } else {
            switch (unit.carriedType) {
                case ResourceType.Supplies: carryColor = C.wood; break;
                case ResourceType.Gold: carryColor = C.gold; break;
            }
        }
        ctx.fillStyle = carryColor;
        ctx.fillRect(-8, -2 + totalBob, 5, 8);
    }

    // ❄️ FROZEN VISUAL OVERLAY
    if (unit.frozenTimer > 0) {
        renderFrozenOverlay(unit, ctx, totalBob);
    }

    // 💚 HEALING VISUAL OVERLAY
    if (unit.healingTimer > 0) {
        renderHealingOverlay(unit, ctx, totalBob);
    }

    // 🔸 SLOW VISUAL
    if (unit.slowTimer > 0) {
        const sAlpha = Math.min(unit.slowTimer * 0.6, 0.5);
        ctx.globalAlpha = sAlpha;
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 1.5;
        for (let ci = 0; ci < 3; ci++) {
            const cx = Math.sin(unit.animTimer * 4 + ci * 2.1) * 8;
            const cy = 10 + totalBob + Math.sin(unit.animTimer * 3 + ci) * 2;
            ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    // ❌ HEAL REDUCTION VISUAL
    if (unit.healReductionTimer > 0) {
        const hrAlpha = Math.min(unit.healReductionTimer * 0.5, 0.7);
        ctx.globalAlpha = hrAlpha;
        ctx.fillStyle = '#ff2222';
        const hrY = -26 + totalBob;
        ctx.fillRect(-3, hrY, 6, 2);
        ctx.globalAlpha = 1;
    }

    ctx.restore();

    // Civilization accent ring
    const civAccent = CIVILIZATION_DATA[unit.civilization].accentColor;
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = civAccent;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(x, y + 11, 10, 4, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;

    // Selection ring
    if (unit.selected) {
        ctx.strokeStyle = C.selection;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(x, y + 10, 12, 5, 0, 0, Math.PI * 2); ctx.stroke();

        const civData = CIVILIZATION_DATA[unit.civilization];
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = civData.accentColor;
        ctx.fillText(civData.icon, x, y - 28);
        ctx.textAlign = 'left';
    }

    // HP bar
    if (unit.hp < unit.maxHp || unit.isHero) {
        const barW = unit.isHero ? 26 : 20, barH = 3;
        ctx.fillStyle = C.hpBg;
        ctx.fillRect(x - barW / 2, y - 20, barW, barH);
        const pct = unit.hp / unit.maxHp;
        ctx.fillStyle = pct > 0.5 ? C.hpGreen : pct > 0.25 ? C.hpYellow : C.hpRed;
        ctx.fillRect(x - barW / 2, y - 20, barW * pct, barH);

        if (unit.isHero) {
            const xpBarY = y - 16;
            ctx.fillStyle = '#222';
            ctx.fillRect(x - barW / 2, xpBarY, barW, 2);
            ctx.fillStyle = '#aa88ff';
            ctx.fillRect(x - barW / 2, xpBarY, barW * unit.xpProgress, 2);
        }
    }

    // Hero level badge + buffs + level-up
    if (unit.isHero) {
        ctx.fillStyle = '#ffd700';
        ctx.font = "bold 8px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(`Lv${unit.heroLevel}`, x, y - 23);
        ctx.textAlign = 'left';

        renderHeroBuffAura(unit, ctx, x, y);
        renderHeroLevelUp(unit, ctx, x, y);
        renderHeroAuraRadius(unit, ctx, x, y);
    }

    // Aura buff indicator (non-hero units receiving aura)
    if (unit.auraBuffType && !unit.isHero) {
        renderAuraBuffIndicator(unit, ctx, x, y);
    }

    // State icon
    if (unit.state === UnitState.Gathering) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '10px monospace';
        ctx.fillText('⛏', x + 12, y - 12);
    } else if (unit.state === UnitState.Building) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '10px monospace';
        ctx.fillText('🔨', x + 12, y - 12);
    }
}
