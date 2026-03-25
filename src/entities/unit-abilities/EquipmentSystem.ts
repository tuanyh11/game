// ============================================================
//  EquipmentSystem — Equip/unequip items on hero units
//  Manages stat application and special effects
// ============================================================

import type { Unit } from '../Unit';
import { EquipmentSlot, EquipmentEffect, getItem } from '../../config/EquipmentData';
import type { EquipmentItem } from '../../config/EquipmentData';

export interface EquipmentBonuses {
    attackBonus: number;
    hpBonus: number;
    armorBonus: number;
    speedBonus: number;       // multiplier
    atkSpeedBonus: number;    // multiplier
    // Special effects
    hasSplash: boolean;
    splashValue: number;
    hasLifesteal: boolean;
    lifestealValue: number;
    hasReflect: boolean;
    reflectValue: number;
    hasAuraBoost: boolean;
    auraBoostValue: number;
    hasAntiHeal: boolean;
    antiHealValue: number;    // reduce enemy healing by this %
    hasSlow: boolean;
    slowValue: number;        // slow enemy move speed by this %
    hasRegen: boolean;
    regenValue: number;       // HP/s regen
}

const EMPTY_BONUSES: EquipmentBonuses = {
    attackBonus: 0, hpBonus: 0, armorBonus: 0, speedBonus: 0, atkSpeedBonus: 0,
    hasSplash: false, splashValue: 0,
    hasLifesteal: false, lifestealValue: 0,
    hasReflect: false, reflectValue: 0,
    hasAuraBoost: false, auraBoostValue: 0,
    hasAntiHeal: false, antiHealValue: 0,
    hasSlow: false, slowValue: 0,
    hasRegen: false, regenValue: 0,
};

/**
 * Equip an item to a hero unit.
 * Returns true if equipped successfully.
 */
export function equipItem(unit: Unit, itemId: string): boolean {
    if (!unit.isHero) return false;

    const item = getItem(itemId);
    if (!item) return false;

    const slot = item.slot;

    // Unequip current item in slot first
    const currentItemId = unit.equipment[slot];
    if (currentItemId) {
        unequipItem(unit, slot);
    }

    // Set the equipped item
    unit.equipment[slot] = itemId;

    // Apply stat bonuses immediately
    unit.attack += item.attackBonus;
    unit.maxHp += item.hpBonus;
    unit.hp += item.hpBonus;
    unit.armor += item.armorBonus;

    // Recalculate cached bonuses
    unit._equipBonuses = calculateBonuses(unit);

    return true;
}

/**
 * Unequip an item from a slot.
 * Returns the unequipped item ID, or null.
 */
export function unequipItem(unit: Unit, slot: EquipmentSlot): string | null {
    const itemId = unit.equipment[slot];
    if (!itemId) return null;

    const item = getItem(itemId);
    if (item) {
        // Remove stat bonuses
        unit.attack -= item.attackBonus;
        unit.maxHp -= item.hpBonus;
        unit.hp = Math.min(unit.hp, unit.maxHp);
        unit.armor -= item.armorBonus;
    }

    unit.equipment[slot] = null;
    unit._equipBonuses = calculateBonuses(unit);
    return itemId;
}

/**
 * Calculate aggregated bonuses from all equipped items.
 * Called when equipment changes. Result is cached on the unit.
 */
function calculateBonuses(unit: Unit): EquipmentBonuses {
    const bonuses: EquipmentBonuses = { ...EMPTY_BONUSES };

    for (const slot of Object.values(EquipmentSlot)) {
        const itemId = unit.equipment[slot];
        if (!itemId) continue;
        const item = getItem(itemId);
        if (!item) continue;

        bonuses.speedBonus += item.speedBonus;
        bonuses.atkSpeedBonus += item.atkSpeedBonus;

        switch (item.effect) {
            case EquipmentEffect.Splash:
                bonuses.hasSplash = true;
                bonuses.splashValue = Math.max(bonuses.splashValue, item.effectValue);
                break;
            case EquipmentEffect.Lifesteal:
                bonuses.hasLifesteal = true;
                bonuses.lifestealValue = Math.max(bonuses.lifestealValue, item.effectValue);
                break;
            case EquipmentEffect.Reflect:
                bonuses.hasReflect = true;
                bonuses.reflectValue = Math.max(bonuses.reflectValue, item.effectValue);
                break;
            case EquipmentEffect.AuraBoost:
                bonuses.hasAuraBoost = true;
                bonuses.auraBoostValue = Math.max(bonuses.auraBoostValue, item.effectValue);
                break;
            case EquipmentEffect.AntiHeal:
                bonuses.hasAntiHeal = true;
                bonuses.antiHealValue = Math.max(bonuses.antiHealValue, item.effectValue);
                break;
            case EquipmentEffect.Slow:
                bonuses.hasSlow = true;
                bonuses.slowValue = Math.max(bonuses.slowValue, item.effectValue);
                break;
            case EquipmentEffect.Regen:
                bonuses.hasRegen = true;
                bonuses.regenValue += item.effectValue; // regen stacks additively
                break;
        }
    }

    return bonuses;
}

/** Get the equipment bonuses (cached on unit) */
export function getEquipBonuses(unit: Unit): EquipmentBonuses {
    return unit._equipBonuses ?? EMPTY_BONUSES;
}
