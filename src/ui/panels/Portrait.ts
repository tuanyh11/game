// ============================================================
//  Portrait & Info Panel — Unit, Building, Resource portraits
//  Japan Zen redesign: clean lines, ink-brush frames, subtle tones
// ============================================================

import {
    C, TILE_SIZE, UnitType, UNIT_DATA, ResourceType, UnitState,
    CIVILIZATION_DATA, CIV_UNIT_MODIFIERS, isCivElite, CIV_ELITE_UNIT, CivilizationType,
    ResourceNodeType, GATHER_RATES, BuildingType, UpgradeType, UPGRADE_DATA,
    TOWER_ATTACK_DATA,
    TowerUpgradeType, TOWER_UPGRADE_DATA,
} from "../../config/GameConfig";
import { t } from '../../i18n/i18n';
import { SelectionSystem } from "../../systems/SelectionSystem";
import { PlayerState } from "../../systems/PlayerState";
import type { ResourceNode } from "../../entities/ResourceNode";
import type { Building } from "../../entities/Building";
import { drawTownCenter } from "../../entities/building-rendering/DrawTownCenter";
import { drawHouse } from "../../entities/building-rendering/DrawHouse";
import { drawBarracks } from "../../entities/building-rendering/DrawBarracks";
import { drawCamp } from "../../entities/building-rendering/DrawCamp";
import { drawStable } from "../../entities/building-rendering/DrawStable";
import { drawTower } from "../../entities/building-rendering/DrawTower";
import { drawHeroAltar } from "../../entities/building-rendering/DrawHeroAltar";
import { drawBlacksmith } from "../../entities/building-rendering/DrawBlacksmith";
import { drawGovernmentCenter } from "../../entities/building-rendering/DrawGovernmentCenter";
import { drawWall } from "../../entities/building-rendering/draw-wall";
import { drawArmory } from "../../entities/building-rendering/DrawArmory";
import { renderUnit } from "../../entities/unit-rendering/UnitRenderer";
import { HERO_XP_TABLE } from "../../entities/Unit";
import { UI_LAYOUT, IS_IOS } from "../../config/PlatformConfig";

type DrawStatBarFn = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, pct: number, color: string, label: string) => void;

// ── ZEN CONSTANTS ──
const ZEN = {
    // Portrait
    portraitSize: UI_LAYOUT.portraitSize,
    barWidth: UI_LAYOUT.barWidth,
    // Typography
    titleFont: "600 14px 'Noto Serif JP', 'Inter', serif",
    subtitleFont: "11px 'Inter', sans-serif",
    bodyFont: "11px 'Inter', sans-serif",
    smallFont: "10px 'Inter', sans-serif",
    tinyFont: "9px 'Inter', sans-serif",
    // Colors
    title: '#e8d4a0',          // warm parchment
    subtitle: '#9ca3af',       // muted grey
    text: '#d4d4d8',           // soft white
    textDim: '#71717a',        // dim
    accent: '#c2185b',         // crimson accent
    gold: '#d4af37',           // soft gold
    separator: 'rgba(194,24,91,0.15)', // crimson separator
    frameBorder: 'rgba(255,255,255,0.06)',
    frameBg: '#0f0e12',
    frameGlow: 'rgba(194,24,91,0.08)',
    // Stat bar
    hpGreen: '#4ade80',
    hpRed: '#ef4444',
    xpPurple: '#a78bfa',
};

// ── ZEN HELPERS ──

/** Draw a subtle Zen-style ink-brush portrait frame */
function drawZenFrame(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    // Outer subtle glow
    ctx.fillStyle = ZEN.frameGlow;
    ctx.fillRect(x - 3, y - 3, size + 6, size + 6);
    // Border
    ctx.fillStyle = ZEN.frameBorder;
    ctx.fillRect(x - 1, y - 1, size + 2, size + 2);
    // Inner fill
    ctx.fillStyle = ZEN.frameBg;
    ctx.fillRect(x, y, size, size);
    // Top crimson accent line
    ctx.fillStyle = ZEN.accent;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(x, y, size, 1);
    ctx.globalAlpha = 1.0;
}

/** Draw a subtle horizontal separator */
function drawZenSeparator(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
    const grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, 'rgba(194,24,91,0)');
    grad.addColorStop(0.3, ZEN.separator);
    grad.addColorStop(0.7, ZEN.separator);
    grad.addColorStop(1, 'rgba(194,24,91,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, 1);
}

/** Draw a Zen stat bar with rounded feel */
function drawZenBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, pct: number, color: string, label: string): void {
    // Background
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(x, y, w, h);
    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, w, h);
    // Fill
    const fillW = (w - 1) * Math.max(0, Math.min(1, pct));
    if (fillW > 0) {
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, color);
        grad.addColorStop(1, adjustBrightness(color, 0.7));
        ctx.fillStyle = grad;
        ctx.fillRect(x + 0.5, y + 0.5, fillW, h - 1);
        // Subtle highlight
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x + 0.5, y + 0.5, fillW, Math.floor(h / 2));
    }
    // Label
    if (label) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${h <= 8 ? 7 : 8}px 'Inter', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(label, x + w / 2, y + h - (h <= 8 ? 1 : 2));
        ctx.textAlign = 'left';
    }
}

function adjustBrightness(hex: string, factor: number): string {
    const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!m) return hex;
    const r = Math.round(parseInt(m[1], 16) * factor);
    const g = Math.round(parseInt(m[2], 16) * factor);
    const b = Math.round(parseInt(m[3], 16) * factor);
    return `rgb(${r},${g},${b})`;
}

// ============================================================
//  UNIT PORTRAIT
// ============================================================

export function renderUnitPortrait(
    ctx: CanvasRenderingContext2D, px: number, py: number, sel: SelectionSystem,
    drawStatBar: DrawStatBarFn, renderMultiUnitGrid: (ctx: CanvasRenderingContext2D, px: number, py: number, count: number, sel: SelectionSystem) => void,
    isEnemy: (team: number) => boolean = (t) => t !== sel.playerTeam,
): void {
    const u = sel.selectedUnits[0];
    const count = sel.selectedUnits.length;
    const ps = ZEN.portraitSize;

    // ── Portrait frame ──
    drawZenFrame(ctx, px, py, ps);

    // Unit icon — render actual in-game unit art inside portrait frame
    ctx.save();
    ctx.beginPath();
    ctx.rect(px + 2, py + 2, ps - 4, ps - 4);
    ctx.clip();

    // Dark background
    ctx.fillStyle = '#1a1510';
    ctx.fillRect(px + 2, py + 2, ps - 4, ps - 4);

    // Temporarily position unit at origin, translate canvas to portrait center
    const savedRenderX = u.renderX;
    const savedRenderY = u.renderY;
    u.renderX = 0;
    u.renderY = 0;

    const cx = px + ps / 2;
    const cy = py + ps / 2 + 4;
    ctx.translate(cx, cy);
    ctx.scale(2, 2); // Scale up for visibility in portrait
    ctx.translate(-cx, -cy);
    ctx.translate(cx, cy);

    // Draw the unit (renderUnit translates to renderX/renderY internally)
    renderUnit(u, ctx);

    // Restore unit position
    u.renderX = savedRenderX;
    u.renderY = savedRenderY;
    ctx.restore();

    // Selection count badge
    if (count > 1) {
        ctx.fillStyle = ZEN.accent;
        ctx.fillRect(px + ps - 20, py + 2, 18, 14);
        ctx.fillStyle = '#fff';
        ctx.font = "bold 9px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(`×${count}`, px + ps - 11, py + 12);
        ctx.textAlign = 'left';
    }

    // ── Info to the right ──
    const infoX = px + ps + 10;
    let infoY = py + 2;

    if (IS_IOS) {
        // ── iOS ULTRA-COMPACT LAYOUT (50px panel) ──
        const infoX = px + ps + 6;
        let infoY = py;

        // Row 1: Name + HP text
        ctx.fillStyle = ZEN.title;
        ctx.font = "bold 9px 'Inter', sans-serif";
        ctx.fillText(u.name, infoX, infoY + 8);
        ctx.fillStyle = ZEN.text;
        ctx.font = "8px 'Inter', sans-serif";
        ctx.fillText(`${u.hp}/${u.maxHp}`, infoX + ctx.measureText(u.name).width + 4, infoY + 8);
        infoY += 11;

        // Row 2: HP bar (thin)
        drawZenBar(ctx, infoX, infoY, ZEN.barWidth, 5, u.hp / u.maxHp, ZEN.hpGreen, '');
        infoY += 8;

        // Row 3: Stats
        ctx.fillStyle = ZEN.textDim;
        ctx.font = "7px 'Inter', sans-serif";
        const armor = u.armor > 0 ? ` D${u.armor}` : '';
        const range = u.data.range > 30 ? ` R${Math.round(u.data.range / TILE_SIZE)}` : '';
        ctx.fillText(`A${u.attack} S${u.speed}${armor}${range}`, infoX, infoY + 6);
    } else {
        // ── DESKTOP FULL LAYOUT ──
        // Name (italic serif)
        ctx.fillStyle = ZEN.title;
        ctx.font = ZEN.titleFont;
        ctx.fillText(u.name, infoX, infoY + 13);
        infoY += 17;

        // Civilization
        const civData = CIVILIZATION_DATA[u.civilization];
        ctx.fillStyle = civData.accentColor;
        ctx.font = ZEN.subtitleFont;
        ctx.fillText(`${civData.icon} ${civData.name}`, infoX, infoY + 9);
        infoY += 14;

        // Enemy/Ally tag (inline)
        if (isEnemy(u.team)) {
            ctx.fillStyle = '#ef4444';
            ctx.font = `bold ${ZEN.subtitleFont}`;
            ctx.fillText(`  ${t('unit.enemy')}`, infoX + ctx.measureText(`${civData.icon} ${civData.name}`).width + 4, infoY - 5);
        } else if (u.team !== sel.playerTeam) {
            ctx.fillStyle = '#60a5fa';
            ctx.font = `bold ${ZEN.subtitleFont}`;
            ctx.fillText(`  ${t('unit.ally')}`, infoX + ctx.measureText(`${civData.icon} ${civData.name}`).width + 4, infoY - 5);
        }

        // Separator
        drawZenSeparator(ctx, infoX, infoY + 2, ZEN.barWidth);
        infoY += 8;

        // HP bar (zen style)
        drawZenBar(ctx, infoX, infoY, ZEN.barWidth, 10, u.hp / u.maxHp, ZEN.hpGreen, `${u.hp}/${u.maxHp}`);
        infoY += 16;

        // Stats — compact row
        ctx.fillStyle = ZEN.text;
        ctx.font = ZEN.bodyFont;
        const armorStr = u.armor > 0 ? `  🛡${u.armor}` : '';
        const rangeStr = u.data.range > 30 ? `  🎯${Math.round(u.data.range / TILE_SIZE)}` : '';
        ctx.fillText(`⚔${u.attack}  🏃${u.speed}${armorStr}${rangeStr}`, infoX, infoY + 9);
        infoY += 15;
    }

    // Hero Level & XP (desktop only — iOS handles this above)
    if (u.isHero && !IS_IOS) {
        ctx.fillStyle = ZEN.gold;
        ctx.font = `bold ${ZEN.bodyFont}`;
        ctx.fillText(`⭐ ${t('unit.level')} ${u.heroLevel}`, infoX, infoY + 9);
        infoY += 14;

        // XP bar
        const xpLabel = u.heroLevel >= 9 ? 'MAX' : `${u.heroXp}/${u.heroLevel < 9 ? HERO_XP_TABLE[u.heroLevel + 1] : '∞'}`;
        drawZenBar(ctx, infoX, infoY, ZEN.barWidth, 7, u.xpProgress, ZEN.xpPurple, xpLabel);
        infoY += 12;

        // Skills
        const skills = u.heroSkills;
        for (let i = 0; i < skills.length; i++) {
            const skill = skills[i];
            const unlocked = u.heroLevel >= skill.unlockLevel;
            const onCooldown = u.heroSkillCooldowns[i] > 0;
            const isActive = u.heroSkillActive[i] > 0;

            if (!unlocked) {
                ctx.fillStyle = ZEN.textDim;
                ctx.font = ZEN.tinyFont;
                ctx.fillText(`🔒 Lv${skill.unlockLevel}: ${skill.name}`, infoX, infoY + 9);
            } else {
                const statusColor = isActive ? '#4ade80' : (onCooldown ? '#71717a' : ZEN.gold);
                ctx.fillStyle = statusColor;
                ctx.font = `bold ${ZEN.tinyFont}`;
                let statusStr = skill.icon + ' ' + skill.name;
                if (isActive) statusStr += ` (${Math.ceil(u.heroSkillActive[i])}s)`;
                else if (onCooldown) statusStr += ` (${Math.ceil(u.heroSkillCooldowns[i])}s)`;
                else statusStr += ' ✓';
                ctx.fillText(statusStr, infoX, infoY + 9);
            }
            infoY += 12;
        }
    } else {
        // Upgrade stars
        if (!u.isVillager && u.upgradeLevel > 0) {
            ctx.fillStyle = ZEN.gold;
            ctx.font = ZEN.smallFont;
            ctx.fillText(`${'★'.repeat(u.upgradeLevel)} ${t('unit.level')} ${u.upgradeLevel}`, infoX, infoY + 9);
            infoY += 13;
        }

        // Passive skill
        if (!u.isVillager) {
            const skillInfo = getUnitSkillInfo(u.type, u.civilization);
            if (skillInfo) {
                ctx.fillStyle = ZEN.gold;
                ctx.font = `bold ${ZEN.tinyFont}`;
                ctx.fillText(`${skillInfo.icon} ${skillInfo.name}`, infoX, infoY + 9);
                infoY += 12;
                ctx.fillStyle = ZEN.textDim;
                ctx.font = ZEN.tinyFont;
                ctx.fillText(skillInfo.desc, infoX, infoY + 8);
                infoY += 11;
                if (skillInfo.desc2) {
                    ctx.fillText(skillInfo.desc2, infoX, infoY + 8);
                    infoY += 11;
                }
            }
        }
    }

    // Carrying info
    if (u.isCarrying) {
        let carriedText = '';
        for (const [typeStr, amount] of Object.entries(u.carriedResources)) {
            if (amount && amount > 0) {
                const type = typeStr as ResourceType;
                let resIcon = '📦';
                switch (type) {
                    case ResourceType.Supplies: resIcon = '📦'; break;
                    case ResourceType.Gold: resIcon = '🪙'; break;
                }
                carriedText += `${resIcon}${Math.floor(amount)} `;
            }
        }
        if (carriedText !== '') {
            drawZenSeparator(ctx, infoX, infoY, ZEN.barWidth);
            infoY += 5;
            ctx.fillStyle = ZEN.gold;
            ctx.font = ZEN.smallFont;
            ctx.fillText(carriedText.trim(), infoX, infoY + 9);
            infoY += 14;
        }
    }

    // State (own units only)
    const stateLabels: Record<number, string> = {
        [UnitState.Idle]: t('state.idle'),
        [UnitState.Moving]: t('state.moving'),
        [UnitState.Gathering]: t('state.gathering'),
        [UnitState.Returning]: t('state.returning'),
        [UnitState.Building]: t('state.building'),
        [UnitState.Attacking]: t('state.attacking'),
    };
    if (u.team === sel.playerTeam) {
        ctx.fillStyle = ZEN.textDim;
        ctx.font = ZEN.tinyFont;
        ctx.fillText(stateLabels[u.state] ?? '', infoX, infoY + 9);
    }

    // Multi-unit grid
    if (count > 1) {
        renderMultiUnitGrid(ctx, px, py + ps + 8, count, sel);
    }
}

// ============================================================
//  BUILDING PORTRAIT
// ============================================================

export function renderBuildingPortrait(
    ctx: CanvasRenderingContext2D, px: number, py: number, sel: SelectionSystem,
    drawStatBar: DrawStatBarFn, playerState?: PlayerState,
    isEnemy: (team: number) => boolean = (t) => t !== sel.playerTeam,
): void {
    const b = sel.selectedBuilding!;
    const ps = ZEN.portraitSize;

    // ── Portrait frame ──
    drawZenFrame(ctx, px, py, ps);

    // Building icon — draw actual building art inside portrait frame
    ctx.save();
    ctx.beginPath();
    ctx.rect(px + 2, py + 2, ps - 4, ps - 4);
    ctx.clip();

    // Dark background for the portrait
    ctx.fillStyle = '#1a1510';
    ctx.fillRect(px + 2, py + 2, ps - 4, ps - 4);

    // Draw the actual building type, scaled to fit portrait
    const bldW = b.tileW * TILE_SIZE;
    const bldH = b.tileH * TILE_SIZE;
    const scale = Math.min((ps - 12) / bldW, (ps - 12) / bldH);
    const drawW = bldW * scale;
    const drawH = bldH * scale;
    const drawX = px + (ps - drawW) / 2;
    const drawY = py + (ps - drawH) / 2 + 2;

    drawBuildingPortrait(b, ctx, drawX, drawY, drawW, drawH);

    ctx.restore();

    // Civ icon badge (bottom-left corner of portrait)
    if (!IS_IOS) {
        const bldCivData = CIVILIZATION_DATA[b.civilization];
        ctx.fillStyle = 'rgba(10,8,6,0.85)';
        ctx.fillRect(px + 1, py + ps - 16, 18, 15);
        ctx.fillStyle = bldCivData.accentColor;
        ctx.font = '12px sans-serif';
        ctx.fillText(bldCivData.icon, px + 3, py + ps - 4);
    }

    // Age badge (bottom-right corner of portrait)
    if (b.age >= 1 && !IS_IOS) {
        const ageRoman = ['I', 'II', 'III', 'IV'];
        const ageColors = ['#a1a1aa', '#60a5fa', '#a78bfa', '#fbbf24'];
        const ageText = ageRoman[b.age - 1] || `${b.age}`;
        ctx.font = "bold 9px 'Inter', sans-serif";
        const ageW = ctx.measureText(ageText).width + 6;
        ctx.fillStyle = 'rgba(10,8,6,0.85)';
        ctx.fillRect(px + ps - ageW - 1, py + ps - 14, ageW, 13);
        ctx.fillStyle = ageColors[b.age - 1] || '#a1a1aa';
        ctx.fillText(ageText, px + ps - ageW + 2, py + ps - 4);
    }

    const infoX = px + ps + 10;
    let infoY = py + 2;

    if (IS_IOS) {
        // ── iOS ULTRA-COMPACT BUILDING LAYOUT (50px panel) ──
        const infoX = px + ps + 6;
        let infoY = py;

        // Row 1: Name + HP text
        const nameColor = b.team === sel.playerTeam ? ZEN.title : (isEnemy(b.team) ? '#fca5a5' : '#93c5fd');
        ctx.fillStyle = nameColor;
        ctx.font = "bold 9px 'Inter', sans-serif";
        ctx.fillText(b.name, infoX, infoY + 8);
        ctx.fillStyle = ZEN.text;
        ctx.font = "8px 'Inter', sans-serif";
        ctx.fillText(`${b.hp}/${b.maxHp}`, infoX + ctx.measureText(b.name).width + 4, infoY + 8);
        infoY += 11;

        // Row 2: HP bar
        const hpColor = b.team === sel.playerTeam ? ZEN.hpGreen : (isEnemy(b.team) ? '#ef4444' : '#60a5fa');
        drawZenBar(ctx, infoX, infoY, ZEN.barWidth, 5, b.hp / b.maxHp, hpColor, '');
        infoY += 8;

        // Row 3: Training % or tower stats
        if (b.team === sel.playerTeam && b.trainQueue.length > 0) {
            const pct = Math.floor(b.trainProgress * 100);
            drawZenBar(ctx, infoX, infoY, ZEN.barWidth, 4, b.trainProgress, ZEN.accent, `${pct}%`);
        } else if (b.type === BuildingType.Tower && b.built) {
            if (b.isTowerUpgrading) {
                const pct = Math.floor((b.towerUpgradeProgress / b.towerUpgradeTime) * 100);
                drawZenBar(ctx, infoX, infoY, ZEN.barWidth, 4, b.towerUpgradeProgress / b.towerUpgradeTime, '#fb923c', `${pct}%`);
            } else {
                const stats = b.getTowerStats();
                if (stats.damage > 0) {
                    ctx.fillStyle = ZEN.textDim;
                    ctx.font = "7px 'Inter', sans-serif";
                    const upgData = TOWER_UPGRADE_DATA[b.towerUpgrade];
                    const prefix = b.towerUpgrade !== TowerUpgradeType.None ? upgData.icon : '';
                    ctx.fillText(`${prefix}A${stats.damage} R${Math.round(stats.range / TILE_SIZE)}`, infoX, infoY + 6);
                }
            }
        }
    } else {
        // ── DESKTOP FULL BUILDING LAYOUT ──
        // Name + Enemy/Ally tag on the same line
        const nameColor = b.team === sel.playerTeam ? ZEN.title : (isEnemy(b.team) ? '#fca5a5' : '#93c5fd');
        ctx.fillStyle = nameColor;
        ctx.font = ZEN.titleFont;
        ctx.fillText(b.name, infoX, infoY + 13);

        // Enemy/Ally indicator (same line, after name)
        if (b.team !== sel.playerTeam) {
            const nameW = ctx.measureText(b.name).width;
            ctx.font = `bold ${ZEN.subtitleFont}`;
            if (isEnemy(b.team)) {
                ctx.fillStyle = '#ef4444';
                ctx.fillText(t('unit.enemy'), infoX + nameW + 8, infoY + 13);
            } else {
                ctx.fillStyle = '#60a5fa';
                ctx.fillText(t('unit.ally'), infoX + nameW + 8, infoY + 13);
            }
        }
        infoY += 17;

        // Separator
        drawZenSeparator(ctx, infoX, infoY + 1, ZEN.barWidth);
        infoY += 6;

        // HP bar
        const hpColor = b.team === sel.playerTeam ? ZEN.hpGreen : (isEnemy(b.team) ? '#ef4444' : '#60a5fa');
        drawZenBar(ctx, infoX, infoY, ZEN.barWidth, 10, b.hp / b.maxHp, hpColor, `${b.hp}/${b.maxHp}`);
        infoY += 16;

        // Tower combat stats
        if (b.type === BuildingType.Tower && b.built) {
            if (b.isTowerUpgrading) {
                // Upgrade progress bar
                const upgData = TOWER_UPGRADE_DATA[b.towerUpgrade];
                ctx.fillStyle = '#fb923c';
                ctx.font = `bold ${ZEN.bodyFont}`;
                ctx.fillText(`${upgData.icon} ${upgData.name}`, infoX, infoY + 9);
                infoY += 14;
                const pct = b.towerUpgradeProgress / b.towerUpgradeTime;
                drawZenBar(ctx, infoX, infoY, ZEN.barWidth, 8, pct, '#fb923c', `${Math.floor(pct * 100)}%`);
                infoY += 14;
            } else {
                const stats = b.getTowerStats();
                if (stats.damage > 0) {
                    // Show upgrade name if upgraded
                    if (b.towerUpgrade !== TowerUpgradeType.None) {
                        const upgData = TOWER_UPGRADE_DATA[b.towerUpgrade];
                        ctx.fillStyle = b.towerUpgrade === TowerUpgradeType.Fire ? '#ff6600'
                            : b.towerUpgrade === TowerUpgradeType.Ice ? '#88ccff'
                            : '#ffaa00';
                        ctx.font = `bold ${ZEN.bodyFont}`;
                        ctx.fillText(`${upgData.icon} ${upgData.name}`, infoX, infoY + 9);
                        infoY += 14;
                    }
                    ctx.fillStyle = ZEN.text;
                    ctx.font = ZEN.bodyFont;
                    const rangeTiles = Math.round(stats.range / TILE_SIZE);
                    ctx.fillText(`⚔${stats.damage}  🎯${rangeTiles}  🏹×${stats.arrowCount}`, infoX, infoY + 9);
                    infoY += 14;
                    ctx.fillStyle = ZEN.textDim;
                    ctx.font = ZEN.smallFont;
                    ctx.fillText(`⏱ ${stats.attackSpeed.toFixed(1)}s`, infoX, infoY + 9);
                    infoY += 12;
                    // Show special bonuses
                    if (stats.splashRadius > 0) {
                        ctx.fillStyle = '#fb923c';
                        ctx.font = `bold ${ZEN.smallFont}`;
                        ctx.fillText(`💥 Splash ${Math.round(stats.splashRadius / TILE_SIZE)} tiles`, infoX, infoY + 9);
                        infoY += 12;
                    }
                    if (stats.slowPct > 0) {
                        ctx.fillStyle = '#88ccff';
                        ctx.font = `bold ${ZEN.smallFont}`;
                        ctx.fillText(`❄️ Slow ${Math.round(stats.slowPct * 100)}% (${stats.slowDuration}s)`, infoX, infoY + 9);
                        infoY += 12;
                    }
                    if (b.age >= 4 && b.towerUpgrade === TowerUpgradeType.None) {
                        ctx.fillStyle = '#fb923c';
                        ctx.font = `bold ${ZEN.smallFont}`;
                        ctx.fillText(t('unit.fireArrow'), infoX, infoY + 9);
                        infoY += 12;
                    }
                    if (b.towerTarget && b.towerTarget.alive) {
                        ctx.fillStyle = '#f87171';
                        ctx.font = ZEN.smallFont;
                        ctx.fillText(`🎯 ${b.towerTarget.name}`, infoX, infoY + 9);
                        infoY += 12;
                    } else {
                        ctx.fillStyle = ZEN.textDim;
                        ctx.font = ZEN.smallFont;
                        ctx.fillText(t('unit.patrolling'), infoX, infoY + 9);
                        infoY += 12;
                    }
                }
            }
        }
    }

    // Training queue
    if (b.team === sel.playerTeam && b.trainQueue.length > 0) {
        drawZenSeparator(ctx, infoX, infoY, ZEN.barWidth);
        infoY += 6;

        const item = b.trainQueue[0];
        const ud = UNIT_DATA[item.unitType];

        // Training label (clipped)
        const maxTextW = 140;
        ctx.save();
        ctx.beginPath();
        ctx.rect(infoX - 2, infoY, maxTextW + 4, 14);
        ctx.clip();
        ctx.fillStyle = ZEN.gold;
        ctx.font = `bold ${ZEN.bodyFont}`;
        ctx.fillText(`⚒ ${ud.name}`, infoX, infoY + 10);
        ctx.restore();
        infoY += 14;

        // Progress bar
        const pct = Math.floor(b.trainProgress * 100);
        drawZenBar(ctx, infoX, infoY, ZEN.barWidth, 7, b.trainProgress, ZEN.accent, `${pct}%`);
        infoY += 12;

        // Queue icon grid
        const queueIconSize = 20;
        const queueGap = 2;
        const maxPerRow = 5;
        const maxShow = Math.min(b.trainQueue.length, 10);
        const queueStartX = infoX;
        const queueStartY = infoY;

        const unitIcon: Partial<Record<UnitType, string>> = {
            [UnitType.Villager]: '👷',
            [UnitType.Spearman]: '🛡',
            [UnitType.Archer]: '🏹',
            [UnitType.Swordsman]: '⚔',
            [UnitType.Scout]: '🐴',
            [UnitType.Knight]: '🗡',
        };

        for (let qi = 0; qi < maxShow; qi++) {
            const qItem = b.trainQueue[qi];
            const row = Math.floor(qi / maxPerRow);
            const col = qi % maxPerRow;
            const qx = queueStartX + col * (queueIconSize + queueGap);
            const qy = queueStartY + row * (queueIconSize + queueGap);

            // Background
            ctx.fillStyle = qi === 0 ? 'rgba(194,24,91,0.08)' : 'rgba(255,255,255,0.02)';
            ctx.fillRect(qx, qy, queueIconSize, queueIconSize);

            // Progress overlay on first item
            if (qi === 0) {
                const prog = qItem.progress / qItem.time;
                ctx.fillStyle = 'rgba(194,24,91,0.2)';
                ctx.fillRect(qx, qy + queueIconSize * (1 - prog), queueIconSize, queueIconSize * prog);
            }

            // Unit icon
            const icon = unitIcon[qItem.unitType] || '⭐';
            ctx.font = "11px sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText(icon, qx + queueIconSize / 2, qy + queueIconSize / 2 + 4);
            ctx.textAlign = 'left';

            // Border
            ctx.strokeStyle = qi === 0 ? ZEN.accent : 'rgba(255,255,255,0.06)';
            ctx.lineWidth = qi === 0 ? 1 : 0.5;
            ctx.strokeRect(qx + 0.5, qy + 0.5, queueIconSize - 1, queueIconSize - 1);

            // Cancel click area
            if ((sel as any)._queueClickAreas) {
                (sel as any)._queueClickAreas.push({
                    x: qx, y: qy, w: queueIconSize, h: queueIconSize,
                    queueIndex: qi, buildingId: b.id,
                });
            }
        }

        // Queue count
        const totalRows = Math.ceil(maxShow / maxPerRow);
        const labelX = queueStartX + Math.min(maxShow, maxPerRow) * (queueIconSize + queueGap) + 3;
        const labelY = queueStartY + (totalRows - 1) * (queueIconSize + queueGap) + queueIconSize / 2 + 3;
        ctx.fillStyle = ZEN.textDim;
        ctx.font = ZEN.tinyFont;
        ctx.fillText(`${b.trainQueue.length}/10`, labelX, labelY);

        infoY += totalRows * (queueIconSize + queueGap) + 4;
    }

    // Age-up progress (own TC)
    if (b.team === sel.playerTeam && b.type === BuildingType.TownCenter && playerState?.isAgingUp) {
        drawZenSeparator(ctx, infoX, infoY, ZEN.barWidth);
        infoY += 6;

        const ageRoman = ['I', 'II', 'III', 'IV'];
        const targetAgeLabel = ageRoman[playerState.ageUpTargetAge - 1] || playerState.ageUpTargetAge;
        const pct = playerState.ageUpPercent;
        const remaining = Math.ceil(playerState.ageUpTime - playerState.ageUpProgress);

        ctx.fillStyle = ZEN.gold;
        ctx.font = `bold ${ZEN.bodyFont}`;
        ctx.fillText(`${t('unit.agingUp')} ${targetAgeLabel}`, infoX, infoY + 9);
        infoY += 14;

        drawZenBar(ctx, infoX, infoY, ZEN.barWidth, 8, pct, '#d4af37', `${Math.floor(pct * 100)}%`);
        infoY += 12;

        ctx.fillStyle = ZEN.textDim;
        ctx.font = ZEN.tinyFont;
        ctx.fillText(`${t('unit.timeRemaining')} ${remaining}s`, infoX, infoY + 9);
        infoY += 14;
    }

    // Research progress
    const research = playerState?.activeResearch;
    const isUpgradeBuilding = b.type === BuildingType.Blacksmith || b.type === BuildingType.Market;
    if (b.team === sel.playerTeam && research && isUpgradeBuilding) {
        const upData = UPGRADE_DATA[research.upgradeType];
        const pct = research.progress / research.time;
        ctx.fillStyle = '#93c5fd';
        ctx.font = ZEN.bodyFont;
        ctx.fillText(`🔬 ${upData.icon} ${upData.name}`, infoX, infoY + 9);
        infoY += 14;
        drawZenBar(ctx, infoX, infoY, ZEN.barWidth, 7, pct, '#60a5fa', `${Math.floor(pct * 100)}%`);
        infoY += 12;
    }

    // Upgrade levels summary
    if (b.team === sel.playerTeam && b.type === BuildingType.Blacksmith) {
        const levels = playerState!.upgrades;
        const milLvl = levels.meleeAttack + levels.rangedAttack + levels.meleeDefense + levels.rangedDefense;
        if (milLvl > 0) {
            ctx.fillStyle = ZEN.textDim;
            ctx.font = ZEN.tinyFont;
            ctx.fillText(`⚔${levels.meleeAttack} 🏹${levels.rangedAttack} 🛡${levels.meleeDefense} 🪖${levels.rangedDefense}`, infoX, infoY + 9);
        }
    }
    if (b.team === sel.playerTeam && b.type === BuildingType.Market) {
        const levels = playerState!.upgrades;
        const ecoLvl = (levels[UpgradeType.GatherSupplies] || 0) + (levels[UpgradeType.GatherGold] || 0) + (levels[UpgradeType.CarryCapacity] || 0) + (levels[UpgradeType.VillagerSpeed] || 0);
        if (ecoLvl > 0) {
            ctx.fillStyle = ZEN.textDim;
            ctx.font = ZEN.tinyFont;
            ctx.fillText(`🌾${levels[UpgradeType.GatherSupplies] || 0} 🪙${levels[UpgradeType.GatherGold] || 0} 📦${levels[UpgradeType.CarryCapacity] || 0} 🏃${levels[UpgradeType.VillagerSpeed] || 0}`, infoX, infoY + 9);
        }
    }
}

// ============================================================
//  SKILL INFO
// ============================================================

/** Get passive skill info for a unit type + civilization */
export function getUnitSkillInfo(type: UnitType, civ: CivilizationType): { icon: string; name: string; desc: string; desc2?: string } | null {
    // Elite units — unique skills
    switch (type) {
        case UnitType.Immortal: return { icon: '❄️', name: t('skill.immortal'), desc: t('skill.immortal.desc'), desc2: t('skill.immortal.desc2') };
        case UnitType.ChuKoNu: return { icon: '⚔', name: t('skill.chukonu'), desc: t('skill.chukonu.desc'), desc2: t('skill.chukonu.desc2') };
        case UnitType.Ninja: return { icon: '💨', name: t('skill.ninja'), desc: t('skill.ninja.desc'), desc2: t('skill.ninja.desc2') };
        case UnitType.Centurion: return { icon: '🛡', name: t('skill.centurion'), desc: t('skill.centurion.desc'), desc2: t('skill.centurion.desc2') };
        case UnitType.Ulfhednar: return { icon: '⚡', name: t('skill.ulfhednar'), desc: t('skill.ulfhednar.desc'), desc2: t('skill.ulfhednar.desc2') };
    }

    // Standard units — per civilization
    const skills: Record<string, { icon: string; name: string; desc: string; desc2?: string }> = {
        [`${CivilizationType.BaTu}_${UnitType.Spearman}`]: { icon: '🛡', name: t('skill.baTu.spearman'), desc: t('skill.baTu.spearman.desc'), desc2: t('skill.baTu.spearman.desc2') },
        [`${CivilizationType.BaTu}_${UnitType.Archer}`]: { icon: '🔥', name: t('skill.baTu.archer'), desc: t('skill.baTu.archer.desc'), desc2: t('skill.baTu.archer.desc2') },
        [`${CivilizationType.BaTu}_${UnitType.Swordsman}`]: { icon: '⚔', name: t('skill.baTu.swordsman'), desc: t('skill.baTu.swordsman.desc') },
        [`${CivilizationType.BaTu}_${UnitType.Knight}`]: { icon: '🐴', name: t('skill.baTu.knight'), desc: t('skill.baTu.knight.desc'), desc2: t('skill.baTu.knight.desc2') },
        [`${CivilizationType.DaiMinh}_${UnitType.Spearman}`]: { icon: '🏯', name: t('skill.daiMinh.spearman'), desc: t('skill.daiMinh.spearman.desc'), desc2: t('skill.daiMinh.spearman.desc2') },
        [`${CivilizationType.DaiMinh}_${UnitType.Archer}`]: { icon: '🎯', name: t('skill.daiMinh.archer'), desc: t('skill.daiMinh.archer.desc'), desc2: t('skill.daiMinh.archer.desc2') },
        [`${CivilizationType.DaiMinh}_${UnitType.Swordsman}`]: { icon: '🥋', name: t('skill.daiMinh.swordsman'), desc: t('skill.daiMinh.swordsman.desc') },
        [`${CivilizationType.DaiMinh}_${UnitType.Knight}`]: { icon: '⚡', name: t('skill.daiMinh.knight'), desc: t('skill.daiMinh.knight.desc'), desc2: t('skill.daiMinh.knight.desc2') },
        [`${CivilizationType.Yamato}_${UnitType.Spearman}`]: { icon: '🔱', name: t('skill.yamato.spearman'), desc: t('skill.yamato.spearman.desc') },
        [`${CivilizationType.Yamato}_${UnitType.Archer}`]: { icon: '🎋', name: t('skill.yamato.archer'), desc: t('skill.yamato.archer.desc'), desc2: t('skill.yamato.archer.desc2') },
        [`${CivilizationType.Yamato}_${UnitType.Swordsman}`]: { icon: '⛩', name: t('skill.yamato.swordsman'), desc: t('skill.yamato.swordsman.desc') },
        [`${CivilizationType.Yamato}_${UnitType.Knight}`]: { icon: '🌸', name: t('skill.yamato.knight'), desc: t('skill.yamato.knight.desc') },
        [`${CivilizationType.LaMa}_${UnitType.Spearman}`]: { icon: '🐢', name: t('skill.laMa.spearman'), desc: t('skill.laMa.spearman.desc') },
        [`${CivilizationType.LaMa}_${UnitType.Archer}`]: { icon: '❄', name: t('skill.laMa.archer'), desc: t('skill.laMa.archer.desc') },
        [`${CivilizationType.LaMa}_${UnitType.Swordsman}`]: { icon: '⚔', name: t('skill.laMa.swordsman'), desc: t('skill.laMa.swordsman.desc') },
        [`${CivilizationType.LaMa}_${UnitType.Knight}`]: { icon: '💥', name: t('skill.laMa.knight'), desc: t('skill.laMa.knight.desc'), desc2: t('skill.laMa.knight.desc2') },
        [`${CivilizationType.Viking}_${UnitType.Spearman}`]: { icon: '💚', name: t('skill.viking.spearman'), desc: t('skill.viking.spearman.desc') },
        [`${CivilizationType.Viking}_${UnitType.Archer}`]: { icon: '❄', name: t('skill.viking.archer'), desc: t('skill.viking.archer.desc') },
        [`${CivilizationType.Viking}_${UnitType.Swordsman}`]: { icon: '🔥', name: t('skill.viking.swordsman'), desc: t('skill.viking.swordsman.desc'), desc2: t('skill.viking.swordsman.desc2') },
        [`${CivilizationType.Viking}_${UnitType.Knight}`]: { icon: '🌀', name: t('skill.viking.knight'), desc: t('skill.viking.knight.desc'), desc2: t('skill.viking.knight.desc2') },
    };

    const key = `${civ}_${type}`;
    return skills[key] || null;
}

// ============================================================
//  RESOURCE PORTRAIT
// ============================================================

export function renderResourcePortrait(
    ctx: CanvasRenderingContext2D, px: number, py: number, res: ResourceNode,
    drawStatBar: DrawStatBarFn,
): void {
    const ps = ZEN.portraitSize;

    // ── Portrait frame ──
    drawZenFrame(ctx, px, py, ps);

    // Resource-specific icon
    const cx = px + ps / 2;
    const cy = py + ps / 2;
    switch (res.nodeType) {
        case ResourceNodeType.GoldMine:
            ctx.fillStyle = '#bba030';
            ctx.fillRect(cx - 16, cy - 7, 32, 22);
            ctx.fillStyle = '#ccc050';
            ctx.fillRect(cx - 12, cy - 11, 24, 7);
            ctx.fillStyle = C.gold;
            ctx.fillRect(cx - 5, cy - 3, 10, 10);
            ctx.fillStyle = '#fff8cc';
            ctx.fillRect(cx - 2, cy, 4, 4);
            break;

        case ResourceNodeType.Tree:
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(cx - 2, cy + 4, 4, 16);
            ctx.fillStyle = '#2a6a18';
            ctx.beginPath();
            ctx.arc(cx, cy - 2, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#3a8a22';
            ctx.beginPath();
            ctx.arc(cx - 3, cy - 5, 8, 0, Math.PI * 2);
            ctx.fill();
            break;

    }

    // ── Info ──
    const infoX = px + ps + 10;
    let infoY = py + 2;

    if (IS_IOS) {
        // ── iOS ULTRA-COMPACT RESOURCE LAYOUT ──
        const infoX = px + ps + 6;
        let infoY = py;

        const nameMap: Record<string, string> = {
            [ResourceNodeType.GoldMine]: t('res.goldMine'),
            [ResourceNodeType.Tree]: t('res.tree'),
        };
        ctx.fillStyle = ZEN.title;
        ctx.font = "bold 9px 'Inter', sans-serif";
        ctx.fillText(nameMap[res.nodeType] ?? t('res.resource'), infoX, infoY + 8);
        infoY += 11;

        // Resource bar
        const pct = res.amount / res.maxAmount;
        const resTypeMap: Record<string, [string, string]> = {
            [ResourceType.Gold]: [t('res.gold'), C.gold],
            [ResourceType.Supplies]: [t('res.supplies') || 'Supplies', C.wood || '#8B5E3C'],
        };
        const [, resColor] = resTypeMap[res.resourceType] ?? [t('res.other'), C.uiText];
        const barColor = pct > 0.5 ? resColor : (pct > 0.25 ? '#fbbf24' : ZEN.hpRed);
        drawZenBar(ctx, infoX, infoY, ZEN.barWidth, 5, pct, barColor, `${Math.floor(res.amount)}/${res.maxAmount}`);
    } else {
        // ── DESKTOP FULL RESOURCE LAYOUT ──
        // Resource name
        const nameMap: Record<string, string> = {
            [ResourceNodeType.GoldMine]: t('res.goldMine'),
            [ResourceNodeType.Tree]: t('res.tree'),
        };
        ctx.fillStyle = ZEN.title;
        ctx.font = ZEN.titleFont;
        ctx.fillText(nameMap[res.nodeType] ?? t('res.resource'), infoX, infoY + 13);
        infoY += 20;

        // Resource type
        const resTypeMap: Record<string, [string, string]> = {
            [ResourceType.Gold]: [t('res.gold'), C.gold],
            [ResourceType.Supplies]: [t('res.supplies') || 'Supplies', C.wood || '#8B5E3C'],
        };
        const [resLabel, resColor] = resTypeMap[res.resourceType] ?? [t('res.other'), C.uiText];
        ctx.fillStyle = resColor;
        ctx.font = ZEN.bodyFont;
        ctx.fillText(resLabel, infoX, infoY + 9);
        infoY += 16;

        // Separator
        drawZenSeparator(ctx, infoX, infoY, ZEN.barWidth);
        infoY += 6;

        // Resource amount bar
        const pct = res.amount / res.maxAmount;
        const barColor = pct > 0.5 ? resColor : (pct > 0.25 ? '#fbbf24' : ZEN.hpRed);
        drawZenBar(ctx, infoX, infoY, ZEN.barWidth, 10, pct, barColor, `${Math.floor(res.amount)}/${res.maxAmount}`);
        infoY += 16;

        // Gather rate
        const gatherInfo = GATHER_RATES[res.nodeType];
        ctx.fillStyle = ZEN.textDim;
        ctx.font = ZEN.smallFont;
        ctx.fillText(`⚡ ${gatherInfo.rate}/s   📦 ${gatherInfo.carry}`, infoX, infoY + 9);
    }
}

// ============================================================
//  MULTI-UNIT GRID
// ============================================================

export function renderMultiUnitGrid(ctx: CanvasRenderingContext2D, px: number, py: number, count: number, sel: SelectionSystem): void {
    const iconSize = 18;
    const gap = 2;
    const maxDraw = Math.min(count, 6);
    const cols = Math.min(maxDraw, 3);
    for (let i = 0; i < maxDraw; i++) {
        const u = sel.selectedUnits[i];
        const col = i % cols, row = Math.floor(i / cols);
        const ix = px + col * (iconSize + gap);
        const iy = py + row * (iconSize + gap);
        // Subtle border
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(ix, iy, iconSize, iconSize);
        const gridCivData = CIVILIZATION_DATA[u.civilization];
        ctx.fillStyle = u.slotColor || gridCivData.secondaryColor;
        ctx.fillRect(ix + 1, iy + 1, iconSize - 2, iconSize - 2);
        // HP indicator
        const hpPct = u.hp / u.maxHp;
        ctx.fillStyle = hpPct > 0.5 ? ZEN.hpGreen : ZEN.hpRed;
        ctx.fillRect(ix + 1, iy + iconSize - 2, (iconSize - 2) * hpPct, 1.5);
    }
}

/** Draw a building's actual art for the portrait panel */
function drawBuildingPortrait(b: Building, ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    switch (b.type) {
        case BuildingType.TownCenter: drawTownCenter(b, ctx, x, y, w, h); break;
        case BuildingType.House: drawHouse(b, ctx, x, y, w, h); break;
        case BuildingType.Wall: {
            // Draw wall as simple colored block for portrait
            ctx.fillStyle = '#8a7a6a';
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = '#a09080';
            ctx.fillRect(x, y, w, 4);
            break;
        }
        case BuildingType.Barracks: drawBarracks(b, ctx, x, y, w, h); break;
        case BuildingType.Market: drawCamp(b, ctx, x, y, w, h, C.gold); break;
        case BuildingType.Stable: drawStable(b, ctx, x, y, w, h); break;
        case BuildingType.Tower: drawTower(b, ctx, x, y, w, h); break;
        case BuildingType.HeroAltar: drawHeroAltar(b, ctx, x, y, w, h); break;
        case BuildingType.Blacksmith: drawBlacksmith(b, ctx, x, y, w, h); break;
        case BuildingType.GovernmentCenter: drawGovernmentCenter(b, ctx, x, y, w, h); break;
        case BuildingType.Armory: drawArmory(b, ctx, x, y, w, h); break;
        default: {
            // Fallback generic building
            ctx.fillStyle = '#6a5a4a';
            ctx.fillRect(x, y, w, h);
            break;
        }
    }
}
