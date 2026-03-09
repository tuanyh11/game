// ============================================================
//  GameConfig — All enums, constants, and data tables
// ============================================================

export const TILE_SIZE = 16;
export const MAP_COLS = 800;
export const MAP_ROWS = 800;
export const WORLD_W = MAP_COLS * TILE_SIZE;
export const WORLD_H = MAP_ROWS * TILE_SIZE;

// ---- Unique ID generator ----
let _nextId = 1;
export function genId(): number { return _nextId++; }

// ---- Enums ----
export enum TerrainType {
    Grass, GrassDark, GrassLight, GrassFlower,
    Sand, Dirt, DirtDark, Rock,
    Water, Bridge
}

export enum ResourceType { Food = 'food', Wood = 'wood', Gold = 'gold', Stone = 'stone' }

export enum ResourceNodeType {
    Tree = 'tree', GoldMine = 'goldMine', StoneMine = 'stoneMine',
    BerryBush = 'berryBush', Farm = 'farm',
}

export enum UnitType {
    Villager = 'villager', Spearman = 'spearman', Archer = 'archer',
    Scout = 'scout', Swordsman = 'swordsman', Knight = 'knight',

    // Unique Civilization Heroes
    HeroSpartacus = 'heroSpartacus',       // La Mã (Roman)
    HeroZarathustra = 'heroZarathustra',   // Ba Tư (Persian)
    HeroQiJiguang = 'heroHuangZhong',     // Đại Minh (Ming/Chinese)
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

    // Test Dummy
    TargetDummy = 'targetDummy',
}

export enum BuildingType {
    TownCenter = 'townCenter', House = 'house', Barracks = 'barracks',
    Market = 'market', Farm = 'farm',
    Stable = 'stable', Tower = 'tower', HeroAltar = 'heroAltar',
    Blacksmith = 'blacksmith', GovernmentCenter = 'governmentCenter',
    Wall = 'wall',
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
        name: 'Ba Tư',
        icon: '🐘',
        description: 'Kỵ binh mạnh nhất, kinh tế vượt trội. Dân thu thập +15%. Kỵ sĩ +20% ATK/+15% HP.',
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
        name: 'Đại Minh',
        icon: '🐲',
        description: 'Cẩm Y Vệ tinh nhuệ. Cung thủ +15% ATK/+20% tầm. Tháp +25%. Kỵ binh yếu.',
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
        name: 'Yamato',
        icon: '⛩️',
        description: 'Samurai cực nhanh. Train -20% thời gian. Bộ binh +20% ATK/+10% HP. Kỵ binh yếu.',
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
        name: 'La Mã',
        icon: '🏛️',
        description: 'Cân bằng hoàn hảo. Quân bền +15% HP. Công trình +20%. Không có điểm yếu.',
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
        name: 'Viking',
        icon: '⚓',
        description: 'Bạo lực cận chiến. Bộ binh +25% ATK/+15% HP. Kỵ binh rất yếu. Cung yếu.',
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
    return type === UnitType.Archer || type === UnitType.Immortal;
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
        [UnitType.Swordsman]: { attack: 1.20, speed: 1.08, attackSpeed: 0.90, name: 'Samurai' }, // Elite infantry
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
export interface Cost { food?: number; wood?: number; gold?: number; stone?: number; }

// ---- Building data ----
export interface BuildingData {
    name: string; cost: Cost; size: [number, number]; hp: number;
    popProvided?: number; isDropOff?: ResourceType[]; trainable?: UnitType[];
    ageRequired: number;
}

export const BUILDING_DATA: Record<BuildingType, BuildingData> = {
    [BuildingType.TownCenter]: {
        name: 'Nhà Chính', cost: { wood: 275, stone: 100 }, size: [4, 4], hp: 2400, popProvided: 5,
        isDropOff: [ResourceType.Food, ResourceType.Wood, ResourceType.Gold, ResourceType.Stone],
        trainable: [UnitType.Villager], ageRequired: 2,
    },
    [BuildingType.House]: {
        name: 'Nhà Ở', cost: { wood: 30 }, size: [3, 3], hp: 550, popProvided: 5, ageRequired: 1,
    },
    [BuildingType.Barracks]: {
        name: 'Trại Lính', cost: { wood: 175 }, size: [4, 4], hp: 1200,
        trainable: [UnitType.Spearman, UnitType.Archer, UnitType.Swordsman,
        UnitType.Immortal, UnitType.ChuKoNu, UnitType.Ninja, UnitType.Centurion, UnitType.Ulfhednar], ageRequired: 1,
    },
    [BuildingType.Market]: {
        name: 'Kho Tài Nguyên', cost: { wood: 100 }, size: [3, 3], hp: 700,
        isDropOff: [ResourceType.Wood, ResourceType.Gold, ResourceType.Stone, ResourceType.Food], ageRequired: 1,
    },
    [BuildingType.Farm]: {
        name: 'Trang Trại', cost: { wood: 60 }, size: [3, 3], hp: 480, ageRequired: 2,
    },
    [BuildingType.Stable]: {
        name: 'Chuồng Ngựa', cost: { wood: 175, gold: 50 }, size: [4, 4], hp: 1200,
        trainable: [
            UnitType.Scout, UnitType.Knight,
            UnitType.WarElephant, UnitType.FireLancer, UnitType.Yabusame, UnitType.Equites, UnitType.BearRider
        ], ageRequired: 2,
    },
    [BuildingType.Tower]: {
        name: 'Tháp Canh', cost: { stone: 125, wood: 50 }, size: [3, 3], hp: 1500, ageRequired: 2,
    },
    [BuildingType.HeroAltar]: {
        name: 'Đền Tướng', cost: { gold: 200, stone: 100 }, size: [4, 4], hp: 1800,
        // Altar trainable units are injected at runtime based on the civilization type
        ageRequired: 2,
    },
    [BuildingType.Blacksmith]: {
        name: 'Lò Rèn', cost: { wood: 150, gold: 50 }, size: [3, 3], hp: 1000,
        ageRequired: 2,
    },
    [BuildingType.GovernmentCenter]: {
        name: 'Nhà Chính Phủ', cost: { wood: 200, stone: 100 }, size: [4, 4], hp: 2000,
        ageRequired: 3,
    },
    [BuildingType.Wall]: {
        name: 'Tường Thành', cost: { stone: 15 }, size: [3, 3], hp: 2400,
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

// ---- Unit data ----
export interface UnitData {
    name: string; cost: Cost; hp: number; speed: number; attack: number;
    range: number; attackSpeed: number; sight: number;
    trainTime: number; ageRequired: number;
}

export const UNIT_DATA: Record<UnitType, UnitData> = {
    [UnitType.Villager]: { name: 'Dân', cost: { food: 50 }, hp: 25, speed: 90, attack: 3, range: 24, attackSpeed: 2.0, sight: 6, trainTime: 25, ageRequired: 1 },
    [UnitType.Spearman]: { name: 'Lính Giáo', cost: { food: 35, wood: 25 }, hp: 60, speed: 80, attack: 8, range: 32, attackSpeed: 1.4, sight: 10, trainTime: 20, ageRequired: 1 },
    [UnitType.Archer]: { name: 'Cung Thủ', cost: { food: 25, gold: 45 }, hp: 35, speed: 80, attack: 5, range: 120, attackSpeed: 1.6, sight: 10, trainTime: 30, ageRequired: 2 },
    [UnitType.Scout]: { name: 'Trinh Sát', cost: { food: 80 }, hp: 75, speed: 120, attack: 4, range: 30, attackSpeed: 1.0, sight: 12, trainTime: 30, ageRequired: 1 },
    [UnitType.Swordsman]: { name: 'Kiếm Sĩ', cost: { food: 60, gold: 30 }, hp: 80, speed: 70, attack: 12, range: 28, attackSpeed: 1.2, sight: 10, trainTime: 25, ageRequired: 2 },
    [UnitType.Knight]: { name: 'Kỵ Sĩ', cost: { food: 60, gold: 75 }, hp: 120, speed: 140, attack: 14, range: 35, attackSpeed: 1.8, sight: 10, trainTime: 35, ageRequired: 3 },
    // Unique Heroes (max level 6)
    [UnitType.HeroSpartacus]: { name: '🗡️ Spartacus', cost: { gold: 250 }, hp: 280, speed: 100, attack: 35, range: 38, attackSpeed: 1.0, sight: 10, trainTime: 55, ageRequired: 2 },
    [UnitType.HeroZarathustra]: { name: '🔥 Zarathustra', cost: { gold: 250 }, hp: 160, speed: 90, attack: 30, range: 180, attackSpeed: 1.2, sight: 12, trainTime: 55, ageRequired: 2 },
    [UnitType.HeroQiJiguang]: { name: '🛡️ T. Kế Quang', cost: { gold: 250 }, hp: 250, speed: 95, attack: 32, range: 45, attackSpeed: 1.1, sight: 10, trainTime: 55, ageRequired: 2 },
    [UnitType.HeroMusashi]: { name: '⚔️ Musashi', cost: { gold: 250 }, hp: 175, speed: 110, attack: 45, range: 35, attackSpeed: 0.9, sight: 9, trainTime: 55, ageRequired: 2 },
    [UnitType.HeroRagnar]: { name: '🪓 Ragnar', cost: { gold: 250 }, hp: 240, speed: 90, attack: 35, range: 40, attackSpeed: 1.1, sight: 10, trainTime: 55, ageRequired: 2 },

    // Civ-unique elite units
    [UnitType.Immortal]: { name: 'Bất Tử Quân', cost: { food: 60, gold: 55 }, hp: 55, speed: 80, attack: 7, range: 120, attackSpeed: 1.3, sight: 10, trainTime: 32, ageRequired: 3 },
    [UnitType.ChuKoNu]: { name: 'Cẩm Y Vệ', cost: { food: 55, gold: 50 }, hp: 85, speed: 115, attack: 13, range: 28, attackSpeed: 0.8, sight: 10, trainTime: 28, ageRequired: 3 },
    [UnitType.Ninja]: { name: 'Ninja', cost: { food: 50, gold: 60 }, hp: 50, speed: 130, attack: 15, range: 26, attackSpeed: 0.9, sight: 10, trainTime: 32, ageRequired: 3 },
    [UnitType.Centurion]: { name: 'Centurion', cost: { food: 80, gold: 50 }, hp: 135, speed: 65, attack: 10, range: 80, attackSpeed: 1.5, sight: 10, trainTime: 35, ageRequired: 3 },
    [UnitType.Ulfhednar]: { name: 'Chiến Binh Sói', cost: { food: 55, gold: 45 }, hp: 90, speed: 90, attack: 13, range: 28, attackSpeed: 1.0, sight: 10, trainTime: 30, ageRequired: 3 },

    // Civ-unique cavalry (Stable)
    [UnitType.WarElephant]: { name: '🐘 Voi Chiến', cost: { food: 120, gold: 80 }, hp: 300, speed: 60, attack: 18, range: 35, attackSpeed: 2.2, sight: 10, trainTime: 45, ageRequired: 3 },
    [UnitType.FireLancer]: { name: '🎇 Hỏa Thương', cost: { food: 70, gold: 60 }, hp: 110, speed: 135, attack: 25, range: 35, attackSpeed: 1.8, sight: 10, trainTime: 35, ageRequired: 3 },
    [UnitType.Yabusame]: { name: '🏹 Yabusame', cost: { food: 60, gold: 70 }, hp: 90, speed: 145, attack: 10, range: 140, attackSpeed: 1.2, sight: 11, trainTime: 30, ageRequired: 3 },
    [UnitType.Equites]: { name: '🛡️ Equites', cost: { food: 65, gold: 60 }, hp: 130, speed: 130, attack: 12, range: 35, attackSpeed: 1.5, sight: 10, trainTime: 32, ageRequired: 3 },
    [UnitType.BearRider]: { name: '🐻 Kỵ Binh Gấu', cost: { food: 75, gold: 45 }, hp: 170, speed: 110, attack: 22, range: 30, attackSpeed: 1.4, sight: 10, trainTime: 28, ageRequired: 3 },

    [UnitType.TargetDummy]: { name: 'Hình Nhân', cost: {}, hp: 999999999, speed: 0, attack: 0, range: 0, attackSpeed: 0, sight: 4, trainTime: 1, ageRequired: 1 },
};

// ---- Gather rates ----
export const GATHER_RATES: Record<ResourceNodeType, { rate: number; carry: number; resourceType: ResourceType }> = {
    [ResourceNodeType.Tree]: { rate: 0.45, carry: 10, resourceType: ResourceType.Wood },
    [ResourceNodeType.GoldMine]: { rate: 0.38, carry: 10, resourceType: ResourceType.Gold },
    [ResourceNodeType.StoneMine]: { rate: 0.38, carry: 10, resourceType: ResourceType.Stone },
    [ResourceNodeType.BerryBush]: { rate: 0.32, carry: 10, resourceType: ResourceType.Food },
    [ResourceNodeType.Farm]: { rate: 0.35, carry: 10, resourceType: ResourceType.Food },
};

// ---- Ages ----
export const AGE_COSTS: Cost[] = [
    {},
    { food: 500, gold: 200 },
    { food: 800, gold: 500, stone: 200 },
    { food: 1000, gold: 800, stone: 400 },
];
export const AGE_NAMES = ['Thời Đồ Đá', 'Thời Phong Kiến', 'Thời Lâu Đài', 'Thời Đế Chế'];

// ---- Upgrade system ----
export enum UpgradeType {
    MeleeAttack = 'meleeAttack',
    RangedAttack = 'rangedAttack',
    MeleeDefense = 'meleeDefense',
    RangedDefense = 'rangedDefense',
    // Economy upgrades (Market)
    GatherFood = 'gatherFood',
    GatherWood = 'gatherWood',
    GatherGold = 'gatherGold',
    GatherStone = 'gatherStone',
    CarryCapacity = 'carryCapacity',
    VillagerSpeed = 'villagerSpeed',
    // Government Center upgrades
    Architecture = 'architecture',
    MeleeHealth = 'meleeHealth',
    Cartography = 'cartography',
    Trade = 'trade',
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
        description: '+2 Tấn công cho Lính Giáo, Kiếm Sĩ, Kỵ Sĩ, Trinh Sát',
        maxLevel: 3,
        costs: [
            { food: 100, gold: 50 },
            { food: 200, gold: 100 },
            { food: 300, gold: 200 },
        ],
        bonusPerLevel: 2,
        researchTime: [30, 45, 60],
        ageRequired: [1, 2, 3],
    },
    [UpgradeType.RangedAttack]: {
        name: 'Tấn Công Tầm Xa',
        icon: '🏹',
        description: '+2 Tấn công cho Cung Thủ',
        maxLevel: 3,
        costs: [
            { food: 100, gold: 75 },
            { food: 200, gold: 150 },
            { food: 300, gold: 250 },
        ],
        bonusPerLevel: 2,
        researchTime: [35, 50, 65],
        ageRequired: [1, 2, 3],
    },
    [UpgradeType.MeleeDefense]: {
        name: 'Giáp Cận Chiến',
        icon: '🛡',
        description: '+1 Giáp, +10 HP cho lính cận chiến (Giáo, Kiếm, Kỵ Sĩ)',
        maxLevel: 3,
        costs: [
            { food: 100, wood: 75 },
            { food: 200, wood: 150 },
            { food: 300, wood: 250 },
        ],
        bonusPerLevel: 1,
        researchTime: [30, 45, 60],
        ageRequired: [1, 2, 3],
    },
    [UpgradeType.RangedDefense]: {
        name: 'Giáp Tầm Xa',
        icon: '🪖',
        description: '+1 Giáp, +8 HP cho cung thủ',
        maxLevel: 3,
        costs: [
            { food: 100, wood: 100 },
            { food: 200, wood: 200 },
            { food: 300, wood: 300 },
        ],
        bonusPerLevel: 1,
        researchTime: [35, 50, 65],
        ageRequired: [1, 2, 3],
    },
    // ---- ECONOMY UPGRADES (Market) ----
    [UpgradeType.GatherFood]: {
        name: 'Khai Thác Thực Phẩm',
        icon: '🌾',
        description: '+15% tốc độ thu hoạch thực phẩm',
        maxLevel: 3,
        costs: [
            { food: 50, wood: 75 },
            { food: 100, wood: 150 },
            { food: 200, wood: 250 },
        ],
        bonusPerLevel: 0.15,
        researchTime: [25, 40, 55],
        ageRequired: [1, 2, 3],
    },
    [UpgradeType.GatherWood]: {
        name: 'Khai Thác Gỗ',
        icon: '🪵',
        description: '+15% tốc độ khai thác gỗ',
        maxLevel: 3,
        costs: [
            { food: 75, wood: 50 },
            { food: 150, wood: 100 },
            { food: 250, wood: 200 },
        ],
        bonusPerLevel: 0.15,
        researchTime: [25, 40, 55],
        ageRequired: [1, 2, 3],
    },
    [UpgradeType.GatherGold]: {
        name: 'Khai Thác Vàng',
        icon: '🪙',
        description: '+15% tốc độ khai thác vàng',
        maxLevel: 3,
        costs: [
            { food: 75, gold: 50 },
            { food: 150, gold: 100 },
            { food: 250, gold: 200 },
        ],
        bonusPerLevel: 0.15,
        researchTime: [25, 40, 55],
        ageRequired: [1, 2, 3],
    },
    [UpgradeType.GatherStone]: {
        name: 'Khai Thác Đá',
        icon: '🪨',
        description: '+15% tốc độ khai thác đá',
        maxLevel: 3,
        costs: [
            { food: 75, stone: 50 },
            { food: 150, stone: 100 },
            { food: 250, stone: 200 },
        ],
        bonusPerLevel: 0.15,
        researchTime: [25, 40, 55],
        ageRequired: [1, 2, 3],
    },
    [UpgradeType.CarryCapacity]: {
        name: 'Sức Mang',
        icon: '📦',
        description: '+5 sức mang tài nguyên cho dân',
        maxLevel: 3,
        costs: [
            { food: 50, wood: 50 },
            { food: 100, wood: 100 },
            { food: 200, wood: 200 },
        ],
        bonusPerLevel: 5,
        researchTime: [20, 35, 50],
        ageRequired: [1, 2, 3],
    },
    [UpgradeType.VillagerSpeed]: {
        name: 'Tốc Độ Dân',
        icon: '🏃',
        description: '+10% tốc độ di chuyển cho dân',
        maxLevel: 2,
        costs: [
            { food: 100, gold: 50 },
            { food: 200, gold: 100 },
        ],
        bonusPerLevel: 0.10,
        researchTime: [30, 50],
        ageRequired: [2, 3],
    },
    [UpgradeType.Architecture]: {
        name: 'Kiến Trúc Học',
        icon: '🏗️',
        description: '+20% Máu công trình, +20% Tốc độ xây dựng',
        maxLevel: 1,
        costs: [{ wood: 300, stone: 200 }],
        bonusPerLevel: 0.20,
        researchTime: [45],
        ageRequired: [3],
    },
    [UpgradeType.MeleeHealth]: {
        name: 'Chiến Binh Thép',
        icon: '💪',
        description: '+15% Máu cho Lính Giáo, Kiếm, Kỵ, Trinh Sát',
        maxLevel: 1,
        costs: [{ food: 250, gold: 150 }],
        bonusPerLevel: 0.15,
        researchTime: [40],
        ageRequired: [3],
    },
    [UpgradeType.Cartography]: {
        name: 'Bản Đồ Học',
        icon: '🗺️',
        description: 'Chia sẻ tầm nhìn với Đồng minh',
        maxLevel: 1,
        costs: [{ food: 100, gold: 100 }],
        bonusPerLevel: 1,
        researchTime: [30],
        ageRequired: [3],
    },
    [UpgradeType.Trade]: {
        name: 'Giao Thương',
        icon: '🤝',
        description: 'Cho phép gửi tài nguyên cho Đồng minh',
        maxLevel: 1,
        costs: [{ food: 150, gold: 150 }],
        bonusPerLevel: 1,
        researchTime: [40],
        ageRequired: [3],
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
    player: '#4488ff', enemy: '#ff4444', neutral: '#cccccc',
    gold: '#ffd700', stone: '#8899aa', wood: '#8B5E3C', food: '#e85050',
    selection: '#00ff66', selectionBox: 'rgba(0,255,100,0.15)',
    selectionBoxBorder: 'rgba(0,255,100,0.6)',
    hpGreen: '#44dd44', hpYellow: '#dddd44', hpRed: '#dd4444', hpBg: '#222',
    // Warcraft UI palette
    uiBg: '#0d0b08',            // deep dark panel background
    uiBgInner: '#1a1510',       // slightly lighter inner panels
    uiBgPanel: '#141110',       // main panel fill
    uiBorder: '#8a6f3e',        // gold/bronze border
    uiBorderLight: '#c9a84c',   // bright gold accent
    uiBorderDark: '#3a2a10',    // dark edge of border
    uiBorderOuter: '#050403',   // outermost border (near black)
    uiText: '#e8d4a0',          // warm parchment text
    uiTextBright: '#fff5dd',    // highlight text
    uiTextDim: '#8a7a60',       // dimmed label text
    uiTextGreen: '#88cc44',     // positive/available
    uiTextRed: '#cc4444',       // negative/unavailable
    uiHighlight: '#ffd700',     // gold highlight
    uiButton: '#1e1a14',        // button normal
    uiButtonHover: '#2e2518',   // button hover
    uiButtonActive: '#3a3020',  // button pressed
    uiButtonBorder: '#5a4a2e',  // button border
    uiButtonBorderHover: '#8a6f3e', // button border hover
    uiPortraitBg: '#0a0908',    // portrait background
    uiMpBlue: '#3388ee',        // mana bar color
    uiSeparator: '#3a2e1e',     // separator lines
};
