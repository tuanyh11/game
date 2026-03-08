// ============================================================
//  AbilityTypes — Shared interfaces for the elite ability system
// ============================================================

import type { Unit } from "../entities/Unit";
import type { ParticleSystem } from "../effects/ParticleSystem";

/** Context passed to every elite ability update call */
export interface AbilityContext {
    particles: ParticleSystem;
    findNearestEnemy?: (x: number, y: number, team: number, range: number) => Unit | null;
    allUnits: Unit[];
}

/**
 * EliteAbility — Strategy interface for per-unit-type special abilities.
 * Each elite unit type implements this to encapsulate its unique mechanics.
 */
export interface EliteAbility {
    /** Called every frame during Unit.update(), after common timers. */
    update(unit: Unit, dt: number, ctx: AbilityContext): void;
}
