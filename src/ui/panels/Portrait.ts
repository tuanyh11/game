// ============================================================
//  Portrait & Info Panel — Unit, Building, Resource portraits
//  Extracted from GameUI.ts
// ============================================================

import {
    C, TILE_SIZE, UnitType, UNIT_DATA, ResourceType, UnitState,
    CIVILIZATION_DATA, CIV_UNIT_MODIFIERS, isCivElite, CIV_ELITE_UNIT, CivilizationType,
    ResourceNodeType, GATHER_RATES, BuildingType, UpgradeType, UPGRADE_DATA,
    TOWER_ATTACK_DATA,
} from "../../config/GameConfig";
import { SelectionSystem } from "../../systems/SelectionSystem";
import { PlayerState } from "../../systems/PlayerState";
import type { ResourceNode } from "../../entities/ResourceNode";
import { HERO_XP_TABLE } from "../../entities/Unit";

type DrawStatBarFn = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, pct: number, color: string, label: string) => void;

export function renderUnitPortrait(
    ctx: CanvasRenderingContext2D, px: number, py: number, sel: SelectionSystem,
    drawStatBar: DrawStatBarFn, renderMultiUnitGrid: (ctx: CanvasRenderingContext2D, px: number, py: number, count: number, sel: SelectionSystem) => void,
    isEnemy: (team: number) => boolean = (t) => t !== 0,
): void {
    const u = sel.selectedUnits[0];
    const count = sel.selectedUnits.length;

    // Portrait frame
    const portraitSize = 70;
    ctx.fillStyle = C.uiBorderDark;
    ctx.fillRect(px - 2, py - 2, portraitSize + 4, portraitSize + 4);
    ctx.fillStyle = C.uiBorder;
    ctx.fillRect(px - 1, py - 1, portraitSize + 2, portraitSize + 2);
    ctx.fillStyle = C.uiPortraitBg;
    ctx.fillRect(px, py, portraitSize, portraitSize);

    // Unit icon (large pixel art in portrait)
    const cx = px + portraitSize / 2;
    const cy = py + portraitSize / 2;
    // Body — civilization colored
    const unitCivData = CIVILIZATION_DATA[u.civilization];
    const bodyColor = unitCivData.secondaryColor;
    const bodyAccent = unitCivData.accentColor;
    ctx.fillStyle = bodyColor;
    ctx.fillRect(cx - 10, cy - 4, 20, 22);
    // Civ accent trim on body
    ctx.fillStyle = bodyAccent;
    ctx.fillRect(cx - 10, cy - 4, 20, 3);
    // Head
    ctx.fillStyle = '#e8b87a';
    ctx.fillRect(cx - 8, cy - 16, 16, 14);
    // Eyes
    ctx.fillStyle = '#222';
    ctx.fillRect(cx + 1, cy - 10, 3, 3);
    // Hair / Helmet — civ colored
    ctx.fillStyle = u.isVillager ? '#5a3010' : bodyAccent;
    ctx.fillRect(cx - 8, cy - 18, 16, 5);
    // Weapon for military
    if (!u.isVillager) {
        ctx.fillStyle = '#bbb';
        ctx.fillRect(cx + 10, cy - 18, 3, 24);
    }

    // Selection count badge
    if (count > 1) {
        ctx.fillStyle = C.uiHighlight;
        ctx.font = "bold 12px 'Inter', sans-serif";
        ctx.fillText(`×${count}`, px + portraitSize - 18, py + 14);
    }

    // Info to the right of portrait
    const infoX = px + portraitSize + 12;
    let infoY = py + 4;

    // Name
    ctx.fillStyle = C.uiHighlight;
    ctx.font = "bold 15px 'MedievalSharp', cursive";
    ctx.fillText(u.name, infoX, infoY + 14);
    infoY += 18;

    // Civilization
    const civData = CIVILIZATION_DATA[u.civilization];
    ctx.fillStyle = civData.accentColor;
    ctx.font = "11px 'Inter', sans-serif";
    ctx.fillText(`${civData.icon} ${civData.name}`, infoX, infoY + 10);
    infoY += 16;

    // HP bar
    drawStatBar(ctx, infoX, infoY, 130, 10, u.hp / u.maxHp, C.hpGreen, `${u.hp}/${u.maxHp}`);
    infoY += 18;

    // Stats
    ctx.fillStyle = C.uiText;
    ctx.font = "12px 'Inter', sans-serif";
    const armorStr = u.armor > 0 ? `  🛡 ${u.armor}` : '';
    const rangeStr = u.data.range > 30 ? `  🎯 ${Math.round(u.data.range / TILE_SIZE)}` : '';
    ctx.fillText(`⚔ ${u.attack}   🏃 ${u.speed}${armorStr}${rangeStr}`, infoX, infoY + 10);
    infoY += 18;

    // Enemy/Ally team label
    if (isEnemy(u.team)) {
        ctx.fillStyle = '#ff4444';
        ctx.font = "bold 11px 'Inter', sans-serif";
        ctx.fillText('⚔ Kẻ địch', infoX, infoY + 10);
        infoY += 16;
    } else if (u.team !== 0) {
        ctx.fillStyle = '#44aaff';
        ctx.font = "bold 11px 'Inter', sans-serif";
        ctx.fillText('🤝 Đồng minh', infoX, infoY + 10);
        infoY += 16;
    }

    // Hero Level & XP
    if (u.isHero) {
        // Level
        ctx.fillStyle = '#ffd700';
        ctx.font = "bold 12px 'Inter', sans-serif";
        ctx.fillText(`⭐ Cấp ${u.heroLevel}`, infoX, infoY + 10);
        infoY += 16;

        // XP bar
        const xpLabel = u.heroLevel >= 9 ? 'MAX' : `${u.heroXp}/${u.heroLevel < 9 ? HERO_XP_TABLE[u.heroLevel + 1] : '∞'}`;
        drawStatBar(ctx, infoX, infoY, 130, 8, u.xpProgress, '#aa88ff', xpLabel);
        infoY += 14;

        // Skills list
        const skills = u.heroSkills;
        for (let i = 0; i < skills.length; i++) {
            const skill = skills[i];
            const unlocked = u.heroLevel >= skill.unlockLevel;
            const onCooldown = u.heroSkillCooldowns[i] > 0;
            const isActive = u.heroSkillActive[i] > 0;

            if (!unlocked) {
                ctx.fillStyle = '#555';
                ctx.font = "10px 'Inter', sans-serif";
                ctx.fillText(`🔒 Lv${skill.unlockLevel}: ${skill.name}`, infoX, infoY + 10);
            } else {
                const statusColor = isActive ? '#44ff44' : (onCooldown ? '#888' : '#ffd700');
                ctx.fillStyle = statusColor;
                ctx.font = "bold 10px 'Inter', sans-serif";
                let statusStr = skill.icon + ' ' + skill.name;
                if (isActive) statusStr += ` (${Math.ceil(u.heroSkillActive[i])}s)`;
                else if (onCooldown) statusStr += ` (${Math.ceil(u.heroSkillCooldowns[i])}s)`;
                else statusStr += ' ✓';
                ctx.fillText(statusStr, infoX, infoY + 10);
            }
            infoY += 13;
        }
    } else {
        // Upgrade level for military (non-hero)
        if (!u.isVillager && u.upgradeLevel > 0) {
            ctx.fillStyle = '#ffd700';
            ctx.font = "11px 'Inter', sans-serif";
            ctx.fillText(`${'★'.repeat(u.upgradeLevel)} Cấp ${u.upgradeLevel}`, infoX, infoY + 10);
            infoY += 16;
        }

        // ---- Passive Skill display ----
        if (!u.isVillager) {
            const skillInfo = getUnitSkillInfo(u.type, u.civilization);
            if (skillInfo) {
                // Skill name
                ctx.fillStyle = '#ffd700';
                ctx.font = "bold 10px 'Inter', sans-serif";
                ctx.fillText(`${skillInfo.icon} ${skillInfo.name}`, infoX, infoY + 10);
                infoY += 13;
                // Skill description
                ctx.fillStyle = '#bbaa88';
                ctx.font = "9px 'Inter', sans-serif";
                ctx.fillText(skillInfo.desc, infoX, infoY + 9);
                infoY += 12;
                if (skillInfo.desc2) {
                    ctx.fillText(skillInfo.desc2, infoX, infoY + 9);
                    infoY += 12;
                }
            }
        }
    }

    // Carrying info (own units only)
    if (u.team === 0 && u.isCarrying && u.carriedType) {
        let resIcon = '📦';
        switch (u.carriedType) {
            case ResourceType.Food: resIcon = '🌾'; break;
            case ResourceType.Wood: resIcon = '🪵'; break;
            case ResourceType.Gold: resIcon = '🪙'; break;
            case ResourceType.Stone: resIcon = '🪨'; break;
        }
        ctx.fillStyle = C.uiHighlight;
        ctx.font = "12px 'Inter', sans-serif";
        ctx.fillText(`${resIcon} ${Math.floor(u.carriedAmount)}`, infoX, infoY + 10);
        infoY += 16;
    }

    // State
    const stateLabels: Record<number, string> = {
        [UnitState.Idle]: '⏸ Đang nghỉ',
        [UnitState.Moving]: '🚶 Di chuyển',
        [UnitState.Gathering]: '⛏ Khai thác',
        [UnitState.Returning]: '📦 Mang về',
        [UnitState.Building]: '🔨 Xây dựng',
        [UnitState.Attacking]: '⚔ Tấn công',
    };
    // State (own units only)
    if (u.team === 0) {
        ctx.fillStyle = C.uiTextDim;
        ctx.font = "11px 'Inter', sans-serif";
        ctx.fillText(stateLabels[u.state] ?? '', infoX, infoY + 10);
    }

    // Multi-unit grid (if multiple selected)
    if (count > 1) {
        renderMultiUnitGrid(ctx, px, py + portraitSize + 8, count, sel);
    }
}

export function renderBuildingPortrait(
    ctx: CanvasRenderingContext2D, px: number, py: number, sel: SelectionSystem,
    drawStatBar: DrawStatBarFn, playerState?: PlayerState,
    isEnemy: (team: number) => boolean = (t) => t !== 0,
): void {
    const b = sel.selectedBuilding!;
    const portraitSize = 70;

    // Portrait frame
    ctx.fillStyle = C.uiBorderDark;
    ctx.fillRect(px - 2, py - 2, portraitSize + 4, portraitSize + 4);
    ctx.fillStyle = C.uiBorder;
    ctx.fillRect(px - 1, py - 1, portraitSize + 2, portraitSize + 2);
    ctx.fillStyle = C.uiPortraitBg;
    ctx.fillRect(px, py, portraitSize, portraitSize);

    // Building icon — civilization colored
    const bldCivData = CIVILIZATION_DATA[b.civilization];
    ctx.fillStyle = bldCivData.secondaryColor;
    ctx.fillRect(px + 10, py + 15, 50, 40);
    ctx.fillStyle = bldCivData.accentColor;
    ctx.fillRect(px + 8, py + 10, 54, 10);
    // Flag — civ colored
    ctx.fillStyle = bldCivData.accentColor;
    ctx.fillRect(px + portraitSize / 2, py + 2, 3, 12);
    ctx.fillRect(px + portraitSize / 2 + 3, py + 2, 12, 8);
    // Windows
    ctx.fillStyle = C.gold;
    ctx.fillRect(px + 18, py + 24, 8, 8);
    ctx.fillRect(px + 42, py + 24, 8, 8);

    const infoX = px + portraitSize + 12;
    let infoY = py + 4;

    // Name
    ctx.fillStyle = b.team === 0 ? C.uiHighlight : (isEnemy(b.team) ? '#ff6666' : '#66aaff');
    ctx.font = "bold 15px 'MedievalSharp', cursive";
    ctx.fillText(b.name, infoX, infoY + 14);
    infoY += 18;

    // Civilization + Team label
    ctx.fillStyle = bldCivData.accentColor;
    ctx.font = "11px 'Inter', sans-serif";
    ctx.fillText(`${bldCivData.icon} ${bldCivData.name}`, infoX, infoY + 10);
    infoY += 16;
    if (isEnemy(b.team)) {
        ctx.fillStyle = '#ff4444';
        ctx.font = "bold 11px 'Inter', sans-serif";
        ctx.fillText('⚔ Kẻ địch', infoX, infoY + 10);
        infoY += 16;
    } else if (b.team !== 0) {
        ctx.fillStyle = '#44aaff';
        ctx.font = "bold 11px 'Inter', sans-serif";
        ctx.fillText('🤝 Đồng minh', infoX, infoY + 10);
        infoY += 16;
    }

    // Age info (especially for Town Center)
    if (b.age >= 1) {
        const ageRoman = ['I', 'II', 'III', 'IV'];
        const ageColors = ['#aaa', '#44aaff', '#aa88ff', '#ffd700'];
        ctx.fillStyle = ageColors[b.age - 1] || '#aaa';
        ctx.font = "bold 12px 'Inter', sans-serif";
        ctx.fillText(`🏛 Đời ${ageRoman[b.age - 1] || b.age}`, infoX, infoY + 10);
        infoY += 18;
    }

    // HP bar
    const hpColor = b.team === 0 ? C.hpGreen : (isEnemy(b.team) ? '#cc3333' : '#33ccff');
    drawStatBar(ctx, infoX, infoY, 130, 10, b.hp / b.maxHp, hpColor, `${b.hp}/${b.maxHp}`);
    infoY += 20;

    // Tower combat stats
    if (b.type === BuildingType.Tower && b.built) {
        const ageIdx = Math.min(b.age, TOWER_ATTACK_DATA.length - 1);
        const stats = TOWER_ATTACK_DATA[ageIdx];
        if (stats.damage > 0) {
            ctx.fillStyle = C.uiText;
            ctx.font = "12px 'Inter', sans-serif";
            const rangeTiles = Math.round(stats.range / TILE_SIZE);
            ctx.fillText(`⚔ ${stats.damage}   🎯 ${rangeTiles} ô   🏹 ×${stats.arrowCount}`, infoX, infoY + 10);
            infoY += 16;
            ctx.fillStyle = C.uiTextDim;
            ctx.font = "11px 'Inter', sans-serif";
            ctx.fillText(`⏱ Tốc đánh: ${stats.attackSpeed.toFixed(1)}s`, infoX, infoY + 10);
            infoY += 14;
            // Fire arrow indicator for age 4
            if (b.age >= 4) {
                ctx.fillStyle = '#ff8800';
                ctx.font = "bold 11px 'Inter', sans-serif";
                ctx.fillText('🔥 Tên lửa', infoX, infoY + 10);
                infoY += 14;
            }
            // Current target
            if (b.towerTarget && b.towerTarget.alive) {
                ctx.fillStyle = '#ff6644';
                ctx.font = "11px 'Inter', sans-serif";
                ctx.fillText(`🎯 Đang tấn công: ${b.towerTarget.name}`, infoX, infoY + 10);
                infoY += 14;
            } else {
                ctx.fillStyle = C.uiTextDim;
                ctx.font = "11px 'Inter', sans-serif";
                ctx.fillText('🔍 Đang tuần tra...', infoX, infoY + 10);
                infoY += 14;
            }
        }
    }

    // Training progress (own buildings only)
    if (b.team === 0 && b.trainQueue.length > 0) {
        const item = b.trainQueue[0];
        const ud = UNIT_DATA[item.unitType];
        ctx.fillStyle = C.uiText;
        ctx.font = "12px 'Inter', sans-serif";
        ctx.fillText(`Đang huấn luyện: ${ud.name}`, infoX, infoY + 10);
        infoY += 16;
        drawStatBar(ctx, infoX, infoY, 130, 8, b.trainProgress, C.uiHighlight, '');
        infoY += 14;
        ctx.fillStyle = C.uiTextDim;
        ctx.font = "11px 'Inter', sans-serif";
        ctx.fillText(`Hàng đợi: ${b.trainQueue.length}`, infoX, infoY + 10);
        infoY += 16;
    }

    // Age-up progress (Town Center, own team only)
    if (b.team === 0 && b.type === BuildingType.TownCenter && playerState?.isAgingUp) {
        const ageRoman = ['I', 'II', 'III', 'IV'];
        const targetAgeLabel = ageRoman[playerState.ageUpTargetAge - 1] || playerState.ageUpTargetAge;
        const pct = playerState.ageUpPercent;
        const remaining = Math.ceil(playerState.ageUpTime - playerState.ageUpProgress);

        // Title
        ctx.fillStyle = '#ffd700';
        ctx.font = "bold 12px 'Inter', sans-serif";
        ctx.fillText(`⬆ Đang lên: Đời ${targetAgeLabel}`, infoX, infoY + 10);
        infoY += 16;

        // Progress bar (golden)
        drawStatBar(ctx, infoX, infoY, 130, 10, pct, '#daa520', `${Math.floor(pct * 100)}%`);
        infoY += 14;

        // Time remaining
        ctx.fillStyle = C.uiTextDim;
        ctx.font = "10px 'Inter', sans-serif";
        ctx.fillText(`⏱ Còn ${remaining}s`, infoX, infoY + 10);
        infoY += 16;
    }

    // Research progress (own buildings only)
    const research = playerState?.activeResearch;
    const isUpgradeBuilding = b.type === BuildingType.Blacksmith || b.type === BuildingType.Market;
    if (b.team === 0 && research && isUpgradeBuilding) {
        const upData = UPGRADE_DATA[research.upgradeType];
        const pct = research.progress / research.time;
        ctx.fillStyle = '#aaccff';
        ctx.font = "12px 'Inter', sans-serif";
        ctx.fillText(`🔬 ${upData.icon} ${upData.name}`, infoX, infoY + 10);
        infoY += 16;
        drawStatBar(ctx, infoX, infoY, 130, 8, pct, '#44aaff', `${Math.floor(pct * 100)}%`);
        infoY += 14;
    }

    // Show upgrade levels summary (own buildings only)
    if (b.team === 0 && b.type === BuildingType.Blacksmith) {
        const levels = playerState!.upgrades;
        const milLvl = levels.meleeAttack + levels.rangedAttack + levels.meleeDefense + levels.rangedDefense;
        if (milLvl > 0) {
            ctx.fillStyle = C.uiTextDim;
            ctx.font = "10px 'Inter', sans-serif";
            const summary = `⚔${levels.meleeAttack} 🏹${levels.rangedAttack} 🛡${levels.meleeDefense} 🪖${levels.rangedDefense}`;
            ctx.fillText(summary, infoX, infoY + 10);
        }
    }
    if (b.team === 0 && b.type === BuildingType.Market) {
        const levels = playerState!.upgrades;
        const ecoLvl = levels.gatherFood + levels.gatherWood + levels.gatherGold + levels.gatherStone + levels.carryCapacity + levels.villagerSpeed;
        if (ecoLvl > 0) {
            ctx.fillStyle = C.uiTextDim;
            ctx.font = "10px 'Inter', sans-serif";
            const summary = `🌾${levels.gatherFood} 🪵${levels.gatherWood} 🪙${levels.gatherGold} 🪨${levels.gatherStone} 📦${levels.carryCapacity} 🏃${levels.villagerSpeed}`;
            ctx.fillText(summary, infoX, infoY + 10);
        }
    }
}

/** Get passive skill info for a unit type + civilization */
export function getUnitSkillInfo(type: UnitType, civ: CivilizationType): { icon: string; name: string; desc: string; desc2?: string } | null {
    // Elite units — unique skills
    switch (type) {
        case UnitType.Immortal: return { icon: '❄️', name: 'Phép Tối Thượng', desc: 'Mỗi 4s: đóng băng 3 địch 3s', desc2: 'Hồi 4 HP đồng minh gần' };
        case UnitType.ChuKoNu: return { icon: '⚔', name: 'Tịch Tà Kiếm Phổ', desc: 'Tự động lướt chém 3 lần (CD 4s)', desc2: 'Ẩn hiện từ 3 góc khác nhau' };
        case UnitType.Ninja: return { icon: '💨', name: 'Độn Thổ', desc: 'Ẩn mình + lướt tới mục tiêu', desc2: '4x sát thương + xuyên giáp 2s' };
        case UnitType.Centurion: return { icon: '🛡', name: 'Giáo & Kiếm', desc: '🏹 Giáo: phi nổ AOE mỗi 3s', desc2: '⚔ Kiếm: 4 đòn → nổ bom 50px' };
        case UnitType.Ulfhednar: return { icon: '⚡', name: 'Cuồng Sói', desc: 'Chịu 5 đòn → cuồng nộ 4s', desc2: 'Bắn 3 sét trời, +15 giáp, +30% ATK' };
    }

    // Standard units — per civilization
    const skills: Record<string, { icon: string; name: string; desc: string; desc2?: string }> = {
        // Ba Tư
        [`${CivilizationType.BaTu}_${UnitType.Spearman}`]: { icon: '🛡', name: 'Tường Bất Tử', desc: 'HP <40%: giảm 30% dmg nhận 4s', desc2: 'Hồi chiêu 15 giây' },
        [`${CivilizationType.BaTu}_${UnitType.Archer}`]: { icon: '🔥', name: 'Tên Lửa', desc: '20% bắn tên lửa', desc2: 'gây thêm 5 dmg cháy/2s' },
        [`${CivilizationType.BaTu}_${UnitType.Swordsman}`]: { icon: '⚔', name: 'Cuồng Chiến', desc: 'Hạ gục địch → +30% ATK 4s' },
        [`${CivilizationType.BaTu}_${UnitType.Knight}`]: { icon: '🐴', name: 'Xung Phong Sa Mạc', desc: 'Đòn đầu sau di chuyển', desc2: 'gây 2x sát thương' },

        // Đại Minh
        [`${CivilizationType.DaiMinh}_${UnitType.Spearman}`]: { icon: '🏯', name: 'Trận Pháp', desc: 'Có 3+ giáo gần:', desc2: 'tất cả +20% phòng thủ' },
        [`${CivilizationType.DaiMinh}_${UnitType.Archer}`]: { icon: '🎯', name: 'Nỏ Liên Châu', desc: 'Mỗi 4 phát bắn', desc2: 'phát thứ 4 gây 2x dmg' },
        [`${CivilizationType.DaiMinh}_${UnitType.Swordsman}`]: { icon: '🥋', name: 'Võ Thuật', desc: '20% né đòn (dodge)' },
        [`${CivilizationType.DaiMinh}_${UnitType.Knight}`]: { icon: '⚡', name: 'Thiết Kỵ', desc: 'Đòn tấn công stun 0.5s', desc2: 'Hồi chiêu 8 giây' },

        // Yamato
        [`${CivilizationType.Yamato}_${UnitType.Spearman}`]: { icon: '🔱', name: 'Yari Jutsu', desc: 'Tầm đánh +15px (giáo dài)' },
        [`${CivilizationType.Yamato}_${UnitType.Archer}`]: { icon: '🎋', name: 'Kyūdō', desc: '15% cơ hội critical', desc2: '2x sát thương' },
        [`${CivilizationType.Yamato}_${UnitType.Swordsman}`]: { icon: '⛩', name: 'Bushidō', desc: 'HP <30%: ATK +50%' },
        [`${CivilizationType.Yamato}_${UnitType.Knight}`]: { icon: '🌸', name: 'Banzai', desc: 'Hạ gục địch → hồi 20 HP' },

        // La Mã
        [`${CivilizationType.LaMa}_${UnitType.Spearman}`]: { icon: '🐢', name: 'Testudo', desc: 'Đứng yên: -25% dmg nhận' },
        [`${CivilizationType.LaMa}_${UnitType.Archer}`]: { icon: '❄', name: 'Plumbata', desc: 'Mũi tên làm chậm 20% 2s' },
        [`${CivilizationType.LaMa}_${UnitType.Swordsman}`]: { icon: '⚔', name: 'Gladius', desc: '+20% tốc đánh' },
        [`${CivilizationType.LaMa}_${UnitType.Knight}`]: { icon: '💥', name: 'Equites', desc: 'Gây thêm 30% splash', desc2: 'cho quân địch gần' },

        // Viking
        [`${CivilizationType.Viking}_${UnitType.Spearman}`]: { icon: '💚', name: 'Shield Wall', desc: 'HP <50%: hồi 2 HP/s' },
        [`${CivilizationType.Viking}_${UnitType.Archer}`]: { icon: '❄', name: 'Frost Arrow', desc: '20% làm chậm 30% 2s' },
        [`${CivilizationType.Viking}_${UnitType.Swordsman}`]: { icon: '🔥', name: 'Berserker', desc: '+25% dmg gây ra', desc2: 'nhưng nhận thêm 15% dmg' },
        [`${CivilizationType.Viking}_${UnitType.Knight}`]: { icon: '🌀', name: "Odin's Steed", desc: '+20% tốc di chuyển', desc2: '10% né đòn' },
    };

    const key = `${civ}_${type}`;
    return skills[key] || null;
}

export function renderResourcePortrait(
    ctx: CanvasRenderingContext2D, px: number, py: number, res: ResourceNode,
    drawStatBar: DrawStatBarFn,
): void {
    const portraitSize = 70;

    // Portrait frame
    ctx.fillStyle = C.uiBorderDark;
    ctx.fillRect(px - 2, py - 2, portraitSize + 4, portraitSize + 4);
    ctx.fillStyle = C.uiBorder;
    ctx.fillRect(px - 1, py - 1, portraitSize + 2, portraitSize + 2);
    ctx.fillStyle = C.uiPortraitBg;
    ctx.fillRect(px, py, portraitSize, portraitSize);

    // Resource-specific icon in portrait
    const cx = px + portraitSize / 2;
    const cy = py + portraitSize / 2;
    switch (res.nodeType) {
        case ResourceNodeType.GoldMine:
            // Gold nugget shape
            ctx.fillStyle = '#bba030';
            ctx.fillRect(cx - 18, cy - 8, 36, 24);
            ctx.fillStyle = '#ccc050';
            ctx.fillRect(cx - 14, cy - 12, 28, 8);
            ctx.fillStyle = C.gold;
            ctx.fillRect(cx - 6, cy - 4, 12, 12);
            ctx.fillStyle = '#fff8cc';
            ctx.fillRect(cx - 3, cy - 1, 6, 6);
            break;
        case ResourceNodeType.StoneMine:
            // Stone blocks
            ctx.fillStyle = '#6a6a6a';
            ctx.fillRect(cx - 16, cy - 6, 32, 20);
            ctx.fillStyle = '#888';
            ctx.fillRect(cx - 12, cy - 10, 24, 8);
            ctx.fillStyle = '#9a9a9a';
            ctx.fillRect(cx - 8, cy - 2, 16, 10);
            ctx.fillStyle = '#aaa';
            ctx.fillRect(cx - 4, cy + 1, 8, 5);
            break;
        case ResourceNodeType.Tree:
            // Tree trunk + canopy
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(cx - 3, cy + 4, 6, 18);
            ctx.fillStyle = '#2a6a18';
            ctx.beginPath();
            ctx.arc(cx, cy - 2, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#3a8a22';
            ctx.beginPath();
            ctx.arc(cx - 4, cy - 6, 10, 0, Math.PI * 2);
            ctx.fill();
            break;
        case ResourceNodeType.BerryBush:
            // Bush with berries
            ctx.fillStyle = '#2e7a20';
            ctx.beginPath();
            ctx.arc(cx, cy + 2, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#3a9a2a';
            ctx.beginPath();
            ctx.arc(cx - 5, cy - 2, 9, 0, Math.PI * 2);
            ctx.fill();
            // Berries
            ctx.fillStyle = '#e85050';
            const berryPos = [[-8, -4], [4, -6], [8, 2], [-4, 6], [0, 0]];
            for (const [bx, by] of berryPos) {
                ctx.beginPath();
                ctx.arc(cx + bx, cy + by, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
        case ResourceNodeType.Farm:
            // Farm field
            ctx.fillStyle = '#8a7040';
            ctx.fillRect(cx - 16, cy - 12, 32, 28);
            ctx.fillStyle = '#6a8a30';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(cx - 14 + i * 8, cy - 10, 6, 24);
            }
            break;
    }

    // Info to the right of portrait
    const infoX = px + portraitSize + 12;
    let infoY = py + 4;

    // Resource name
    const nameMap: Record<string, string> = {
        [ResourceNodeType.GoldMine]: '⛏ Mỏ Vàng',
        [ResourceNodeType.StoneMine]: '⛏ Mỏ Đá',
        [ResourceNodeType.Tree]: '🌲 Cây Gỗ',
        [ResourceNodeType.BerryBush]: '🫐 Bụi Quả',
        [ResourceNodeType.Farm]: '🌾 Trang Trại',
    };
    ctx.fillStyle = C.uiHighlight;
    ctx.font = "bold 15px 'MedievalSharp', cursive";
    ctx.fillText(nameMap[res.nodeType] ?? 'Tài Nguyên', infoX, infoY + 14);
    infoY += 22;

    // Resource type
    const resTypeMap: Record<string, [string, string]> = {
        [ResourceType.Gold]: ['🪙 Vàng', C.gold],
        [ResourceType.Stone]: ['🪨 Đá', C.stone],
        [ResourceType.Wood]: ['🪵 Gỗ', C.wood],
        [ResourceType.Food]: ['🌾 Thực phẩm', C.food],
    };
    const [resLabel, resColor] = resTypeMap[res.resourceType] ?? ['📦 Khác', C.uiText];
    ctx.fillStyle = resColor;
    ctx.font = "12px 'Inter', sans-serif";
    ctx.fillText(`Loại: ${resLabel}`, infoX, infoY + 10);
    infoY += 18;

    // Resource amount bar
    const pct = res.amount / res.maxAmount;
    const barColor = pct > 0.5 ? resColor : (pct > 0.25 ? C.hpYellow : C.hpRed);
    drawStatBar(ctx, infoX, infoY, 130, 10, pct, barColor, `${Math.floor(res.amount)}/${res.maxAmount}`);
    infoY += 20;

    // Gather rate info
    const gatherInfo = GATHER_RATES[res.nodeType];
    ctx.fillStyle = C.uiTextDim;
    ctx.font = "11px 'Inter', sans-serif";
    ctx.fillText(`⚡ Tốc độ khai thác: ${gatherInfo.rate}/s`, infoX, infoY + 10);
    infoY += 16;
    ctx.fillText(`📦 Mang tối đa: ${gatherInfo.carry}`, infoX, infoY + 10);
}

export function renderMultiUnitGrid(ctx: CanvasRenderingContext2D, px: number, py: number, count: number, sel: SelectionSystem): void {
    const iconSize = 20;
    const gap = 3;
    const maxDraw = Math.min(count, 6); // Max 6 units so it fits in 2 rows.
    const cols = Math.min(maxDraw, 3); // 3 columns max per row, to fit perfectly under the 70px wide portrait box!
    for (let i = 0; i < maxDraw; i++) {
        const u = sel.selectedUnits[i];
        const col = i % cols, row = Math.floor(i / cols);
        const ix = px + col * (iconSize + gap);
        const iy = py + row * (iconSize + gap);
        ctx.fillStyle = C.uiButtonBorder;
        ctx.fillRect(ix, iy, iconSize, iconSize);
        const gridCivData = CIVILIZATION_DATA[u.civilization];
        ctx.fillStyle = u.slotColor || gridCivData.secondaryColor;
        ctx.fillRect(ix + 1, iy + 1, iconSize - 2, iconSize - 2);
        // Tiny HP indicator
        const hpPct = u.hp / u.maxHp;
        ctx.fillStyle = hpPct > 0.5 ? C.hpGreen : C.hpRed;
        ctx.fillRect(ix + 1, iy + iconSize - 3, (iconSize - 2) * hpPct, 2);
    }
}
