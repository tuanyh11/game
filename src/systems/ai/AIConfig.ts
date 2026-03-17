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
    [AIDifficulty.Easy]: 'Dễ',
    [AIDifficulty.Normal]: 'Thường',
    [AIDifficulty.Hard]: 'Khó',
};

export const AI_DIFFICULTY_DESC: Record<AIDifficulty, string> = {
    [AIDifficulty.Easy]: 'AI chậm, ít tấn công, thu nhập thấp',
    [AIDifficulty.Normal]: 'AI cân bằng, tấn công vừa phải',
    [AIDifficulty.Hard]: 'AI mạnh, tấn công nhanh, thu nhập cao',
};

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
