// ============================================================
//  EliteAbilitySystem — Registry & dispatcher for elite abilities
//  Maps UnitType → EliteAbility, called from Unit.update()
// ============================================================

import type { AbilityContext } from "../../types/AbilityTypes";
import type { Unit } from "../Unit";
import { UnitType } from "../../config/GameConfig";
import type { EliteAbility } from "../../types/AbilityTypes";

// Import all elite ability implementations
import { NinjaAbility } from "./NinjaAbility";
import { MagiAbility } from "./MagiAbility";
import { CamYVeAbility } from "./CamYVeAbility";
import { CenturionAbility } from "./CenturionAbility";
import { UlfhednarAbility } from "./UlfhednarAbility";

// ---- Registry: UnitType → EliteAbility ----
const ELITE_ABILITIES = new Map<UnitType, EliteAbility>([
    [UnitType.Ninja, NinjaAbility],
    [UnitType.Immortal, MagiAbility],
    [UnitType.ChuKoNu, CamYVeAbility],
    [UnitType.Centurion, CenturionAbility],
    [UnitType.Ulfhednar, UlfhednarAbility],
]);

/**
 * Update elite ability for a unit if it has one registered.
 * Called every frame from Unit.update(), replaces inline elite logic.
 */
export function updateEliteAbility(unit: Unit, dt: number, ctx: AbilityContext): void {
    const ability = ELITE_ABILITIES.get(unit.type);
    if (ability) ability.update(unit, dt, ctx);
}
