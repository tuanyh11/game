// ============================================================
//  UnitEconomy — Extracted gathering, building & drop-off logic
//  Contains: unitDoGather, unitDoBuilding, unitDropOff
//  Auto-continue: villagers automatically find next resource/building
// ============================================================

import { Unit } from "../Unit";
import { Building } from "../Building";
import { ParticleSystem } from "../../effects/ParticleSystem";
import {
    UnitState, ResourceType, ResourceNodeType,
    GATHER_RATES, C, TILE_SIZE,
} from "../../config/GameConfig";

// Max distance (in pixels) a villager will auto-search for the next resource
const AUTO_GATHER_RANGE = TILE_SIZE * 15;   // ~15 tiles
// Max distance a villager will auto-search for the next unbuilt building
const AUTO_BUILD_RANGE = TILE_SIZE * 12;    // ~12 tiles

// ============================================================
//  Gather State — villager collects from a resource node
// ============================================================
export function unitDoGather(
    unit: Unit,
    dt: number,
    findNearestDropOff: (x: number, y: number, resType: ResourceType, team: number) => Building | null,
    particles: ParticleSystem,
): void {
    if (!unit.targetResource || unit.targetResource.isDepleted) {
        // === AUTO-CONTINUE: find next resource of same type ===
        autoFindNextResource(unit, findNearestDropOff);
        return;
    }

    const node = unit.targetResource;
    const resInfo = GATHER_RATES[node.nodeType];
    // Use per-resource bonus if available
    let gatherBonus = unit.gatherSpeedBonus;
    switch (resInfo.resourceType) {
        case ResourceType.Food: gatherBonus = unit.gatherFoodBonus || gatherBonus; break;
        case ResourceType.Wood: gatherBonus = unit.gatherWoodBonus || gatherBonus; break;
        case ResourceType.Gold: gatherBonus = unit.gatherGoldBonus || gatherBonus; break;
        case ResourceType.Stone: gatherBonus = unit.gatherStoneBonus || gatherBonus; break;
    }
    const gathered = node.gather(dt) * (1 + gatherBonus);
    unit.carriedType = resInfo.resourceType;
    unit.carriedAmount += gathered;

    // ---- GATHER PARTICLE EFFECTS ----
    unit.gatherEffectTimer += dt;
    if (unit.gatherEffectTimer >= 0.45) {
        unit.gatherEffectTimer -= 0.45;
        const ex = node.x + (Math.random() - 0.5) * 10;
        const ey = node.y + (Math.random() - 0.5) * 10;
        switch (node.nodeType) {
            case ResourceNodeType.Tree: particles.emitWoodChips(ex, ey); break;
            case ResourceNodeType.GoldMine: particles.emitGoldSparkle(ex, ey); break;
            case ResourceNodeType.StoneMine: particles.emitStoneChips(ex, ey); break;
            case ResourceNodeType.BerryBush: particles.emitBerryPick(ex, ey); break;
            case ResourceNodeType.Farm: particles.emitFarmHarvest(ex, ey); break;
        }
    }

    const effectiveCarry = resInfo.carry + unit.carryCapacityBonus;
    if (unit.carriedAmount >= effectiveCarry) {
        unit.carriedAmount = Math.min(unit.carriedAmount, effectiveCarry);
        const dropOff = findNearestDropOff(unit.x, unit.y, unit.carriedType!, unit.team);
        if (dropOff) {
            unit.targetBuilding = dropOff;
            unit.targetX = dropOff.x;
            unit.targetY = dropOff.y;
            unit.state = UnitState.Returning;
            unit.moveCallback = () => {
                if (unit.targetResource && !unit.targetResource.isDepleted) {
                    // Stand at edge of resource, not on top
                    const res = unit.targetResource;
                    const standoff = res.radius + 6;
                    const gdx = unit.x - res.x, gdy = unit.y - res.y;
                    const gd = Math.hypot(gdx, gdy) || 1;
                    unit.targetX = res.x + (gdx / gd) * standoff;
                    unit.targetY = res.y + (gdy / gd) * standoff;
                    unit.state = UnitState.Moving;
                    unit.moveCallback = () => {
                        unit.state = UnitState.Gathering;
                        unit.gatherEffectTimer = 0;
                    };
                } else {
                    // Resource depleted after drop-off → auto-find next
                    autoFindNextResource(unit, findNearestDropOff);
                }
            };
        }
    }
}

/**
 * Auto-find the next resource of the same type when current one is depleted.
 * If carrying resources, drop off first, then go to next resource.
 */
function autoFindNextResource(
    unit: Unit,
    findNearestDropOff: (x: number, y: number, resType: ResourceType, team: number) => Building | null,
): void {
    const depletedType = unit.targetResource?.nodeType;
    unit.targetResource = null;

    if (!depletedType || !unit._findNearbyResource) {
        unit.state = UnitState.Idle;
        return;
    }

    // Find next resource of same type nearby
    const nextRes = unit._findNearbyResource(unit.x, unit.y, depletedType);

    if (!nextRes || Math.hypot(nextRes.x - unit.x, nextRes.y - unit.y) > AUTO_GATHER_RANGE) {
        unit.state = UnitState.Idle;
        return;
    }

    // If carrying resources, drop off first, then continue to next resource
    if (unit.carriedAmount > 0 && unit.carriedType) {
        const dropOff = findNearestDropOff(unit.x, unit.y, unit.carriedType, unit.team);
        if (dropOff) {
            unit.targetResource = nextRes; // Remember next target
            unit.targetBuilding = dropOff;
            unit.targetX = dropOff.x;
            unit.targetY = dropOff.y;
            unit.state = UnitState.Returning;
            unit.moveCallback = () => {
                // After drop-off, go to new resource
                if (unit.targetResource && !unit.targetResource.isDepleted) {
                    startGatheringAt(unit, unit.targetResource, findNearestDropOff);
                } else {
                    unit.state = UnitState.Idle;
                }
            };
            return;
        }
    }

    // Go directly to next resource
    startGatheringAt(unit, nextRes, findNearestDropOff);
}

/** Helper: move villager to a resource and start gathering */
function startGatheringAt(
    unit: Unit,
    res: import("../ResourceNode").ResourceNode,
    findNearestDropOff: (x: number, y: number, resType: ResourceType, team: number) => Building | null,
): void {
    unit.targetResource = res;
    const standoff = res.radius + 6;
    const dx = unit.x - res.x, dy = unit.y - res.y;
    const d = Math.hypot(dx, dy) || 1;
    unit.targetX = res.x + (dx / d) * standoff;
    unit.targetY = res.y + (dy / d) * standoff;
    unit.state = UnitState.Moving;
    unit.pathWaypoints = [];
    unit.pathIndex = 0;
    unit.stuckTimer = 0;
    unit.stuckCount = 0;
    unit.moveCallback = () => {
        if (unit.targetResource && !unit.targetResource.isDepleted) {
            unit.state = UnitState.Gathering;
            unit.gatherEffectTimer = 0;
        } else {
            unit.state = UnitState.Idle;
        }
    };
    // Keep drop-off callback active
    unit._onDropOff = unit._onDropOff;
}

// ============================================================
//  Building State — villager constructs/repairs a building
// ============================================================
export function unitDoBuilding(
    unit: Unit,
    dt: number,
    particles: ParticleSystem,
    spendResource: (team: number, cost: Record<string, number>) => boolean
): void {
    if (!unit.buildTarget) {
        autoFindNextBuilding(unit);
        return;
    }

    // If fully built and full HP, nothing to do
    if (unit.buildTarget.built && unit.buildTarget.hp >= unit.buildTarget.maxHp) {
        autoFindNextBuilding(unit);
        return;
    }

    // Face the building
    if (unit.buildTarget.x > unit.x) unit.facingRight = true;
    else unit.facingRight = false;

    // Advance build or repair
    unit.buildSwingTimer += dt;
    let completed = false;

    if (!unit.buildTarget.built) {
        completed = unit.buildTarget.advanceBuild(dt, particles);
    } else {
        completed = unit.buildTarget.repairBuilding(dt, particles, spendResource, unit.team);
    }

    if (completed) {
        // Building done! Auto-find next unbuilt building nearby
        autoFindNextBuilding(unit);
    }
}

/**
 * Auto-find the next unbuilt building within range and start building it.
 */
function autoFindNextBuilding(unit: Unit): void {
    unit.buildTarget = null;

    if (!unit._findNearbyUnbuiltBuilding) {
        unit.state = UnitState.Idle;
        return;
    }

    const nextBldg = unit._findNearbyUnbuiltBuilding(unit.x, unit.y, unit.team, AUTO_BUILD_RANGE);

    if (nextBldg) {
        unit.buildTarget = nextBldg;
        unit.targetX = nextBldg.x;
        unit.targetY = nextBldg.y;
        unit.state = UnitState.Moving;
        unit.pathWaypoints = [];
        unit.pathIndex = 0;
        unit.stuckTimer = 0;
        unit.stuckCount = 0;
        unit.moveCallback = () => {
            if (unit.buildTarget && !unit.buildTarget.built) {
                unit.state = UnitState.Building;
                unit.buildSwingTimer = 0;
            } else {
                unit.state = UnitState.Idle;
                unit.buildTarget = null;
            }
        };
    } else {
        unit.state = UnitState.Idle;
    }
}

// ============================================================
//  Drop Off — deliver carried resources to nearest building
// ============================================================
export function unitDropOff(unit: Unit, particles: ParticleSystem): void {
    if (unit.carriedAmount > 0 && unit.carriedType) {
        if (unit._onDropOff) {
            unit._onDropOff(unit.carriedType, Math.floor(unit.carriedAmount));
        }
        // Drop-off splash effect
        let dropColor = '#888';
        switch (unit.carriedType) {
            case ResourceType.Food: dropColor = C.food; break;
            case ResourceType.Wood: dropColor = C.wood; break;
            case ResourceType.Gold: dropColor = C.gold; break;
            case ResourceType.Stone: dropColor = C.stone; break;
        }
        particles.emitDropOff(unit.x, unit.y, dropColor);
        unit.carriedAmount = 0;
    }
}
