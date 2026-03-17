// ============================================================
//  PlayerState — Player resources, population, age, upgrades
// ============================================================

import {
    ResourceType, Cost, AGE_COSTS, getAgeNames,
    UpgradeType, UPGRADE_DATA, UnitType
} from "../config/GameConfig";

// Time (seconds) to advance to each age: [dummy, age2, age3, age4]
const AGE_UP_TIMES = [0, 40, 60, 90];

export interface ActiveResearch {
    upgradeType: UpgradeType;
    progress: number;
    time: number;
}

export class PlayerState {
    resources: Record<ResourceType, number> = {
        [ResourceType.Food]: 200,
        [ResourceType.Wood]: 200,
        [ResourceType.Gold]: 100,
        [ResourceType.Stone]: 100,
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
        [UpgradeType.GatherFood]: 0,
        [UpgradeType.GatherWood]: 0,
        [UpgradeType.GatherGold]: 0,
        [UpgradeType.GatherStone]: 0,
        [UpgradeType.CarryCapacity]: 0,
        [UpgradeType.VillagerSpeed]: 0,
        [UpgradeType.Architecture]: 0,
        [UpgradeType.MeleeHealth]: 0,
        [UpgradeType.Cartography]: 0,
        [UpgradeType.Trade]: 0,
    };

    // Active research (only one at a time per building)
    activeResearch: ActiveResearch | null = null;

    get ageName(): string { return getAgeNames()[this.age - 1]; }

    canAfford(cost: Cost): boolean {
        if (cost.food && this.resources.food < cost.food) return false;
        if (cost.wood && this.resources.wood < cost.wood) return false;
        if (cost.gold && this.resources.gold < cost.gold) return false;
        if (cost.stone && this.resources.stone < cost.stone) return false;
        return true;
    }

    spend(cost: Cost): boolean {
        if (!this.canAfford(cost)) return false;
        if (cost.food) this.resources.food -= cost.food;
        if (cost.wood) this.resources.wood -= cost.wood;
        if (cost.gold) this.resources.gold -= cost.gold;
        if (cost.stone) this.resources.stone -= cost.stone;
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

    /** Get the display level text for an upgrade */
    getUpgradeLevel(type: UpgradeType): number {
        return this.upgrades[type];
    }

    /** Get bonus attack for a unit type based on upgrades */
    getAttackBonus(unitType: UnitType): number {
        if (unitType === UnitType.Archer) {
            return this.upgrades[UpgradeType.RangedAttack] * UPGRADE_DATA[UpgradeType.RangedAttack].bonusPerLevel;
        }
        if (unitType === UnitType.Spearman || unitType === UnitType.Scout || unitType === UnitType.Swordsman || unitType === UnitType.Knight) {
            return this.upgrades[UpgradeType.MeleeAttack] * UPGRADE_DATA[UpgradeType.MeleeAttack].bonusPerLevel;
        }
        return 0;
    }

    /** Get bonus armor (damage reduction) for a unit type */
    getArmorBonus(unitType: UnitType): number {
        if (unitType === UnitType.Archer) {
            return this.upgrades[UpgradeType.RangedDefense] * UPGRADE_DATA[UpgradeType.RangedDefense].bonusPerLevel;
        }
        if (unitType === UnitType.Spearman || unitType === UnitType.Scout || unitType === UnitType.Swordsman || unitType === UnitType.Knight) {
            return this.upgrades[UpgradeType.MeleeDefense] * UPGRADE_DATA[UpgradeType.MeleeDefense].bonusPerLevel;
        }
        return 0;
    }

    /** Get bonus HP for a unit type based on defense upgrades */
    getHpBonus(unitType: UnitType): number {
        if (unitType === UnitType.Archer) {
            return this.upgrades[UpgradeType.RangedDefense] * 8;
        }
        if (unitType === UnitType.Spearman || unitType === UnitType.Scout || unitType === UnitType.Swordsman || unitType === UnitType.Knight) {
            return this.upgrades[UpgradeType.MeleeDefense] * 10;
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
            case ResourceType.Food: return this.upgrades[UpgradeType.GatherFood] * UPGRADE_DATA[UpgradeType.GatherFood].bonusPerLevel;
            case ResourceType.Wood: return this.upgrades[UpgradeType.GatherWood] * UPGRADE_DATA[UpgradeType.GatherWood].bonusPerLevel;
            case ResourceType.Gold: return this.upgrades[UpgradeType.GatherGold] * UPGRADE_DATA[UpgradeType.GatherGold].bonusPerLevel;
            case ResourceType.Stone: return this.upgrades[UpgradeType.GatherStone] * UPGRADE_DATA[UpgradeType.GatherStone].bonusPerLevel;
            default: return 0;
        }
    }

    /** Generic gather speed bonus (average of all, for backward compat) */
    get gatherSpeedBonus(): number {
        return (
            this.upgrades[UpgradeType.GatherFood] +
            this.upgrades[UpgradeType.GatherWood] +
            this.upgrades[UpgradeType.GatherGold] +
            this.upgrades[UpgradeType.GatherStone]
        ) / 4 * 0.15;
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
