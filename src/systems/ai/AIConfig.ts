// ============================================================
//  AI Configuration — Difficulty params, shared types, intel
//  Extracted from AIController.ts
// ============================================================

import { Building } from "../../entities/Building";
import { t } from '../../i18n/i18n';

export enum AIDifficulty {
    Easy = 'easy',
    Normal = 'normal',
    Hard = 'hard',
}

export const AI_DIFFICULTY_NAMES: Record<AIDifficulty, string> = {
    get [AIDifficulty.Easy]() { return t('diff.easy'); },
    get [AIDifficulty.Normal]() { return t('diff.normal'); },
    get [AIDifficulty.Hard]() { return t('diff.hard'); },
} as any;

export const AI_DIFFICULTY_DESC: Record<AIDifficulty, string> = {
    get [AIDifficulty.Easy]() { return t('diff.easy.desc'); },
    get [AIDifficulty.Normal]() { return t('diff.normal.desc'); },
    get [AIDifficulty.Hard]() { return t('diff.hard.desc'); },
} as any;

export function getAIDifficultyNames(): Record<AIDifficulty, string> {
    return {
        [AIDifficulty.Easy]: t('diff.easy'),
        [AIDifficulty.Normal]: t('diff.normal'),
        [AIDifficulty.Hard]: t('diff.hard'),
    };
}

export function getAIDifficultyDesc(): Record<AIDifficulty, string> {
    return {
        [AIDifficulty.Easy]: t('diff.easy.desc'),
        [AIDifficulty.Normal]: t('diff.normal.desc'),
        [AIDifficulty.Hard]: t('diff.hard.desc'),
    };
}

export interface DifficultyParams {
    resourceMult: number;      // passive income multiplier
    attackInterval: number;    // base seconds between waves
    attackWaveGrowth: number;  // seconds added per wave
    trainInterval: number;     // seconds between train checks
    buildSpeed: number;        // AI build speed multiplier
    patrolInterval: number;    // seconds between patrol pushes
    startingWaveSize: number;  // initial wave size
    maxWaveSize: number;       // max units per wave
    combatAwareness: number;   // sight range multiplier for combat (1.0 = normal)
    allyResponseSpeed: number; // how quickly AI responds to ally distress (lower = faster)
    coordinationRange: number; // range in tiles to coordinate with allies
}

export const DIFFICULTY_PARAMS: Record<AIDifficulty, DifficultyParams> = {
    [AIDifficulty.Easy]: {
        resourceMult: 0.5, attackInterval: 120, attackWaveGrowth: 30,
        trainInterval: 12, buildSpeed: 3, patrolInterval: 25,
        startingWaveSize: 5, maxWaveSize: 8,
        combatAwareness: 0.8, allyResponseSpeed: 8, coordinationRange: 80,
    },
    [AIDifficulty.Normal]: {
        resourceMult: 1.0, attackInterval: 45, attackWaveGrowth: 8,
        trainInterval: 6, buildSpeed: 5, patrolInterval: 12,
        startingWaveSize: 5, maxWaveSize: 15,
        combatAwareness: 1.0, allyResponseSpeed: 4, coordinationRange: 120,
    },
    [AIDifficulty.Hard]: {
        resourceMult: 2.0, attackInterval: 30, attackWaveGrowth: 4,
        trainInterval: 4, buildSpeed: 8, patrolInterval: 6,
        startingWaveSize: 6, maxWaveSize: 20,
        combatAwareness: 1.3, allyResponseSpeed: 2, coordinationRange: 200,
    },
};

// ===== Shared intel between allied AIs =====
export interface ThreatReport {
    x: number;
    y: number;
    severity: number;      // 0-1, how many enemies vs defenders
    timestamp: number;     // game time when reported
    reporterTeam: number;
    targetTeam: number;    // which team is threatened
}

export interface AttackCoordination {
    targetX: number;
    targetY: number;
    targetBuilding: Building | null;
    initiatorTeam: number;
    timestamp: number;
    participating: Set<number>;  // teams that joined
}

// Static shared state between all AI controllers (alliance intel)
export const sharedIntel = {
    threats: [] as ThreatReport[],
    coordinatedAttacks: [] as AttackCoordination[],
    gameTime: 0,
};

// ============================================================
//  AI Strategy — Rush / Balanced / Boom
// ============================================================
export enum AIStrategy {
    Rush = 'rush',
    Balanced = 'balanced',
    Boom = 'boom',
}

export interface StrategyParams {
    maxVillagers: number;            // cap on villager training
    ageUpVillagerThreshold: number[];// [age1→2, age2→3, age3→4] villager count triggers
    attackDelayMult: number;         // multiplier on attackInterval (lower = attack sooner)
    trainMilitaryFirst: boolean;     // if true, prioritize military over villagers
    garrisonRatio: number;           // fraction of army kept at base
    raidAggressiveness: number;      // 0-1, chance to raid each cycle
    tcExpansion: boolean;            // whether to build extra TCs
    minWaveSizeOverride: number;     // override minimum wave size to attack (0 = use default)
    boomMilitaryAge: number;         // Boom: only train military starting from this age
    eliteTrainChance: number;        // chance to train elite units at age 3+
}

export const STRATEGY_PARAMS: Record<AIStrategy, StrategyParams> = {
    [AIStrategy.Rush]: {
        maxVillagers: 8,
        ageUpVillagerThreshold: [99, 99, 99], // Rush: delay age-up, focus on army
        attackDelayMult: 0.4,
        trainMilitaryFirst: true,
        garrisonRatio: 0.1,
        raidAggressiveness: 0.8,
        tcExpansion: false,
        minWaveSizeOverride: 3,     // attack with as few as 3 units
        boomMilitaryAge: 1,
        eliteTrainChance: 0.1,
    },
    [AIStrategy.Balanced]: {
        maxVillagers: 18,
        ageUpVillagerThreshold: [12, 18, 24],
        attackDelayMult: 1.0,
        trainMilitaryFirst: false,
        garrisonRatio: 0.25,
        raidAggressiveness: 0.4,
        tcExpansion: true,
        minWaveSizeOverride: 0,
        boomMilitaryAge: 1,
        eliteTrainChance: 0.25,
    },
    [AIStrategy.Boom]: {
        maxVillagers: 30,
        ageUpVillagerThreshold: [8, 14, 20], // Boom: age up early
        attackDelayMult: 2.0,
        trainMilitaryFirst: false,
        garrisonRatio: 0.4,
        raidAggressiveness: 0.1,
        tcExpansion: true,
        minWaveSizeOverride: 0,
        boomMilitaryAge: 3,         // Boom: only train military from age 3
        eliteTrainChance: 0.4,      // heavy elite training in late game
    },
};
