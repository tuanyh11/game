// ============================================================
//  PlayerState — Player resources, population, age, upgrades
// ============================================================

import {
    ResourceType, Cost, AGE_COSTS, getAgeNames,
    UpgradeType, UPGRADE_DATA, UnitType, isCivElite, isCivCavalry
} from "../config/GameConfig";
import { getItem } from "../config/EquipmentData";
import type { EquipmentItem } from "../config/EquipmentData";


// Time (seconds) to advance to each age: [dummy, age2, age3, age4]
const AGE_UP_TIMES = [0, 40, 60, 75];

export interface ActiveResearch {
    upgradeType: UpgradeType;
    progress: number;
    time: number;
}

export class PlayerState {
    resources: Record<ResourceType, number> = {
        [ResourceType.Supplies]: 100,
        [ResourceType.Gold]: 200,
    };

    population = 0;
    maxPopulation = 0;
    queuedPopulation = 0; // units in training queue
    age = 1; // 1-4

    // Age advancement progress
    isAgingUp = false;
    ageUpProgress = 0;      // current progress in seconds
    ageUpTime = 0;          // total time needed
    ageUpTargetAge = 0;     // which age we're advancing to

    // Upgrade levels (0 = not researched)
    upgrades: Record<UpgradeType, number> = {
        [UpgradeType.MeleeAttack]: 0,
        [UpgradeType.RangedAttack]: 0,
        [UpgradeType.MeleeDefense]: 0,
        [UpgradeType.RangedDefense]: 0,
        [UpgradeType.GatherSupplies]: 0,
        [UpgradeType.GatherGold]: 0,
        [UpgradeType.CarryCapacity]: 0,
        [UpgradeType.VillagerSpeed]: 0,
        [UpgradeType.Architecture]: 0,
        [UpgradeType.MeleeHealth]: 0,
        [UpgradeType.Cartography]: 0,
        [UpgradeType.Trade]: 0,
        [UpgradeType.EliteAttack]: 0,
        [UpgradeType.EliteDefense]: 0,
        [UpgradeType.CavalryAttack]: 0,
    };

    // Active research (only one at a time per building)
    activeResearch: ActiveResearch | null = null;

    // Equipment crafting (separate from research — runs at Blacksmith)
    activeCraft: { itemId: string; progress: number; time: number } | null = null;
    craftedItems: string[] = [];  // item IDs crafted but not yet equipped

    get ageName(): string { return getAgeNames()[this.age - 1]; }

    canAfford(cost: Cost): boolean {
        if (cost.supplies && this.resources.supplies < cost.supplies) return false;
        if (cost.gold && this.resources.gold < cost.gold) return false;
        return true;
    }

    spend(cost: Cost): boolean {
        if (!this.canAfford(cost)) return false;
        if (cost.supplies) this.resources.supplies -= cost.supplies;
        if (cost.gold) this.resources.gold -= cost.gold;
        return true;
    }

    addResource(type: ResourceType, amount: number): void {
        this.resources[type] += amount;
    }

    canAgeUp(): boolean {
        if (this.age >= 4) return false;
        if (this.isAgingUp) return false; // already in progress
        return this.canAfford(AGE_COSTS[this.age]);
    }

    /** Start the age-up process (spends resources, begins timer) */
    ageUp(): boolean {
        if (!this.canAgeUp()) return false;
        this.spend(AGE_COSTS[this.age]);
        this.isAgingUp = true;
        this.ageUpProgress = 0;
        this.ageUpTargetAge = this.age + 1;
        this.ageUpTime = AGE_UP_TIMES[this.age] ?? 60;
        return true;
    }

    /** Update age-up progress each frame. Returns true when age-up completes. */
    updateAgeUp(dt: number): boolean {
        if (!this.isAgingUp) return false;
        this.ageUpProgress += dt;
        if (this.ageUpProgress >= this.ageUpTime) {
            // Complete!
            this.age = this.ageUpTargetAge;
            this.isAgingUp = false;
            this.ageUpProgress = 0;
            this.ageUpTime = 0;
            this.ageUpTargetAge = 0;
            return true;
        }
        return false;
    }

    /** Get age-up progress as 0-1 fraction */
    get ageUpPercent(): number {
        if (!this.isAgingUp || this.ageUpTime <= 0) return 0;
        return Math.min(1, this.ageUpProgress / this.ageUpTime);
    }

    hasPopSpace(additionalPop: number = 0): boolean {
        return this.population + additionalPop < this.maxPopulation;
    }

    // ---- Upgrade System ----

    /** Check if an upgrade can be started */
    canResearch(type: UpgradeType): boolean {
        const data = UPGRADE_DATA[type];
        const level = this.upgrades[type];
        if (level >= data.maxLevel) return false;
        if (this.age < data.ageRequired[level]) return false;
        if (this.activeResearch) return false; // already researching
        return this.canAfford(data.costs[level]);
    }

    /** Start researching an upgrade */
    startResearch(type: UpgradeType): boolean {
        if (!this.canResearch(type)) return false;
        const data = UPGRADE_DATA[type];
        const level = this.upgrades[type];
        this.spend(data.costs[level]);
        this.activeResearch = {
            upgradeType: type,
            progress: 0,
            time: data.researchTime[level],
        };
        return true;
    }

    /** Update research progress (called every frame) */
    updateResearch(dt: number): boolean {
        if (!this.activeResearch) return false;
        this.activeResearch.progress += dt;
        if (this.activeResearch.progress >= this.activeResearch.time) {
            // Complete!
            const type = this.activeResearch.upgradeType;
            this.upgrades[type]++;
            this.activeResearch = null;
            return true; // research completed this frame
        }
        return false;
    }

    /** Cancel current research and refund resources */
    cancelResearch(): boolean {
        if (!this.activeResearch) return false;
        const type = this.activeResearch.upgradeType;
        const data = UPGRADE_DATA[type];
        const level = this.upgrades[type];
        const cost = data.costs[level];
        // Refund resources
        if (cost.supplies) this.resources.supplies += cost.supplies;
        if (cost.gold) this.resources.gold += cost.gold;
        this.activeResearch = null;
        return true;
    }

    /** Get the display level text for an upgrade */
    getUpgradeLevel(type: UpgradeType): number {
        return this.upgrades[type];
    }




    // ---- Equipment Crafting ----

    /** Check if an equipment item can be crafted */
    canCraftItem(itemId: string): boolean {
        if (this.activeCraft) return false; // already crafting
        const item = getItem(itemId);
        if (!item) return false;
        if (this.age < item.ageRequired) return false;
        return this.canAfford(item.cost as Cost);
    }

    /** Start crafting an equipment item */
    startCraft(itemId: string): boolean {
        if (!this.canCraftItem(itemId)) return false;
        const item = getItem(itemId)!;
        this.spend(item.cost as Cost);
        this.activeCraft = {
            itemId: item.id,
            progress: 0,
            time: item.craftTime,
        };
        return true;
    }

    /** Update craft progress (called every frame). Returns item ID when complete. */
    updateCraft(dt: number): string | null {
        if (!this.activeCraft) return null;
        this.activeCraft.progress += dt;
        if (this.activeCraft.progress >= this.activeCraft.time) {
            const itemId = this.activeCraft.itemId;
            this.craftedItems.push(itemId);
            this.activeCraft = null;
            return itemId;
        }
        return null;
    }

    /** Get craft progress as 0-1 */
    get craftPercent(): number {
        if (!this.activeCraft || this.activeCraft.time <= 0) return 0;
        return Math.min(1, this.activeCraft.progress / this.activeCraft.time);
    }

    /** Get bonus attack for a unit type based on upgrades */
    getAttackBonus(unitType: UnitType): number {
        if (unitType === UnitType.Archer) {
            return this.upgrades[UpgradeType.RangedAttack] * UPGRADE_DATA[UpgradeType.RangedAttack].bonusPerLevel;
        }
        if (unitType === UnitType.Spearman || unitType === UnitType.Swordsman) {
            return this.upgrades[UpgradeType.MeleeAttack] * UPGRADE_DATA[UpgradeType.MeleeAttack].bonusPerLevel;
        }
        // Scout & Knight: cavalry attack bonus ONLY (no melee double-dip)
        if (unitType === UnitType.Scout || unitType === UnitType.Knight) {
            return this.upgrades[UpgradeType.CavalryAttack] * UPGRADE_DATA[UpgradeType.CavalryAttack].bonusPerLevel;
        }
        // Elite & unique cavalry units
        if (isCivElite(unitType) || isCivCavalry(unitType)) {
            return this.upgrades[UpgradeType.EliteAttack] * UPGRADE_DATA[UpgradeType.EliteAttack].bonusPerLevel
                 + this.upgrades[UpgradeType.CavalryAttack] * UPGRADE_DATA[UpgradeType.CavalryAttack].bonusPerLevel;
        }
        return 0;
    }

    /** Get bonus armor (damage reduction) for a unit type */
    getArmorBonus(unitType: UnitType): number {
        if (unitType === UnitType.Archer) {
            return this.upgrades[UpgradeType.RangedDefense] * UPGRADE_DATA[UpgradeType.RangedDefense].bonusPerLevel;
        }
        if (unitType === UnitType.Spearman || unitType === UnitType.Swordsman) {
            return this.upgrades[UpgradeType.MeleeDefense] * UPGRADE_DATA[UpgradeType.MeleeDefense].bonusPerLevel;
        }
        // Scout & Knight: cavalry armor ONLY (no melee defense double-dip)
        if (unitType === UnitType.Scout || unitType === UnitType.Knight) {
            return this.upgrades[UpgradeType.CavalryAttack] * 1;
        }
        // Elite & unique cavalry units
        if (isCivElite(unitType) || isCivCavalry(unitType)) {
            return this.upgrades[UpgradeType.EliteDefense] * UPGRADE_DATA[UpgradeType.EliteDefense].bonusPerLevel
                 + this.upgrades[UpgradeType.CavalryAttack] * 1;
        }
        return 0;
    }

    /** Get bonus HP for a unit type based on defense upgrades */
    getHpBonus(unitType: UnitType): number {
        if (unitType === UnitType.Archer) {
            return this.upgrades[UpgradeType.RangedDefense] * 8;
        }
        if (unitType === UnitType.Spearman || unitType === UnitType.Swordsman) {
            return this.upgrades[UpgradeType.MeleeDefense] * 10;
        }
        // Scout & Knight: cavalry HP bonus ONLY (no melee HP double-dip)
        if (unitType === UnitType.Scout || unitType === UnitType.Knight) {
            return this.upgrades[UpgradeType.CavalryAttack] * 10;
        }
        // Elite & unique cavalry units
        if (isCivElite(unitType) || isCivCavalry(unitType)) {
            return this.upgrades[UpgradeType.EliteDefense] * 15
                 + this.upgrades[UpgradeType.CavalryAttack] * 10;
        }
        return 0;
    }

    /** Get total upgrade level (sum of all) for visual tier */
    get totalUpgradeLevel(): number {
        return Object.values(this.upgrades).reduce((s, v) => s + v, 0);
    }

    // ---- Economy Upgrade Getters ----

    /** Get gather speed bonus for a specific resource type */
    getGatherBonus(resType: ResourceType): number {
        switch (resType) {
            case ResourceType.Supplies: return this.upgrades[UpgradeType.GatherSupplies] * UPGRADE_DATA[UpgradeType.GatherSupplies].bonusPerLevel;
            case ResourceType.Gold: return this.upgrades[UpgradeType.GatherGold] * UPGRADE_DATA[UpgradeType.GatherGold].bonusPerLevel;
            default: return 0;
        }
    }

    /** Generic gather speed bonus (average of all, for backward compat) */
    get gatherSpeedBonus(): number {
        return (
            this.upgrades[UpgradeType.GatherSupplies] +
            this.upgrades[UpgradeType.GatherGold]
        ) / 2 * 0.15;
    }

    /** Get carry capacity bonus from upgrades (e.g. +5 per level) */
    get carryCapacityBonus(): number {
        return this.upgrades[UpgradeType.CarryCapacity] * UPGRADE_DATA[UpgradeType.CarryCapacity].bonusPerLevel;
    }

    /** Get villager speed multiplier bonus from upgrades */
    get villagerSpeedBonus(): number {
        return this.upgrades[UpgradeType.VillagerSpeed] * UPGRADE_DATA[UpgradeType.VillagerSpeed].bonusPerLevel;
    }

    // ---- Government Center Upgrade Getters ----

    /** Architecture: +20% Building HP */
    get buildingHpBonus(): number {
        return this.upgrades[UpgradeType.Architecture] * UPGRADE_DATA[UpgradeType.Architecture].bonusPerLevel;
    }

    /** Architecture: +20% Construction Speed */
    get constructionSpeedBonus(): number {
        return this.upgrades[UpgradeType.Architecture] * UPGRADE_DATA[UpgradeType.Architecture].bonusPerLevel;
    }

    /** Melee Health: +15% HP for melee units */
    get meleeHpBonus(): number {
        return this.upgrades[UpgradeType.MeleeHealth] * UPGRADE_DATA[UpgradeType.MeleeHealth].bonusPerLevel;
    }

    /** Cartography: Map Reveal with Allies */
    get hasCartography(): boolean {
        return this.upgrades[UpgradeType.Cartography] > 0;
    }

    /** Trade: Allow sending resources to allies */
    get hasTrade(): boolean {
        return this.upgrades[UpgradeType.Trade] > 0;
    }
}
