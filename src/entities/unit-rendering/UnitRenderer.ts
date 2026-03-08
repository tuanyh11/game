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
    ResourceType, ResourceNodeType, isRangedType,
} from "../../config/GameConfig";
import type { Unit } from "../Unit";

// Re-export shared types for external consumers
export { CivColors, getCivColors } from "./shared";

// Draw functions — imported from extracted modules
import { drawVillager } from "./draw-villager";
import { drawSpearman } from "./draw-spearman";
import { drawArcher } from "./draw-archer";
import { drawChuKoNu, drawImmortal, drawNinja, drawCenturion, drawUlfhednar } from "./draw-elites";
import { drawScout, drawSwordsman } from "./draw-dispatchers";
import { drawKnight, drawHero, getCivHeroVisuals } from "./draw-knight-hero";
import { drawTargetDummy } from "./draw-dummy";

// Effects
import { renderAttackWeapon, renderAttackEffects } from "./effects/AttackEffects";
import { renderFrozenOverlay, renderHealingOverlay, renderHeroBuffAura, renderHeroLevelUp } from "./effects/StatusOverlays";

// ============================================================
//  renderUnit — COMPLETE unit rendering pipeline
//  Extracted from Unit.render() for separation of concerns
//  Handles: shadow, body draw, tool/attack anims, overlays,
//           selection, HP bars, hero effects, status icons
// ============================================================
export function renderUnit(unit: Unit, ctx: CanvasRenderingContext2D): void {
    const x = Math.round(unit.x), y = Math.round(unit.y);
    const flip = unit.facingRight ? 1 : -1;
    const age = unit.age;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flip, 1);

    // Walking bob
    const isMoving = unit.state === UnitState.Moving || unit.state === UnitState.Returning;
    const bob = isMoving ? Math.sin(unit.animTimer * 18) * 2 : 0;

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

    // Main shadow (darker center, lighter edge)
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(shadowOffX, shadowOffY, shadowBaseW * shadowScale, shadowBaseH * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    // Softer outer shadow ring
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath();
    ctx.ellipse(shadowOffX, shadowOffY, (shadowBaseW + 3) * shadowScale, (shadowBaseH + 1.5) * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

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
    if (unit.isStealthed && unit.type === UnitType.Ninja) {
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#4400aa';
        ctx.fillRect(-6, -16 + totalBob, 12, 28);
        ctx.fillStyle = '#8800ff';
        ctx.fillRect(-4, -12 + totalBob, 8, 20);
    }

    // Draw unit body
    if (unit.isVillager) {
        drawVillager(unit, ctx, age, totalBob, isMoving);
    } else {
        switch (unit.type) {
            case UnitType.Spearman: drawSpearman(unit, ctx, age, totalBob, isMoving); break;
            case UnitType.Archer: drawArcher(unit, ctx, age, totalBob, isMoving); break;
            case UnitType.Scout: drawScout(unit, ctx, age, totalBob, isMoving); break;
            case UnitType.Swordsman: drawSwordsman(unit, ctx, age, totalBob, isMoving); break;
            case UnitType.Knight: drawKnight(unit, ctx, age, totalBob, isMoving); break;
            case UnitType.Immortal: drawImmortal(unit, ctx, age, totalBob, isMoving); break;
            case UnitType.ChuKoNu: drawChuKoNu(unit, ctx, age, totalBob, isMoving); break;
            case UnitType.Ninja: drawNinja(unit, ctx, age, totalBob, isMoving); break;
            case UnitType.Centurion: drawCenturion(unit, ctx, age, totalBob, isMoving); break;
            case UnitType.Ulfhednar: drawUlfhednar(unit, ctx, age, totalBob, isMoving); break;
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
                    case ResourceNodeType.StoneMine:
                        ctx.fillStyle = '#8B5E3C';
                        ctx.fillRect(0, -12, 2, 14);
                        ctx.fillStyle = age >= 3 ? '#aaa' : '#999';
                        ctx.fillRect(-5, -14, 10, 3);
                        ctx.fillRect(-5, -14, 2, 5);
                        break;
                    case ResourceNodeType.BerryBush:
                    case ResourceNodeType.Farm:
                        ctx.fillStyle = '#c9a84c';
                        ctx.fillRect(-2, -4, 6, 6);
                        break;
                }
            }
        }
        ctx.restore();
    }

    // ---- ATTACK ANIMATION (military units) ----
    let isInAttackRange = false;
    if (unit.state === UnitState.Attacking && !unit.isVillager) {
        if (unit.attackTarget && unit.attackTarget.alive) {
            const td = Math.hypot(unit.attackTarget.x - unit.x, unit.attackTarget.y - unit.y);
            isInAttackRange = td <= unit.civRange;
        } else if (unit.attackBuildingTarget && unit.attackBuildingTarget.alive) {
            const bd = Math.hypot(unit.attackBuildingTarget.x - unit.x, unit.attackBuildingTarget.y - unit.y);
            isInAttackRange = bd <= unit.civRange + unit.attackBuildingTarget.tileW * TILE_SIZE * 0.4;
        }
    }
    if (isInAttackRange) {
        const swingT = unit.attackAnimTimer;
        const swingCycle = Math.sin(swingT * 10);
        const swingPhase = (swingT * 10) % (Math.PI * 2);

        ctx.save();
        renderAttackWeapon(unit, ctx, totalBob, swingCycle, swingPhase);
        ctx.restore();

        // Visual slash & impact effects
        const impactPhase = (unit.attackAnimTimer * 10) % (Math.PI * 2);
        const impactMoment = Math.sin(impactPhase) > 0.85;
        ctx.save();
        renderAttackEffects(unit, ctx, totalBob, impactPhase, impactMoment);
        ctx.restore();

        // Impact flash for melee units
        if (impactMoment && !isRangedType(unit.type)) {
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(6, -3 + totalBob, 5, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#ffffaa';
            ctx.beginPath(); ctx.arc(6, -3 + totalBob, 10, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
        // Safety: ensure globalAlpha is reset after attack animations
        ctx.globalAlpha = 1;
    }

    // Carry indicator
    if (unit.isCarrying && unit.carriedType) {
        let carryColor = '#888';
        switch (unit.carriedType) {
            case ResourceType.Food: carryColor = C.food; break;
            case ResourceType.Wood: carryColor = C.wood; break;
            case ResourceType.Gold: carryColor = C.gold; break;
            case ResourceType.Stone: carryColor = C.stone; break;
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
