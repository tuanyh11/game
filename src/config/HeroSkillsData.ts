// ============================================================
//  Hero Skill System — unique abilities per civilization
//  Each (CivType, HeroType) combo has 3 unique skills
//  EXTRACTED from Unit.ts for maintainability
// ============================================================

import { CivilizationType, UnitType } from './GameConfig';

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
    // ==================== BA TƯ ====================
    // 🦁 Zarathustra — Pháp sư lửa thánh (Fire Mage)
    [UnitType.HeroZarathustra]: [
        { name: 'Lửa Thánh', icon: '🔥', description: 'Gây 45 sát thương vùng lửa thánh', cooldown: 12, duration: 0, unlockLevel: 1, skillId: 'batu_m0' },
        { name: 'Thiêu Đốt', icon: '☄️', description: 'DOT 8/giây trong 5s cho kẻ địch gần', cooldown: 18, duration: 5, unlockLevel: 3, skillId: 'batu_m1' },
        { name: 'Ngọn Lửa Vĩnh Cửu', icon: '💥', description: 'Gây 80 sát thương vùng rộng', cooldown: 40, duration: 0, unlockLevel: 5, skillId: 'batu_m2' },
    ],

    // ==================== ĐẠI TỐNG ====================
    // ==================== ĐẠI TỐNG ====================
    // 🛡️ Thích Kế Quang — Danh tướng chống Oa khấu (Tank/Fighter)
    [UnitType.HeroQiJiguang]: [
        { name: 'Cuồng Phong', icon: '🌪️', description: 'Lốc xoáy bao vây 8s: Thay đổi giao diện, chém ra gió', cooldown: 20, duration: 8, unlockLevel: 1, skillId: 'qijiguang_w0' },
        { name: 'Hỏa Khí Phun', icon: '🔥', description: 'Bắn lửa hình nón gây 40 sát thương, đẩy lùi nhẹ', cooldown: 12, duration: 0, unlockLevel: 1, skillId: 'qijiguang_w1' },
        { name: 'Trường Đao Phá Trận', icon: '⚔️', description: 'Chém AoE khổng lồ gây 80 sát thương', cooldown: 25, duration: 0, unlockLevel: 3, skillId: 'qijiguang_w2' },
    ],

    // ==================== YAMATO ====================
    // ==================== YAMATO ====================
    // ⚔️ Miyamoto Musashi — Kiếm thánh (Duelist)
    [UnitType.HeroMusashi]: [
        { name: 'Zan-Tetsu-Ken', icon: '⚔️', description: 'Lướt dọc đường gây 30 sát thương', cooldown: 10, duration: 0, unlockLevel: 1, skillId: 'yamato_w0' },
        { name: 'Kage Bunshin', icon: '👤', description: 'Phân thân (1→3 bóng theo cấp) 5s', cooldown: 8, duration: 5, unlockLevel: 3, skillId: 'yamato_w1' },
        { name: 'Musashi Tuyệt Kỹ', icon: '💀', description: 'Tăng x2 sát thương trong 4s', cooldown: 30, duration: 4, unlockLevel: 5, skillId: 'yamato_w2' },
    ],

    // ==================== LA MÃ ====================
    // ==================== LA MÃ ====================
    // 🗡️ Spartacus — Giác đấu sĩ (Tank/Warrior)
    [UnitType.HeroSpartacus]: [
        { name: 'Lôi Thần', icon: '⚡', description: 'Hóa Lôi Thần 6-10s (theo cấp): Đánh lan sét & giật điện xung quanh', cooldown: 15, duration: 6, unlockLevel: 1, skillId: 'lama_w0' },
        { name: 'Testudo', icon: '🛡️', description: 'Team gần giảm 40% sát thương nhận 5s', cooldown: 20, duration: 5, unlockLevel: 3, skillId: 'lama_w1' },
        { name: 'Bất Khuất Spartacus', icon: '💖', description: 'Hồi 50% HP. Giết = hồi thêm 20%', cooldown: 45, duration: 0, unlockLevel: 5, skillId: 'lama_w2' },
    ],

    // ==================== VIKING ====================
    // ==================== VIKING ====================
    // ⚔️ Ragnar Lothbrok — Berserker huyền thoại
    [UnitType.HeroRagnar]: [
        { name: 'Cuồng Chiến', icon: '🔥', description: 'Càng ít HP càng mạnh: +50-100% ATK', cooldown: 15, duration: 6, unlockLevel: 1, skillId: 'viking_w0' },
        { name: 'Mjölnir Hạ Thần', icon: '⚡', description: 'Phun băng + đóng băng kẻ địch 2s', cooldown: 18, duration: 0, unlockLevel: 2, skillId: 'viking_w1' },
        { name: 'Valhalla', icon: '✨', description: 'Bất tử 4s + hồi 30% HP sau đó', cooldown: 50, duration: 4, unlockLevel: 5, skillId: 'viking_w2' },
    ],
};

/** Get hero skills for a specific hero unit type */
export function getHeroSkills(heroType: UnitType): HeroSkill[] {
    return HERO_SKILLS[heroType] ?? [];
}

export const HERO_XP_TABLE = [0, 0, 100, 250, 500, 850, 1300];
export const HERO_MAX_LEVEL = 6;
