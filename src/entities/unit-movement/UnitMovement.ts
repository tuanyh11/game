// ============================================================
//  UnitMovement — Extracted movement/pathfinding logic from Unit.ts
//  Contains: chaseMove, isTileOfTarget, doMove, escapeToWalkableTile
// ============================================================

import { Unit } from "../Unit";
import { ParticleSystem } from "../../effects/ParticleSystem";
import {
    UnitType, UnitState, TILE_SIZE,
    CivilizationType, TerrainType,
    MAP_COLS, MAP_ROWS,
} from "../../config/GameConfig";
import type { TileMapRef } from "../../types/TileMapRef";

// ============================================================
//  Chase Movement — used during attack pursuit
// ============================================================
export function unitChaseMove(
    unit: Unit,
    dx: number, dy: number, dist: number, dt: number,
    tileMap?: TileMapRef,
): void {
    const slowMult = unit.slowTimer > 0 ? 0.5 : 1;
    const step = unit.speed * (1 + unit.speedBonus) * slowMult * dt;

    // ---- STUCK DETECTION for chase ----
    const movedDist = Math.hypot(unit.x - unit.lastX, unit.y - unit.lastY);
    if (movedDist < 0.5) {
        unit.stuckTimer += dt;
    } else {
        unit.stuckTimer = 0;
        unit.stuckCount = 0;
    }
    unit.lastX = unit.x;
    unit.lastY = unit.y;

    // Stagger stuck threshold to prevent multiple clumped units from running A* on the same frame
    // Base threshold 0.6s + deterministic jitter based on unit ID
    const stuckThreshold = 0.6 + ((unit.id % 10) * 0.05);

    if (unit.stuckTimer > stuckThreshold) {
        unit.pathWaypoints = [];
        unit.pathIndex = 0;
        unit.stuckTimer = 0;
        unit.stuckCount++;

        // Only escape-teleport if actually standing on an unwalkable tile (water/building)
        // Otherwise just reset stuck count and let A* retry next frame
        // (the leash/range logic in combat strategy handles when to stop chasing)
        if (unit.stuckCount > 6 && tileMap) {
            const [curC, curR] = tileMap.worldToTile(unit.x, unit.y);
            if (!tileMap.isWalkable(curC, curR)) {
                // Genuinely stuck on unwalkable terrain — escape to nearest walkable tile
                unit.escapeToWalkableTile(tileMap, unit.x + dx, unit.y + dy);
            }
            // Reset stuck count — keep chasing, never go idle from here
            unit.stuckCount = 0;
        }
    }

    // ---- A* PATHFINDING for chase ----
    if (tileMap && unit.pathWaypoints.length === 0) {
        // Determine actual target position (enemy unit or building)
        let targetPosX = unit.x + dx;
        let targetPosY = unit.y + dy;

        const [sc, sr] = tileMap.worldToTile(unit.x, unit.y);
        const [ec, er] = tileMap.worldToTile(targetPosX, targetPosY);
        if (sc !== ec || sr !== er) {
            const tilePath = tileMap.findPath(sc, sr, ec, er);
            if (tilePath && tilePath.length > 0) {
                unit.pathWaypoints = tilePath.map(([c, r]) => {
                    const [wx, wy] = tileMap.tileToWorld(c, r);
                    return { x: wx, y: wy };
                });
                unit.pathWaypoints.push({ x: targetPosX, y: targetPosY });
                unit.pathIndex = 0;
            }
        }
    }

    // Follow waypoints if available
    let moveToX = unit.x + dx;
    let moveToY = unit.y + dy;

    if (unit.pathWaypoints.length > 0 && unit.pathIndex < unit.pathWaypoints.length) {
        const wp = unit.pathWaypoints[unit.pathIndex];
        moveToX = wp.x;
        moveToY = wp.y;

        const wpDist = Math.hypot(wp.x - unit.x, wp.y - unit.y);
        if (wpDist < TILE_SIZE * 0.5) {
            unit.pathIndex++;
            if (unit.pathIndex < unit.pathWaypoints.length) {
                const next = unit.pathWaypoints[unit.pathIndex];
                moveToX = next.x;
                moveToY = next.y;
            } else {
                // Reached end of path, clear it so next frame recalculates if still chasing
                unit.pathWaypoints = [];
                unit.pathIndex = 0;
                moveToX = unit.x + dx;
                moveToY = unit.y + dy;
            }
        }
    }

    const mdx = moveToX - unit.x;
    const mdy = moveToY - unit.y;
    const mDist = Math.hypot(mdx, mdy);
    if (mDist < 1) return;

    let newX = unit.x + (mdx / mDist) * step;
    let newY = unit.y + (mdy / mDist) * step;

    if (tileMap) {
        const [curCol, curRow] = tileMap.worldToTile(unit.x, unit.y);
        const [newCol, newRow] = tileMap.worldToTile(newX, newY);

        const isBlocked = (c: number, r: number) => {
            return !tileMap.isWalkable(c, r) && !unit.isTileOfTarget(c, r);
        };

        // If on impassable tile: try to escape toward passable tiles
        const onImpassable = !tileMap.isWalkable(curCol, curRow);
        if (onImpassable) {
            if (isBlocked(newCol, newRow)) {
                const baseAngle = Math.atan2(mdy, mdx);
                const angles = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, Math.PI * 3 / 4, -Math.PI * 3 / 4, Math.PI];
                let found = false;
                for (const off of angles) {
                    const a = baseAngle + off;
                    const tx = unit.x + Math.cos(a) * step;
                    const ty = unit.y + Math.sin(a) * step;
                    const [tc, tr] = tileMap.worldToTile(tx, ty);
                    if (tileMap.isWalkable(tc, tr)) {
                        newX = tx; newY = ty; found = true; break;
                    }
                }
                if (!found) return;
            }
        } else if (newCol !== curCol || newRow !== curRow) {
            if (isBlocked(newCol, newRow)) {
                // Try axis-separated sliding
                const [slideXCol] = tileMap.worldToTile(newX, unit.y);
                const [, slideYRow] = tileMap.worldToTile(unit.x, newY);
                const xOk = slideXCol === curCol || !isBlocked(slideXCol, curRow);
                const yOk = slideYRow === curRow || !isBlocked(curCol, slideYRow);

                if (xOk && slideXCol !== curCol) {
                    newY = unit.y;
                } else if (yOk && slideYRow !== curRow) {
                    newX = unit.x;
                } else {
                    // Multi-angle steering
                    const baseAngle = Math.atan2(mdy, mdx);
                    const tryOffsets = [
                        Math.PI / 6, -Math.PI / 6, Math.PI / 3, -Math.PI / 3,
                        Math.PI / 2, -Math.PI / 2, Math.PI * 2 / 3, -Math.PI * 2 / 3,
                    ];
                    let found = false;
                    for (const offset of tryOffsets) {
                        const tryAngle = baseAngle + offset;
                        const tryX = unit.x + Math.cos(tryAngle) * step;
                        const tryY = unit.y + Math.sin(tryAngle) * step;
                        const [tc, tr] = tileMap.worldToTile(tryX, tryY);
                        if (tileMap.isWalkable(tc, tr) || (tc === curCol && tr === curRow)) {
                            newX = tryX; newY = tryY; found = true; break;
                        }
                    }
                    if (!found) return;
                }
            }
        }
    }

    // Clamp to map bounds (2 tile margin)
    newX = Math.max(TILE_SIZE * 2, Math.min(newX, (MAP_COLS - 2) * TILE_SIZE));
    newY = Math.max(TILE_SIZE * 2, Math.min(newY, (MAP_ROWS - 2) * TILE_SIZE));

    unit.x = newX;
    unit.y = newY;
}

// ============================================================
//  Check if tile belongs to unit's target building/resource
// ============================================================
export function unitIsTileOfTarget(unit: Unit, col: number, row: number): boolean {
    // Building targets
    const targets = [unit.buildTarget, unit.targetBuilding, unit.attackBuildingTarget];
    for (const b of targets) {
        if (!b) continue;
        if (col >= b.tileX && col < b.tileX + b.tileW &&
            row >= b.tileY && row < b.tileY + b.tileH) {
            return true;
        }
    }
    // Resource target (tree, mine, etc.)
    if (unit.targetResource && unit.targetResource.alive) {
        const rx = Math.floor(unit.targetResource.x / TILE_SIZE);
        const ry = Math.floor(unit.targetResource.y / TILE_SIZE);
        if (col === rx && row === ry) return true;
    }
    return false;
}

// ============================================================
//  Main Move State — follow path waypoints, handle stuck
// ============================================================
export function unitDoMove(
    unit: Unit,
    dt: number,
    particles: ParticleSystem,
    tileMap?: TileMapRef,
): void {
    const dx = unit.targetX - unit.x;
    const dy = unit.targetY - unit.y;
    const dist = Math.hypot(dx, dy);
    // Larger arrival distance for buildings (units stop at edge, not center)
    let arrivalDist = unit.state === UnitState.Returning ? 40 : 20;
    if (unit.buildTarget) {
        arrivalDist = Math.max(unit.buildTarget.tileW, unit.buildTarget.tileH) * TILE_SIZE * 0.6 + 10;
    } else if (unit.targetBuilding) {
        arrivalDist = Math.max(unit.targetBuilding.tileW, unit.targetBuilding.tileH) * TILE_SIZE * 0.5 + 10;
    } else if (unit.targetResource) {
        // Stop near the resource edge position (target is already offset to edge)
        arrivalDist = TILE_SIZE * 1.2;
    }

    if (dist < arrivalDist) {
        // Drop off on arrival at building
        if (unit.state === UnitState.Returning && unit.targetBuilding) {
            unit.dropOff(particles);
        }
        if (unit.moveCallback) {
            const cb = unit.moveCallback;
            unit.moveCallback = null;
            cb();
        } else if (unit.state !== UnitState.Gathering && unit.state !== UnitState.Building) {
            unit.state = UnitState.Idle;
        }
        unit.pathWaypoints = [];
        return;
    }

    // ---- STUCK DETECTION ----
    const movedDist = Math.hypot(unit.x - unit.lastX, unit.y - unit.lastY);
    if (movedDist < 2) {
        unit.stuckTimer += dt;
    } else {
        unit.stuckTimer = 0;
        unit.stuckCount = 0;
    }
    unit.lastX = unit.x;
    unit.lastY = unit.y;

    // Stagger stuck threshold to prevent A* lag spikes from mass clumps
    const stuckThreshold = 0.4 + ((unit.id % 10) * 0.05);

    // If stuck: clear path and let A* re-calculate a new route
    if (unit.stuckTimer > stuckThreshold) {
        unit.pathWaypoints = [];
        unit.pathIndex = 0;
        unit.stuckTimer = 0;
        unit.stuckCount++;

        // After 2 attempts, smart escape to walkable tile + re-path
        if (unit.stuckCount > 2 && tileMap) {
            const escaped = unit.escapeToWalkableTile(tileMap, unit.targetX, unit.targetY);
            if (escaped) {
                unit.stuckCount = 0;
                // Immediately recalculate path from new position
                const [esc, esr] = tileMap.worldToTile(unit.x, unit.y);
                const [eec, eer] = tileMap.worldToTile(unit.targetX, unit.targetY);
                if (esc !== eec || esr !== eer) {
                    const newPath = tileMap.findPath(esc, esr, eec, eer);
                    if (newPath && newPath.length > 0) {
                        unit.pathWaypoints = newPath.map(([c, r]) => {
                            const [wx, wy] = tileMap.tileToWorld(c, r);
                            return { x: wx, y: wy };
                        });
                        unit.pathWaypoints.push({ x: unit.targetX, y: unit.targetY });
                        unit.pathIndex = 0;
                    }
                }
                return;
            }
        }
        // After 5 fails (was 3), go idle — but escape water first
        if (unit.stuckCount > 5) {
            unit.stuckCount = 0;
            if (tileMap) {
                const [curC, curR] = tileMap.worldToTile(unit.x, unit.y);
                if (!tileMap.isWalkable(curC, curR)) {
                    unit.escapeToWalkableTile(tileMap, unit.targetX, unit.targetY);
                }
            }
            unit.state = UnitState.Idle;
            return;
        }
    }

    // ---- A* PATHFINDING ----
    // Calculate path on first frame of movement
    if (tileMap && unit.pathWaypoints.length === 0) {
        const [sc, sr] = tileMap.worldToTile(unit.x, unit.y);
        const [ec, er] = tileMap.worldToTile(unit.targetX, unit.targetY);
        if (sc !== ec || sr !== er) {
            const tilePath = tileMap.findPath(sc, sr, ec, er);
            if (tilePath && tilePath.length > 0) {
                unit.pathWaypoints = tilePath.map(([c, r]) => {
                    const [wx, wy] = tileMap.tileToWorld(c, r);
                    return { x: wx, y: wy };
                });
                // Add final target as last waypoint
                unit.pathWaypoints.push({ x: unit.targetX, y: unit.targetY });
                unit.pathIndex = 0;
            } else {
                // A* failed — fallback to direct movement (steering will handle obstacles)
                unit.pathWaypoints = [{ x: unit.targetX, y: unit.targetY }];
                unit.pathIndex = 0;
            }
        }
    }

    // Determine immediate move target (waypoint or final target)
    let moveToX = unit.targetX;
    let moveToY = unit.targetY;

    if (unit.pathWaypoints.length > 0 && unit.pathIndex < unit.pathWaypoints.length) {
        const wp = unit.pathWaypoints[unit.pathIndex];
        moveToX = wp.x;
        moveToY = wp.y;

        // Check if we reached this waypoint
        const wpDist = Math.hypot(wp.x - unit.x, wp.y - unit.y);
        if (wpDist < TILE_SIZE * 0.5) {
            unit.pathIndex++;
            if (unit.pathIndex < unit.pathWaypoints.length) {
                const next = unit.pathWaypoints[unit.pathIndex];
                moveToX = next.x;
                moveToY = next.y;
            } else {
                moveToX = unit.targetX;
                moveToY = unit.targetY;
            }
        }
    }

    const mdx = moveToX - unit.x;
    const mdy = moveToY - unit.y;
    const mDist = Math.hypot(mdx, mdy);
    if (mDist < 1) return;

    const slowMult = unit.slowTimer > 0 ? 0.5 : 1;
    const step = unit.speed * (1 + unit.speedBonus) * slowMult * dt;
    let newX = unit.x + (mdx / mDist) * step;
    let newY = unit.y + (mdy / mDist) * step;

    // ---- COLLISION CHECK ----
    if (tileMap) {
        const [curCol, curRow] = tileMap.worldToTile(unit.x, unit.y);
        const [newCol, newRow] = tileMap.worldToTile(newX, newY);

        // Blocks water, buildings, and resources (except this unit's target tile)
        const isBlocked = (c: number, r: number) => {
            return !tileMap.isWalkable(c, r) && !unit.isTileOfTarget(c, r);
        };

        // If on impassable tile: ONLY allow moves toward passable tiles (escape to safety)
        const onImpassable = !tileMap.isWalkable(curCol, curRow);
        if (onImpassable) {
            // Must move TOWARD a passable tile, not stay in/go deeper into water
            if (isBlocked(newCol, newRow)) {
                // Try to find any passable neighbor tile
                const baseAngle = Math.atan2(mdy, mdx);
                const angles = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, Math.PI * 3 / 4, -Math.PI * 3 / 4, Math.PI];
                let found = false;
                for (const off of angles) {
                    const a = baseAngle + off;
                    const tx = unit.x + Math.cos(a) * step;
                    const ty = unit.y + Math.sin(a) * step;
                    const [tc, tr] = tileMap.worldToTile(tx, ty);
                    if (tileMap.isWalkable(tc, tr)) {
                        newX = tx; newY = ty; found = true; break;
                    }
                }
                if (!found) return; // Stuck in water, can't escape
            }
        } else if (newCol !== curCol || newRow !== curRow) {
            // Normal movement: block on impassable tiles
            if (isBlocked(newCol, newRow)) {
                // TRY 1: Axis-separated sliding
                const [slideXCol] = tileMap.worldToTile(newX, unit.y);
                const [, slideYRow] = tileMap.worldToTile(unit.x, newY);

                const xOk = slideXCol === curCol || !isBlocked(slideXCol, curRow);
                const yOk = slideYRow === curRow || !isBlocked(curCol, slideYRow);

                if (xOk && slideXCol !== curCol) {
                    newY = unit.y;
                } else if (yOk && slideYRow !== curRow) {
                    newX = unit.x;
                } else {
                    // TRY 2: Multi-angle steering
                    const baseAngle = Math.atan2(mdy, mdx);
                    const tryOffsets = [
                        Math.PI / 6, -Math.PI / 6,
                        Math.PI / 3, -Math.PI / 3,
                        Math.PI / 2, -Math.PI / 2,
                        Math.PI * 2 / 3, -Math.PI * 2 / 3,
                        Math.PI * 5 / 6, -Math.PI * 5 / 6,
                        Math.PI,
                    ];
                    let found = false;
                    for (const offset of tryOffsets) {
                        const tryAngle = baseAngle + offset;
                        const tryX = unit.x + Math.cos(tryAngle) * step;
                        const tryY = unit.y + Math.sin(tryAngle) * step;
                        const [tc, tr] = tileMap.worldToTile(tryX, tryY);
                        if (tileMap.isWalkable(tc, tr) || (tc === curCol && tr === curRow)) {
                            newX = tryX; newY = tryY; found = true; break;
                        }
                    }
                    if (!found) return; // Blocked — stop
                }
            }
        }
    }

    // Successful movement — reset stuck counter
    unit.stuckCount = 0;

    // Clamp to map bounds (2 tile margin to avoid edge water)
    newX = Math.max(TILE_SIZE * 2, Math.min(newX, (MAP_COLS - 2) * TILE_SIZE));
    newY = Math.max(TILE_SIZE * 2, Math.min(newY, (MAP_ROWS - 2) * TILE_SIZE));

    // ===== WATER REPULSION =====
    // When moving near water edges, subtly push away to avoid getting stuck at borders
    if (tileMap) {
        const [nCol, nRow] = tileMap.worldToTile(newX, newY);
        let pushX = 0, pushY = 0;
        const checkDirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
        for (const [cdc, cdr] of checkDirs) {
            const nc = nCol + cdc, nr = nRow + cdr;
            if (nc >= 0 && nc < MAP_COLS && nr >= 0 && nr < MAP_ROWS) {
                if (tileMap.getTerrainAt(nc, nr) === TerrainType.Water) {
                    // Push away from water tile
                    pushX -= cdc * 0.3;
                    pushY -= cdr * 0.3;
                }
            }
        }
        if (pushX !== 0 || pushY !== 0) {
            const pushLen = Math.hypot(pushX, pushY);
            const pushScale = Math.min(step * 0.15, 1.5); // Subtle push
            newX += (pushX / pushLen) * pushScale;
            newY += (pushY / pushLen) * pushScale;
            // Re-check after push: don't push into another blocked tile
            const [pushCol, pushRow] = tileMap.worldToTile(newX, newY);
            if (!tileMap.isWalkable(pushCol, pushRow)) {
                newX -= (pushX / pushLen) * pushScale;
                newY -= (pushY / pushLen) * pushScale;
            }
        }
    }

    unit.x = newX;
    unit.y = newY;
    if (mdx > 0) unit.facingRight = true;
    else if (mdx < 0) unit.facingRight = false;
}

// ============================================================
//  Escape: spiral search for nearest walkable tile
// ============================================================
export function unitEscapeToWalkableTile(
    unit: Unit,
    tileMap: TileMapRef,
    destX: number, destY: number,
): boolean {
    const [curCol, curRow] = tileMap.worldToTile(unit.x, unit.y);

    // Spiral search: all tiles at increasing radius, prefer ones closer to destination
    type Candidate = { col: number; row: number; distToDest: number };
    const candidates: Candidate[] = [];

    for (let radius = 1; radius <= 3; radius++) {
        for (let dr = -radius; dr <= radius; dr++) {
            for (let dc = -radius; dc <= radius; dc++) {
                // Only check the ring at this radius
                if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;
                const nc = curCol + dc;
                const nr = curRow + dr;
                // Bounds check — stay within map with margin
                if (nc < 2 || nc >= MAP_COLS - 2 || nr < 2 || nr >= MAP_ROWS - 2) continue;
                if (tileMap.isWalkable(nc, nr)) {
                    const [wx, wy] = tileMap.tileToWorld(nc, nr);
                    const distToDest = Math.hypot(wx - destX, wy - destY);
                    candidates.push({ col: nc, row: nr, distToDest });
                }
            }
        }
        // If we found walkable tiles at this radius, pick the best one
        if (candidates.length > 0) break;
    }

    if (candidates.length === 0) return false;

    // Sort: prefer tiles that bring us closer to destination
    candidates.sort((a, b) => a.distToDest - b.distToDest);

    // Pick the best candidate (closest to destination)
    const best = candidates[0];
    const [wx, wy] = tileMap.tileToWorld(best.col, best.row);
    unit.x = wx;
    unit.y = wy;
    unit.lastX = wx;
    unit.lastY = wy;
    unit.stuckTimer = 0;
    return true;
}
