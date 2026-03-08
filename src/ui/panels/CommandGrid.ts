// ============================================================
//  Command Grid — Warcraft-style 4x3 action button grid
//  Extracted from GameUI.ts
// ============================================================

import {
    C, TILE_SIZE, BuildingType, BUILDING_DATA, UnitType, UNIT_DATA,
    ResourceType, AGE_NAMES, AGE_COSTS, UnitState,
    UpgradeType, UPGRADE_DATA, CIVILIZATION_DATA, CIV_UNIT_MODIFIERS,
    isCivElite, CIV_ELITE_UNIT, CivilizationType,
} from "../../config/GameConfig";
import { PlayerState } from "../../systems/PlayerState";
import { EntityManager } from "../../systems/EntityManager";
import { SelectionSystem } from "../../systems/SelectionSystem";

export interface ActionDef {
    label: string;
    hotkey?: string;
    cost?: string;
    action: () => void;
    enabled: boolean;
    tooltip?: string;
}

export interface ClickArea {
    x: number; y: number; w: number; h: number;
    action: () => void;
}

export interface CommandGridContext {
    minimapSize: number;
    bottomPanelH: number;
    freeMode: boolean;
    playerState: PlayerState;
    entityManager: EntityManager;
    selectionSystem: SelectionSystem;
    clickAreas: ClickArea[];
    hotkeyActions: Record<string, () => void>;
    isHovered(x: number, y: number, w: number, h: number): boolean;
}

export function renderCommandGrid(
    ctx: CanvasRenderingContext2D, vpW: number, vpH: number, ui: CommandGridContext
): void {
    const gridX = ui.minimapSize + 250;
    const gridY = vpH - ui.bottomPanelH + 12;
    const btnSize = 48;
    const gap = 4;
    const cols = 4;
    const rows = 3;

    // Section label
    const sel = ui.selectionSystem;
    const actions: (ActionDef | null)[] = new Array(cols * rows).fill(null);

    // Populate actions based on selection
    const hasVillager = sel.selectedUnits.some(u => u.isVillager && u.team === 0);

    // Show cancel button when in build mode
    if (sel.buildMode !== null) {
        actions[0] = {
            label: '❌ HUỶ', hotkey: 'Esc', cost: '', enabled: true,
            action: () => { sel.buildMode = null; },
        };
    } else if (hasVillager) {
        if (!sel.buildMenuOpen) {
            actions[8] = {
                label: 'XÂY DỰNG', hotkey: 'B', cost: '', enabled: true,
                action: () => { sel.buildMenuOpen = true; },
            };
        } else {
            const buildList: [BuildingType, string, string][] = [
                [BuildingType.House, 'Nhà Ở', 'E'],             // BE
                [BuildingType.Market, 'Kho T.N', 'S'],          // BS
                [BuildingType.Farm, 'T.Trại', 'F'],             // BF
                [BuildingType.Barracks, 'T.Lính', 'B'],         // BB
                [BuildingType.Stable, 'C.Ngựa', 'L'],           // BL
                [BuildingType.Blacksmith, 'Lò Rèn', 'R'],       // BR (Fallback since B is taken and R is open)
                [BuildingType.Tower, 'T.Canh', 'T'],            // BT
                [BuildingType.HeroAltar, 'Đ.Tướng', 'H'],       // BH
                [BuildingType.TownCenter, 'Nhà Chính', 'N'],    // BN
                [BuildingType.GovernmentCenter, 'C.Phủ', 'C'],  // BC
                [BuildingType.Wall, 'Tường', 'W'],              // BW
            ];
            for (let i = 0; i < buildList.length; i++) {
                const [type, label, hotkey] = buildList[i];
                const data = BUILDING_DATA[type];
                const meetsAge = ui.playerState.age >= data.ageRequired;
                const canAfford = meetsAge && ui.playerState.canAfford(data.cost);
                const costStr = Object.entries(data.cost)
                    .filter(([_, v]) => v)
                    .map(([k, v]) => `${v}${k[0].toUpperCase()}`)
                    .join(' ');
                actions[i] = {
                    label: meetsAge ? label : `🔒${label}`, hotkey, cost: costStr, enabled: canAfford,
                    action: () => { if (canAfford) sel.enterBuildMode(type); },
                };
            }
        }
    } else if (sel.selectedBuilding && sel.selectedBuilding.team === 0) {
        const b = sel.selectedBuilding;
        const trainable = b.data.trainable;

        if (trainable && trainable.length > 0) {
            const bCiv = b.civilization;
            const trainSpeedMult = CIVILIZATION_DATA[bCiv].bonuses.trainSpeed;
            const myElite = CIV_ELITE_UNIT[bCiv];
            // Filter by the building's civilization
            const filtered = trainable.filter(ut => !isCivElite(ut) || ut === myElite);
            for (let i = 0; i < filtered.length; i++) {
                const unitType = filtered[i];
                const ud = UNIT_DATA[unitType];
                const canTrain = b.canTrain(unitType, ui.playerState);
                const costStr = Object.entries(ud.cost)
                    .filter(([_, v]) => v)
                    .map(([k, v]) => `${v}${k[0].toUpperCase()}`)
                    .join(' ');
                let hotkey = ['Q', 'W', 'E', 'R'][i];
                if (unitType === UnitType.Villager) {
                    hotkey = 'C';
                }

                // Use civ-specific name if available
                const civMod = CIV_UNIT_MODIFIERS[bCiv]?.[unitType];
                const displayName = civMod?.name ?? ud.name;
                actions[i] = {
                    label: displayName, hotkey: hotkey, cost: costStr, enabled: canTrain,
                    action: () => { if (b.canTrain(unitType, ui.playerState)) b.addToQueue(unitType, ui.playerState, trainSpeedMult); },
                };
            }

            // Age up button (TownCenter only)
            if (b.type === BuildingType.TownCenter && ui.playerState.age < 4) {
                const isAgingUp = ui.playerState.isAgingUp;
                const canAge = !isAgingUp && ui.playerState.canAgeUp();
                const nextAge = AGE_NAMES[ui.playerState.age];
                const cost = AGE_COSTS[ui.playerState.age];
                let costStr = '';
                let label = '';

                if (isAgingUp) {
                    // Show progress while aging up
                    const pct = Math.floor(ui.playerState.ageUpPercent * 100);
                    label = `⏳ ${AGE_NAMES[ui.playerState.ageUpTargetAge - 1].slice(0, 6)}`;
                    costStr = `${pct}%`;
                } else {
                    label = `⬆${nextAge.slice(0, 6)}`;
                    costStr = Object.entries(cost)
                        .filter(([_, v]) => v)
                        .map(([k, v]) => `${v}${k[0].toUpperCase()}`)
                        .join(' ');
                }

                actions[cols] = {
                    label, hotkey: 'U', cost: costStr, enabled: canAge,
                    action: () => {
                        ui.playerState.ageUp();
                    },
                };
            }
        } else if (b.type === BuildingType.Blacksmith) {
            // ---- BLACKSMITH: Military upgrades ----
            const upgradeList: [UpgradeType, string][] = [
                [UpgradeType.MeleeAttack, 'Q'],
                [UpgradeType.RangedAttack, 'W'],
                [UpgradeType.MeleeDefense, 'E'],
                [UpgradeType.RangedDefense, 'R'],
            ];
            for (let i = 0; i < upgradeList.length; i++) {
                const [upType, hk] = upgradeList[i];
                const upData = UPGRADE_DATA[upType];
                const level = ui.playerState.getUpgradeLevel(upType);
                const canResearch = ui.playerState.canResearch(upType);
                const isMaxed = level >= upData.maxLevel;
                const isResearching = ui.playerState.activeResearch?.upgradeType === upType;

                let costStr = '';
                let label = `${upData.icon} ${upData.name.slice(0, 6)}`;

                if (isMaxed) {
                    label = `${upData.icon} MAX`;
                    costStr = '★★★';
                } else if (isResearching) {
                    label = `${upData.icon} ...`;
                    const r = ui.playerState.activeResearch!;
                    const pct = Math.floor((r.progress / r.time) * 100);
                    costStr = `${pct}%`;
                } else {
                    const starStr = level > 0 ? '★'.repeat(level) : '';
                    label = `${upData.icon}${starStr} Lv${level + 1}`;
                    const cost = upData.costs[level];
                    costStr = Object.entries(cost)
                        .filter(([_, v]) => v)
                        .map(([k, v]) => `${v}${k[0].toUpperCase()}`)
                        .join(' ');
                }

                actions[i] = {
                    label, hotkey: hk, cost: costStr,
                    enabled: canResearch && !isMaxed && !isResearching,
                    tooltip: upData.description,
                    action: () => { ui.playerState.startResearch(upType); },
                };
            }
        } else if (b.type === BuildingType.Market) {
            // ---- MARKET: Economy upgrades for villagers ----
            const ecoUpgrades: [UpgradeType, string][] = [
                [UpgradeType.GatherFood, 'Q'],
                [UpgradeType.GatherWood, 'W'],
                [UpgradeType.GatherGold, 'E'],
                [UpgradeType.GatherStone, 'R'],
                [UpgradeType.CarryCapacity, 'A'],
                [UpgradeType.VillagerSpeed, 'S'],
            ];
            for (let i = 0; i < ecoUpgrades.length; i++) {
                const [upType, hk] = ecoUpgrades[i];
                const upData = UPGRADE_DATA[upType];
                const level = ui.playerState.getUpgradeLevel(upType);
                const canResearch = ui.playerState.canResearch(upType);
                const isMaxed = level >= upData.maxLevel;
                const isResearching = ui.playerState.activeResearch?.upgradeType === upType;

                let costStr = '';
                let label = `${upData.icon} ${upData.name.slice(0, 6)}`;

                if (isMaxed) {
                    label = `${upData.icon} MAX`;
                    costStr = '★★★';
                } else if (isResearching) {
                    label = `${upData.icon} ...`;
                    const r = ui.playerState.activeResearch!;
                    const pct = Math.floor((r.progress / r.time) * 100);
                    costStr = `${pct}%`;
                } else {
                    const starStr = level > 0 ? '★'.repeat(level) : '';
                    label = `${upData.icon}${starStr} Lv${level + 1}`;
                    const cost = upData.costs[level];
                    costStr = Object.entries(cost)
                        .filter(([_, v]) => v)
                        .map(([k, v]) => `${v}${k[0].toUpperCase()}`)
                        .join(' ');
                }

                actions[i] = {
                    label, hotkey: hk, cost: costStr,
                    enabled: canResearch && !isMaxed && !isResearching,
                    tooltip: upData.description,
                    action: () => { ui.playerState.startResearch(upType); },
                };
            }
        } else if (b.type === BuildingType.GovernmentCenter) {
            // ---- GOVERNMENT CENTER: Advanced upgrades ----
            const govUpgrades: [UpgradeType, string][] = [
                [UpgradeType.Architecture, 'Q'],
                [UpgradeType.MeleeHealth, 'W'],
                [UpgradeType.Cartography, 'E'],
                [UpgradeType.Trade, 'R'],
            ];
            for (let i = 0; i < govUpgrades.length; i++) {
                const [upType, hk] = govUpgrades[i];
                const upData = UPGRADE_DATA[upType];
                const level = ui.playerState.getUpgradeLevel(upType);
                const canResearch = ui.playerState.canResearch(upType);
                const isMaxed = level >= upData.maxLevel;
                const isResearching = ui.playerState.activeResearch?.upgradeType === upType;

                let costStr = '';
                let label = `${upData.icon} ${upData.name.slice(0, 7)}`;

                if (isMaxed) {
                    label = `${upData.icon} MAX`;
                    costStr = '★★★';
                } else if (isResearching) {
                    label = `${upData.icon} ...`;
                    const r = ui.playerState.activeResearch!;
                    const pct = Math.floor((r.progress / r.time) * 100);
                    costStr = `${pct}%`;
                } else {
                    const starStr = level > 0 ? '★'.repeat(level) : '';
                    label = `${upData.icon}${starStr} Lv${level + 1}`;
                    const cost = upData.costs[level];
                    costStr = Object.entries(cost)
                        .filter(([_, v]) => v)
                        .map(([k, v]) => `${v}${k[0].toUpperCase()}`)
                        .join(' ');
                }

                actions[i] = {
                    label, hotkey: hk, cost: costStr,
                    enabled: canResearch && !isMaxed && !isResearching,
                    tooltip: upData.description,
                    action: () => { ui.playerState.startResearch(upType); },
                };
            }
        }
    }

    // Draw grid buttons
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const idx = row * cols + col;
            const bx = gridX + col * (btnSize + gap);
            const by = gridY + row * (btnSize + gap) + 4;
            const action = actions[idx];

            drawCommandButton(ctx, bx, by, btnSize, action, ui);
        }
    }
}

export function drawCommandButton(
    ctx: CanvasRenderingContext2D, x: number, y: number, size: number, action: ActionDef | null,
    ui: CommandGridContext
): void {
    const hovered = ui.isHovered(x, y, size, size);

    if (!action) {
        // Empty slot
        ctx.fillStyle = '#0a0908';
        ctx.fillRect(x, y, size, size);
        ctx.strokeStyle = C.uiBorderDark;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
        return;
    }

    // Button background
    const enabled = action.enabled;
    if (hovered && enabled) {
        ctx.fillStyle = C.uiButtonHover;
    } else {
        ctx.fillStyle = enabled ? C.uiButton : '#0e0c0a';
    }
    ctx.fillRect(x, y, size, size);

    // Border
    ctx.strokeStyle = hovered && enabled ? C.uiBorderLight : (enabled ? C.uiButtonBorder : '#1a1510');
    ctx.lineWidth = hovered && enabled ? 2 : 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

    // Hover glow effect
    if (hovered && enabled) {
        ctx.fillStyle = 'rgba(200,170,80,0.08)';
        ctx.fillRect(x + 2, y + 2, size - 4, size / 2 - 2);
    }

    // Label
    ctx.fillStyle = enabled ? C.uiText : '#4a3a2a';
    ctx.font = "bold 10px 'Inter', sans-serif";
    ctx.fillText(action.label, x + 4, y + 16);

    // Cost
    if (action.cost) {
        ctx.fillStyle = enabled ? C.uiTextDim : C.uiTextRed;
        ctx.font = "8px 'Inter', sans-serif";
        ctx.fillText(action.cost, x + 4, y + size - 16);
    }

    // Hotkey badge
    if (action.hotkey) {
        ctx.fillStyle = enabled ? C.uiBorderDark : '#111';
        ctx.fillRect(x + size - 16, y + size - 14, 14, 12);
        ctx.fillStyle = enabled ? C.uiHighlight : '#3a3020';
        ctx.font = "bold 9px 'Inter', sans-serif";
        ctx.fillText(action.hotkey, x + size - 14, y + size - 5);
    }

    // Register clickable area and hotkey
    if (enabled) {
        ui.clickAreas.push({ x, y, w: size, h: size, action: action.action });
        if (action.hotkey) {
            ui.hotkeyActions[action.hotkey.toLowerCase()] = action.action;
        }
    }
}
