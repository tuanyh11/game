// ============================================================
//  Spawn Palette — Free Mode unit spawning interface
//  Extracted from GameUI.ts
// ============================================================

import {
    C, UnitType, UNIT_DATA, CIVILIZATION_DATA, CivilizationType,
    isCivElite, CIV_ELITE_UNIT, BuildingType, ResourceNodeType, BUILDING_DATA,
    isCivCavalry, CIV_UNIQUE_CAVALRY
} from "../../config/GameConfig";
import type { ClickArea } from "./CommandGrid";
import { t } from '../../i18n/i18n';

export const SPAWN_CIVS = [
    CivilizationType.BaTu,
    CivilizationType.DaiMinh,
    CivilizationType.Yamato,
    CivilizationType.LaMa,
    CivilizationType.Viking,
];
export type SpawnEntityType = UnitType | BuildingType | ResourceNodeType;

export interface SpawnItemDef {
    type: SpawnEntityType;
    entityCategory: 'unit' | 'building' | 'resource';
    label: string;
    group?: string;
}

export const SPAWN_ITEMS: SpawnItemDef[] = [
    // --- UNITS ---
    // Trung Tâm
    { type: UnitType.Villager, entityCategory: 'unit', get label() { return t('unit.villager'); }, get group() { return t('spawn.group.townCenter'); } },
    // Trại Lính
    { type: UnitType.Spearman, entityCategory: 'unit', get label() { return t('unit.spearman'); }, get group() { return t('spawn.group.barracks'); } },
    { type: UnitType.Archer, entityCategory: 'unit', get label() { return t('unit.archer'); }, get group() { return t('spawn.group.barracks'); } },
    { type: UnitType.Swordsman, entityCategory: 'unit', get label() { return t('unit.swordsman'); }, get group() { return t('spawn.group.barracks'); } },
    // Chuồng Ngựa
    { type: UnitType.Scout, entityCategory: 'unit', get label() { return t('unit.scout'); }, get group() { return t('spawn.group.stable'); } },
    { type: UnitType.Knight, entityCategory: 'unit', get label() { return t('unit.knight'); }, get group() { return t('spawn.group.stable'); } },
    // Đền Tướng (Specific Civ Heroes)
    { type: UnitType.HeroZarathustra, entityCategory: 'unit', get label() { return t('unit.heroZarathustra'); }, get group() { return t('spawn.group.hero'); } },
    { type: UnitType.HeroQiJiguang, entityCategory: 'unit', get label() { return t('unit.heroQiJiguang'); }, get group() { return t('spawn.group.hero'); } },
    { type: UnitType.HeroMusashi, entityCategory: 'unit', get label() { return t('unit.heroMusashi'); }, get group() { return t('spawn.group.hero'); } },
    { type: UnitType.HeroSpartacus, entityCategory: 'unit', get label() { return t('unit.heroSpartacus'); }, get group() { return t('spawn.group.hero'); } },
    { type: UnitType.HeroRagnar, entityCategory: 'unit', get label() { return t('unit.heroRagnar'); }, get group() { return t('spawn.group.hero'); } },
    // Lính Đặc Biệt
    { type: UnitType.Immortal, entityCategory: 'unit', get label() { return t('unit.immortal'); }, get group() { return t('spawn.group.special'); } },
    { type: UnitType.ChuKoNu, entityCategory: 'unit', get label() { return t('unit.chuKoNu'); }, get group() { return t('spawn.group.special'); } },
    { type: UnitType.Ninja, entityCategory: 'unit', get label() { return t('unit.ninja'); }, get group() { return t('spawn.group.special'); } },
    { type: UnitType.Centurion, entityCategory: 'unit', get label() { return t('unit.centurion'); }, get group() { return t('spawn.group.special'); } },
    { type: UnitType.Ulfhednar, entityCategory: 'unit', get label() { return t('unit.ulfhednar'); }, get group() { return t('spawn.group.special'); } },
    { type: UnitType.WarElephant, entityCategory: 'unit', get label() { return t('unit.warElephant'); }, get group() { return t('spawn.group.special'); } },
    { type: UnitType.FireLancer, entityCategory: 'unit', get label() { return t('unit.fireLancer'); }, get group() { return t('spawn.group.special'); } },
    { type: UnitType.Yabusame, entityCategory: 'unit', get label() { return t('unit.yabusame'); }, get group() { return t('spawn.group.special'); } },
    { type: UnitType.Equites, entityCategory: 'unit', get label() { return t('unit.equites'); }, get group() { return t('spawn.group.special'); } },
    { type: UnitType.BearRider, entityCategory: 'unit', get label() { return t('unit.bearRider'); }, get group() { return t('spawn.group.special'); } },

    // Thử nghiệm
    { type: UnitType.TargetDummy, entityCategory: 'unit', get label() { return t('unit.targetDummy'); }, get group() { return t('spawn.group.test'); } },

    // --- BUILDINGS ---
    { type: BuildingType.TownCenter, entityCategory: 'building', get label() { return t('bld.townCenter'); }, get group() { return t('spawn.group.building'); } },
    { type: BuildingType.House, entityCategory: 'building', get label() { return t('bld.house'); }, get group() { return t('spawn.group.building'); } },
    { type: BuildingType.Barracks, entityCategory: 'building', get label() { return t('bld.barracks'); }, get group() { return t('spawn.group.building'); } },
    { type: BuildingType.Market, entityCategory: 'building', get label() { return t('bld.market'); }, get group() { return t('spawn.group.building'); } },
    { type: BuildingType.Stable, entityCategory: 'building', get label() { return t('bld.stable'); }, get group() { return t('spawn.group.building'); } },
    { type: BuildingType.Tower, entityCategory: 'building', get label() { return t('bld.tower'); }, get group() { return t('spawn.group.building'); } },
    { type: BuildingType.HeroAltar, entityCategory: 'building', get label() { return t('bld.heroAltar'); }, get group() { return t('spawn.group.building'); } },
    { type: BuildingType.GovernmentCenter, entityCategory: 'building', get label() { return t('bld.governmentCenter'); }, get group() { return t('spawn.group.building'); } },

    // --- RESOURCES ---
    { type: ResourceNodeType.Tree, entityCategory: 'resource', get label() { return t('res.tree'); }, get group() { return t('spawn.group.resource'); } },
    { type: ResourceNodeType.GoldMine, entityCategory: 'resource', get label() { return t('res.goldMine'); }, get group() { return t('spawn.group.resource'); } },
    { type: ResourceNodeType.StoneMine, entityCategory: 'resource', get label() { return t('res.stoneMine'); }, get group() { return t('spawn.group.resource'); } },
    { type: ResourceNodeType.BerryBush, entityCategory: 'resource', get label() { return t('res.berryBush'); }, get group() { return t('spawn.group.resource'); } },
];

export interface SpawnPaletteContext {
    topBarH: number;
    freeSpawnUnit: SpawnEntityType | null;
    freeSpawnCategory: 'unit' | 'building' | 'resource';
    freeSpawnCiv: CivilizationType;
    freeSpawnAge: number;
    freeSpawnTeam: number;
    freeSlotColor: string;
    freePlacementPhase: boolean;
    onStartBattle: (() => void) | null;
    onResetMap: (() => void) | null;
    onColorChange?: (color: string) => void;
    clickAreas: ClickArea[];
    isHovered(x: number, y: number, w: number, h: number): boolean;
}

export function renderSpawnPalette(
    ctx: CanvasRenderingContext2D, vpW: number, vpH: number, ui: SpawnPaletteContext
): void {
    const panelW = 170;
    const panelX = vpW - panelW - 6;
    const panelY = ui.topBarH + 8;
    const rowH = 22;

    // Panel background
    ctx.fillStyle = 'rgba(8, 6, 4, 0.92)';
    ctx.fillRect(panelX, panelY, panelW, vpH - panelY - 10);
    ctx.strokeStyle = '#2a2218';
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX, panelY, panelW, vpH - panelY - 10);

    let y = panelY + 6;

    // Title
    ctx.fillStyle = '#44ccff';
    ctx.font = "bold 11px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(t('spawn.title'), panelX + panelW / 2, y + 10);
    y += 18;

    // Reset Map button
    const resetBtnH = 24;
    const resetHovered = ui.isHovered(panelX + 8, y, panelW - 16, resetBtnH);
    ctx.fillStyle = resetHovered ? '#4a1a1a' : '#2a0e0e';
    ctx.fillRect(panelX + 8, y, panelW - 16, resetBtnH);
    ctx.strokeStyle = resetHovered ? '#ff4444' : '#662222';
    ctx.lineWidth = resetHovered ? 2 : 1;
    ctx.strokeRect(panelX + 8, y, panelW - 16, resetBtnH);
    ctx.fillStyle = resetHovered ? '#ff6666' : '#cc4444';
    ctx.font = "bold 10px 'Inter', sans-serif";
    ctx.fillText(t('spawn.resetMap'), panelX + panelW / 2, y + resetBtnH / 2 + 4);
    ui.clickAreas.push({
        x: panelX + 8, y, w: panelW - 16, h: resetBtnH,
        action: () => { if (ui.onResetMap) ui.onResetMap(); }
    });
    y += resetBtnH + 8;

    // Start Battle button (only during placement phase)
    if (ui.freePlacementPhase) {
        const startBtnH = 32;
        const hovered = ui.isHovered(panelX + 8, y, panelW - 16, startBtnH);
        ctx.fillStyle = hovered ? '#2a4a1a' : '#1a3010';
        ctx.fillRect(panelX + 8, y, panelW - 16, startBtnH);
        ctx.strokeStyle = hovered ? '#44ff44' : '#228822';
        ctx.lineWidth = hovered ? 2 : 1;
        ctx.strokeRect(panelX + 8, y, panelW - 16, startBtnH);
        if (hovered) {
            ctx.shadowColor = '#44ff44';
            ctx.shadowBlur = 10;
            ctx.strokeRect(panelX + 8, y, panelW - 16, startBtnH);
            ctx.shadowBlur = 0;
        }
        ctx.fillStyle = hovered ? '#66ff66' : '#44dd44';
        ctx.font = "bold 12px 'Inter', sans-serif";
        ctx.fillText(t('spawn.startBattle'), panelX + panelW / 2, y + startBtnH / 2 + 4);
        ui.clickAreas.push({
            x: panelX + 8, y, w: panelW - 16, h: startBtnH,
            action: () => {
                ui.freePlacementPhase = false;
                if (ui.onStartBattle) ui.onStartBattle();
            }
        });
        y += startBtnH + 8;

        // Paused indicator
        ctx.fillStyle = '#ffaa00';
        ctx.font = "bold 10px 'Inter', sans-serif";
        ctx.fillText(t('spawn.placementHint'), panelX + panelW / 2, y + 10);
        y += 16;
    }

    // Team toggle
    const teamBtnW = 70, teamBtnH = 22;
    const teamBtnX1 = panelX + 8;
    const teamBtnX2 = panelX + panelW - teamBtnW - 8;

    // Player team button
    const isPlayerTeam = ui.freeSpawnTeam === 0;
    ctx.fillStyle = isPlayerTeam ? '#1a2a4a' : '#0e0c0a';
    ctx.fillRect(teamBtnX1, y, teamBtnW, teamBtnH);
    ctx.strokeStyle = isPlayerTeam ? '#4488ff' : '#333';
    ctx.lineWidth = isPlayerTeam ? 2 : 1;
    ctx.strokeRect(teamBtnX1, y, teamBtnW, teamBtnH);
    ctx.fillStyle = isPlayerTeam ? '#4488ff' : '#666';
    ctx.font = "bold 10px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(t('spawn.playerTeam'), teamBtnX1 + teamBtnW / 2, y + 15);
    ui.clickAreas.push({ x: teamBtnX1, y, w: teamBtnW, h: teamBtnH, action: () => { ui.freeSpawnTeam = 0; } });

    // Enemy team button
    const isEnemyTeam = ui.freeSpawnTeam === 2;
    ctx.fillStyle = isEnemyTeam ? '#4a1a1a' : '#0e0c0a';
    ctx.fillRect(teamBtnX2, y, teamBtnW, teamBtnH);
    ctx.strokeStyle = isEnemyTeam ? '#dd4444' : '#333';
    ctx.lineWidth = isEnemyTeam ? 2 : 1;
    ctx.strokeRect(teamBtnX2, y, teamBtnW, teamBtnH);
    ctx.fillStyle = isEnemyTeam ? '#dd4444' : '#666';
    ctx.fillText(t('spawn.enemyTeam'), teamBtnX2 + teamBtnW / 2, y + 15);
    ui.clickAreas.push({ x: teamBtnX2, y, w: teamBtnW, h: teamBtnH, action: () => { ui.freeSpawnTeam = 2; } });
    y += teamBtnH + 6;

    // ── COLOR PICKER ROW ──
    ctx.fillStyle = '#887766';
    ctx.font = "bold 9px 'Inter', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText(t('spawn.teamColor'), panelX + 8, y + 10);
    y += 14;

    const PRESET_COLORS = ['#cc3333', '#3366cc', '#33aa33', '#ddaa00', '#aa33aa', '#33aaaa', '#ff6600', '#ff69b4'];
    const colorBtnW = 16, colorBtnH = 16, colorGap = 3;
    for (let i = 0; i < PRESET_COLORS.length; i++) {
        const col = PRESET_COLORS[i];
        const bx = panelX + 8 + i * (colorBtnW + colorGap);
        const isSelected = ui.freeSlotColor === col;
        const hovered = ui.isHovered(bx, y, colorBtnW, colorBtnH);

        ctx.fillStyle = col;
        ctx.fillRect(bx, y, colorBtnW, colorBtnH);
        ctx.strokeStyle = isSelected ? '#fff' : (hovered ? '#ccc' : '#555');
        ctx.lineWidth = isSelected ? 2.5 : 1;
        ctx.strokeRect(bx, y, colorBtnW, colorBtnH);

        if (isSelected) {
            // Checkmark
            ctx.fillStyle = '#fff';
            ctx.font = "bold 10px sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText('✓', bx + colorBtnW / 2, y + 12);
        }

        ui.clickAreas.push({ x: bx, y, w: colorBtnW, h: colorBtnH, action: () => {
            ui.freeSlotColor = col;
            if (ui.onColorChange) ui.onColorChange(col);
        }});
    }
    y += colorBtnH + 8;

    // Separator
    ctx.strokeStyle = '#2a2218';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(panelX + 8, y); ctx.lineTo(panelX + panelW - 8, y); ctx.stroke();
    y += 4;

    // Civilization selector
    ctx.fillStyle = '#887766';
    ctx.font = "bold 9px 'Inter', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText(t('spawn.civilization'), panelX + 8, y + 10);
    y += 14;

    const civBtnW = 28, civBtnH = 24, civGap = 3;
    for (let i = 0; i < SPAWN_CIVS.length; i++) {
        const civ = SPAWN_CIVS[i];
        const civData = CIVILIZATION_DATA[civ];
        const bx = panelX + 8 + i * (civBtnW + civGap);
        const isSelected = ui.freeSpawnCiv === civ;
        const hovered = ui.isHovered(bx, y, civBtnW, civBtnH);

        ctx.fillStyle = isSelected ? civData.secondaryColor : (hovered ? '#1a1814' : '#0e0c0a');
        ctx.fillRect(bx, y, civBtnW, civBtnH);
        ctx.strokeStyle = isSelected ? civData.accentColor : '#333';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(bx, y, civBtnW, civBtnH);
        ctx.fillStyle = isSelected ? '#fff' : '#999';
        ctx.font = "12px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(civData.icon, bx + civBtnW / 2, y + 17);
        ui.clickAreas.push({ x: bx, y, w: civBtnW, h: civBtnH, action: () => { ui.freeSpawnCiv = civ; } });
    }
    y += civBtnH + 6;

    // Age selector
    ctx.fillStyle = '#887766';
    ctx.font = "bold 9px 'Inter', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText(t('spawn.age'), panelX + 8, y + 10);
    y += 14;

    const ageBtnW = 34, ageBtnH = 20, ageGap = 4;
    for (let i = 1; i <= 4; i++) {
        const bx = panelX + 8 + (i - 1) * (ageBtnW + ageGap);
        const isSelected = ui.freeSpawnAge === i;
        const hovered = ui.isHovered(bx, y, ageBtnW, ageBtnH);

        ctx.fillStyle = isSelected ? '#554422' : (hovered ? '#2a2218' : '#0e0c0a');
        ctx.fillRect(bx, y, ageBtnW, ageBtnH);
        ctx.strokeStyle = isSelected ? '#ffcc00' : '#444';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(bx, y, ageBtnW, ageBtnH);
        ctx.fillStyle = isSelected ? '#ffcc00' : '#aaa';
        ctx.font = "bold 11px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(`Age ${i}`, bx + ageBtnW / 2, y + 14);
        ui.clickAreas.push({ x: bx, y, w: ageBtnW, h: ageBtnH, action: () => { ui.freeSpawnAge = i; } });
    }
    y += ageBtnH + 6;

    // Separator
    ctx.strokeStyle = '#2a2218';
    ctx.beginPath(); ctx.moveTo(panelX + 8, y); ctx.lineTo(panelX + panelW - 8, y); ctx.stroke();
    y += 6;

    // Tabs for Categories
    const tabW = Math.floor((panelW - 16 - 4) / 3);
    const tabH = 20;
    const tabs: { cat: 'unit' | 'building' | 'resource', icon: string }[] = [
        { cat: 'unit', icon: t('spawn.tabUnit') },
        { cat: 'building', icon: t('spawn.tabBuilding') },
        { cat: 'resource', icon: t('spawn.tabResource') },
    ];

    for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        const bx = panelX + 8 + i * (tabW + 2);
        const isSelected = ui.freeSpawnCategory === tab.cat;
        const hovered = ui.isHovered(bx, y, tabW, tabH);

        ctx.fillStyle = isSelected ? '#3a2a1a' : (hovered ? '#1a1814' : '#0e0c0a');
        ctx.fillRect(bx, y, tabW, tabH);
        ctx.strokeStyle = isSelected ? '#edc474' : '#333';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(bx, y, tabW, tabH);
        ctx.fillStyle = isSelected ? '#fff' : '#999';
        ctx.font = "bold 9px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(tab.icon, bx + tabW / 2, y + 13);

        ui.clickAreas.push({ x: bx, y, w: tabW, h: tabH, action: () => { ui.freeSpawnCategory = tab.cat; } });
    }
    y += tabH + 6;

    // Unit type buttons
    ctx.textAlign = 'left';

    const visibleItems = SPAWN_ITEMS.filter(entry => {
        if (entry.entityCategory !== ui.freeSpawnCategory) return false;

        const isHeroGroup = entry.group === t('spawn.group.hero');

        if (entry.entityCategory === 'unit') {
            const ut = entry.type as UnitType;
            if (UNIT_DATA[ut].ageRequired > ui.freeSpawnAge) return false;

            if (isCivElite(ut)) {
                return ut === CIV_ELITE_UNIT[ui.freeSpawnCiv];
            }
            if (isCivCavalry(ut)) {
                return ut === CIV_UNIQUE_CAVALRY[ui.freeSpawnCiv];
            }
            if (isHeroGroup) {
                const civHeroes: Record<CivilizationType, UnitType> = {
                    [CivilizationType.LaMa]: UnitType.HeroSpartacus,
                    [CivilizationType.BaTu]: UnitType.HeroZarathustra,
                    [CivilizationType.DaiMinh]: UnitType.HeroQiJiguang,
                    [CivilizationType.Yamato]: UnitType.HeroMusashi,
                    [CivilizationType.Viking]: UnitType.HeroRagnar,
                };
                return ut === civHeroes[ui.freeSpawnCiv];
            }
        } else if (entry.entityCategory === 'building') {
            const bt = entry.type as BuildingType;
            if (BUILDING_DATA[bt]?.ageRequired > ui.freeSpawnAge) return false;
        }

        return true;
    });

    const unitBtnW = panelW - 16;
    let lastGroup = '';
    for (const entry of visibleItems) {
        // Group header
        if (entry.group && entry.group !== lastGroup) {
            y += 2;
            ctx.fillStyle = '#665544';
            ctx.font = "bold 8px 'Inter', sans-serif";
            ctx.textAlign = 'left';
            ctx.fillText(entry.group, panelX + 10, y + 8);
            y += 12;
            lastGroup = entry.group;
        }

        const isSelected = ui.freeSpawnUnit === entry.type;
        const hovered = ui.isHovered(panelX + 8, y, unitBtnW, rowH);
        const civData = CIVILIZATION_DATA[ui.freeSpawnCiv];

        ctx.fillStyle = isSelected ? civData.secondaryColor : (hovered ? '#1a1814' : '#0e0c0a');
        ctx.fillRect(panelX + 8, y, unitBtnW, rowH);
        ctx.strokeStyle = isSelected ? civData.accentColor : (hovered ? '#444' : '#222');
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(panelX + 8, y, unitBtnW, rowH);

        // Unit name
        ctx.fillStyle = isSelected ? '#fff' : (hovered ? '#ddd' : '#aaa');
        ctx.font = isSelected ? "bold 10px 'Inter', sans-serif" : "10px 'Inter', sans-serif";
        ctx.textAlign = 'left';
        ctx.fillText(`${entry.label}`, panelX + 14, y + 15);

        // Stats or Type info
        ctx.fillStyle = '#666';
        ctx.font = "8px 'Inter', sans-serif";
        ctx.textAlign = 'right';
        if (entry.entityCategory === 'unit') {
            const ud = UNIT_DATA[entry.type as UnitType];
            ctx.fillText(`⚔${ud.attack} ❤${ud.hp}`, panelX + 8 + unitBtnW - 4, y + 15);
        } else if (entry.entityCategory === 'building') {
            const bd = BUILDING_DATA[entry.type as BuildingType];
            ctx.fillText(`❤${bd.hp}`, panelX + 8 + unitBtnW - 4, y + 15);
        } else if (entry.entityCategory === 'resource') {
            // Give a hint for resources
            ctx.fillText(t('spawn.treeOrMine'), panelX + 8 + unitBtnW - 4, y + 15);
        }

        ui.clickAreas.push({ x: panelX + 8, y, w: unitBtnW, h: rowH, action: () => { ui.freeSpawnUnit = entry.type; } });
        y += rowH + 2;
    }

    // Instructions at bottom
    y += 8;
    ctx.fillStyle = '#555';
    ctx.font = "9px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(t('spawn.clickHint'), panelX + panelW / 2, y + 10);
    y += 12;
    ctx.fillText(t('spawn.dragHint'), panelX + panelW / 2, y + 10);

    ctx.textAlign = 'left';
}

export interface PauseButtonContext {
    topBarH: number;
    freePlacementPhase: boolean;
    onPauseGame: (() => void) | null;
    clickAreas: ClickArea[];
    isHovered(x: number, y: number, w: number, h: number): boolean;
}

export function renderFreePauseButton(
    ctx: CanvasRenderingContext2D, vpW: number, ui: PauseButtonContext
): void {
    const btnW = 160, btnH = 36;
    const bx = vpW - btnW - 10;
    const by = ui.topBarH + 10;
    const hovered = ui.isHovered(bx, by, btnW, btnH);

    // Button background
    ctx.fillStyle = hovered ? '#2a1a1a' : '#1a1010';
    ctx.fillRect(bx, by, btnW, btnH);
    ctx.strokeStyle = hovered ? '#ff8844' : '#885522';
    ctx.lineWidth = hovered ? 2 : 1;
    ctx.strokeRect(bx, by, btnW, btnH);
    if (hovered) {
        ctx.shadowColor = '#ff8844';
        ctx.shadowBlur = 8;
        ctx.strokeRect(bx, by, btnW, btnH);
        ctx.shadowBlur = 0;
    }

    // Label
    ctx.fillStyle = hovered ? '#ffaa66' : '#cc8844';
    ctx.font = "bold 12px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(t('spawn.pause'), bx + btnW / 2, by + btnH / 2 + 4);

    ui.clickAreas.push({
        x: bx, y: by, w: btnW, h: btnH,
        action: () => {
            ui.freePlacementPhase = true;
            if (ui.onPauseGame) ui.onPauseGame();
        }
    });

    ctx.textAlign = 'left';
}
