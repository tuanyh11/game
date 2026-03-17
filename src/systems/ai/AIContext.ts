// ============================================================
//  AIContext — Shared interface that sub-modules use to access
//  AIController state without circular dependencies.
//  AIController implements this and passes `this` to modules.
// ============================================================

import { Unit } from "../../entities/Unit";
import { Building } from "../../entities/Building";
import { EntityManager } from "../EntityManager";
import { PlayerState } from "../PlayerState";
import { DifficultyParams, AIDifficulty } from "./AIConfig";
import { ResourceNodeType } from "../../config/GameConfig";

// Defense stance enum
export enum DefenseStance {
    Peaceful = 'peaceful',   // Garrison nhỏ, focus kinh tế
    Alert = 'alert',         // Tăng garrison, sẵn sàng phòng thủ
    Fortress = 'fortress',   // Tất cả về phòng thủ
}

export interface AIContext {
    readonly entityManager: EntityManager;
    readonly aiState: PlayerState;
    readonly team: number;
    readonly difficulty: AIDifficulty;
    readonly params: DifficultyParams;

    // Base position (fallback to unit centroid if no Town Center)
    baseX: number;
    baseY: number;

    // Wave / combat state
    waveState: 'gathering' | 'attacking' | 'supporting' | 'counterattack' | 'pursuit' | 'retreating';
    waveResetTimer: number;
    wavesSent: number;
    attackWaveSize: number;
    rallyX: number;
    rallyY: number;

    // Retreat state
    retreatRallyX: number;
    retreatRallyY: number;
    retreatRegroupTimer: number;

    // Support state
    supportTarget: { x: number; y: number } | null;
    supportTimer: number;

    // Counter-attack & pursuit
    counterAttackTarget: { x: number; y: number } | null;
    counterAttackTimer: number;
    pursuitTarget: Unit | null;
    pursuitTimer: number;
    lastDefenseEnemyCount: number;
    defenseSuccessStreak: number;

    // Force allocation
    forceAllocation: {
        garrisonRatio: number;
        attackRatio: number;
        supportRatio: number;
        garrisonUnits: Unit[];
        attackUnits: Unit[];
        supportUnits: Unit[];
    };

    // Vision / scouting
    scoutedEnemyBuildings: Map<number, { x: number; y: number; type: any; time: number; alive: boolean }>;
    scoutedEnemyUnits: Map<number, { x: number; y: number; time: number }>;
    exploredRegions: Set<string>;
    scoutTargets: { x: number; y: number }[];
    explorationComplete: boolean;
    explorationCheckTimer: number;

    // Defense
    defendingUnits: Set<number>;

    // === TIER-1 DEFENSE: Early Warning System ===
    defenseStance: DefenseStance;
    earlyWarningActive: boolean;         // true khi phát hiện kẻ thù trong vùng cảnh báo
    earlyWarningEnemies: Unit[];         // danh sách kẻ thù trong perimeter
    earlyWarningCooldown: number;        // cooldown giữa các lần cảnh báo

    // === TIER-1 DEFENSE: Attack Direction Memory ===
    attackHistory: { direction: number; time: number; severity: number }[];
    primaryThreatDirection: number;      // hướng tấn công phổ biến nhất (radian)
    threatDirectionConfidence: number;   // 0-1, độ tin cậy của hướng đe dọa

    // === TIER-1 DEFENSE: Tower Coordination ===
    towerDefenseActive: boolean;         // đang phối hợp với tower

    // === TIER-2 DEFENSE: Enhanced Attack Pattern Memory ===
    attackPatterns: AttackPatternRecord[];
    averageAttackInterval: number;       // trung bình giây giữa các đợt tấn công
    lastAttackTime: number;              // thời điểm đợt tấn công cuối
    predictedNextAttackTime: number;     // dự đoán đợt tấn công tiếp theo

    // === TIER-2 DEFENSE: Adaptive Defense Training ===
    defenseTrainingPriority: DefenseTrainingPriority;

    // === TIER-2 DEFENSE: Layered Defense Roles ===
    defenseLayerAssignments: Map<number, DefenseLayer>;

    // === TIER-3 DEFENSE: Chokepoint Exploitation ===
    knownChokepoints: Chokepoint[];
    chokepointScanDone: boolean;
    activeChokepointDefense: Chokepoint | null;  // currently defended chokepoint

    // === TIER-3 DEFENSE: Bait & Trap ===
    trapState: TrapState | null;
    trapCooldown: number;

    // Raiding
    raidingUnits: Set<number>;
    raidTarget: { x: number; y: number } | null;
    raidCooldown: number;
    raidActive: boolean;

    // Enemy composition
    enemyComposition: {
        melee: number; ranged: number; cavalry: number; heroes: number; total: number;
        lastUpdate: number;
    };

    // Multi-prong
    flankForce: Unit[];
    flankTarget: { x: number; y: number } | null;

    // Threat memory
    knownEnemyPositions: Map<number, { x: number; y: number; time: number }>;

    // Utility methods exposed to sub-modules
    log(msg: string, color?: string): void;
    safeMoveTo(u: Unit, x: number, y: number, callback?: () => void): void;
    findNearestEnemyUnit(x: number, y: number, range: number): Unit | null;
    findNearestEnemyBuilding(x: number, y: number, range: number): Building | null;
    findNearestAllyBuilding(x: number, y: number): Building | null;
    findNearestEnemyVillager(x: number, y: number, range: number): Unit | null;
    findNearestEnemyEcoBuilding(x: number, y: number, range: number): Building | null;
    findNearestResource(x: number, y: number): any;
    findNearestResourceOfType(x: number, y: number, type: ResourceNodeType): any;
    calculateCombatPower(units: Unit[]): number;
    selectBestTarget(attacker: Unit, range: number): Unit | null;
    callFocusFire(caller: Unit, target: Unit, aiUnits: Unit[]): void;
    findAllyInCombat(x: number, y: number, range: number): Unit | null;
    reportThreat(x: number, y: number, severity: number, targetTeam?: number): void;
    moveTowardEnemy(u: Unit): void;
    checkExplorationComplete(): boolean;
    sendToExplore(u: Unit): void;
    returnScoutToArmy(u: Unit): void;

    // Vision helpers
    isPositionVisible(px: number, py: number): boolean;
    getScoutedEnemyBuildings(): Building[];
    hasScoutedEnemy(): boolean;

    // Combat helpers
    evaluateBattlefield(): void;
    handleVillagerCombat(u: Unit): void;
    handleActiveAttacker(u: Unit, aiUnits: Unit[], isAggressive: boolean): void;
    triggerRetreat(units: Unit[]): void;

    // Defense helpers
    calculateForceAllocation(): void;
    initiateCounterAttack(military: Unit[], lastAttackedBuilding: Building): void;

    // Tier-1 Defense helpers
    findNearestOwnTower(x: number, y: number): Building | null;
    getOwnTowers(): Building[];

    // Tier-2 Defense helpers
    getDefenseTrainingPriority(): DefenseTrainingPriority;
}

// === TIER-2 TYPES ===

// Record of a single enemy attack wave — what they brought, from where, when
export interface AttackPatternRecord {
    time: number;                        // game time khi đợt tấn công xảy ra
    direction: number;                   // hướng tấn công (radian)
    armySize: number;                    // số lượng quân địch
    composition: {                       // chi tiết thành phần quân
        melee: number;
        ranged: number;
        cavalry: number;
        heroes: number;
    };
    severity: number;                    // 0-1 mức độ nghiêm trọng
    wasDefeated: boolean;                // AI có phòng thủ thành công?
}

// What type of units AI should prioritize training for defense
export interface DefenseTrainingPriority {
    needAntiMelee: number;               // 0-1 cần counter melee (train archers)
    needAntiRanged: number;              // 0-1 cần counter ranged (train cavalry)
    needAntiCavalry: number;             // 0-1 cần counter cavalry (train spearmen)
    needMoreTowers: boolean;             // nên xây thêm tower?
    suggestedUnitType: string | null;    // gợi ý loại quân cần train
    lastUpdate: number;
}

// Layers in the defense formation
export enum DefenseLayer {
    Vanguard = 'vanguard',       // Layer 1: Cavalry + melee scouts — flanking & intercept
    Frontline = 'frontline',     // Layer 2: Heavy melee (spearmen, swordsmen) — defensive wall
    Backline = 'backline',       // Layer 3: Ranged + heroes — DPS from safety
}

// === TIER-3 TYPES ===

// A terrain chokepoint — narrow passage near base that's good for defense
export interface Chokepoint {
    x: number;                   // world x of center
    y: number;                   // world y of center
    tileCol: number;
    tileRow: number;
    width: number;               // narrowest walkable width (tiles)
    facingAngle: number;         // angle from base to chokepoint
    defenseScore: number;        // 0-1 how good for defense (narrow + near base = high)
}

// State of an active bait & trap operation
export interface TrapState {
    phase: 'baiting' | 'springing' | 'complete';
    baitUnitId: number;          // unit used as bait
    killzoneX: number;           // where to lure enemies
    killzoneY: number;
    ambushUnitIds: number[];     // units waiting in ambush
    nearestTowerId: number;      // tower providing fire
    startTime: number;
    targetEnemyIds: number[];    // enemies being lured
}
