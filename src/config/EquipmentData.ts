// ============================================================
//  Equipment Data — Hero equipment items definitions
//  Items can be crafted at the Blacksmith and equipped to heroes
// ============================================================

export enum EquipmentSlot {
    Weapon = 'weapon',
    Armor = 'armor',
    Accessory = 'accessory',
}

export enum EquipmentEffect {
    None = 'none',
    Splash = 'splash',           // War Axe: splash damage to 1 nearby enemy
    AtkSpeed = 'atkSpeed',       // Dragonbone Sword: +10% attack speed
    Reflect = 'reflect',         // Dragon Scale: reflect 10% damage
    Lifesteal = 'lifesteal',     // Blood Ring: 15% lifesteal
    AuraBoost = 'auraBoost',     // Crown of Kings: +30% aura radius
    AntiHeal = 'antiHeal',       // Cursed Blade: reduce enemy healing
    Slow = 'slow',               // Frost Hammer: slow enemies on hit
    Regen = 'regen',             // Health Potion: HP regen over time
}

export interface EquipmentItem {
    id: string;
    name: string;
    icon: string;
    slot: EquipmentSlot;
    tier: 1 | 2 | 3;
    ageRequired: number;
    cost: { gold: number; supplies?: number };
    craftTime: number;           // seconds to craft
    // Stat bonuses
    attackBonus: number;
    hpBonus: number;
    armorBonus: number;
    speedBonus: number;          // multiplier (e.g. 0.15 = +15%)
    atkSpeedBonus: number;       // multiplier (e.g. 0.10 = +10%)
    // Special effect
    effect: EquipmentEffect;
    effectValue: number;         // effect strength (e.g. 0.15 = 15%)
    description: string;
}

// ============================================================
//  ALL EQUIPMENT ITEMS (balanced for competitive play)
// ============================================================

export const EQUIPMENT_ITEMS: Record<string, EquipmentItem> = {
    // ── WEAPONS ──────────────────────────────────────────────

    // T1: Cheap, basic damage. Good early-game power spike.
    iron_blade: {
        id: 'iron_blade',
        name: 'Iron Blade',
        icon: '🗡️',
        slot: EquipmentSlot.Weapon,
        tier: 1,
        ageRequired: 2,
        cost: { gold: 120, supplies: 80 },
        craftTime: 15,
        attackBonus: 4,
        hpBonus: 0,
        armorBonus: 0,
        speedBonus: 0,
        atkSpeedBonus: 0,
        effect: EquipmentEffect.None,
        effectValue: 0,
        description: '+4 ATK',
    },

    // T2: AOE damage — strong in teamfights but expensive.
    war_axe: {
        id: 'war_axe',
        name: 'War Axe',
        icon: '⚔️',
        slot: EquipmentSlot.Weapon,
        tier: 2,
        ageRequired: 3,
        cost: { gold: 220, supplies: 120 },
        craftTime: 25,
        attackBonus: 7,
        hpBonus: 0,
        armorBonus: 0,
        speedBonus: 0,
        atkSpeedBonus: 0,
        effect: EquipmentEffect.Splash,
        effectValue: 0.40,         // 40% damage splash to 1 nearby
        description: '+7 ATK, Splash 40%',
    },

    // T2: Anti-heal — counter lifesteal/regen heroes. Niche but powerful.
    cursed_blade: {
        id: 'cursed_blade',
        name: 'Cursed Blade',
        icon: '🔪',
        slot: EquipmentSlot.Weapon,
        tier: 2,
        ageRequired: 3,
        cost: { gold: 200, supplies: 80 },
        craftTime: 22,
        attackBonus: 5,
        hpBonus: 0,
        armorBonus: 0,
        speedBonus: 0,
        atkSpeedBonus: 0,
        effect: EquipmentEffect.AntiHeal,
        effectValue: 0.50,         // Reduce enemy healing by 50% for 4s
        description: '+5 ATK, -50% Enemy Heal',
    },

    // T3: Best DPS weapon. High ATK + attack speed.
    dragonbone_sword: {
        id: 'dragonbone_sword',
        name: 'Dragonbone Sword',
        icon: '🐉',
        slot: EquipmentSlot.Weapon,
        tier: 3,
        ageRequired: 4,
        cost: { gold: 350, supplies: 200 },
        craftTime: 38,
        attackBonus: 12,
        hpBonus: 0,
        armorBonus: 0,
        speedBonus: 0,
        atkSpeedBonus: 0.12,       // +12% attack speed
        effect: EquipmentEffect.AtkSpeed,
        effectValue: 0.12,
        description: '+12 ATK, +12% Atk Speed',
    },

    // T3: Slow weapon — control/utility. Less raw damage, but CC.
    frost_hammer: {
        id: 'frost_hammer',
        name: 'Frost Hammer',
        icon: '🔨',
        slot: EquipmentSlot.Weapon,
        tier: 3,
        ageRequired: 4,
        cost: { gold: 300, supplies: 240 },
        craftTime: 35,
        attackBonus: 8,
        hpBonus: 0,
        armorBonus: 0,
        speedBonus: 0,
        atkSpeedBonus: 0,
        effect: EquipmentEffect.Slow,
        effectValue: 0.30,         // Slow enemy 30% for 2s on hit
        description: '+8 ATK, Slow 30%',
    },

    // ── ARMOR ────────────────────────────────────────────────

    // T1: Basic defense. Affordable.
    chain_mail: {
        id: 'chain_mail',
        name: 'Chain Mail',
        icon: '🛡️',
        slot: EquipmentSlot.Armor,
        tier: 1,
        ageRequired: 2,
        cost: { gold: 100, supplies: 80 },
        craftTime: 15,
        attackBonus: 0,
        hpBonus: 25,
        armorBonus: 2,
        speedBonus: 0,
        atkSpeedBonus: 0,
        effect: EquipmentEffect.None,
        effectValue: 0,
        description: '+25 HP, +2 Armor',
    },

    // T2: Solid mid-game defense.
    plate_armor: {
        id: 'plate_armor',
        name: 'Plate Armor',
        icon: '🪖',
        slot: EquipmentSlot.Armor,
        tier: 2,
        ageRequired: 3,
        cost: { gold: 180, supplies: 140 },
        craftTime: 25,
        attackBonus: 0,
        hpBonus: 50,
        armorBonus: 4,
        speedBonus: 0,
        atkSpeedBonus: 0,
        effect: EquipmentEffect.None,
        effectValue: 0,
        description: '+50 HP, +4 Armor',
    },

    // T3: Ultimate tank. Reflect makes attackers pay.
    dragon_scale: {
        id: 'dragon_scale',
        name: 'Dragon Scale',
        icon: '🐲',
        slot: EquipmentSlot.Armor,
        tier: 3,
        ageRequired: 4,
        cost: { gold: 350, supplies: 200 },
        craftTime: 38,
        attackBonus: 0,
        hpBonus: 80,
        armorBonus: 6,
        speedBonus: 0,
        atkSpeedBonus: 0,
        effect: EquipmentEffect.Reflect,
        effectValue: 0.12,         // 12% damage reflect
        description: '+80 HP, +6 Armor, Reflect 12%',
    },

    // ── ACCESSORIES ──────────────────────────────────────────

    // T1: Health Potion — instant regen, cheap. Good sustain.
    health_potion: {
        id: 'health_potion',
        name: 'Health Potion',
        icon: '🧪',
        slot: EquipmentSlot.Accessory,
        tier: 1,
        ageRequired: 1,           // Available from Age 1!
        cost: { gold: 80, supplies: 60 },
        craftTime: 10,
        attackBonus: 0,
        hpBonus: 15,
        armorBonus: 0,
        speedBonus: 0,
        atkSpeedBonus: 0,
        effect: EquipmentEffect.Regen,
        effectValue: 3,            // +3 HP/s regeneration
        description: '+15 HP, +3 HP/s Regen',
    },

    // T1: Mobility. Good for chasing or escaping.
    swift_boots: {
        id: 'swift_boots',
        name: 'Swift Boots',
        icon: '👢',
        slot: EquipmentSlot.Accessory,
        tier: 1,
        ageRequired: 2,
        cost: { gold: 100, supplies: 60 },
        craftTime: 15,
        attackBonus: 0,
        hpBonus: 0,
        armorBonus: 0,
        speedBonus: 0.12,          // +12% move speed
        atkSpeedBonus: 0,
        effect: EquipmentEffect.None,
        effectValue: 0,
        description: '+12% Move Speed',
    },

    // T2: Lifesteal — sustain in fights. Countered by antiHeal.
    blood_ring: {
        id: 'blood_ring',
        name: 'Blood Ring',
        icon: '💍',
        slot: EquipmentSlot.Accessory,
        tier: 2,
        ageRequired: 3,
        cost: { gold: 200, supplies: 100 },
        craftTime: 25,
        attackBonus: 2,
        hpBonus: 0,
        armorBonus: 0,
        speedBonus: 0,
        atkSpeedBonus: 0,
        effect: EquipmentEffect.Lifesteal,
        effectValue: 0.12,         // 12% lifesteal
        description: '+2 ATK, 12% Lifesteal',
    },

    // T3: Support item. Boosts aura range + gives stats.
    crown_of_kings: {
        id: 'crown_of_kings',
        name: 'Crown of Kings',
        icon: '👑',
        slot: EquipmentSlot.Accessory,
        tier: 3,
        ageRequired: 4,
        cost: { gold: 300, supplies: 240 },
        craftTime: 38,
        attackBonus: 3,
        hpBonus: 40,
        armorBonus: 0,
        speedBonus: 0,
        atkSpeedBonus: 0,
        effect: EquipmentEffect.AuraBoost,
        effectValue: 0.25,         // +25% aura radius
        description: '+3 ATK, +40 HP, +25% Aura',
    },
};

/** Get equipment items filtered by slot */
export function getItemsBySlot(slot: EquipmentSlot): EquipmentItem[] {
    return Object.values(EQUIPMENT_ITEMS).filter(i => i.slot === slot);
}

/** Get all items available at a given age, sorted by tier */
export function getAvailableItems(age: number): EquipmentItem[] {
    return Object.values(EQUIPMENT_ITEMS)
        .filter(i => i.ageRequired <= age)
        .sort((a, b) => a.tier - b.tier || a.slot.localeCompare(b.slot));
}

/** Get item by ID */
export function getItem(id: string): EquipmentItem | undefined {
    return EQUIPMENT_ITEMS[id];
}
