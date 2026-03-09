// ============================================================
//  HeroSkillSystem — Auto-cast logic for hero skills
//  Extracted from Unit.update() lines 1054-1141
// ============================================================

import type { Unit } from "../Unit";
import type { ParticleSystem } from "../../effects/ParticleSystem";
import { UnitState, CivilizationType } from "../../config/GameConfig";
import { CombatStrategyFactory } from "../combat/CombatStrategyFactory";

import { Building } from "../Building";

/** Run the hero skill auto-cast system. Called every frame for hero units. */
export function updateHeroSkills(
    unit: Unit,
    dt: number,
    particles: ParticleSystem,
    findNearestEnemy?: (x: number, y: number, team: number, range: number) => Unit | null,
    findNearestEnemyBuilding?: (x: number, y: number, team: number, range: number) => Building | null,
): void {
    unit.heroSkillVfxTimer += dt;
    if (unit.heroLevelUpTimer > 0) unit.heroLevelUpTimer -= dt;

    const skills = unit.heroSkills;
    const inCombat = unit.state === UnitState.Attacking;

    // Tick cooldowns down
    for (let i = 0; i < 3; i++) {
        if (unit.heroSkillCooldowns[i] > 0) unit.heroSkillCooldowns[i] -= dt;
    }

    // Tick active buffs down and apply/remove effects
    for (let i = 0; i < 3; i++) {
        if (unit.heroSkillActive[i] > 0) {
            unit.heroSkillActive[i] -= dt;
            if (unit.heroSkillActive[i] <= 0) {
                unit.heroSkillActive[i] = 0;
                // Remove buff effects when expired — restore base stats
                const sid = skills[i]?.skillId ?? '';
                if (sid.endsWith('_r1') || sid.endsWith('_r1')) {
                    unit.speed = unit._baseSpeed; // remove speed buff
                }
                if (sid.endsWith('_w0') && (unit.civilization === CivilizationType.Yamato || unit.civilization === CivilizationType.LaMa)) {
                    // Remove attack speed buff (Cuồng Nộ / Trận Hàm expired)
                }
            }
        }
    }

    // Auto-cast skills — using skillId-based universal logic
    for (let i = 0; i < skills.length; i++) {
        const skill = skills[i];
        if (unit.heroLevel < skill.unlockLevel) continue;
        if (unit.heroSkillCooldowns[i] > 0) continue;

        let shouldCast = false;
        const sid = skill.skillId;

        // Universal auto-cast rules by skill pattern:
        // _w0: Warrior skill 1 → cast in combat (offensive buff/rage)
        // _w1: Warrior skill 2 → cast in combat with target (AOE/buff allies)
        // _w2: Warrior skill 3 → cast at low HP (survival)
        // _m0: Mage skill 1 → cast in combat with target (AOE damage/debuff)
        // _m1: Mage skill 2 → cast in combat or low HP (CC/heal/utility)
        // _m2: Mage skill 3 → cast when conditions met (ultimate)
        // _r0: Ranger skill 1 → cast in combat with target (multi-shot/snipe)
        // _r1: Ranger skill 2 → cast in combat (mobility/speed)
        // _r2: Ranger skill 3 → cast in combat with target (ultimate)

        // Check distance to target to prevent cross-map sniping
        const target = unit.attackTarget || unit.attackBuildingTarget;
        const hasTarget = !!target;
        let inRange = false;

        if (hasTarget && target) {
            // Give heroes a bit of extra leeway for skills compared to normal attacks
            const castRange = Math.max(unit.civRange * 1.5, 120);
            const dist = Math.hypot(target.x - unit.x, target.y - unit.y);
            inRange = dist <= castRange;
        }

        if (sid.endsWith('_w0')) {
            shouldCast = inCombat;
        } else if (sid.endsWith('_w1')) {
            shouldCast = inCombat && hasTarget && inRange;
        } else if (sid.endsWith('_w2')) {
            // Survival skill — different thresholds per civ
            if (sid === 'viking_w2') {
                shouldCast = unit.hp < unit.maxHp * 0.25; // Valhalla: very low HP
            } else {
                shouldCast = unit.hp < unit.maxHp * 0.35; // Heal/Shield
            }
        } else if (sid.endsWith('_m0')) {
            shouldCast = inCombat && hasTarget && inRange;
        } else if (sid.endsWith('_m1')) {
            // Mage skill 2: heal = low HP, CC = in combat
            if (sid === 'daiminh_m1') {
                shouldCast = unit.hp < unit.maxHp * 0.5; // Trường Sinh heal
            } else {
                shouldCast = inCombat; // CC/debuff
            }
        } else if (sid.endsWith('_m2')) {
            shouldCast = inCombat && hasTarget && inRange;
        } else if (sid.endsWith('_r0')) {
            shouldCast = inCombat && hasTarget && inRange;
        } else if (sid.endsWith('_r1')) {
            shouldCast = inCombat;
        } else if (sid.endsWith('_r2')) {
            shouldCast = inCombat && hasTarget && inRange;
        }

        if (shouldCast) {
            unit.heroSkillCooldowns[i] = skill.cooldown;
            if (skill.duration > 0) unit.heroSkillActive[i] = skill.duration;
            const strategy = CombatStrategyFactory.getStrategy(unit.type);
            if (strategy.castHeroSkill) {
                strategy.castHeroSkill(unit, i, particles, findNearestEnemy, findNearestEnemyBuilding);
            }
        }
    }
}
