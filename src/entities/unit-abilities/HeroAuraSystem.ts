// ============================================================
//  HeroAuraSystem — Applies passive aura buffs from heroes
//  to nearby allied military units each frame.
//  Called from EntityManager.update() after all unit updates.
// ============================================================

import type { Unit } from '../Unit';
import { UnitType } from '../../config/GameConfig';
import { HERO_AURA_DATA, getAuraRadius } from '../../config/HeroAuraData';
import type { AuraBuffType } from '../../config/HeroAuraData';

/**
 * Update hero auras for all units.
 * 1. Clear all existing aura buffs (and remove temporary stat bonuses)
 * 2. For each alive hero, find nearby same-team allies and apply aura
 * 3. Apply stat effects (regen, HP, armor, atkSpeed, speed)
 */
export function updateHeroAuras(units: Unit[], dt: number): void {
    // ---- Phase 1: Clear all aura buffs and remove temporary bonuses ----
    for (let i = 0; i < units.length; i++) {
        const u = units[i];
        if (!u.alive) continue;

        // Remove previous HP aura bonus if it was applied
        if (u._auraHpApplied > 0) {
            u.maxHp -= u._auraHpApplied;
            u.hp = Math.min(u.hp, u.maxHp);
            u._auraHpApplied = 0;
        }

        // Remove previous armor aura bonus
        if (u._auraArmorApplied !== 0) {
            u.armor -= u._auraArmorApplied;
            u._auraArmorApplied = 0;
        }

        // Reset atkSpeed and speed aura (these are read directly, not applied to base stat)
        u._auraAtkSpeedApplied = 0;
        u._auraSpeedApplied = 0;

        u.auraBuffType = '';
        u.auraBuffValue = 0;
        u.auraDebuffType = '';
        u.auraDebuffValue = 0;
        u.auraSourceId = -1;
    }

    // ---- Phase 2: Apply auras from each hero ----
    for (let h = 0; h < units.length; h++) {
        const hero = units[h];
        if (!hero.alive || !hero.isHero) continue;

        const aura = HERO_AURA_DATA[hero.type];
        if (!aura) continue;

        let radius = getAuraRadius(aura, hero.heroLevel);
        // Equipment: Crown of Kings boosts aura radius
        const eb = hero._equipBonuses;
        if (eb && eb.hasAuraBoost) {
            radius = Math.floor(radius * (1 + eb.auraBoostValue));
        }
        const radiusSq = radius * radius;

        for (let i = 0; i < units.length; i++) {
            const ally = units[i];
            // Skip: dead, different team, self, villagers (only buff military)
            if (!ally.alive || ally.team !== hero.team || ally.id === hero.id) continue;
            if (ally.type === UnitType.Villager || ally.type === UnitType.TargetDummy) continue;

            const dx = ally.x - hero.x;
            const dy = ally.y - hero.y;
            const distSq = dx * dx + dy * dy;

            if (distSq > radiusSq) continue;

            // If already buffed by a closer hero, skip
            if (ally.auraSourceId !== -1) {
                const prevHero = findUnitById(units, ally.auraSourceId);
                if (prevHero) {
                    const prevDistSq = (ally.x - prevHero.x) ** 2 + (ally.y - prevHero.y) ** 2;
                    if (prevDistSq <= distSq) continue;
                }
            }

            // Apply aura buff
            ally.auraBuffType = aura.buffType;
            ally.auraBuffValue = aura.buffValue;
            ally.auraSourceId = hero.id;

            // Apply secondary debuff (e.g. Ragnar's -10% defense)
            if (aura.debuffType && aura.debuffValue !== undefined) {
                ally.auraDebuffType = aura.debuffType;
                ally.auraDebuffValue = aura.debuffValue;
            }
        }
    }

    // ---- Phase 3: Apply frame-based effects ----
    for (let i = 0; i < units.length; i++) {
        const u = units[i];
        if (!u.alive || u.auraBuffType === '') continue;

        switch (u.auraBuffType) {
            case 'regen': {
                // Regen aura: tick HP each frame
                u.auraRegenAccum += u.auraBuffValue * dt;
                if (u.auraRegenAccum >= 1) {
                    const heal = Math.floor(u.auraRegenAccum);
                    u.auraRegenAccum -= heal;
                    u.hp = Math.min(u.hp + heal, u.maxHp);
                }
                break;
            }

            case 'hp': {
                // HP aura: temporarily increase maxHP (removed in Phase 1 next frame)
                const bonus = Math.floor(u.maxHp * u.auraBuffValue);
                u.maxHp += bonus;
                u.hp += bonus;
                u._auraHpApplied = bonus;
                break;
            }

            case 'armor': {
                // Armor aura: temporarily increase armor
                const armorBonus = Math.floor(u.armor * u.auraBuffValue);
                const clampedBonus = Math.max(armorBonus, 1); // at least +1 armor
                u.armor += clampedBonus;
                u._auraArmorApplied = clampedBonus;
                break;
            }

            case 'atkSpeed': {
                // Attack speed aura: store multiplier (read by combat system)
                u._auraAtkSpeedApplied = u.auraBuffValue;
                break;
            }

            case 'speed': {
                // Speed aura: store multiplier (read by movement system)
                u._auraSpeedApplied = u.auraBuffValue;
                break;
            }
        }

        // Apply secondary debuff effects (e.g. Ragnar's armor penalty)
        if (u.auraDebuffType === 'armor' && u.auraDebuffValue < 0) {
            // Negative armor from debuff — reduce armor (but don't go below 0)
            const penalty = Math.floor(u.armor * Math.abs(u.auraDebuffValue));
            const clampedPenalty = Math.max(penalty, 1);
            u.armor = Math.max(0, u.armor - clampedPenalty);
            u._auraArmorApplied -= clampedPenalty; // track net change
        }
    }
}

function findUnitById(units: Unit[], id: number): Unit | null {
    for (let i = 0; i < units.length; i++) {
        if (units[i].id === id) return units[i];
    }
    return null;
}
