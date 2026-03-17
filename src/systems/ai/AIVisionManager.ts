// ============================================================
//  AI Vision Manager — Fog of war, scouting, exploration
//  Extracted from AIController.ts
// ============================================================

import {
    BuildingType, ResourceNodeType, UnitType, ResourceType, UnitState,
    C, TILE_SIZE, UPGRADE_DATA, UpgradeType, isRangedType, isCavalryType, MAP_COLS, MAP_ROWS, UNIT_DATA,
    CIV_ELITE_UNIT, CivilizationType
} from "../../config/GameConfig";
import { Unit } from "../../entities/Unit";
import { Building } from "../../entities/Building";
import type { AIContext } from "./AIContext";
import { sharedIntel } from "./AIConfig";

// ===================================================================
//  FOG OF WAR: Vision system — AI discovers enemies through sight
// ===================================================================
export function isPositionVisible(ai: AIContext, px: number, py: number): boolean {
    // Check if any AI unit can see this position
    for (const u of ai.entityManager.units) {
        if (!u.alive || u.team !== ai.team) continue;
        const sightRange = u.data.sight * TILE_SIZE;
        if (Math.hypot(u.x - px, u.y - py) < sightRange) return true;
    }
    // Check if any AI building can see this position (buildings have 8 tile sight)
    for (const b of ai.entityManager.buildings) {
        if (!b.alive || b.team !== ai.team) continue;
        if (Math.hypot(b.x - px, b.y - py) < TILE_SIZE * 8) return true;
    }
    return false;
}

export function updateVision(ai: AIContext): void {
    const now = sharedIntel.gameTime;

    // Get all AI units and buildings for sight checks
    const myUnits = ai.entityManager.units.filter(u => u.alive && u.team === ai.team);
    const myBuildings = ai.entityManager.buildings.filter(b => b.alive && b.team === ai.team);

    // Check each enemy unit — can we see it?
    for (const enemy of ai.entityManager.units) {
        if (!enemy.alive || !ai.entityManager.isEnemy(ai.team, enemy.team)) continue;

        let visible = false;
        for (const u of myUnits) {
            const sightRange = u.data.sight * TILE_SIZE;
            if (Math.hypot(u.x - enemy.x, u.y - enemy.y) < sightRange) {
                visible = true;
                break;
            }
        }
        if (!visible) {
            for (const b of myBuildings) {
                if (Math.hypot(b.x - enemy.x, b.y - enemy.y) < TILE_SIZE * 8) {
                    visible = true;
                    break;
                }
            }
        }

        if (visible) {
            ai.scoutedEnemyUnits.set(enemy.id ?? 0, { x: enemy.x, y: enemy.y, time: now });
            ai.knownEnemyPositions.set(enemy.id ?? 0, { x: enemy.x, y: enemy.y, time: now });
        }
    }

    // Check each enemy building — can we see it?
    for (const enemyBldg of ai.entityManager.buildings) {
        if (!enemyBldg.alive || !ai.entityManager.isEnemy(ai.team, enemyBldg.team)) continue;

        let visible = false;
        for (const u of myUnits) {
            const sightRange = u.data.sight * TILE_SIZE;
            if (Math.hypot(u.x - enemyBldg.x, u.y - enemyBldg.y) < sightRange) {
                visible = true;
                break;
            }
        }
        if (!visible) {
            for (const b of myBuildings) {
                if (Math.hypot(b.x - enemyBldg.x, b.y - enemyBldg.y) < TILE_SIZE * 8) {
                    visible = true;
                    break;
                }
            }
        }

        if (visible) {
            ai.scoutedEnemyBuildings.set(
                enemyBldg.id ?? 0,
                { x: enemyBldg.x, y: enemyBldg.y, type: enemyBldg.type, time: now, alive: true }
            );
        }
    }

    // Track explored regions (8x8 tile chunks)
    for (const u of myUnits) {
        const regionCol = Math.floor(u.x / (TILE_SIZE * 8));
        const regionRow = Math.floor(u.y / (TILE_SIZE * 8));
        ai.exploredRegions.add(`${regionCol}_${regionRow}`);
    }
}

/** Get scouted enemy buildings that AI has discovered */
export function getScoutedEnemyBuildings(ai: AIContext): Building[] {
    const result: Building[] = [];
    for (const [id] of ai.scoutedEnemyBuildings) {
        const bldg = ai.entityManager.buildings.find(
            b => b.alive && (b.id ?? 0) === id
        );
        if (bldg) result.push(bldg);
    }
    return result;
}

/** Check if AI has scouted any enemy positions */
export function hasScoutedEnemy(ai: AIContext): boolean {
    return ai.scoutedEnemyBuildings.size > 0 || ai.scoutedEnemyUnits.size > 0;
}

// ===================================================================
//  Move toward SCOUTED enemy positions (not omniscient)
// ===================================================================
export function moveTowardEnemy(ai: AIContext, u: Unit): void {
    // Try scouted enemy buildings first
    const scoutedBuildings = ai.getScoutedEnemyBuildings();
    if (scoutedBuildings.length > 0) {
        let closest = scoutedBuildings[0];
        let closestDist = Infinity;
        for (const b of scoutedBuildings) {
            const d = Math.hypot(b.x - u.x, b.y - u.y);
            if (d < closestDist) { closestDist = d; closest = b; }
        }
        u.moveTo(closest.x, closest.y);
        return;
    }

    // Try known enemy unit positions from intel
    if (ai.knownEnemyPositions.size > 0) {
        let bestPos = { x: 0, y: 0, time: 0 };
        let bestDist = Infinity;
        for (const [, pos] of ai.knownEnemyPositions) {
            const d = Math.hypot(pos.x - u.x, pos.y - u.y);
            if (d < bestDist) { bestDist = d; bestPos = pos; }
        }
        ai.safeMoveTo(u, bestPos.x, bestPos.y);
        return;
    }

    // No intel at all! Explore a random unexplored region
    ai.sendToExplore(u);
}

/** Check if all non-water regions have been explored */
export function checkExplorationComplete(ai: AIContext): boolean {
    if (ai.explorationComplete) return true;

    ai.explorationCheckTimer -= 0.5; // called from combat timer (0.5s)
    if (ai.explorationCheckTimer > 0) return ai.explorationComplete;
    ai.explorationCheckTimer = 10; // recheck every 10s

    // Exploration is "complete" once we've found at least one enemy base
    if (ai.scoutedEnemyBuildings.size > 0) {
        ai.explorationComplete = true;
        ai.log('🗺️ Trinh sát phát hiện căn cứ địch! Chuyển sang theo dõi.', '#44ff88');
        return true;
    }
    return false;
}

/**
 * Generate probable enemy locations based on map spawn pattern.
 * Enemies typically spawn at corners/edges far from AI's own TC.
 */
function getProbableEnemyLocations(ai: AIContext): { x: number; y: number }[] {
    // Find our TC position
    const myTC = ai.entityManager.buildings.find(
        b => b.alive && b.team === ai.team && b.type === BuildingType.TownCenter
    );
    const myX = myTC?.x ?? MAP_COLS * TILE_SIZE / 2;
    const myY = myTC?.y ?? MAP_ROWS * TILE_SIZE / 2;

    // All likely spawn positions (same as EntityManager setupGame corners)
    const corners = [
        { x: 68 * TILE_SIZE, y: 390 * TILE_SIZE },
        { x: 68 * TILE_SIZE, y: 68 * TILE_SIZE },
        { x: 225 * TILE_SIZE, y: 405 * TILE_SIZE },
        { x: 375 * TILE_SIZE, y: 68 * TILE_SIZE },
        { x: 383 * TILE_SIZE, y: 375 * TILE_SIZE },
        { x: 390 * TILE_SIZE, y: 225 * TILE_SIZE },
        { x: 225 * TILE_SIZE, y: 30 * TILE_SIZE },
        // Also check default player position area
        { x: 45 * TILE_SIZE, y: 210 * TILE_SIZE },
    ];

    // Sort by distance from our TC (farthest first = most likely enemy)
    return corners
        .map(c => ({ ...c, dist: Math.hypot(c.x - myX, c.y - myY) }))
        .filter(c => c.dist > TILE_SIZE * 30) // Skip corners too close to us
        .sort((a, b) => b.dist - a.dist)
        .map(c => ({ x: c.x, y: c.y }));
}

/** Send a scout to find enemies or track them */
export function sendToExplore(ai: AIContext, u: Unit): void {
    // === PHASE 1: If we've found enemies, SHADOW them ===
    if (ai.scoutedEnemyBuildings.size > 0 || ai.scoutedEnemyUnits.size > 0) {
        shadowEnemy(ai, u);
        return;
    }

    // === PHASE 2: Go to probable enemy locations ===
    const probableLocations = getProbableEnemyLocations(ai);

    // Filter out locations we've already explored
    const unexploredTargets = probableLocations.filter(loc => {
        const regionCol = Math.floor(loc.x / (TILE_SIZE * 8));
        const regionRow = Math.floor(loc.y / (TILE_SIZE * 8));
        return !ai.exploredRegions.has(`${regionCol}_${regionRow}`);
    });

    if (unexploredTargets.length > 0) {
        // Go to nearest unexplored probable enemy location
        let best = unexploredTargets[0];
        let bestDist = Infinity;
        for (const p of unexploredTargets) {
            const d = Math.hypot(p.x - u.x, p.y - u.y);
            if (d < bestDist) { bestDist = d; best = p; }
        }
        ai.safeMoveTo(u, best.x, best.y);
        return;
    }

    // === PHASE 3: All probable locations checked — sweep remaining map ===
    const maxRegionCol = Math.ceil(MAP_COLS / 8);
    const maxRegionRow = Math.ceil(MAP_ROWS / 8);
    const map = ai.entityManager.map;

    const unexplored: { x: number; y: number }[] = [];
    for (let c = 0; c < maxRegionCol; c++) {
        for (let r = 0; r < maxRegionRow; r++) {
            if (!ai.exploredRegions.has(`${c}_${r}`)) {
                const wx = (c * 8 + 4) * TILE_SIZE;
                const wy = (r * 8 + 4) * TILE_SIZE;
                if (!map.isWaterAtWorld(wx, wy)) {
                    unexplored.push({ x: wx, y: wy });
                }
            }
        }
    }

    if (unexplored.length > 0) {
        let best = unexplored[0];
        let bestDist = Infinity;
        for (const p of unexplored) {
            const d = Math.hypot(p.x - u.x, p.y - u.y);
            if (d < bestDist) { bestDist = d; best = p; }
        }
        ai.safeMoveTo(u, best.x, best.y);
    } else {
        ai.explorationComplete = true;
        ai.log('🗺️ Trinh sát hoàn tất! Quay về tập hợp quân.', '#44ff88');
        ai.returnScoutToArmy(u);
    }
}

/**
 * Shadow/track enemy: scout patrols around known enemy positions
 * to keep vision updated on enemy army movements.
 */
function shadowEnemy(ai: AIContext, u: Unit): void {
    // Find closest known enemy position
    let bestX = 0, bestY = 0, bestDist = Infinity;

    // Check scouted enemy buildings
    for (const [, info] of ai.scoutedEnemyBuildings) {
        const d = Math.hypot(info.x - u.x, info.y - u.y);
        if (d < bestDist) { bestDist = d; bestX = info.x; bestY = info.y; }
    }

    // Check known enemy unit positions
    for (const [, info] of ai.knownEnemyPositions) {
        const d = Math.hypot(info.x - u.x, info.y - u.y);
        if (d < bestDist) { bestDist = d; bestX = info.x; bestY = info.y; }
    }

    if (bestDist < Infinity) {
        // Patrol around enemy base at safe distance (12-15 tiles away)
        const safeRadius = TILE_SIZE * 13;
        const patrolAngle = (sharedIntel.gameTime / 8 + u.id * 1.5) * Math.PI * 2;
        const px = bestX + Math.cos(patrolAngle) * safeRadius;
        const py = bestY + Math.sin(patrolAngle) * safeRadius;
        ai.safeMoveTo(u, px, py);
    } else {
        ai.returnScoutToArmy(u);
    }
}

/** Return a scout to the nearest military concentration */
export function returnScoutToArmy(ai: AIContext, u: Unit): void {
    // Find where military units are concentrated
    const military = ai.entityManager.units.filter(
        m => m.alive && m.team === ai.team && !m.isVillager && m.type !== UnitType.Scout
    );

    if (military.length > 0) {
        // Calculate center of army mass
        let armyX = 0, armyY = 0;
        for (const m of military) { armyX += m.x; armyY += m.y; }
        armyX /= military.length;
        armyY /= military.length;
        ai.safeMoveTo(u, armyX + (Math.random() - 0.5) * TILE_SIZE * 3,
            armyY + (Math.random() - 0.5) * TILE_SIZE * 3);
    } else {
        // No military — go to TC
        const aiTC = ai.entityManager.buildings.find(
            b => b.alive && b.team === ai.team && b.type === BuildingType.TownCenter
        );
        if (aiTC) {
            ai.safeMoveTo(u, aiTC.x + (Math.random() - 0.5) * TILE_SIZE * 4,
                aiTC.y + (Math.random() - 0.5) * TILE_SIZE * 4);
        }
    }
}
