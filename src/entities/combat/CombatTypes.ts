// ============================================================
//  CombatTypes — Interfaces and types for Combat Strategy
// ============================================================

import { Unit } from "../Unit";
import { Building } from "../Building";
import { ParticleSystem } from "../../effects/ParticleSystem";
import type { TileMapRef } from "../../types/TileMapRef";

export interface CombatContext {
    unit: Unit;
    dt: number;
    particles: ParticleSystem;
    findNearestEnemy: ((x: number, y: number, team: number, range: number) => Unit | null) | undefined;
    tileMap: TileMapRef | undefined;
    findNearestEnemyBuilding: ((x: number, y: number, team: number, range: number) => Building | null) | undefined;
}

export interface ICombatStrategy {
    /** Main attack loop (handling target selection, chasing, and attacking) */
    doAttack(context: CombatContext): void;

    /** Cast hero specific active skills */
    castHeroSkill?(unit: Unit, skillIndex: number, particles: ParticleSystem, findNearestEnemy?: (x: number, y: number, team: number, range: number) => Unit | null, findNearestEnemyBuilding?: (x: number, y: number, team: number, range: number) => Building | null): void;

    /** Passive defense logic when unit takes damage */
    applyPassiveDefense(unit: Unit, damage: number, particles: ParticleSystem, pierceBlock?: boolean): number;

    /** Passive behaviors when idle */
    applyPassiveIdle(unit: Unit, dt: number, particles: ParticleSystem): void;

    /** Update passive effects that happen continuously regardless of state */
    updatePassive?(unit: Unit, dt: number, particles: ParticleSystem, getNearbyUnits: (x: number, y: number, range: number) => Unit[]): void;

    /** Hook called when an attack lands to modify damage or trigger effects */
    onAttackImpact?(unit: Unit, target: Unit | Building, damage: number, particles: ParticleSystem, getNearbyUnits: (x: number, y: number, range: number) => Unit[]): number;
}
