// ============================================================
//  Hero Aura Data — passive aura definitions per hero
//  Each hero provides a unique buff to nearby allied units
// ============================================================

import { UnitType } from './GameConfig';
import { t } from '../i18n/i18n';

export type AuraBuffType = 'armor' | 'atkSpeed' | 'regen' | 'speed' | 'hp';

export interface HeroAuraData {
    name: string;
    icon: string;
    buffType: AuraBuffType;
    /** Buff value: multiplier (e.g. 0.15 = +15%) or flat (e.g. 2 = 2 HP/s) */
    buffValue: number;
    /** Optional secondary debuff (e.g. Ragnar: -10% defense) */
    debuffType?: AuraBuffType;
    debuffValue?: number;
    /** Base aura radius in pixels */
    baseRadius: number;
    /** Extra radius gained per hero level */
    radiusPerLevel: number;
    /** Aura particle/visual color */
    color: string;
    /** Secondary glow color */
    glowColor: string;
}

export const HERO_AURA_DATA: Partial<Record<UnitType, HeroAuraData>> = {
    // 🗡️ Spartacus — Phalanx Spirit: Allies take less damage
    [UnitType.HeroSpartacus]: {
        get name() { return t('aura.heroSpartacus'); },
        icon: '🛡️',
        buffType: 'armor',
        buffValue: 0.15,      // +15% damage reduction
        baseRadius: 128,
        radiusPerLevel: 12,
        color: '#60a5fa',      // soft blue
        glowColor: '#3b82f6',
    },

    // ⚔️ Ragnar — Berserker Fury: Allies attack faster, but take more damage
    [UnitType.HeroRagnar]: {
        get name() { return t('aura.heroRagnar'); },
        icon: '🔥',
        buffType: 'atkSpeed',
        buffValue: 0.20,       // +20% attack speed
        debuffType: 'armor',
        debuffValue: -0.10,    // -10% defense (take 10% more damage)
        baseRadius: 120,
        radiusPerLevel: 12,
        color: '#f87171',      // soft red
        glowColor: '#ef4444',
    },

    // 🔥 Zarathustra — Sacred Flame: Allies regenerate HP
    [UnitType.HeroZarathustra]: {
        get name() { return t('aura.heroZarathustra'); },
        icon: '✨',
        buffType: 'regen',
        buffValue: 2,          // +2 HP per second
        baseRadius: 140,
        radiusPerLevel: 12,
        color: '#4ade80',      // soft green
        glowColor: '#22c55e',
    },

    // ⚔️ Musashi — Way of the Sword: Allies move faster
    [UnitType.HeroMusashi]: {
        get name() { return t('aura.heroMusashi'); },
        icon: '💨',
        buffType: 'speed',
        buffValue: 0.10,       // +10% movement speed
        baseRadius: 128,
        radiusPerLevel: 12,
        color: '#e2e8f0',      // silvery white
        glowColor: '#cbd5e1',
    },

    // 🛡️ Qi Jiguang — Iron Discipline: Allies gain max HP
    [UnitType.HeroQiJiguang]: {
        get name() { return t('aura.heroQiJiguang'); },
        icon: '💪',
        buffType: 'hp',
        buffValue: 0.15,       // +15% max HP
        baseRadius: 136,
        radiusPerLevel: 12,
        color: '#fbbf24',      // golden
        glowColor: '#f59e0b',
    },
};

/** Get the effective aura radius for a hero at a given level */
export function getAuraRadius(aura: HeroAuraData, heroLevel: number): number {
    return aura.baseRadius + heroLevel * aura.radiusPerLevel;
}
