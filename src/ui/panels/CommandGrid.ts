// ============================================================
//  Command Grid — Warcraft-style 4x3 action button grid
//  Extracted from GameUI.ts
// ============================================================

import {
    C, TILE_SIZE, BuildingType, BUILDING_DATA, UnitType, UNIT_DATA,
    ResourceType, getAgeNames, AGE_COSTS, UnitState,
    UpgradeType, UPGRADE_DATA, CIVILIZATION_DATA, CIV_UNIT_MODIFIERS,
    isCivElite, CIV_ELITE_UNIT, CivilizationType,
    CIV_UNIQUE_CAVALRY, isCivCavalry,
    CIV_HERO, isCivHero,
    TowerUpgradeType, TOWER_UPGRADE_DATA,
} from "../../config/GameConfig";
import { UI_LAYOUT, IS_IOS } from "../../config/PlatformConfig";
import { getAvailableItems, getItem, EQUIPMENT_ITEMS } from "../../config/EquipmentData";
import type { EquipmentSlot } from "../../config/EquipmentData";
import { equipItem, unequipItem } from "../../entities/unit-abilities/EquipmentSystem";
import { PlayerState } from "../../systems/PlayerState";
import { EntityManager } from "../../systems/EntityManager";
import { SelectionSystem } from "../../systems/SelectionSystem";
import { t } from "../../i18n/i18n";
import { cmdTrain, cmdResearch, cmdAgeUp, cmdCancelResearch, cmdTowerUpgrade } from "../../network/NetworkCommands";
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

export interface ActionDef {
    label: string;
    hotkey?: string;
    cost?: string;
    action: () => void;
    enabled: boolean;
    tooltip?: string;
    isEquipment?: boolean;
    isEmptySlot?: boolean;
    equipDragData?: { itemId: string; slot: string; heroId: number; icon: string };
    buildingType?: BuildingType;
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
    shiftHeld: boolean;
    isHovered(x: number, y: number, w: number, h: number): boolean;
    onEquipDrag?: (itemId: string, slot: string, heroId: number, icon: string, x: number, y: number) => void;
    activeTooltip?: { x: number; y: number; lines: string[] } | null;
}

export function renderCommandGrid(
    ctx: CanvasRenderingContext2D, vpW: number, vpH: number, ui: CommandGridContext
): void {
    const btnSize = UI_LAYOUT.cmdBtnSize;
    const gap = IS_IOS ? 4 : 4;
    const cols = 4;
    const rows = 3;

    let gridX: number;
    let gridY: number;

    if (IS_IOS) {
        // iOS: floating action bar at bottom-center
        // gridX/Y will be calculated after we know how many active buttons
        // For now, set rows=1 for horizontal strip, calculate later
        gridY = vpH - btnSize - 10;
        gridX = 0; // Will be overridden below
    } else {
        gridX = ui.minimapSize + 16 + UI_LAYOUT.portraitSize + 10 + UI_LAYOUT.barWidth + 30;
        gridY = vpH - ui.bottomPanelH + 6;
    }

    // Section label
    const sel = ui.selectionSystem;
    const actions: (ActionDef | null)[] = new Array(cols * rows).fill(null);

    // Populate actions based on selection
    const hasVillager = sel.selectedUnits.some(u => u.isVillager && u.team === sel.playerTeam);

    // Show cancel button when in build mode
    if (sel.buildMode !== null) {
        actions[0] = {
            label: IS_IOS ? 'X' : '❌ HUỶ', hotkey: 'Esc', cost: '', enabled: true,
            action: () => { sel.buildMode = null; },
        };
    } else if (hasVillager) {
        if (!sel.buildMenuOpen) {
            actions[8] = {
                label: '🔨', hotkey: 'B', cost: '', enabled: true,
                action: () => { sel.buildMenuOpen = true; },
            };
            // Town Bell — rally selected villagers to TC for militia
            const selVillagers = sel.selectedUnits.filter(u => u.isVillager && u.team === sel.playerTeam);
            const anySelMilitia = selVillagers.some(u => u.isMilitia || u.isMilitiaRallying);
            actions[9] = {
                label: anySelMilitia ? `🔕 ${t('cmd.townBellOff')}` : `🔔 ${t('cmd.townBell')}`,
                hotkey: 'T', cost: '', enabled: selVillagers.length > 0,
                action: () => {
                    const vills = sel.selectedUnits.filter(u => u.isVillager && u.team === sel.playerTeam);
                    if (anySelMilitia) {
                        for (const v of vills) {
                            if (v.isMilitia) {
                                v.isMilitia = false;
                                v.armor = Math.max(0, v.armor - 2);
                                v.attack = Math.max(1, v.attack - 3);
                                v.civAttackSpeed = Math.max(0.5, v.civAttackSpeed - 0.15);
                            }
                            v.isMilitiaRallying = false;
                        }
                    } else {
                        // Find nearest TC
                        const tc = ui.entityManager.buildings.find(b => b.alive && b.built && b.type === BuildingType.TownCenter && b.team === sel.playerTeam);
                        if (tc) {
                            for (const v of vills) {
                                v.isMilitiaRallying = true;
                                v.targetResource = null;
                                v.buildTarget = null;
                                const angle = Math.random() * Math.PI * 2;
                                const dist = 40 + Math.random() * 30;
                                v.moveTo(tc.x + Math.cos(angle) * dist, tc.y + Math.sin(angle) * dist, () => {
                                    // Convert to militia on arrival
                                    if (v.isMilitiaRallying && !v.isMilitia) {
                                        v.isMilitia = true;
                                        v.isMilitiaRallying = false;
                                        v.armor += 2;
                                        v.attack += 3;
                                        v.civAttackSpeed += 0.15;
                                    }
                                });
                                v.manualCommand = true;
                            }
                        }
                    }
                },
            };
        } else {
            const buildList: [BuildingType, string, string][] = [
                [BuildingType.House, 'bld.house', 'E'],
                [BuildingType.Market, 'bld.market', 'S'],
                [BuildingType.Barracks, 'bld.barracks', 'B'],
                [BuildingType.Stable, 'bld.stable', 'L'],
                [BuildingType.Blacksmith, 'bld.blacksmith', 'R'],
                [BuildingType.Tower, 'bld.tower', 'T'],
                [BuildingType.HeroAltar, 'bld.heroAltar', 'H'],
                [BuildingType.Armory, 'bld.armory', 'A'],
                [BuildingType.TownCenter, 'bld.townCenter', 'N'],
                [BuildingType.GovernmentCenter, 'bld.governmentCenter', 'C'],
                [BuildingType.Wall, 'bld.wall', 'W'],
            ];
            for (let i = 0; i < buildList.length; i++) {
                const [type, labelKey, hotkey] = buildList[i];
                const data = BUILDING_DATA[type];
                // Emergency TC rebuild: allow building 1 TC if player has none, regardless of age
                const hasNoTC = type === BuildingType.TownCenter &&
                    !ui.entityManager.buildings.some(b => b.alive && b.type === BuildingType.TownCenter && b.team === sel.playerTeam);
                const meetsAge = hasNoTC || ui.playerState.age >= data.ageRequired;
                const canAfford = meetsAge && ui.playerState.canAfford(data.cost);
                const costStr = Object.entries(data.cost)
                    .filter(([_, v]) => v)
                    .map(([k, v]) => `${v}${k[0].toUpperCase()}`)
                    .join(' ');
                
                const localizedLabel = t(labelKey);
                actions[i] = {
                    label: meetsAge ? localizedLabel : `🔒${localizedLabel}`, 
                    hotkey, 
                    cost: costStr, 
                    enabled: canAfford,
                    action: () => { if (canAfford) sel.enterBuildMode(type); },
                    buildingType: type,
                };
            }
        }
    } else if (!hasVillager && sel.selectedUnits.length > 0) {
        // ---- HERO EQUIPMENT INVENTORY (Warcraft III style) ----
        const heroUnit = sel.selectedUnits.find(u => u.isHero && u.team === sel.playerTeam);
        if (heroUnit) {
            const equipSlots: Array<{ key: 'weapon' | 'armor' | 'accessory'; icon: string; label: string }> = [
                { key: 'weapon', icon: '🗡️', label: 'Weapon' },
                { key: 'armor', icon: '🛡️', label: 'Armor' },
                { key: 'accessory', icon: '💍', label: 'Access.' },
            ];
            let slotIdx = 0;
            for (let i = 0; i < equipSlots.length; i++) {
                const slot = equipSlots[i];
                const itemId = heroUnit.equipment[slot.key];
                const eqItem = itemId ? getItem(itemId) : null;
                if (eqItem) {
                    // Calculate sell price (50% of original cost)
                    const sellGold = Math.floor((eqItem.cost.gold || 0) * 0.5);
                    actions[slotIdx] = {
                        label: `${eqItem.icon} ${eqItem.name.slice(0, 7)}`,
                        hotkey: '',
                        cost: `💰 Bán ${sellGold}G`,
                        enabled: true,
                        isEquipment: true,
                        equipDragData: { itemId: eqItem.id, slot: eqItem.slot, heroId: heroUnit.id, icon: eqItem.icon },
                        action: () => {
                            // Sell: unequip + refund 50%
                            unequipItem(heroUnit, eqItem.slot as any);
                            for (const [k, v] of Object.entries(eqItem.cost)) {
                                const resType = k as ResourceType;
                                ui.playerState.addResource(resType, Math.floor((v as number) * 0.5));
                            }
                        },
                    };
                    slotIdx++;
                }
            }
        }
    }
    if (sel.selectedBuilding && sel.selectedBuilding.team === sel.playerTeam) {
        const b = sel.selectedBuilding;
        const trainable = b.data.trainable;

        if (trainable && trainable.length > 0) {
            const bCiv = b.civilization;
            const trainSpeedMult = CIVILIZATION_DATA[bCiv].bonuses.trainSpeed;
            const myElite = CIV_ELITE_UNIT[bCiv];
            const myUniqueCav = CIV_UNIQUE_CAVALRY[bCiv];
            const myHero = CIV_HERO[bCiv];
            // Check if hero already exists on this team (alive OR in any training queue)
            const heroExists = ui.entityManager.units.some(
                u => u.alive && u.team === sel.playerTeam && u.isHero
            ) || ui.entityManager.buildings.some(
                tb => tb.alive && tb.team === sel.playerTeam &&
                    tb.trainQueue.some(q => isCivHero(q.unitType))
            );
            // Filter by the building's civilization
            const filtered = trainable.filter(ut => {
                if (isCivElite(ut) && ut !== myElite) return false;
                if (isCivCavalry(ut) && ut !== myUniqueCav) return false;
                if (isCivHero(ut) && ut !== myHero) return false;
                return true;
            });
            for (let i = 0; i < filtered.length; i++) {
                const unitType = filtered[i];
                const ud = UNIT_DATA[unitType];
                const canTrain = b.canTrain(unitType, ui.playerState, heroExists);
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
                    action: () => {
                        const batchCount = ui.shiftHeld ? 5 : 1;
                        for (let bi = 0; bi < batchCount; bi++) {
                            if (!b.canTrain(unitType, ui.playerState, heroExists)) break;
                            if (sel.isMultiplayer && sel.sendCommand) {
                                sel.sendCommand(cmdTrain(sel.playerTeam, b.id, unitType as any));
                            } else {
                                b.addToQueue(unitType, ui.playerState, trainSpeedMult);
                            }
                        }
                    },
                };
            }

            // Age up button (TownCenter only)
            if (b.type === BuildingType.TownCenter && ui.playerState.age < 4) {
                const isAgingUp = ui.playerState.isAgingUp;
                const canAge = !isAgingUp && ui.playerState.canAgeUp();
                const nextAge = getAgeNames()[ui.playerState.age];
                const cost = AGE_COSTS[ui.playerState.age];
                let costStr = '';
                let label = '';

                if (isAgingUp) {
                    // Show progress while aging up
                    const pct = Math.floor(ui.playerState.ageUpPercent * 100);
                    label = `⏳ ${getAgeNames()[ui.playerState.ageUpTargetAge - 1].slice(0, 6)}`;
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
                        if (sel.isMultiplayer && sel.sendCommand) {
                            sel.sendCommand(cmdAgeUp(sel.playerTeam));
                        } else {
                            ui.playerState.ageUp();
                        }
                    },
                };
            }

            // Town Bell button — rally villagers as militia
            if (b.built) {
                const villagers = ui.entityManager.units.filter(u => u.alive && u.isVillager && u.team === sel.playerTeam);
                const anyMilitia = villagers.some(u => u.isMilitia || u.isMilitiaRallying);
                const bellLabel = anyMilitia ? `🔕 ${t('cmd.townBellOff')}` : `🔔 ${t('cmd.townBell')}`;

                actions[cols + 1] = {
                    label: bellLabel, hotkey: 'T', cost: anyMilitia ? '' : `${villagers.length} 👤`,
                    enabled: villagers.length > 0,
                    action: () => {
                        const vills = ui.entityManager.units.filter(u => u.alive && u.isVillager && u.team === sel.playerTeam);
                        if (anyMilitia) {
                            // Deactivate militia
                            for (const v of vills) {
                                if (v.isMilitia) {
                                    v.isMilitia = false;
                                    v.armor = Math.max(0, v.armor - 2);
                                    v.attack = Math.max(1, v.attack - 3);
                                    v.civAttackSpeed = Math.max(0.5, v.civAttackSpeed - 0.15);
                                }
                                v.isMilitiaRallying = false;
                            }
                        } else {
                            // Rally to TC — armor applied on arrival
                            for (const v of vills) {
                                v.isMilitiaRallying = true;
                                v.targetResource = null;
                                v.buildTarget = null;
                                // Rally to TC with some spread
                                const angle = Math.random() * Math.PI * 2;
                                const dist = 40 + Math.random() * 30;
                                v.moveTo(b.x + Math.cos(angle) * dist, b.y + Math.sin(angle) * dist, () => {
                                    // Convert to militia on arrival
                                    if (v.isMilitiaRallying && !v.isMilitia) {
                                        v.isMilitia = true;
                                        v.isMilitiaRallying = false;
                                        v.armor += 2;
                                        v.attack += 3;
                                        v.civAttackSpeed += 0.15;
                                    }
                                });
                                v.manualCommand = true;
                            }
                        }
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
                [UpgradeType.EliteAttack, 'A'],
                [UpgradeType.EliteDefense, 'S'],
                [UpgradeType.CavalryAttack, 'D'],
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
                    action: () => {
                        if (sel.isMultiplayer && sel.sendCommand) {
                            sel.sendCommand(cmdResearch(sel.playerTeam, upType));
                        } else {
                            ui.playerState.startResearch(upType);
                        }
                    },
                };
            }
            // Cancel research button when researching
            if (ui.playerState.activeResearch) {
                actions[cols * rows - 1] = {
                    label: t('cmd.cancel'), hotkey: 'Esc', cost: '', enabled: true,
                    action: () => {
                        if (sel.isMultiplayer && sel.sendCommand) {
                            sel.sendCommand(cmdCancelResearch(sel.playerTeam));
                        } else {
                            ui.playerState.cancelResearch();
                        }
                    },
                };
            }
        } else if (b.type === BuildingType.Armory) {
            // ---- ARMORY: Instant equipment purchase ----
            const equipItems = getAvailableItems(ui.playerState.age);
            const equipHotkeys = ['Q', 'W', 'E', 'R', 'A', 'S', 'D', 'F', 'Z', 'X', 'C', 'V'];
            const hero = ui.entityManager.units.find(u => u.alive && u.team === sel.playerTeam && u.isHero);
            const heroExists = !!hero;

            for (let i = 0; i < Math.min(equipItems.length, cols * rows); i++) {
                const eItem = equipItems[i];

                const slotFilled = hero && hero.equipment[eItem.slot as keyof typeof hero.equipment] !== null;
                const canBuy = heroExists && !slotFilled && ui.playerState.canAfford(eItem.cost as any);

                let label = `${eItem.icon} ${eItem.name.slice(0, 6)}`;
                let costStr = Object.entries(eItem.cost)
                    .filter(([_, v]) => v)
                    .map(([k, v]) => `${v}${k[0].toUpperCase()}`)
                    .join(' ');

                if (slotFilled) {
                    label = `${eItem.icon} ✓`;
                    costStr = 'Equipped';
                } else if (!heroExists) {
                    label = `${eItem.icon} 🔒`;
                    costStr = 'Need Hero';
                }

                actions[i] = {
                    label,
                    hotkey: equipHotkeys[i],
                    cost: costStr,
                    enabled: canBuy && !slotFilled,
                    tooltip: eItem.description,
                    action: () => {
                        // Instant buy: spend resources + equip immediately
                        if (ui.playerState.spend(eItem.cost as any) && hero) {
                            equipItem(hero, eItem.id);
                        }
                    },
                };
            }
        } else if (b.type === BuildingType.Market) {
            // ---- MARKET: Economy upgrades for villagers ----
            const ecoUpgrades: [UpgradeType, string][] = [
                [UpgradeType.GatherSupplies, 'Q'],
                [UpgradeType.GatherGold, 'W'],
                [UpgradeType.CarryCapacity, 'E'],
                [UpgradeType.VillagerSpeed, 'R'],
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
                    action: () => {
                        if (sel.isMultiplayer && sel.sendCommand) {
                            sel.sendCommand(cmdResearch(sel.playerTeam, upType));
                        } else {
                            ui.playerState.startResearch(upType);
                        }
                    },
                };
            }
            // Cancel research button when researching
            if (ui.playerState.activeResearch) {
                actions[cols * rows - 1] = {
                    label: t('cmd.cancel'), hotkey: 'Esc', cost: '', enabled: true,
                    action: () => {
                        if (sel.isMultiplayer && sel.sendCommand) {
                            sel.sendCommand(cmdCancelResearch(sel.playerTeam));
                        } else {
                            ui.playerState.cancelResearch();
                        }
                    },
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
                    action: () => {
                        if (sel.isMultiplayer && sel.sendCommand) {
                            sel.sendCommand(cmdResearch(sel.playerTeam, upType));
                        } else {
                            ui.playerState.startResearch(upType);
                        }
                    },
                };
            }
            // Cancel research button when researching
            if (ui.playerState.activeResearch) {
                actions[cols * rows - 1] = {
                    label: t('cmd.cancel'), hotkey: 'Esc', cost: '', enabled: true,
                    action: () => {
                        if (sel.isMultiplayer && sel.sendCommand) {
                            sel.sendCommand(cmdCancelResearch(sel.playerTeam));
                        } else {
                            ui.playerState.cancelResearch();
                        }
                    },
                };
            }
        } else if (b.type === BuildingType.Tower && b.built) {
            // ---- TOWER: Upgrade buttons (Fire / Ice / Cannon) ----
            if (b.isTowerUpgrading) {
                // Show upgrade progress
                const pct = Math.floor((b.towerUpgradeProgress / b.towerUpgradeTime) * 100);
                const upgData = TOWER_UPGRADE_DATA[b.towerUpgrade];
                actions[0] = {
                    label: `${upgData.icon} ${upgData.name.slice(0, 8)}`,
                    hotkey: '', cost: `⏳ ${pct}%`, enabled: false,
                    action: () => {},
                };
            } else if (b.towerUpgrade === TowerUpgradeType.None) {
                // Show upgrade options
                const towerUpgrades: [TowerUpgradeType, string][] = [
                    [TowerUpgradeType.Fire, 'Q'],
                    [TowerUpgradeType.Ice, 'W'],
                    [TowerUpgradeType.Cannon, 'E'],
                ];
                for (let i = 0; i < towerUpgrades.length; i++) {
                    const [upgType, hk] = towerUpgrades[i];
                    const upgData = TOWER_UPGRADE_DATA[upgType];
                    const meetsAge = ui.playerState.age >= upgData.ageRequired;
                    const canAfford = meetsAge && ui.playerState.canAfford(upgData.cost);
                    const costStr = Object.entries(upgData.cost)
                        .filter(([_, v]) => v)
                        .map(([k, v]) => `${v}${k[0].toUpperCase()}`)
                        .join(' ');

                    actions[i] = {
                        label: meetsAge ? `${upgData.icon} ${upgData.name.slice(0, 8)}` : `🔒 ${upgData.icon}`,
                        hotkey: hk, cost: costStr, enabled: canAfford,
                        tooltip: upgData.description,
                        action: () => {
                            if (!canAfford) return;
                            if (sel.isMultiplayer && sel.sendCommand) {
                                sel.sendCommand(cmdTowerUpgrade(sel.playerTeam, b.id, upgType));
                            } else {
                                if (ui.playerState.spend(upgData.cost)) {
                                    b.startTowerUpgrade(upgType);
                                }
                            }
                        },
                    };
                }
            } else {
                // Already upgraded — show info
                const upgData = TOWER_UPGRADE_DATA[b.towerUpgrade];
                actions[0] = {
                    label: `${upgData.icon} ${upgData.name.slice(0, 8)}`,
                    hotkey: '', cost: '✅', enabled: false,
                    tooltip: upgData.description,
                    action: () => {},
                };
            }
        }
    }

    // iOS: add deselect "X" button as last action
    if (IS_IOS && sel.buildMode === null) {
        actions[11] = {
            label: 'X', hotkey: '', cost: '', enabled: true,
            action: () => {
                sel.clearSelection();
                sel.buildMenuOpen = false;
            },
        };
    }

    // Draw grid buttons
    if (IS_IOS) {
        // iOS: floating horizontal strip — only active buttons, centered
        const activeActions = actions.filter(a => a !== null) as ActionDef[];
        const activeCount = activeActions.length;
        if (activeCount === 0) return;

        const barPad = 6;
        const barW = activeCount * (btnSize + gap) - gap + barPad * 2;
        const barH = btnSize + barPad * 2;
        gridX = Math.floor((vpW - barW) / 2) + barPad;
        gridY = vpH - barH - 42 + barPad;
        const bgX = gridX - barPad;
        const bgY = gridY - barPad;

        // Rounded background
        const r = 8;
        ctx.fillStyle = 'rgba(12, 10, 8, 0.85)';
        ctx.beginPath();
        ctx.moveTo(bgX + r, bgY);
        ctx.lineTo(bgX + barW - r, bgY);
        ctx.quadraticCurveTo(bgX + barW, bgY, bgX + barW, bgY + r);
        ctx.lineTo(bgX + barW, bgY + barH - r);
        ctx.quadraticCurveTo(bgX + barW, bgY + barH, bgX + barW - r, bgY + barH);
        ctx.lineTo(bgX + r, bgY + barH);
        ctx.quadraticCurveTo(bgX, bgY + barH, bgX, bgY + barH - r);
        ctx.lineTo(bgX, bgY + r);
        ctx.quadraticCurveTo(bgX, bgY, bgX + r, bgY);
        ctx.fill();

        // Top accent
        ctx.strokeStyle = 'rgba(194, 24, 91, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bgX + r, bgY);
        ctx.lineTo(bgX + barW - r, bgY);
        ctx.stroke();

        // Draw active buttons in a row
        for (let i = 0; i < activeCount; i++) {
            const bx = gridX + i * (btnSize + gap);
            drawCommandButton(ctx, bx, gridY, btnSize, activeActions[i], ui);
        }
    } else {
        // Desktop: traditional 4×3 grid
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
}

export function drawCommandButton(
    ctx: CanvasRenderingContext2D, x: number, y: number, size: number, action: ActionDef | null,
    ui: CommandGridContext
): void {
    const hovered = ui.isHovered(x, y, size, size);

    if (!action) {
        // Empty slot
        ctx.fillStyle = '#121214';
        ctx.fillRect(x, y, size, size);
        ctx.strokeStyle = C.uiBorderDark;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
        return;
    }

    // Button background
    const enabled = action.enabled;

    // ---- EQUIPMENT ITEM: render same as standard button but with golden border ----
    if (action.isEquipment) {
        // Use standard button rendering (same as Armory items)
        // Background
        if (hovered && enabled) {
            ctx.fillStyle = C.uiButtonHover;
        } else {
            ctx.fillStyle = enabled ? C.uiButton : '#121214';
        }
        ctx.fillRect(x, y, size, size);

        // Golden border (distinguishes from regular buttons)
        ctx.strokeStyle = hovered ? '#ffd700' : '#d4af37';
        ctx.lineWidth = hovered ? 2 : 1.5;
        ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

        // Hover glow
        if (hovered && enabled) {
            ctx.fillStyle = 'rgba(212,175,55,0.08)';
            ctx.fillRect(x + 1, y + 1, size - 2, size / 2);
        }

        // Set tooltip when hovered
        if (hovered && action.equipDragData) {
            const eqItem = getItem(action.equipDragData.itemId);
            if (eqItem) {
                const lines = buildEquipTooltip(eqItem, true);
                ui.activeTooltip = { x: x + size / 2, y: y - 4, lines };
            }
        }

        // Clip text to button bounds
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + 2, y + 2, size - 4, size - 4);
        ctx.clip();

        // Icon + Label (same layout as standard buttons)
        ctx.fillStyle = enabled ? '#e8d4a0' : '#3a3a42';
        ctx.font = "13px 'Inter', sans-serif";
        ctx.fillText(action.label, x + 4, y + 18);

        // Cost / sell info
        if (action.cost) {
            ctx.fillStyle = enabled ? '#a0a0aa' : '#3a3a42';
            ctx.font = "8px 'Inter', sans-serif";
            ctx.fillText(action.cost, x + 4, y + size - 6);
        }

        ctx.restore();

        // Register click area: initiates drag tracking (GameUI handles sell vs drop)
        if (action.equipDragData && ui.onEquipDrag) {
            const dragData = action.equipDragData;
            const onDrag = ui.onEquipDrag;
            ui.clickAreas.push({
                x, y, w: size, h: size,
                action: () => onDrag(dragData.itemId, dragData.slot, dragData.heroId, dragData.icon, x + size / 2, y + size / 2),
            });
        } else if (action.enabled) {
            ui.clickAreas.push({ x, y, w: size, h: size, action: action.action });
        }
        return;
    }

    // ---- EMPTY EQUIPMENT SLOT ----
    if (action.isEmptySlot) {
        ctx.fillStyle = '#0e0c0a';
        ctx.fillRect(x, y, size, size);
        ctx.strokeStyle = '#2a2218';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
        // Dim slot icon
        ctx.font = "18px 'Inter', sans-serif";
        ctx.globalAlpha = 0.3;
        ctx.fillText(action.label.split(' ')[0], x + size / 2 - 10, y + size / 2 + 6);
        ctx.globalAlpha = 1;
        // Slot label
        if (action.cost) {
            ctx.fillStyle = '#3a3a42';
            ctx.font = "8px 'Inter', sans-serif";
            ctx.fillText(action.cost, x + 4, y + size - 6);
        }
        return;
    }

    if (hovered && enabled) {
        ctx.fillStyle = C.uiButtonHover;
    } else {
        ctx.fillStyle = enabled ? C.uiButton : '#121214';
    }
    ctx.fillRect(x, y, size, size);

    // Border
    ctx.strokeStyle = hovered && enabled ? C.uiBorderLight : (enabled ? C.uiButtonBorder : '#1e1e24');
    ctx.lineWidth = hovered && enabled ? 1.5 : 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

    // Hover glow effect (zen crimson)
    if (hovered && enabled) {
        ctx.fillStyle = 'rgba(194,24,91,0.06)';
        ctx.fillRect(x + 1, y + 1, size - 2, size / 2);
    }

    // Building sprite icon (if this is a build menu button)
    if (action.buildingType !== undefined) {
        if (!enabled) ctx.globalAlpha = 0.35;
        drawBuildingIcon(ctx, x, y, size, action.buildingType);
        ctx.globalAlpha = 1;
    }

    // Skip text for building buttons (sprite icon is enough; tooltip shows details)
    const skipText = action.buildingType !== undefined;

    if (!skipText) {
        // Clip text to button bounds
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + 2, y + 2, size - 4, size - 4);
        ctx.clip();

        // Label
        ctx.fillStyle = enabled ? C.uiText : '#3a3a42';
        // Strip emoji on iOS (Canvas can't render them)
        let displayLabel = action.label;
        if (IS_IOS) {
            displayLabel = displayLabel.replace(/[\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '').trim();
            if (!displayLabel) displayLabel = action.hotkey || '•';
        }
        if (action.label === '🔨') {
            if (IS_IOS) {
                ctx.font = `bold ${Math.max(5, Math.round(size * 0.45))}px 'Inter', sans-serif`;
                ctx.fillText('B', x + size / 2 - 3, y + size / 2 + 3);
            } else {
                ctx.font = "24px 'Inter', sans-serif";
                const w = ctx.measureText(action.label).width;
                ctx.fillText(action.label, x + size / 2 - w / 2, y + size / 2 + 8);
            }
        } else {
            const fontSize = IS_IOS ? Math.max(7, Math.round(size * 0.32)) : 10;
            ctx.font = `bold ${fontSize}px 'Inter', sans-serif`;
            ctx.fillText(displayLabel, x + 3, y + Math.round(size * 0.55));
        }

        // Cost — only show on button face for non-building actions on iOS
        // On web, cost is shown in tooltip instead
        if (action.cost && IS_IOS && action.buildingType === undefined) {
            ctx.fillStyle = enabled ? C.uiTextDim : C.uiTextRed;
            ctx.font = "8px 'Inter', sans-serif";
            ctx.fillText(action.cost, x + 4, y + size - 16);
        }

        ctx.restore(); // Remove clip

        // Hotkey badge
        if (action.hotkey) {
            ctx.fillStyle = enabled ? C.uiBorderDark : '#16161a';
            ctx.fillRect(x + size - 16, y + size - 14, 14, 12);
            ctx.fillStyle = enabled ? C.uiHighlight : '#3a3a42';
            ctx.font = "bold 9px 'Inter', sans-serif";
            ctx.fillText(action.hotkey, x + size - 14, y + size - 5);
        }
    }

    // Register clickable area and hotkey
    if (enabled) {
        ui.clickAreas.push({ x, y, w: size, h: size, action: action.action });
        if (action.hotkey) {
            ui.hotkeyActions[action.hotkey.toLowerCase()] = action.action;
        }
    }

    // Set tooltip when hovered
    if (hovered && !action.isEquipment) {
        if (action.tooltip || action.label) {
            // Try matching equipment item first (Armory)
            const allItems = Object.values(EQUIPMENT_ITEMS);
            const matchItem = allItems.find((i: any) => i.description === action.tooltip);
            if (matchItem) {
                ui.activeTooltip = { x: x + size / 2, y: y - 4, lines: buildEquipTooltip(matchItem as any, false) };
            } else {
                // General tooltip
                const lines: string[] = [action.label];
                if (action.tooltip && action.tooltip !== action.cost) lines.push(action.tooltip);
                if (action.cost) lines.push(action.cost);
                ui.activeTooltip = { x: x + size / 2, y: y - 4, lines };
            }
        }
    }
}

/** Build localized tooltip lines for an equipment item */
function buildEquipTooltip(item: import('../../config/EquipmentData').EquipmentItem, isEquipped: boolean): string[] {
    const lines: string[] = [];
    // Name (localized)
    const localName = t(`equip.${item.id}`);
    lines.push(`${item.icon} ${localName}`);
    // Slot
    const slotName = t(`equip.slot.${item.slot}`);
    lines.push(`${t('equip.tier')} ${item.tier} · ${slotName}`);
    // Stats
    const stats: string[] = [];
    if (item.attackBonus > 0) stats.push(`+${item.attackBonus} ATK`);
    if (item.hpBonus > 0) stats.push(`+${item.hpBonus} HP`);
    if (item.armorBonus > 0) stats.push(`+${item.armorBonus} DEF`);
    if (item.speedBonus > 0) stats.push(`+${Math.round(item.speedBonus * 100)}% SPD`);
    if (item.atkSpeedBonus > 0) stats.push(`+${Math.round(item.atkSpeedBonus * 100)}% AS`);
    if (stats.length > 0) lines.push(stats.join('  '));
    // Effect
    if (item.effect !== 'none') {
        const effectName = t(`equip.effect.${item.effect}`);
        lines.push(`✦ ${effectName} ${Math.round(item.effectValue * 100)}%`);
    }
    // Cost
    const costParts: string[] = [];
    if (item.cost.gold) costParts.push(`${item.cost.gold}🪙`);
    if (item.cost.supplies) costParts.push(`${item.cost.supplies}📦`);
    lines.push(`${t('equip.cost')}: ${costParts.join(' ')}`);
    // Sell/Drop hint
    if (isEquipped) {
        const sellGold = Math.floor((item.cost.gold || 0) * 0.5);
        lines.push(`🖱 Click: ${t('equip.sell')} ${sellGold}🪙`);
        lines.push(`✋ ${t('equip.drop')}`);
    }
    return lines;
}


/** Draw a mini building sprite icon inside a button */
function drawBuildingIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, bType: BuildingType): void {
    const data = BUILDING_DATA[bType];
    const [tw, th] = data.size;
    const buildingW = tw * TILE_SIZE;
    const buildingH = th * TILE_SIZE;

    // Scale to fit inside the button with padding
    const pad = 4;
    const availW = size - pad * 2;
    const availH = size - pad * 2;
    const scale = Math.min(availW / buildingW, availH / buildingH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 1, y + 1, size - 2, size - 2);
    ctx.clip();

    // Translate to button center, then scale
    const offX = x + pad + (availW - buildingW * scale) / 2;
    const offY = y + pad + (availH - buildingH * scale) / 2;
    ctx.translate(offX, offY);
    ctx.scale(scale, scale);

    // Create minimal mock building for draw functions
    const mockB = {
        civilization: CivilizationType.LaMa,
        age: 2,
        team: 0,
        type: bType,
        tileX: 0, tileY: 0, tileW: tw, tileH: th,
        slotColor: '#3a88dd',
    } as any;

    // Draw building type
    switch (bType) {
        case BuildingType.TownCenter: drawTownCenter(mockB, ctx, 0, 0, buildingW, buildingH); break;
        case BuildingType.House: drawHouse(mockB, ctx, 0, 0, buildingW, buildingH); break;
        case BuildingType.Barracks: drawBarracks(mockB, ctx, 0, 0, buildingW, buildingH); break;
        case BuildingType.Market: drawCamp(mockB, ctx, 0, 0, buildingW, buildingH, C.gold); break;
        case BuildingType.Stable: drawStable(mockB, ctx, 0, 0, buildingW, buildingH); break;
        case BuildingType.Tower: drawTower(mockB, ctx, 0, 0, buildingW, buildingH); break;
        case BuildingType.HeroAltar: drawHeroAltar(mockB, ctx, 0, 0, buildingW, buildingH); break;
        case BuildingType.Blacksmith: drawBlacksmith(mockB, ctx, 0, 0, buildingW, buildingH); break;
        case BuildingType.GovernmentCenter: drawGovernmentCenter(mockB, ctx, 0, 0, buildingW, buildingH); break;
        case BuildingType.Armory: drawArmory(mockB, ctx, 0, 0, buildingW, buildingH); break;
        case BuildingType.Wall:
            // Simple stone block icon for wall
            ctx.fillStyle = '#8a8070';
            ctx.fillRect(8, 16, buildingW - 16, buildingH - 24);
            ctx.fillStyle = '#a09888';
            ctx.fillRect(10, 18, buildingW - 20, buildingH - 28);
            ctx.fillStyle = '#6a6058';
            ctx.fillRect(8, 16, buildingW - 16, 3);
            break;
    }

    ctx.restore();
}
