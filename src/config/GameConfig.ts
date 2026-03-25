// ============================================================
//  GameConfig — All enums, constants, and data tables
// ============================================================

import { t } from '../i18n/i18n';
import { PLATFORM_MAP_COLS, PLATFORM_MAP_ROWS } from './PlatformConfig';

export const TILE_SIZE = 16;
export const MAP_COLS = PLATFORM_MAP_COLS;
export const MAP_ROWS = PLATFORM_MAP_ROWS;
export const WORLD_W = MAP_COLS * TILE_SIZE;
export const WORLD_H = MAP_ROWS * TILE_SIZE;

// ---- Unique ID generator ----
let _nextId = 1;
export function genId(): number { return _nextId++; }
export function resetId(): void { _nextId = 1; }

// ---- Enums ----
export enum TerrainType {
    Grass, GrassDark, GrassLight, GrassFlower,
    Sand, Dirt, DirtDark, Rock,
    Water, Bridge
}

export enum ResourceType { Gold = 'gold', Supplies = 'supplies' }

export enum ResourceNodeType {
    Tree = 'tree', GoldMine = 'goldMine',
}

export enum UnitType {
    Villager = 'villager', Spearman = 'spearman', Archer = 'archer',
    Scout = 'scout', Swordsman = 'swordsman', Knight = 'knight',

    // Unique Civilization Heroes
    HeroSpartacus = 'heroSpartacus',       // La Mã (Roman)
    HeroZarathustra = 'heroZarathustra',   // Ba Tư (Persian)
    HeroQiJiguang = 'heroQiJiguang',     // Đại Minh (Ming/Chinese)
    HeroMusashi = 'heroMusashi',           // Yamato (Japanese)
    HeroRagnar = 'heroRagnar',             // Viking (Norse)

    // Civilization-unique elite units (Age 3)
    Immortal = 'immortal',       // Ba Tư — Bất Tử
    ChuKoNu = 'chuKoNu',         // Đại Minh — Cẩm Y Vệ
    Ninja = 'ninja',              // Yamato — Ninja
    Centurion = 'centurion',      // La Mã — Centurion
    Ulfhednar = 'ulfhednar',      // Viking — Chiến Binh Sói

    // Civilization-unique cavalry (Age 3, trained from Stable)
    WarElephant = 'warElephant', // Ba Tư
    FireLancer = 'fireLancer',   // Đại Minh
    Yabusame = 'yabusame',       // Yamato
    Equites = 'equites',         // La Mã
    BearRider = 'bearRider',       // Viking

    // Neutral Creep Monsters
    CreepWolf = 'creepWolf',
    CreepSkeleton = 'creepSkeleton',
    CreepOgre = 'creepOgre',
    CreepDragon = 'creepDragon',           // European dragon
    CreepDragonEast = 'creepDragonEast',   // Asian dragon (Rồng Phương Đông)

    // Test Dummy
    TargetDummy = 'targetDummy',
}

export enum BuildingType {
    TownCenter = 'townCenter', House = 'house', Barracks = 'barracks',
    Market = 'market',
    Stable = 'stable', Tower = 'tower', HeroAltar = 'heroAltar',
    Blacksmith = 'blacksmith', GovernmentCenter = 'governmentCenter',
    Wall = 'wall', StoragePit = 'storagePit', Granary = 'granary',
    Armory = 'armory',
}

export enum UnitState { Idle, Moving, Gathering, Returning, Building, Attacking }

// ---- Civilization (Faction) Types ----
export enum CivilizationType {
    BaTu = 'baTu',       // Persian — strong cavalry & economy
    DaiMinh = 'daiTong',  // Ming/Chinese — espionage, imperial guard
    Yamato = 'yamato',    // Japanese — fast infantry, samurai
    LaMa = 'laMa',        // Roman — balanced, strong buildings
    Viking = 'viking',    // Viking — aggressive melee
}

export interface CivilizationData {
    name: string;
    icon: string;
    description: string;
    // Stat bonuses (multipliers, 1.0 = normal)
    bonuses: {
        infantryAttack: number;   // melee infantry attack multiplier
        infantryHp: number;       // melee infantry HP multiplier
        cavalryAttack: number;    // cavalry attack multiplier
        cavalryHp: number;        // cavalry HP multiplier
        archerAttack: number;     // ranged attack multiplier
        archerRange: number;      // ranged range multiplier
        villagerGather: number;   // gather speed multiplier
        buildingHp: number;       // building HP multiplier
        trainSpeed: number;       // training speed multiplier (lower = faster)
        towerDamage: number;      // tower damage multiplier
    };
    // Visual theming
    accentColor: string;          // faction accent color
    secondaryColor: string;       // secondary accent
    shieldEmblem: string;         // emoji emblem on shields
    helmetStyle: 'western' | 'eastern' | 'norse' | 'roman' | 'persian';
}

export const CIVILIZATION_DATA: Record<CivilizationType, CivilizationData> = {
    [CivilizationType.BaTu]: {
        get name() { return t('civ.baTu'); },
        icon: '🐘',
        get description() { return t('civ.baTu.desc'); },
        bonuses: {
            infantryAttack: 1.0, infantryHp: 1.0,
            cavalryAttack: 1.20, cavalryHp: 1.15,
            archerAttack: 1.0, archerRange: 1.0,
            villagerGather: 1.15, buildingHp: 1.0,
            trainSpeed: 1.0, towerDamage: 1.0,
        },
        accentColor: '#c9a84c', secondaryColor: '#8a6f3e',
        shieldEmblem: '☀', helmetStyle: 'persian',
    },
    [CivilizationType.DaiMinh]: {
        get name() { return t('civ.daiTong'); },
        icon: '🐲',
        get description() { return t('civ.daiTong.desc'); },
        bonuses: {
            infantryAttack: 1.0, infantryHp: 1.05,
            cavalryAttack: 0.85, cavalryHp: 0.95,
            archerAttack: 1.15, archerRange: 1.20,
            villagerGather: 1.0, buildingHp: 1.20,
            trainSpeed: 1.0, towerDamage: 1.25,
        },
        accentColor: '#dd3333', secondaryColor: '#aa1111',
        shieldEmblem: '龍', helmetStyle: 'eastern',
    },
    [CivilizationType.Yamato]: {
        get name() { return t('civ.yamato'); },
        icon: '⛩️',
        get description() { return t('civ.yamato.desc'); },
        bonuses: {
            infantryAttack: 1.20, infantryHp: 1.10,
            cavalryAttack: 0.90, cavalryHp: 0.90,
            archerAttack: 1.05, archerRange: 1.0,
            villagerGather: 1.0, buildingHp: 1.0,
            trainSpeed: 0.80, towerDamage: 1.0,
        },
        accentColor: '#ff6b6b', secondaryColor: '#5555aa',
        shieldEmblem: '菊', helmetStyle: 'eastern',
    },
    [CivilizationType.LaMa]: {
        get name() { return t('civ.laMa'); },
        icon: '🏛️',
        get description() { return t('civ.laMa.desc'); },
        bonuses: {
            infantryAttack: 1.10, infantryHp: 1.15,
            cavalryAttack: 1.05, cavalryHp: 1.05,
            archerAttack: 1.0, archerRange: 1.0,
            villagerGather: 1.05, buildingHp: 1.20,
            trainSpeed: 0.95, towerDamage: 1.10,
        },
        accentColor: '#8b0000', secondaryColor: '#daa520',
        shieldEmblem: '🦅', helmetStyle: 'roman',
    },
    [CivilizationType.Viking]: {
        get name() { return t('civ.viking'); },
        icon: '⚓',
        get description() { return t('civ.viking.desc'); },
        bonuses: {
            infantryAttack: 1.25, infantryHp: 1.15,
            cavalryAttack: 0.80, cavalryHp: 0.85,
            archerAttack: 0.90, archerRange: 0.90,
            villagerGather: 1.10, buildingHp: 1.05,
            trainSpeed: 0.90, towerDamage: 0.90,
        },
        accentColor: '#5588bb', secondaryColor: '#334466',
        shieldEmblem: '⚡', helmetStyle: 'norse',
    },
};

// Helper: check if a unit type is infantry (melee)
export function isInfantryType(type: UnitType): boolean {
    return type === UnitType.Spearman || type === UnitType.Swordsman
        || type === UnitType.ChuKoNu || type === UnitType.Ninja
        || type === UnitType.Centurion || type === UnitType.Ulfhednar;
}

// Helper: check if a unit type is cavalry
export function isCavalryType(type: UnitType): boolean {
    return type === UnitType.Scout || type === UnitType.Knight
        || type === UnitType.WarElephant || type === UnitType.FireLancer
        || type === UnitType.Yabusame || type === UnitType.Equites || type === UnitType.BearRider;
}

// Helper: check if a unit type is a civ-unique cavalry
export function isCivCavalry(type: UnitType): boolean {
    return type === UnitType.WarElephant || type === UnitType.FireLancer
        || type === UnitType.Yabusame || type === UnitType.Equites || type === UnitType.BearRider;
}

// Helper: check if a unit type is ranged
export function isRangedType(type: UnitType): boolean {
    return type === UnitType.Archer || type === UnitType.Immortal || type === UnitType.WarElephant;
}

// Helper: check if a unit type is a civ-unique elite
export function isCivElite(type: UnitType): boolean {
    return type === UnitType.Immortal || type === UnitType.ChuKoNu
        || type === UnitType.Ninja || type === UnitType.Centurion || type === UnitType.Ulfhednar;
}

// Map: which civ owns which elite unit (from Barracks)
export const CIV_ELITE_UNIT: Record<CivilizationType, UnitType> = {
    [CivilizationType.BaTu]: UnitType.Immortal,
    [CivilizationType.DaiMinh]: UnitType.ChuKoNu,
    [CivilizationType.Yamato]: UnitType.Ninja,
    [CivilizationType.LaMa]: UnitType.Centurion,
    [CivilizationType.Viking]: UnitType.Ulfhednar,
};

// Map: which civ owns which unique cavalry (from Stable)
export const CIV_UNIQUE_CAVALRY: Record<CivilizationType, UnitType> = {
    [CivilizationType.BaTu]: UnitType.WarElephant,
    [CivilizationType.DaiMinh]: UnitType.FireLancer,
    [CivilizationType.Yamato]: UnitType.Yabusame,
    [CivilizationType.LaMa]: UnitType.Equites,
    [CivilizationType.Viking]: UnitType.BearRider,
};

// Map: which civ owns which hero (from HeroAltar)
export const CIV_HERO: Record<CivilizationType, UnitType> = {
    [CivilizationType.LaMa]: UnitType.HeroSpartacus,
    [CivilizationType.BaTu]: UnitType.HeroZarathustra,
    [CivilizationType.DaiMinh]: UnitType.HeroQiJiguang,
    [CivilizationType.Yamato]: UnitType.HeroMusashi,
    [CivilizationType.Viking]: UnitType.HeroRagnar,
};

// Helper: check if a unit type is a hero
export function isCivHero(type: UnitType): boolean {
    return type === UnitType.HeroSpartacus || type === UnitType.HeroZarathustra
        || type === UnitType.HeroQiJiguang || type === UnitType.HeroMusashi || type === UnitType.HeroRagnar;
}

// ============================================================
//  Civ-Specific Unit Modifiers — Tactical Triangle System
//  Each civ can fine-tune individual unit types beyond global bonuses.
//  Values are multipliers (1.0 = no change). Missing entries = 1.0.
// ============================================================
export interface CivUnitModifier {
    hp?: number;          // HP multiplier
    attack?: number;      // Attack multiplier
    speed?: number;       // Movement speed multiplier
    range?: number;       // Attack range multiplier
    attackSpeed?: number; // Attack speed multiplier (<1 = faster)
    name?: string;        // Civ-specific unit name override
}

export const CIV_UNIT_MODIFIERS: Partial<Record<CivilizationType, Partial<Record<UnitType, CivUnitModifier>>>> = {
    // ---- BA TƯ: Strong cavalry & economy, average infantry ----
    [CivilizationType.BaTu]: {
        [UnitType.Swordsman]: { attack: 1.10, speed: 1.05, name: 'Cấm Quân' },         // Elite swordsman
        [UnitType.Scout]: { speed: 1.10, name: 'Kỵ Sĩ Sa Mạc' },                 // Desert rider — fastest scout
        [UnitType.Knight]: { attack: 1.20, hp: 1.15, name: 'Kỵ Binh Nặng' },      // Heavy cavalry — strongest
        [UnitType.HeroZarathustra]: { attack: 1.12, hp: 0.93, range: 1.05, name: '🔥 Zarathustra' },         // Pháp sư lửa thánh — AOE cực mạnh
    },
    // ---- ĐẠI MINH: Strong range & defense, weak cavalry ----
    [CivilizationType.DaiMinh]: {
        [UnitType.Spearman]: { hp: 1.10, speed: 0.95, name: 'Trường Thương' },      // Tanky but slow
        [UnitType.Swordsman]: { hp: 1.10, name: 'Đao Binh' },                         // Durable
        [UnitType.Archer]: { attack: 1.15, range: 1.20, name: 'Thần Nỏ' },        // Best range in game
        [UnitType.Scout]: { speed: 0.90, name: 'Trinh Sát Kỵ' },                  // Slowest scout
        [UnitType.Knight]: { attack: 0.85, hp: 0.95, name: 'Thiết Kỵ' },          // Weakest cavalry
        [UnitType.HeroQiJiguang]: { attack: 1.15, hp: 1.15, speed: 0.95, name: '🛡️ Thích Kế Quang' },        // Danh tướng kỵ hải tặc
    },
    // ---- YAMATO: Fast infantry & samurai, weak cavalry ----
    [CivilizationType.Yamato]: {
        [UnitType.Spearman]: { speed: 1.10, hp: 0.95, range: 1.15, name: 'Ashigaru' },           // Fast + Yari Jutsu longer reach
        [UnitType.Swordsman]: { attack: 1.15, speed: 1.08, attackSpeed: 0.92, name: 'Samurai' }, // Elite infantry
        [UnitType.Archer]: { attackSpeed: 0.92, name: 'Yumi Thủ' },                 // Faster shooting
        [UnitType.Scout]: { speed: 1.05, name: 'Kỵ Trinh Sát' },                  // Slightly faster
        [UnitType.Knight]: { attack: 0.90, hp: 0.90, name: 'Kỵ Mã Samurai' },     // Weakened cavalry
        [UnitType.HeroMusashi]: { attack: 1.25, hp: 0.85, name: '⚔️ Miyamoto Musashi' }, // Kiếm thánh — Duelist, không còn attackSpeed siêu OP
    },
    // ---- LA MÃ: Balanced, durable, no weakness ----
    [CivilizationType.LaMa]: {
        [UnitType.Spearman]: { hp: 1.15, name: 'Hasta' },                             // Tanky spear
        [UnitType.Swordsman]: { hp: 1.15, attack: 1.10, name: 'Legionnaire' },        // All-round strong
        [UnitType.Knight]: { hp: 1.05, attack: 1.05, name: 'Cataphract' },         // Slightly better
        [UnitType.HeroSpartacus]: { hp: 1.08, attack: 1.00, name: '🗡️ Spartacus' },
    },
    // ---- VIKING: Extreme melee, very weak cavalry & range ----
    [CivilizationType.Viking]: {
        [UnitType.Spearman]: { attack: 1.10, hp: 0.95, speed: 1.05, name: 'Chiến Binh' }, // Aggressive
        [UnitType.Swordsman]: { attack: 1.25, hp: 0.90, attackSpeed: 0.85, name: 'Berserker' }, // Highest ATK, low HP
        [UnitType.Archer]: { attack: 0.90, range: 0.90, name: 'Cung Thủ' },        // Weakest range
        [UnitType.Scout]: { speed: 0.85, hp: 1.20, name: 'Trinh Sát Bộ' },       // On foot, tanky, slow
        [UnitType.Knight]: { attack: 0.80, hp: 0.85, speed: 0.80, name: 'Huscarl' }, // Mounted berserker, weakest
        [UnitType.HeroRagnar]: { attack: 1.30, hp: 0.96, attackSpeed: 0.82, name: '⚔️ Ragnar Lothbrok' },
    },
};

// ---- Cost interface ----
export interface Cost { gold?: number; supplies?: number; }

// ---- Building data ----
export interface BuildingData {
    name: string; cost: Cost; size: [number, number]; hp: number;
    popProvided?: number; isDropOff?: ResourceType[]; trainable?: UnitType[];
    ageRequired: number;
}

export const BUILDING_DATA: Record<BuildingType, BuildingData> = {
    [BuildingType.TownCenter]: {
        name: 'Nhà Chính', cost: { supplies: 300 }, size: [4, 4], hp: 2400, popProvided: 5,
        isDropOff: [ResourceType.Gold, ResourceType.Supplies],
        trainable: [UnitType.Villager], ageRequired: 2,
    },
    [BuildingType.House]: {
        name: 'Nhà Ở', cost: { supplies: 25 }, size: [3, 3], hp: 550, popProvided: 5, ageRequired: 1,
    },
    [BuildingType.Barracks]: {
        name: 'Trại Lính', cost: { supplies: 150 }, size: [4, 4], hp: 1200,
        trainable: [UnitType.Spearman, UnitType.Archer, UnitType.Swordsman,
        UnitType.Immortal, UnitType.ChuKoNu, UnitType.Ninja, UnitType.Centurion, UnitType.Ulfhednar], ageRequired: 1,
    },
    [BuildingType.Market]: {
        name: 'Kho Tài Nguyên', cost: { supplies: 80 }, size: [3, 3], hp: 700,
        isDropOff: [ResourceType.Gold, ResourceType.Supplies], ageRequired: 1,
    },
    [BuildingType.Stable]: {
        name: 'Chuồng Ngựa', cost: { supplies: 150, gold: 40 }, size: [4, 4], hp: 1200,
        trainable: [
            UnitType.Scout, UnitType.Knight,
            UnitType.WarElephant, UnitType.FireLancer, UnitType.Yabusame, UnitType.Equites, UnitType.BearRider
        ], ageRequired: 2,
    },
    [BuildingType.Tower]: {
        name: 'Tháp Canh', cost: { supplies: 150 }, size: [3, 3], hp: 1500, ageRequired: 2,
    },
    [BuildingType.HeroAltar]: {
        name: 'Đền Tướng', cost: { gold: 160, supplies: 80 }, size: [4, 4], hp: 1800,
        trainable: [UnitType.HeroSpartacus, UnitType.HeroZarathustra, UnitType.HeroQiJiguang, UnitType.HeroMusashi, UnitType.HeroRagnar],
        ageRequired: 2,
    },
    [BuildingType.Blacksmith]: {
        name: 'Lò Rèn', cost: { supplies: 120, gold: 40 }, size: [3, 3], hp: 1000,
        ageRequired: 2,
    },
    [BuildingType.GovernmentCenter]: {
        name: 'Nhà Chính Phủ', cost: { supplies: 250 }, size: [4, 4], hp: 2000,
        isDropOff: [ResourceType.Gold, ResourceType.Supplies],
        ageRequired: 3,
    },
    [BuildingType.Wall]: {
        name: 'Tường Thành', cost: { supplies: 10 }, size: [1, 1], hp: 2400,
        ageRequired: 2,
    },
    [BuildingType.StoragePit]: {
        name: 'Hố Lưu Trữ', cost: { supplies: 100 }, size: [3, 3], hp: 600,
        isDropOff: [ResourceType.Gold, ResourceType.Supplies], ageRequired: 1,
    },
    [BuildingType.Granary]: {
        name: 'Kho Thóc', cost: { supplies: 100 }, size: [3, 3], hp: 600,
        isDropOff: [ResourceType.Supplies], ageRequired: 1,
    },
    [BuildingType.Armory]: {
        name: 'Quân Khí Xưởng', cost: { supplies: 160, gold: 80 }, size: [3, 3], hp: 1200,
        ageRequired: 2,
    },
};

// ---- Tower attack stats per age (1-indexed, age 1 = no tower) ----
export const TOWER_ATTACK_DATA: { damage: number; range: number; attackSpeed: number; arrowCount: number }[] = [
    { damage: 0, range: 0, attackSpeed: 9, arrowCount: 0 },       // Age 1: no tower
    { damage: 6, range: 5 * TILE_SIZE, attackSpeed: 2.0, arrowCount: 1 },  // Age 2: basic watchtower
    { damage: 10, range: 6 * TILE_SIZE, attackSpeed: 1.6, arrowCount: 2 }, // Age 3: guard tower (2 arrows)
    { damage: 15, range: 7 * TILE_SIZE, attackSpeed: 1.2, arrowCount: 3 }, // Age 4: keep (3 arrows, fire)
];

// ---- Tower Upgrade Types (Warcraft III-style specialization) ----
export enum TowerUpgradeType {
    None = 'none',
    Fire = 'fire',      // Liệt Hỏa — high DPS, splash
    Ice = 'ice',        // Hàn Băng — slows enemies
    Cannon = 'cannon',  // Thần Công — AoE, anti-building
}

export interface TowerUpgradeData {
    name: string;
    icon: string;
    cost: Cost;
    ageRequired: number;
    upgradeTime: number; // seconds
    description: string;
    // Combat bonuses (multiplied on top of base TOWER_ATTACK_DATA)
    damageMult: number;
    rangeMult: number;
    attackSpeedMult: number; // lower = faster
    arrowCountBonus: number;
    splashRadius: number;   // 0 = no splash
    slowPct: number;        // 0-1, slow effect on targets
    slowDuration: number;   // seconds
    bonusVsBuilding: number; // extra damage vs buildings
    hpBonus: number;        // extra HP added to the tower
}

export const TOWER_UPGRADE_DATA: Record<TowerUpgradeType, TowerUpgradeData> = {
    [TowerUpgradeType.None]: {
        name: 'Tháp Canh', icon: '🏗️', cost: {}, ageRequired: 1, upgradeTime: 0,
        description: '',
        damageMult: 1, rangeMult: 1, attackSpeedMult: 1, arrowCountBonus: 0,
        splashRadius: 0, slowPct: 0, slowDuration: 0, bonusVsBuilding: 0, hpBonus: 0,
    },
    [TowerUpgradeType.Fire]: {
        name: 'Tháp Liệt Hỏa', icon: '🔥',
        cost: { gold: 200, supplies: 100 },
        ageRequired: 3, upgradeTime: 25,
        description: '+50% sát thương, +2 mũi tên, splash nhỏ',
        damageMult: 1.5, rangeMult: 1.0, attackSpeedMult: 0.9, arrowCountBonus: 2,
        splashRadius: TILE_SIZE * 1.5, slowPct: 0, slowDuration: 0,
        bonusVsBuilding: 0, hpBonus: 300,
    },
    [TowerUpgradeType.Ice]: {
        name: 'Tháp Hàn Băng', icon: '❄️',
        cost: { gold: 150, supplies: 150 },
        ageRequired: 3, upgradeTime: 25,
        description: 'Làm chậm địch 30%, +tầm bắn xa',
        damageMult: 1.0, rangeMult: 1.3, attackSpeedMult: 1.1, arrowCountBonus: 0,
        splashRadius: 0, slowPct: 0.3, slowDuration: 3.0,
        bonusVsBuilding: 0, hpBonus: 200,
    },
    [TowerUpgradeType.Cannon]: {
        name: 'Tháp Thần Công', icon: '💣',
        cost: { gold: 250, supplies: 200 },
        ageRequired: 3, upgradeTime: 30,
        description: 'AoE lớn, bắn chậm, +dmg vs công trình',
        damageMult: 2.5, rangeMult: 1.2, attackSpeedMult: 1.8, arrowCountBonus: -1,
        splashRadius: TILE_SIZE * 3, slowPct: 0, slowDuration: 0,
        bonusVsBuilding: 15, hpBonus: 500,
    },
};

// ---- Unit data ----
export interface UnitData {
    name: string; cost: Cost; hp: number; speed: number; attack: number;
    range: number; attackSpeed: number; sight: number;
    trainTime: number; ageRequired: number;
}

export const UNIT_DATA: Record<UnitType, UnitData> = {
    [UnitType.Villager]: { name: 'Dân', cost: { gold: 40 }, hp: 25, speed: 90, attack: 3, range: 24, attackSpeed: 2.0, sight: 6, trainTime: 16, ageRequired: 1 },
    [UnitType.Spearman]: { name: 'Lính Giáo', cost: { gold: 50 }, hp: 60, speed: 80, attack: 8, range: 32, attackSpeed: 1.4, sight: 10, trainTime: 14, ageRequired: 1 },
    [UnitType.Archer]: { name: 'Cung Thủ', cost: { gold: 40, supplies: 20 }, hp: 35, speed: 80, attack: 5, range: 120, attackSpeed: 1.6, sight: 10, trainTime: 20, ageRequired: 2 },
    [UnitType.Scout]: { name: 'Trinh Sát', cost: { gold: 65 }, hp: 75, speed: 120, attack: 4, range: 30, attackSpeed: 1.0, sight: 12, trainTime: 20, ageRequired: 1 },
    [UnitType.Swordsman]: { name: 'Kiếm Sĩ', cost: { gold: 50, supplies: 25 }, hp: 80, speed: 70, attack: 12, range: 28, attackSpeed: 1.2, sight: 10, trainTime: 17, ageRequired: 2 },
    [UnitType.Knight]: { name: 'Kỵ Sĩ', cost: { gold: 60, supplies: 50 }, hp: 120, speed: 140, attack: 14, range: 35, attackSpeed: 1.8, sight: 10, trainTime: 23, ageRequired: 3 },
    // Unique Heroes (max level 6)
    [UnitType.HeroSpartacus]: { name: '🗡️ Spartacus', cost: { gold: 200 }, hp: 240, speed: 100, attack: 28, range: 38, attackSpeed: 1.0, sight: 10, trainTime: 36, ageRequired: 2 },
    [UnitType.HeroZarathustra]: { name: '🔥 Zarathustra', cost: { gold: 200 }, hp: 150, speed: 90, attack: 22, range: 180, attackSpeed: 1.2, sight: 12, trainTime: 36, ageRequired: 2 },
    [UnitType.HeroQiJiguang]: { name: '🛡️ T. Kế Quang', cost: { gold: 200 }, hp: 220, speed: 95, attack: 26, range: 45, attackSpeed: 1.1, sight: 10, trainTime: 36, ageRequired: 2 },
    [UnitType.HeroMusashi]: { name: '⚔️ Musashi', cost: { gold: 200 }, hp: 165, speed: 110, attack: 28, range: 35, attackSpeed: 0.9, sight: 9, trainTime: 36, ageRequired: 2 },
    [UnitType.HeroRagnar]: { name: '🪓 Ragnar', cost: { gold: 200 }, hp: 210, speed: 90, attack: 28, range: 40, attackSpeed: 1.1, sight: 10, trainTime: 36, ageRequired: 2 },

    // Civ-unique elite units
    [UnitType.Immortal]: { name: 'Bất Tử Quân', cost: { gold: 45, supplies: 50 }, hp: 55, speed: 80, attack: 7, range: 120, attackSpeed: 1.3, sight: 10, trainTime: 22, ageRequired: 3 },
    [UnitType.ChuKoNu]: { name: 'Cẩm Y Vệ', cost: { gold: 40, supplies: 45 }, hp: 75, speed: 115, attack: 9, range: 28, attackSpeed: 1.1, sight: 10, trainTime: 18, ageRequired: 3 },
    [UnitType.Ninja]: { name: 'Ninja', cost: { gold: 50, supplies: 40 }, hp: 50, speed: 130, attack: 10, range: 26, attackSpeed: 0.9, sight: 10, trainTime: 22, ageRequired: 3 },
    [UnitType.Centurion]: { name: 'Centurion', cost: { gold: 40, supplies: 65 }, hp: 110, speed: 65, attack: 10, range: 80, attackSpeed: 1.5, sight: 10, trainTime: 24, ageRequired: 3 },
    [UnitType.Ulfhednar]: { name: 'Chiến Binh Sói', cost: { gold: 35, supplies: 45 }, hp: 85, speed: 90, attack: 11, range: 28, attackSpeed: 1.1, sight: 10, trainTime: 20, ageRequired: 3 },

    // Civ-unique cavalry (Stable)
    [UnitType.WarElephant]: { name: '🐘 Voi Chiến', cost: { gold: 65, supplies: 100 }, hp: 160, speed: 60, attack: 16, range: 70, attackSpeed: 2.0, sight: 12, trainTime: 26, ageRequired: 3 },
    [UnitType.FireLancer]: { name: '🎇 Hỏa Thương', cost: { gold: 50, supplies: 55 }, hp: 100, speed: 135, attack: 15, range: 35, attackSpeed: 1.8, sight: 10, trainTime: 24, ageRequired: 3 },
    [UnitType.Yabusame]: { name: '🏹 Yabusame', cost: { gold: 55, supplies: 50 }, hp: 85, speed: 145, attack: 10, range: 140, attackSpeed: 1.2, sight: 11, trainTime: 20, ageRequired: 3 },
    [UnitType.Equites]: { name: '🛡️ Equites', cost: { gold: 50, supplies: 55 }, hp: 125, speed: 130, attack: 12, range: 35, attackSpeed: 1.5, sight: 10, trainTime: 22, ageRequired: 3 },
    [UnitType.BearRider]: { name: '🐻 Kỵ Binh Gấu', cost: { gold: 35, supplies: 60 }, hp: 140, speed: 110, attack: 12, range: 30, attackSpeed: 1.4, sight: 10, trainTime: 18, ageRequired: 3 },

    // Neutral Creeps
    [UnitType.CreepWolf]: { name: '🐺 Sói Hoang', cost: {}, hp: 40, speed: 100, attack: 6, range: 24, attackSpeed: 1.0, sight: 6, trainTime: 0, ageRequired: 1 },
    [UnitType.CreepSkeleton]: { name: '💀 Bộ Xương', cost: {}, hp: 80, speed: 70, attack: 10, range: 30, attackSpeed: 1.3, sight: 8, trainTime: 0, ageRequired: 1 },
    [UnitType.CreepOgre]: { name: '🧌 Ogre', cost: {}, hp: 200, speed: 50, attack: 18, range: 32, attackSpeed: 1.8, sight: 8, trainTime: 0, ageRequired: 1 },
    [UnitType.CreepDragon]: { name: '🐉 Rồng Tây', cost: {}, hp: 800, speed: 40, attack: 40, range: 80, attackSpeed: 2.0, sight: 12, trainTime: 0, ageRequired: 1 },
    [UnitType.CreepDragonEast]: { name: '🐲 Rồng Đông', cost: {}, hp: 650, speed: 55, attack: 35, range: 100, attackSpeed: 1.6, sight: 14, trainTime: 0, ageRequired: 1 },

    [UnitType.TargetDummy]: { name: 'Hình Nhân', cost: {}, hp: 999999999, speed: 0, attack: 0, range: 0, attackSpeed: 0, sight: 4, trainTime: 1, ageRequired: 1 },
};

// ---- Neutral Creep Camp Config ----
export const CREEP_TEAM = 99; // Neutral hostile team

export enum CreepCampType {
    WolfDen = 'wolfDen',
    SkeletonTomb = 'skeletonTomb',
    OgreCamp = 'ogreCamp',
    DragonLair = 'dragonLair',
    DragonLairEast = 'dragonLairEast',
}

export interface CreepCampData {
    name: string;
    units: { type: UnitType; count: number }[];
    aggroRange: number;     // tiles — how far creeps detect enemies
    leashRange: number;     // tiles — how far creeps chase before returning
    dropGold: number;       // total gold dropped when camp cleared
    dropXP: number;         // total XP given to hero
    respawnTime: number;    // seconds until camp respawns
    campRadius: number;     // tiles — visual camp area radius
}

export const CREEP_CAMP_DATA: Record<CreepCampType, CreepCampData> = {
    [CreepCampType.WolfDen]: {
        name: '🐺 Hang Sói',
        units: [{ type: UnitType.CreepWolf, count: 4 }],
        aggroRange: 6, leashRange: 12, dropGold: 50, dropXP: 60,
        respawnTime: 120, campRadius: 4,
    },
    [CreepCampType.SkeletonTomb]: {
        name: '💀 Lăng Mộ',
        units: [{ type: UnitType.CreepSkeleton, count: 3 }],
        aggroRange: 8, leashRange: 14, dropGold: 80, dropXP: 100,
        respawnTime: 150, campRadius: 5,
    },
    [CreepCampType.OgreCamp]: {
        name: '🧌 Trại Ogre',
        units: [{ type: UnitType.CreepOgre, count: 2 }],
        aggroRange: 8, leashRange: 14, dropGold: 120, dropXP: 150,
        respawnTime: 180, campRadius: 5,
    },
    [CreepCampType.DragonLair]: {
        name: '🐉 Hang Rồng Tây',
        units: [{ type: UnitType.CreepDragon, count: 1 }],
        aggroRange: 12, leashRange: 18, dropGold: 250, dropXP: 300,
        respawnTime: 300, campRadius: 6,
    },
    [CreepCampType.DragonLairEast]: {
        name: '🐲 Long Cung',
        units: [{ type: UnitType.CreepDragonEast, count: 1 }],
        aggroRange: 14, leashRange: 20, dropGold: 220, dropXP: 280,
        respawnTime: 280, campRadius: 6,
    },
};

export function isCreepType(type: UnitType): boolean {
    return type === UnitType.CreepWolf || type === UnitType.CreepSkeleton ||
        type === UnitType.CreepOgre || type === UnitType.CreepDragon || type === UnitType.CreepDragonEast;
}

// ---- Gather rates ----
export const GATHER_RATES: Record<ResourceNodeType, { rate: number; carry: number; resourceType: ResourceType }> = {
    [ResourceNodeType.Tree]: { rate: 0.65, carry: 10, resourceType: ResourceType.Supplies },
    [ResourceNodeType.GoldMine]: { rate: 0.55, carry: 10, resourceType: ResourceType.Gold },
};

// ---- Ages ----
export const AGE_COSTS: Cost[] = [
    {},
    { gold: 250, supplies: 100 },
    { gold: 500, supplies: 250 },
    { gold: 700, supplies: 400 },
];
export function getAgeNames(): string[] {
    return [t('age.1'), t('age.2'), t('age.3'), t('age.4')];
}
export const AGE_NAMES = ['Thời Đồ Đá', 'Thời Phong Kiến', 'Thời Lâu Đài', 'Thời Đế Chế'];

// ---- Upgrade system ----
export enum UpgradeType {
    MeleeAttack = 'meleeAttack',
    RangedAttack = 'rangedAttack',
    MeleeDefense = 'meleeDefense',
    RangedDefense = 'rangedDefense',
    // Economy upgrades (Market)
    GatherSupplies = 'gatherSupplies',
    GatherGold = 'gatherGold',
    CarryCapacity = 'carryCapacity',
    VillagerSpeed = 'villagerSpeed',
    // Blacksmith: Elite/Special unit upgrades
    EliteAttack = 'eliteAttack',
    EliteDefense = 'eliteDefense',
    // Government Center upgrades
    Architecture = 'architecture',
    MeleeHealth = 'meleeHealth',
    Cartography = 'cartography',
    Trade = 'trade',

    // Blacksmith cavalry upgrade
    CavalryAttack = 'cavalryAttack',
}

export function updateGameTranslations(): void {
    for (const [key, data] of Object.entries(BUILDING_DATA)) {
        Object.defineProperty(data, 'name', { get: () => t(`bld.${key}`), configurable: true });
    }
    for (const [key, data] of Object.entries(UNIT_DATA)) {
        Object.defineProperty(data, 'name', { get: () => t(`unit.${key}`), configurable: true });
    }
    for (const [key, data] of Object.entries(UPGRADE_DATA)) {
        Object.defineProperty(data, 'name', { get: () => t(`upg.${key}`), configurable: true });
    }

    // Civilizations
    const civKeys = Object.keys(CIVILIZATION_DATA) as CivilizationType[];
    for (const civ of civKeys) {
        // Only string replacement if we didn't use getters. Since we just ran `node -e` giving them getters, we don't need to override them again.
        // But for completeness:
        Object.defineProperty(CIVILIZATION_DATA[civ], 'name', { get: () => t(`civ.${civ}`), configurable: true });
        Object.defineProperty(CIVILIZATION_DATA[civ], 'description', { get: () => t(`civ.${civ}.desc`), configurable: true });
    }

    // Civ unit modifiers
    const modKeys = Object.keys(CIV_UNIT_MODIFIERS) as CivilizationType[];
    for (const civ of modKeys) {
        const mods = CIV_UNIT_MODIFIERS[civ];
        if (!mods) continue;
        const ukeys = Object.keys(mods) as UnitType[];
        for (const u of ukeys) {
            const m = mods[u];
            if (m && typeof m.name === 'string') {
                // E.g 'Cấm Quân'
                const transKey = `civUnit.${civ}.${u}`;
                Object.defineProperty(m, 'name', { get: () => t(transKey), configurable: true });
            }
        }
    }
}

export interface UpgradeData {
    name: string;
    icon: string;
    description: string;
    maxLevel: number;
    costs: Cost[];            // cost per level
    bonusPerLevel: number;    // stat bonus per level
    researchTime: number[];   // research time per level
    ageRequired: number[];    // minimum age per level
}

export const UPGRADE_DATA: Record<UpgradeType, UpgradeData> = {
    [UpgradeType.MeleeAttack]: {
        name: 'Tấn Công Cận Chiến',
        icon: '⚔',
        description: '+2 Tấn công cho Lính Giáo, Kiếm Sĩ',
        maxLevel: 3,
        costs: [
            { supplies: 100, gold: 50 },
            { supplies: 200, gold: 100 },
            { supplies: 250, gold: 170 },
        ],
        bonusPerLevel: 2,
        researchTime: [25, 36, 50],
        ageRequired: [2, 3, 4],
    },
    [UpgradeType.RangedAttack]: {
        name: 'Tấn Công Tầm Xa',
        icon: '🏹',
        description: '+2 Tấn công cho Cung Thủ',
        maxLevel: 3,
        costs: [
            { supplies: 100, gold: 75 },
            { supplies: 200, gold: 150 },
            { supplies: 250, gold: 200 },
        ],
        bonusPerLevel: 2,
        researchTime: [28, 40, 55],
        ageRequired: [2, 3, 4],
    },
    [UpgradeType.MeleeDefense]: {
        name: 'Giáp Cận Chiến',
        icon: '🛡',
        description: '+1 Giáp, +10 HP cho lính cận chiến (Giáo, Kiếm)',
        maxLevel: 3,
        costs: [
            { supplies: 175 },
            { supplies: 350 },
            { supplies: 450 },
        ],
        bonusPerLevel: 1,
        researchTime: [25, 36, 50],
        ageRequired: [2, 3, 4],
    },
    [UpgradeType.RangedDefense]: {
        name: 'Giáp Tầm Xa',
        icon: '🪖',
        description: '+1 Giáp, +8 HP cho cung thủ',
        maxLevel: 3,
        costs: [
            { supplies: 200 },
            { supplies: 300 },
            { supplies: 450 },
        ],
        bonusPerLevel: 1,
        researchTime: [28, 36, 55],
        ageRequired: [2, 3, 4],
    },
    // ---- ECONOMY UPGRADES (Market) ----
    [UpgradeType.GatherSupplies]: {
        name: 'Khai Thác Vật Tư',
        icon: '📦',
        description: '+15% tốc độ thu hoạch vật tư',
        maxLevel: 3,
        costs: [
            { supplies: 100, gold: 25 },
            { supplies: 200, gold: 50 },
            { supplies: 350, gold: 100 },
        ],
        bonusPerLevel: 0.15,
        researchTime: [20, 32, 45],
        ageRequired: [1, 2, 3],
    },
    [UpgradeType.GatherGold]: {
        name: 'Khai Thác Vàng',
        icon: '🪙',
        description: '+15% tốc độ khai thác vàng',
        maxLevel: 3,
        costs: [
            { supplies: 75, gold: 50 },
            { supplies: 150, gold: 100 },
            { supplies: 250, gold: 200 },
        ],
        bonusPerLevel: 0.15,
        researchTime: [20, 32, 45],
        ageRequired: [1, 2, 3],
    },
    [UpgradeType.CarryCapacity]: {
        name: 'Sức Mang',
        icon: '📦',
        description: '+5 sức mang tài nguyên cho dân',
        maxLevel: 3,
        costs: [
            { supplies: 100 },
            { supplies: 200 },
            { supplies: 400 },
        ],
        bonusPerLevel: 5,
        researchTime: [16, 28, 40],
        ageRequired: [1, 2, 3],
    },
    [UpgradeType.VillagerSpeed]: {
        name: 'Tốc Độ Dân',
        icon: '🏃',
        description: '+10% tốc độ di chuyển cho dân',
        maxLevel: 2,
        costs: [
            { supplies: 100, gold: 50 },
            { supplies: 200, gold: 100 },
        ],
        bonusPerLevel: 0.10,
        researchTime: [24, 40],
        ageRequired: [2, 3],
    },
    [UpgradeType.Architecture]: {
        name: 'Kiến Trúc Học',
        icon: '🏗️',
        description: '+20% Máu công trình, +20% Tốc độ xây dựng',
        maxLevel: 1,
        costs: [{ supplies: 500 }],
        bonusPerLevel: 0.20,
        researchTime: [45],
        ageRequired: [3],
    },
    [UpgradeType.MeleeHealth]: {
        name: 'Chiến Binh Thép',
        icon: '💪',
        description: '+15% Máu cho Lính Giáo, Kiếm Sĩ',
        maxLevel: 1,
        costs: [{ supplies: 250, gold: 150 }],
        bonusPerLevel: 0.15,
        researchTime: [40],
        ageRequired: [3],
    },
    [UpgradeType.Cartography]: {
        name: 'Bản Đồ Học',
        icon: '🗺️',
        description: 'Chia sẻ tầm nhìn với Đồng minh',
        maxLevel: 1,
        costs: [{ supplies: 100, gold: 100 }],
        bonusPerLevel: 1,
        researchTime: [30],
        ageRequired: [3],
    },
    [UpgradeType.Trade]: {
        name: 'Giao Thương',
        icon: '🤝',
        description: 'Cho phép gửi tài nguyên cho Đồng minh',
        maxLevel: 1,
        costs: [{ supplies: 150, gold: 150 }],
        bonusPerLevel: 1,
        researchTime: [40],
        ageRequired: [3],
    },
    // ---- BLACKSMITH: Elite / Special Unit Upgrades ----
    [UpgradeType.EliteAttack]: {
        name: 'Rèn Vũ Khí Tinh Nhuệ',
        icon: '🔱',
        description: '+3 Tấn công cho quân Elite & Kỵ binh đặc biệt',
        maxLevel: 3,
        costs: [
            { supplies: 150, gold: 100 },
            { supplies: 300, gold: 200 },
            { supplies: 350, gold: 280 },
        ],
        bonusPerLevel: 3,
        researchTime: [28, 40, 55],
        ageRequired: [3, 3, 4],
    },
    [UpgradeType.EliteDefense]: {
        name: 'Giáp Tinh Nhuệ',
        icon: '🛡️',
        description: '+2 Giáp, +15 HP cho quân Elite & Kỵ binh đặc biệt',
        maxLevel: 3,
        costs: [
            { supplies: 250 },
            { supplies: 500 },
            { supplies: 600 },
        ],
        bonusPerLevel: 2,
        researchTime: [28, 40, 55],
        ageRequired: [3, 3, 4],
    },
    [UpgradeType.CavalryAttack]: {
        name: 'Kỵ Binh Tinh Nhuệ',
        icon: '🐴',
        description: '+3 Tấn công, +1 Giáp, +10 HP cho Kỵ Sĩ, Trinh Sát',
        maxLevel: 3,
        costs: [
            { supplies: 150, gold: 75 },
            { supplies: 250, gold: 150 },
            { supplies: 320, gold: 200 },
        ],
        bonusPerLevel: 3,
        researchTime: [25, 36, 50],
        ageRequired: [2, 3, 4],
    },
};

// ---- Colors (Warcraft-inspired dark fantasy) ----
export const C = {
    // Terrain — richer, more vibrant greens
    grass1: '#3a8220', grass2: '#367e1c', grassDark1: '#2a6a15', grassDark2: '#265e12',
    grassLight1: '#50a835', grassLight2: '#48a02e', // vivid meadow green
    grassFlower1: '#429028', grassFlower2: '#4e962e', // warm green (flowers)
    sand: '#c8b878', sand2: '#bfad6e',
    dirt1: '#6b5a3e', dirt2: '#63523a', // brown earth
    dirtDark1: '#4a3d28', dirtDark2: '#433824', // muddy dark earth
    rock1: '#7a7a72', rock2: '#706e66', // grey stone
    water: '#2888b8', waterDeep: '#1a6898',
    // Entities
    player: '#00ff88', enemy: '#ff4444', neutral: '#cccccc',
    gold: '#ffd700', stone: '#8899aa', wood: '#8B5E3C', food: '#e85050',
    selection: '#00ff66', selectionBox: 'rgba(0,255,100,0.15)',
    selectionBoxBorder: 'rgba(0,255,100,0.6)',
    hpGreen: '#44dd44', hpYellow: '#dddd44', hpRed: '#dd4444', hpBg: '#222',
    // Japan Zen UI palette
    uiBg: '#16161a',            // deep charcoal panel background
    uiBgInner: '#1e1e22',       // slightly lighter inner panels
    uiBgPanel: '#1a1a1e',       // main panel fill
    uiBorder: '#3a3a40',        // subtle neutral border
    uiBorderLight: '#c2185b',   // crimson accent (cherry blossom)
    uiBorderDark: '#28282e',    // dark edge of border
    uiBorderOuter: '#0a0a0c',   // outermost border (near black)
    uiText: '#e8e4de',          // rice paper text
    uiTextBright: '#f5f0ea',    // bright text
    uiTextDim: '#71717a',       // muted zinc text
    uiTextGreen: '#6ee7b7',     // soft mint green (positive)
    uiTextRed: '#f87171',       // soft red (negative)
    uiHighlight: '#c2185b',     // crimson highlight
    uiButton: '#1e1e24',        // button normal (dark charcoal)
    uiButtonHover: '#2a2a32',   // button hover
    uiButtonActive: '#343440',  // button pressed
    uiButtonBorder: '#3a3a42',  // button border
    uiButtonBorderHover: '#c2185b', // button border hover (crimson)
    uiPortraitBg: '#121214',    // portrait background
    uiMpBlue: '#60a5fa',        // mana bar color (softer blue)
    uiSeparator: '#28282e',     // separator lines
};
updateGameTranslations();
