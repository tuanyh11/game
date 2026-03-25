// ============================================================
//  Hero Skill System — unique abilities per civilization
//  Each (CivType, HeroType) combo has 3 unique skills
//  EXTRACTED from Unit.ts for maintainability
// ============================================================

import { CivilizationType, UnitType } from './GameConfig';
import { t } from '../i18n/i18n';

export interface HeroSkill {
    name: string;
    icon: string;
    description: string;
    cooldown: number;
    duration: number;
    unlockLevel: number;
    skillId: string;
}

/** Civ-specific hero skills mapped directly to the unique hero type */
export const HERO_SKILLS: Record<string, HeroSkill[]> = {
    // ==================== BA TƯ ====================
    // 🦁 Zarathustra — Pháp sư lửa thánh (Fire Mage)
    [UnitType.HeroZarathustra]: [
        { get name() { return t('hSkill.batu_m0.name'); }, icon: '🔥', get description() { return t('hSkill.batu_m0.desc'); }, cooldown: 12, duration: 0, unlockLevel: 1, skillId: 'batu_m0' },
        { get name() { return t('hSkill.batu_m1.name'); }, icon: '☄️', get description() { return t('hSkill.batu_m1.desc'); }, cooldown: 18, duration: 5, unlockLevel: 3, skillId: 'batu_m1' },
        { get name() { return t('hSkill.batu_m2.name'); }, icon: '💥', get description() { return t('hSkill.batu_m2.desc'); }, cooldown: 40, duration: 0, unlockLevel: 5, skillId: 'batu_m2' },
    ],

    // ==================== ĐẠI TỐNG ====================
    // 🛡️ Thích Kế Quang — Danh tướng chống Oa khấu (Tank/Fighter)
    [UnitType.HeroQiJiguang]: [
        { get name() { return t('hSkill.qijiguang_w0.name'); }, icon: '🌪️', get description() { return t('hSkill.qijiguang_w0.desc'); }, cooldown: 20, duration: 8, unlockLevel: 1, skillId: 'qijiguang_w0' },
        { get name() { return t('hSkill.qijiguang_w1.name'); }, icon: '🔥', get description() { return t('hSkill.qijiguang_w1.desc'); }, cooldown: 12, duration: 0, unlockLevel: 1, skillId: 'qijiguang_w1' },
        { get name() { return t('hSkill.qijiguang_w2.name'); }, icon: '⚔️', get description() { return t('hSkill.qijiguang_w2.desc'); }, cooldown: 25, duration: 0, unlockLevel: 3, skillId: 'qijiguang_w2' },
    ],

    // ==================== YAMATO ====================
    // ⚔️ Miyamoto Musashi — Kiếm thánh (Duelist)
    [UnitType.HeroMusashi]: [
        { get name() { return t('hSkill.yamato_w0.name'); }, icon: '⚔️', get description() { return t('hSkill.yamato_w0.desc'); }, cooldown: 10, duration: 0, unlockLevel: 1, skillId: 'yamato_w0' },
        { get name() { return t('hSkill.yamato_w1.name'); }, icon: '👤', get description() { return t('hSkill.yamato_w1.desc'); }, cooldown: 8, duration: 5, unlockLevel: 3, skillId: 'yamato_w1' },
        { get name() { return t('hSkill.yamato_w2.name'); }, icon: '💀', get description() { return t('hSkill.yamato_w2.desc'); }, cooldown: 30, duration: 4, unlockLevel: 5, skillId: 'yamato_w2' },
    ],

    // ==================== LA MÃ ====================
    // 🗡️ Spartacus — Giác đấu sĩ (Tank/Warrior)
    [UnitType.HeroSpartacus]: [
        { get name() { return t('hSkill.lama_w0.name'); }, icon: '⚡', get description() { return t('hSkill.lama_w0.desc'); }, cooldown: 15, duration: 6, unlockLevel: 1, skillId: 'lama_w0' },
        { get name() { return t('hSkill.lama_w1.name'); }, icon: '🛡️', get description() { return t('hSkill.lama_w1.desc'); }, cooldown: 20, duration: 5, unlockLevel: 3, skillId: 'lama_w1' },
        { get name() { return t('hSkill.lama_w2.name'); }, icon: '💖', get description() { return t('hSkill.lama_w2.desc'); }, cooldown: 45, duration: 0, unlockLevel: 5, skillId: 'lama_w2' },
    ],

    // ==================== VIKING ====================
    // ⚔️ Ragnar Lothbrok — Berserker huyền thoại
    [UnitType.HeroRagnar]: [
        { get name() { return t('hSkill.viking_w0.name'); }, icon: '🔥', get description() { return t('hSkill.viking_w0.desc'); }, cooldown: 15, duration: 6, unlockLevel: 1, skillId: 'viking_w0' },
        { get name() { return t('hSkill.viking_w1.name'); }, icon: '⚡', get description() { return t('hSkill.viking_w1.desc'); }, cooldown: 18, duration: 0, unlockLevel: 2, skillId: 'viking_w1' },
        { get name() { return t('hSkill.viking_w2.name'); }, icon: '✨', get description() { return t('hSkill.viking_w2.desc'); }, cooldown: 50, duration: 4, unlockLevel: 5, skillId: 'viking_w2' },
    ],
};

/** Get hero skills for a specific hero unit type */
export function getHeroSkills(heroType: UnitType): HeroSkill[] {
    return HERO_SKILLS[heroType] ?? [];
}

export const HERO_XP_TABLE = [0, 0, 100, 250, 500, 850, 1300];
export const HERO_MAX_LEVEL = 6;
