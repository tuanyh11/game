// ============================================================
//  BuildingRenderer — Core rendering pipeline for buildings
//  Delegates to per-building-type draw modules
//  Extracted from Building.ts
// ============================================================

import { BuildingType, C, TILE_SIZE, TOWER_ATTACK_DATA } from "../../config/GameConfig";
import type { Building } from "../Building";
import { darkenColor } from "./BuildingColors";

// Per-building-type draw modules
import { drawTownCenter } from "./DrawTownCenter";
import { drawHouse } from "./DrawHouse";
import { drawBarracks } from "./DrawBarracks";
import { drawCamp } from "./DrawCamp";
import { drawStable } from "./DrawStable";
import { drawTower } from "./DrawTower";
import { drawHeroAltar } from "./DrawHeroAltar";
import { drawBlacksmith } from "./DrawBlacksmith";
import { drawGovernmentCenter } from "./DrawGovernmentCenter";
import { drawWall } from "./draw-wall";
import { drawArmory } from "./DrawArmory";
import { RenderCache } from "../RenderCache";

export function renderBuilding(b: Building, ctx: CanvasRenderingContext2D): void {
    if (!b.alive) return;

    const left = b.tileX * TILE_SIZE, top = b.tileY * TILE_SIZE;
    const w = b.tileW * TILE_SIZE, h = b.tileH * TILE_SIZE;
    const pct = b.constructionPct;

    // Construction state: partially transparent
    if (!b.built) {
        ctx.globalAlpha = 0.3 + 0.7 * pct;
    }

    // Damage flash: red tint when recently hit
    if (b.damageFlashTimer > 0) {
        ctx.globalAlpha = (ctx.globalAlpha ?? 1) * (0.6 + 0.4 * Math.sin(b.damageFlashTimer * 40));
    }

    // ===== RENDER STATIC BASE (CACHED) =====
    if (b.built) {
        const cacheKey = `bldg-${b.type}-${b.civilization}-${b.age}`;
        const pad = Math.max(w * 0.15, h * 0.15, 12); // PADDING for shadow
        const cw = w + pad * 2;
        const ch = h + pad * 2;

        const cachedBldg = RenderCache.get(cacheKey, cw, ch, (oCtx) => {
            oCtx.translate(pad, pad); // Center inside padded bounds

            // Building Shadow
            const shadowOffX = Math.min(w * 0.15, 8);
            const shadowOffY = Math.min(h * 0.08, 5);
            oCtx.fillStyle = `rgba(0,0,0,0.18)`;
            oCtx.fillRect(w, shadowOffY + 4, shadowOffX, h - 4);
            oCtx.fillRect(4, h, w - 4 + shadowOffX, shadowOffY);
            oCtx.fillStyle = `rgba(0,0,0,0.11)`;
            oCtx.fillRect(w, h, shadowOffX, shadowOffY);

            // Ambient occlusion
            oCtx.fillStyle = 'rgba(0,0,0,0.06)';
            oCtx.fillRect(0, h - 4, w, 4);

            // Draw the actual building
            switch (b.type) {
                case BuildingType.TownCenter: drawTownCenter(b, oCtx as CanvasRenderingContext2D, 0, 0, w, h); break;
                case BuildingType.House: drawHouse(b, oCtx as CanvasRenderingContext2D, 0, 0, w, h); break;
                case BuildingType.Wall: drawWall(b, oCtx, 0, 0, w, h); break;
                case BuildingType.Barracks: drawBarracks(b, oCtx as CanvasRenderingContext2D, 0, 0, w, h); break;
                case BuildingType.Market: drawCamp(b, oCtx as CanvasRenderingContext2D, 0, 0, w, h, C.gold); break;
                case BuildingType.Stable: drawStable(b, oCtx as CanvasRenderingContext2D, 0, 0, w, h); break;
                case BuildingType.Tower: drawTower(b, oCtx as CanvasRenderingContext2D, 0, 0, w, h); break;
                case BuildingType.HeroAltar: drawHeroAltar(b, oCtx as CanvasRenderingContext2D, 0, 0, w, h); break;
                case BuildingType.Blacksmith: drawBlacksmith(b, oCtx as CanvasRenderingContext2D, 0, 0, w, h); break;
                case BuildingType.GovernmentCenter: drawGovernmentCenter(b, oCtx as CanvasRenderingContext2D, 0, 0, w, h); break;
                case BuildingType.Armory: drawArmory(b, oCtx as CanvasRenderingContext2D, 0, 0, w, h); break;
            }

            // 3D highlight
            oCtx.fillStyle = 'rgba(255,255,240,0.05)';
            oCtx.fillRect(0, 0, w, 3);
            oCtx.fillRect(0, 0, 3, h);
        });

        // Draw cached building
        ctx.globalAlpha = 1;
        ctx.drawImage(cachedBldg, left - pad, top - pad);
    } else {
        // ===== RENDER DYNAMIC BASE (CONSTRUCTION PHASE) =====
        if (pct > 0.5) {
            const shadowAlpha = 0.18 * pct;
            const shadowOffX = Math.min(w * 0.15, 8);
            const shadowOffY = Math.min(h * 0.08, 5);
            ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
            ctx.fillRect(left + w, top + shadowOffY + 4, shadowOffX, h - 4);
            ctx.fillRect(left + 4, top + h, w - 4 + shadowOffX, shadowOffY);
            ctx.fillStyle = `rgba(0,0,0,${shadowAlpha * 0.6})`;
            ctx.fillRect(left + w, top + h, shadowOffX, shadowOffY);
        }

        switch (b.type) {
            case BuildingType.TownCenter: drawTownCenter(b, ctx, left, top, w, h); break;
            case BuildingType.House: drawHouse(b, ctx, left, top, w, h); break;
            case BuildingType.Wall: drawWall(b, ctx, left, top, w, h); break;
            case BuildingType.Barracks: drawBarracks(b, ctx, left, top, w, h); break;
            case BuildingType.Market: drawCamp(b, ctx, left, top, w, h, C.gold); break;
            case BuildingType.Stable: drawStable(b, ctx, left, top, w, h); break;
            case BuildingType.Tower: drawTower(b, ctx, left, top, w, h); break;
            case BuildingType.HeroAltar: drawHeroAltar(b, ctx, left, top, w, h); break;
            case BuildingType.Blacksmith: drawBlacksmith(b, ctx, left, top, w, h); break;
            case BuildingType.GovernmentCenter: drawGovernmentCenter(b, ctx, left, top, w, h); break;
            case BuildingType.Armory: drawArmory(b, ctx, left, top, w, h); break;
        }
    }

    ctx.globalAlpha = 1;

    // Damage red overlay flash
    if (b.damageFlashTimer > 0) {
        ctx.globalAlpha = b.damageFlashTimer * 4;
        ctx.fillStyle = 'rgba(255, 50, 20, 0.3)';
        ctx.fillRect(left, top, w, h);
        ctx.globalAlpha = 1;
    }

    // Scaffolding overlay (during construction)
    if (!b.built) {
        drawScaffolding(ctx, left, top, w, h, pct);
        drawBuildProgressBar(ctx, left, top, w, pct);
    }

    // HP bar (when damaged or selected)
    if (b.built && (b.hp < b.maxHp || b.selected)) {
        const barW = w * 0.75, barH = 7;
        const barX = left + (w - barW) / 2, barY = top - 14;
        const hpPct = Math.max(0, b.hp / b.maxHp);

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
        ctx.fillStyle = '#1a1510';
        ctx.fillRect(barX, barY, barW, barH);

        const hpColor = hpPct > 0.5 ? C.hpGreen : hpPct > 0.25 ? C.hpYellow : C.hpRed;
        const grad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
        grad.addColorStop(0, hpColor);
        grad.addColorStop(0.5, hpColor);
        grad.addColorStop(1, darkenColor(hpColor, 0.6));
        ctx.fillStyle = grad;
        ctx.fillRect(barX + 1, barY + 1, (barW - 2) * hpPct, barH - 2);

        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(barX + 1, barY + 1, (barW - 2) * hpPct, 2);

        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);

        if (b.hp < b.maxHp || b.selected) {
            ctx.fillStyle = '#fff';
            ctx.font = "bold 7px 'Inter', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText(`${b.hp}/${b.maxHp}`, barX + barW / 2, barY + barH - 1);
            ctx.textAlign = 'left';
        }
    }

    // ===== AGE-UP UPGRADING EFFECT (Town Center) =====
    if (b.isUpgrading && b.built) {
        const t = Date.now() / 1000;
        const pulse = 0.4 + Math.sin(t * 3) * 0.2;

        // Golden glow around TC
        ctx.save();
        ctx.shadowColor = `rgba(255,200,50,${pulse})`;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = `rgba(218,165,32,${pulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(left - 1, top - 1, w + 2, h + 2);
        ctx.restore();

        // Scaffolding overlay (semi-transparent)
        drawScaffolding(ctx, left, top, w, h, b.upgradeProgress);

        // Animated sparkle particles (rising golden dots)
        for (let i = 0; i < 4; i++) {
            const sparklePhase = (t * 1.5 + i * 0.7) % 1;
            const sx = left + 8 + ((i * 37 + Math.floor(t * 2)) % (w - 16));
            const sy = top + h - sparklePhase * (h + 20);
            const sparkleAlpha = sparklePhase < 0.8 ? sparklePhase * 1.2 : (1 - sparklePhase) * 5;
            ctx.fillStyle = `rgba(255,215,0,${Math.min(1, sparkleAlpha * 0.8)})`;
            ctx.fillRect(sx, sy, 3, 3);
            ctx.fillStyle = `rgba(255,255,200,${Math.min(1, sparkleAlpha * 0.5)})`;
            ctx.fillRect(sx + 1, sy - 1, 1, 1);
        }

        // Upgrade progress bar (golden, above building)
        const upBarW = w * 0.8, upBarH = 8;
        const upBarX = left + (w - upBarW) / 2;
        const upBarY = top - 20;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(upBarX - 1, upBarY - 1, upBarW + 2, upBarH + 2);
        ctx.fillStyle = '#1a1508';
        ctx.fillRect(upBarX, upBarY, upBarW, upBarH);

        // Golden fill
        const fillW = (upBarW - 2) * b.upgradeProgress;
        const barGrad = ctx.createLinearGradient(upBarX, upBarY, upBarX, upBarY + upBarH);
        barGrad.addColorStop(0, '#ffd700');
        barGrad.addColorStop(0.5, '#daa520');
        barGrad.addColorStop(1, '#8b6914');
        ctx.fillStyle = barGrad;
        ctx.fillRect(upBarX + 1, upBarY + 1, fillW, upBarH - 2);

        // Highlight
        ctx.fillStyle = 'rgba(255,255,200,0.3)';
        ctx.fillRect(upBarX + 1, upBarY + 1, fillW, 2);

        // Percentage text
        ctx.fillStyle = '#fff';
        ctx.font = "bold 6px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(b.upgradeProgress * 100)}%`, upBarX + upBarW / 2, upBarY + upBarH - 1);
        ctx.textAlign = 'left';

        // Label above bar
        ctx.fillStyle = '#ffd700';
        ctx.font = "bold 7px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText('⬆ LÊN ĐỜI', upBarX + upBarW / 2, upBarY - 3);
        ctx.textAlign = 'left';
    }

    // ===== TRAINING ANIMATION (TC / Barracks / Stable / HeroAltar) =====
    if (b.built && b.trainQueue.length > 0) {
        const now = Date.now() / 1000;
        const prog = b.trainProgress;
        const pulse = 0.25 + Math.sin(now * 4) * 0.15;

        // Pulsing glow around building
        ctx.save();
        const glowColor = b.type === BuildingType.TownCenter
            ? `rgba(100,200,255,${pulse})`   // Blue glow for TC
            : `rgba(255,150,50,${pulse})`;    // Orange glow for military buildings
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8 + prog * 6;
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(left, top, w, h);
        ctx.restore();

        // Rising sparkle dots (unit being "forged")
        for (let i = 0; i < 3; i++) {
            const phase = (now * 1.2 + i * 0.4) % 1;
            const sx = left + w * 0.3 + ((i * 29) % Math.max(1, w * 0.4));
            const sy = top + h - phase * (h * 0.6);
            const sparkAlpha = phase < 0.7 ? phase * 1.0 : (1 - phase) * 3.3;
            const sparkColor = b.type === BuildingType.TownCenter
                ? `rgba(100,200,255,${Math.min(0.8, sparkAlpha)})`
                : `rgba(255,180,80,${Math.min(0.8, sparkAlpha)})`;
            ctx.fillStyle = sparkColor;
            ctx.fillRect(sx, sy, 2, 2);
        }

        // Progress bar below building (compact, near doorway)
        const trainBarW = w * 0.5, trainBarH = 4;
        const trainBarX = left + (w - trainBarW) / 2;
        const trainBarY = top + h + 2;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(trainBarX - 1, trainBarY - 1, trainBarW + 2, trainBarH + 2);
        const trainFillColor = b.type === BuildingType.TownCenter ? '#66ccff' : '#ffaa44';
        ctx.fillStyle = trainFillColor;
        ctx.fillRect(trainBarX, trainBarY, trainBarW * prog, trainBarH);
    }

    // ===== RESEARCH/UPGRADE ANIMATION (Market / Blacksmith / GovernmentCenter) =====
    if (b.built && b.isResearching) {
        const now = Date.now() / 1000;
        const prog = b.researchProgress;
        const pulse = 0.3 + Math.sin(now * 3.5) * 0.15;

        // Pulsing cyan/green glow around building
        ctx.save();
        const resGlow = `rgba(50,200,180,${pulse})`;
        ctx.shadowColor = resGlow;
        ctx.shadowBlur = 10 + prog * 8;
        ctx.strokeStyle = resGlow;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(left - 1, top - 1, w + 2, h + 2);
        ctx.restore();

        // Rising scroll/rune sparkle particles
        for (let i = 0; i < 5; i++) {
            const phase = (now * 1.0 + i * 0.5) % 1;
            const sx = left + 6 + ((i * 31 + Math.floor(now * 1.5)) % Math.max(1, w - 12));
            const sy = top + h - phase * (h + 15);
            const sparkAlpha = phase < 0.7 ? phase * 1.0 : (1 - phase) * 3.3;
            // Alternate cyan and gold sparkles
            const sparkColor = i % 2 === 0
                ? `rgba(50,220,200,${Math.min(0.8, sparkAlpha)})`
                : `rgba(200,180,50,${Math.min(0.6, sparkAlpha)})`;
            ctx.fillStyle = sparkColor;
            ctx.fillRect(sx, sy, 2, 2);
            // Tiny glow dot
            ctx.fillStyle = `rgba(255,255,255,${Math.min(0.4, sparkAlpha * 0.5)})`;
            ctx.fillRect(sx + 0.5, sy - 0.5, 1, 1);
        }

        // Research progress bar (above building)
        const resBarW = w * 0.7, resBarH = 6;
        const resBarX = left + (w - resBarW) / 2;
        const resBarY = top - 18;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(resBarX - 1, resBarY - 1, resBarW + 2, resBarH + 2);
        ctx.fillStyle = '#0a1510';
        ctx.fillRect(resBarX, resBarY, resBarW, resBarH);

        // Cyan/teal fill
        const fillW = (resBarW - 2) * prog;
        const resGrad = ctx.createLinearGradient(resBarX, resBarY, resBarX, resBarY + resBarH);
        resGrad.addColorStop(0, '#40e0c0');
        resGrad.addColorStop(0.5, '#20b090');
        resGrad.addColorStop(1, '#108060');
        ctx.fillStyle = resGrad;
        ctx.fillRect(resBarX + 1, resBarY + 1, fillW, resBarH - 2);

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(resBarX + 1, resBarY + 1, fillW, 2);

        // Percentage text
        ctx.fillStyle = '#fff';
        ctx.font = "bold 6px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(prog * 100)}%`, resBarX + resBarW / 2, resBarY + resBarH - 1);
        ctx.textAlign = 'left';

        // Label
        ctx.fillStyle = '#40e0c0';
        ctx.font = "bold 7px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText('📜 Nghiên cứu', resBarX + resBarW / 2, resBarY - 3);
        ctx.textAlign = 'left';
    }

    // Selection indicator
    if (b.selected) {
        ctx.strokeStyle = C.selection;
        ctx.lineWidth = 2;
        ctx.strokeRect(left - 2, top - 2, w + 4, h + 4);

        // Tower: show attack range circle when selected
        if (b.type === BuildingType.Tower && b.built) {
            const ageIdx = Math.min(b.age, TOWER_ATTACK_DATA.length - 1);
            const stats = TOWER_ATTACK_DATA[ageIdx];
            if (stats.range > 0) {
                const cx = left + w / 2;
                const cy = top + h / 2;
                // Dashed range circle
                ctx.save();
                ctx.setLineDash([6, 4]);
                ctx.strokeStyle = 'rgba(255,170,0,0.35)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(cx, cy, stats.range, 0, Math.PI * 2);
                ctx.stroke();
                // Inner subtle fill
                ctx.fillStyle = 'rgba(255,170,0,0.04)';
                ctx.beginPath();
                ctx.arc(cx, cy, stats.range, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
    }

    // Tower attack animation: arrow trail line from tower to target
    if (b.type === BuildingType.Tower && b.towerAttackAnimTimer > 0) {
        const progress = b.towerAttackAnimTimer / 0.35; // 1 → 0
        const towerCx = left + w / 2;
        const towerCy = top - 20; // tower top
        // Target coords are world coords; ctx already has camera transform applied
        const targetSx = b.towerLastTargetX;
        const targetSy = b.towerLastTargetY;

        const isFireArrow = b.age >= 4;

        ctx.save();
        ctx.globalAlpha = progress * 0.8;

        // Arrow trail line (animated — moves from tower to target)
        const trailProgress = 1 - progress; // 0 → 1 (travels toward target)
        const midX = towerCx + (targetSx - towerCx) * trailProgress;
        const midY = towerCy + (targetSy - towerCy) * trailProgress;
        const tailX = towerCx + (targetSx - towerCx) * Math.max(0, trailProgress - 0.3);
        const tailY = towerCy + (targetSy - towerCy) * Math.max(0, trailProgress - 0.3);

        // Glow line
        ctx.strokeStyle = isFireArrow ? `rgba(255,100,0,${progress * 0.6})` : `rgba(200,168,76,${progress * 0.5})`;
        ctx.lineWidth = isFireArrow ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(midX, midY);
        ctx.stroke();

        // Bright core
        ctx.strokeStyle = isFireArrow ? `rgba(255,200,50,${progress * 0.8})` : `rgba(255,240,200,${progress * 0.7})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(midX, midY);
        ctx.stroke();

        // Arrowhead dot
        ctx.fillStyle = isFireArrow ? '#ffcc00' : '#ffd700';
        ctx.beginPath();
        ctx.arc(midX, midY, isFireArrow ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ---- Scaffolding drawing ----
function drawScaffolding(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, pct: number): void {
    const alpha = 1 - pct;
    ctx.globalAlpha = alpha * 0.8;
    ctx.strokeStyle = '#a08050';
    ctx.lineWidth = 2;

    const poleCount = Math.ceil(w / 50);
    for (let i = 0; i <= poleCount; i++) {
        const px = x + (i / poleCount) * w;
        ctx.beginPath(); ctx.moveTo(px, y + h); ctx.lineTo(px, y); ctx.stroke();
    }

    const barCount = Math.ceil(h / 40);
    for (let i = 0; i <= barCount; i++) {
        const by = y + (i / barCount) * h;
        ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x + w, by); ctx.stroke();
    }

    ctx.strokeStyle = '#806030';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y + h); ctx.lineTo(x + w, y);
    ctx.moveTo(x + w, y + h); ctx.lineTo(x, y);
    ctx.stroke();

    ctx.fillStyle = '#5a4020';
    ctx.fillRect(x, y + h - 6, w, 6);
    ctx.globalAlpha = 1;
}

// ---- Build progress bar ----
function drawBuildProgressBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, pct: number): void {
    const barW = w * 0.8, barH = 8;
    const barX = x + (w - barW) / 2;
    const barY = y - 16;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#1a1510';
    ctx.fillRect(barX, barY, barW, barH);

    const grad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
    grad.addColorStop(0, '#ffcc00');
    grad.addColorStop(0.5, '#ff8800');
    grad.addColorStop(1, '#cc6600');
    ctx.fillStyle = grad;
    ctx.fillRect(barX + 1, barY + 1, (barW - 2) * pct, barH - 2);

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(barX + 1, barY + 1, (barW - 2) * pct, 2);

    ctx.fillStyle = '#fff';
    ctx.font = "bold 7px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(pct * 100)}%`, barX + barW / 2, barY + barH - 1);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#ffd700';
    ctx.font = "bold 8px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('🔨 Đang xây', barX + barW / 2, barY - 3);
    ctx.textAlign = 'left';
}
