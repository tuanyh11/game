// ============================================================
//  TileMapRef — Shared interface for tile map access
//  Single source of truth — used by Unit, UnitMovement,
//  UnitCombat, and ability modules
// ============================================================

import type { TerrainType } from "../config/GameConfig";

/** Subset of TileMap methods needed for unit movement & abilities */
export type TileMapRef = {
    isPassable: (col: number, row: number) => boolean;
    isWalkable: (col: number, row: number) => boolean;
    worldToTile: (x: number, y: number) => [number, number];
    tileToWorld: (col: number, row: number) => [number, number];
    findPath: (sc: number, sr: number, ec: number, er: number) => [number, number][] | null;
    getTerrainAt: (col: number, row: number) => TerrainType;
    getAllUnits: () => import("../entities/Unit").Unit[];
};
