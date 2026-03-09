// ============================================================
//  EntityManager — Manages all game entities, spawning, queries
//  OPTIMIZED: Spatial grid for O(1) neighbor queries
// ============================================================

import {
    C, TILE_SIZE, MAP_COLS, MAP_ROWS, ResourceNodeType, UnitType, UnitState,
    BuildingType, BUILDING_DATA, UNIT_DATA, ResourceType, TerrainType,
    CivilizationType, CIVILIZATION_DATA
} from "../config/GameConfig";
import { TileMap } from "../map/TileMap";
import { ResourceNode } from "../entities/ResourceNode";
import { Unit } from "../entities/Unit";
import { Building } from "../entities/Building";
import { PlayerState } from "./PlayerState";
import { FogOfWar } from "./FogOfWar";
import { ParticleSystem } from "../effects/ParticleSystem";

// ==== Spatial Grid for fast neighbor queries ====
const GRID_CELL_SIZE = TILE_SIZE * 8; // 8 tiles per cell
const GRID_COLS = Math.ceil(MAP_COLS * TILE_SIZE / GRID_CELL_SIZE);
const GRID_ROWS = Math.ceil(MAP_ROWS * TILE_SIZE / GRID_CELL_SIZE);

class SpatialGrid {
    private cells: Unit[][] = [];

    constructor() {
        for (let i = 0; i < GRID_COLS * GRID_ROWS; i++) {
            this.cells.push([]);
        }
    }

    clear() {
        for (const cell of this.cells) cell.length = 0;
    }

    insert(u: Unit) {
        const cx = Math.floor(u.x / GRID_CELL_SIZE);
        const cy = Math.floor(u.y / GRID_CELL_SIZE);
        if (cx < 0 || cx >= GRID_COLS || cy < 0 || cy >= GRID_ROWS) return;
        this.cells[cy * GRID_COLS + cx].push(u);
    }

    /** Get units in a cell and its neighbors (3x3 grid around the cell) */
    getNearby(x: number, y: number): Unit[] {
        const cx = Math.floor(x / GRID_CELL_SIZE);
        const cy = Math.floor(y / GRID_CELL_SIZE);
        const result: Unit[] = [];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = cx + dx, ny = cy + dy;
                if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) continue;
                const cell = this.cells[ny * GRID_COLS + nx];
                for (let i = 0; i < cell.length; i++) result.push(cell[i]);
            }
        }
        return result;
    }

    /** Get units within range, using grid cells to limit search */
    getInRange(x: number, y: number, range: number): Unit[] {
        const cellRange = Math.ceil(range / GRID_CELL_SIZE) + 1;
        const cx = Math.floor(x / GRID_CELL_SIZE);
        const cy = Math.floor(y / GRID_CELL_SIZE);
        const result: Unit[] = [];
        const rangeSq = range * range;
        for (let dy = -cellRange; dy <= cellRange; dy++) {
            for (let dx = -cellRange; dx <= cellRange; dx++) {
                const nx = cx + dx, ny = cy + dy;
                if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) continue;
                const cell = this.cells[ny * GRID_COLS + nx];
                for (let i = 0; i < cell.length; i++) {
                    const u = cell[i];
                    const ddx = u.x - x, ddy = u.y - y;
                    if (ddx * ddx + ddy * ddy <= rangeSq) result.push(u);
                }
            }
        }
        return result;
    }
}

export class EntityManager {
    units: Unit[] = [];
    buildings: Building[] = [];
    resources: ResourceNode[] = [];
    private spatialGrid = new SpatialGrid();
    freeMode = false;
    fog: FogOfWar | null = null;

    // Civilization for each team
    playerCiv: CivilizationType = CivilizationType.LaMa;
    enemyCivs: CivilizationType[] = [CivilizationType.Viking];

    // Alliance system: maps team -> alliance number (0 = player side, 1 = enemy side)
    private teamAlliances: Map<number, number> = new Map([[0, 0]]);
    // Custom slot colors from lobby (team -> hex color)
    private teamColors: Map<number, string> = new Map();

    constructor(
        private tileMap: TileMap,
        private playerState: PlayerState,
    ) { }

    /** Public access to tileMap for AI pathfinding decisions */
    get map(): TileMap { return this.tileMap; }

    /** Set civilizations for teams */
    setCivilizations(playerCiv: CivilizationType, enemyCivs: CivilizationType[]): void {
        this.playerCiv = playerCiv;
        this.enemyCivs = enemyCivs;
    }

    /** Set custom slot colors from lobby */
    setTeamColors(playerColor: string, aiColors: string[]): void {
        if (playerColor) this.teamColors.set(0, playerColor);
        for (let i = 0; i < aiColors.length; i++) {
            if (aiColors[i]) this.teamColors.set(i + 1, aiColors[i]);
        }
    }

    /** Get slot color for a team */
    getTeamColor(team: number): string {
        return this.teamColors.get(team) ?? '';
    }

    /** Setup alliance mapping: allies are on same side as player (alliance 0), enemies on alliance 1 */
    setAlliances(allyCount: number, enemyCount: number): void {
        this.teamAlliances.clear();
        this.teamAlliances.set(0, 0); // player is always alliance 0
        // Ally teams (1..allyCount) → alliance 0
        for (let i = 1; i <= allyCount; i++) {
            this.teamAlliances.set(i, 0);
        }
        // Enemy teams (allyCount+1..allyCount+enemyCount) → alliance 1
        for (let i = allyCount + 1; i <= allyCount + enemyCount; i++) {
            this.teamAlliances.set(i, 1);
        }
    }

    /** Get alliance for a team (0 = player side, 1 = enemy side) */
    getAlliance(team: number): number {
        return this.teamAlliances.get(team) ?? 1; // unknown teams default to enemy
    }

    /** Check if two teams are enemies (different alliance) */
    isEnemy(teamA: number, teamB: number): boolean {
        if (teamA === teamB) return false;
        return this.getAlliance(teamA) !== this.getAlliance(teamB);
    }

    /** Check if two teams are allies (same alliance) */
    isAlly(teamA: number, teamB: number): boolean {
        return this.getAlliance(teamA) === this.getAlliance(teamB);
    }

    /** Get all team IDs allied with a given team (excluding itself) */
    getAllyTeams(team: number): Set<number> {
        const result = new Set<number>();
        const alliance = this.getAlliance(team);
        for (const [t, a] of this.teamAlliances.entries()) {
            if (t !== team && a === alliance) result.add(t);
        }
        return result;
    }

    /** Get civ for a team */
    getCivForTeam(team: number): CivilizationType {
        if (team === 0) return this.playerCiv;
        return this.enemyCivs[team - 1] ?? this.enemyCivs[0];
    }

    // ---- Spawning ----
    spawnUnit(type: UnitType, x: number, y: number, team: number): Unit {
        const civ = this.getCivForTeam(team);
        const u = new Unit(type, x, y, team, civ);
        u.slotColor = this.getTeamColor(team);
        if (team === 0) {
            u.age = this.playerState.age;
            const meleeHpPct = this.playerState.meleeHpBonus;
            if (meleeHpPct > 0 && (type === UnitType.Spearman || type === UnitType.Swordsman || type === UnitType.Knight || type === UnitType.Scout)) {
                u.maxHp = Math.floor(u.maxHp * (1 + meleeHpPct));
                u.hp = u.maxHp;
            }
            const flatHp = this.playerState.getHpBonus(type);
            u.maxHp += flatHp;
            u.hp += flatHp;
        }
        u.setDropOffCallback((resType, amount) => {
            if (team === 0) {
                // Apply civilization gather bonus
                const gatherMult = CIVILIZATION_DATA[civ].bonuses.villagerGather;
                this.playerState.addResource(resType, Math.round(amount * gatherMult));
            }
        });
        this.units.push(u);
        if (team === 0) this.playerState.population++;
        return u;
    }

    /** Spawn unit with custom civilization (for Free Mode / Scenario Editor) */
    spawnUnitFree(type: UnitType, x: number, y: number, team: number, civ: CivilizationType, age: number): Unit {
        const u = new Unit(type, x, y, team, civ);
        u.slotColor = this.getTeamColor(team);
        u.age = age;
        if (team === 0) {
            const meleeHpPct = this.playerState.meleeHpBonus;
            if (meleeHpPct > 0 && (type === UnitType.Spearman || type === UnitType.Swordsman || type === UnitType.Knight || type === UnitType.Scout)) {
                u.maxHp = Math.floor(u.maxHp * (1 + meleeHpPct));
                u.hp = u.maxHp;
            }
            const flatHp = this.playerState.getHpBonus(type);
            u.maxHp += flatHp;
            u.hp += flatHp;
        }
        u.setDropOffCallback((resType, amount) => {
            if (team === 0) {
                const gatherMult = CIVILIZATION_DATA[civ].bonuses.villagerGather;
                this.playerState.addResource(resType, Math.round(amount * gatherMult));
            }
        });
        this.units.push(u);
        return u;
    }

    spawnBuilding(type: BuildingType, tileX: number, tileY: number, team: number, startBuilt = true, forceCiv?: CivilizationType, forceAge?: number): Building | null {
        const data = BUILDING_DATA[type];
        if (!this.tileMap.canPlace(tileX, tileY, data.size[0], data.size[1])) return null;

        // Clear any resources in the building area (trees, mines, berries)
        const bLeft = tileX * TILE_SIZE;
        const bTop = tileY * TILE_SIZE;
        const bRight = (tileX + data.size[0]) * TILE_SIZE;
        const bBottom = (tileY + data.size[1]) * TILE_SIZE;
        // Clear trees and berries in the building area (gold/stone mines are protected)
        for (const res of this.resources) {
            if (!res.alive) continue;
            // Only destroy trees and berry bushes — mines and farms are protected
            if (res.nodeType !== ResourceNodeType.Tree && res.nodeType !== ResourceNodeType.BerryBush) continue;
            if (res.x >= bLeft - 8 && res.x <= bRight + 8 && res.y >= bTop - 8 && res.y <= bBottom + 8) {
                res.alive = false;
                res.amount = 0;
                // Free the occupied tiles
                const [rc, rr] = this.tileMap.worldToTile(res.x, res.y);
                if (res.nodeType === ResourceNodeType.Tree) {
                    this.tileMap.setOccupied(rc, rr, 2, 2, false);
                } else {
                    this.tileMap.setOccupied(rc, rr, 1, 1, false);
                }
            }
        }

        const b = new Building(type, tileX, tileY, team, startBuilt);
        b.civilization = forceCiv !== undefined ? forceCiv : this.getCivForTeam(team);
        b.slotColor = this.getTeamColor(team);

        // Allow overriding age (for free mode)
        b.age = forceAge !== undefined ? forceAge : (team === 0 ? this.playerState.age : 1);

        // Safeguard for advanced buildings that have no Age 1 visual:
        if ((b.type === BuildingType.Tower || b.type === BuildingType.Stable || b.type === BuildingType.HeroAltar) && b.age < 2) {
            b.age = 2;
        }

        if (team === 0) {
            const hpPct = this.playerState.buildingHpBonus;
            if (hpPct > 0) {
                b.maxHp = Math.floor(b.maxHp * (1 + hpPct));
                if (startBuilt) b.hp = b.maxHp;
                else b.hp = Math.floor(b.maxHp * 0.1);
            }
            const speedPct = this.playerState.constructionSpeedBonus;
            if (speedPct > 0) {
                b.buildTime = b.buildTime / (1 + speedPct);
            }
            if (startBuilt) {
                this.playerState.maxPopulation += b.popProvided;
            }
        } else {
            // Add population logic for enemies if needed later, right now mostly just AI state
        }

        this.buildings.push(b);
        this.tileMap.setBuildingOccupied(tileX, tileY, data.size[0], data.size[1], true);
        return b;
    }

    spawnResource(type: ResourceNodeType, x: number, y: number, amount: number): ResourceNode {
        const r = new ResourceNode(x, y, type, amount);
        if (type === ResourceNodeType.Farm) r.age = this.playerState.age;
        this.resources.push(r);

        // Mark tiles as occupied (units can't walk through trees/mines/etc)
        // Farms are excluded — villagers need to walk onto them
        if (type !== ResourceNodeType.Farm) {
            const [col, row] = this.tileMap.worldToTile(x, y);
            // Trees are visually large: occupy 2x2 tiles for proper collision
            if (type === ResourceNodeType.Tree) {
                this.tileMap.setOccupied(col, row, 2, 2, true);
            } else if (type === ResourceNodeType.GoldMine || type === ResourceNodeType.StoneMine) {
                // Mines are visually ~42px diameter (radius 21) → occupy 3x3 tiles (48px)
                this.tileMap.setOccupied(col - 1, row - 1, 3, 3, true);
                this.tileMap.setMineOccupied(col - 1, row - 1, 3, 3, true);
            } else {
                this.tileMap.setOccupied(col, row, 1, 1, true);
            }
        }

        return r;
    }

    // ---- Queries ----
    findUnitAt(x: number, y: number, team?: number): Unit | undefined {
        for (const u of this.units) {
            if (!u.alive) continue;
            if (team !== undefined && u.team !== team) continue;
            if (this.fog && this.isEnemy(0, u.team) && !this.fog.isVisible(u.x, u.y)) continue;
            if (u.containsPoint(x, y)) return u;
        }
        return undefined;
    }

    findBuildingAt(x: number, y: number, team?: number): Building | undefined {
        for (const b of this.buildings) {
            if (team !== undefined && b.team !== team) continue;
            if (this.fog && this.isEnemy(0, b.team) && b.type !== BuildingType.TownCenter && !this.fog.isVisible(b.x, b.y)) continue;
            if (b.containsPoint(x, y)) return b;
        }
        return undefined;
    }

    findResourceAt(x: number, y: number): ResourceNode | undefined {
        for (const r of this.resources) {
            if (!r.alive) continue;
            if (r.containsPoint(x, y)) return r;
        }
        return undefined;
    }

    findUnitsInRect(rx: number, ry: number, rw: number, rh: number, team: number): Unit[] {
        const result: Unit[] = [];
        const x = Math.min(rx, rx + rw), y = Math.min(ry, ry + rh);
        const w = Math.abs(rw), h = Math.abs(rh);
        for (const u of this.units) {
            if (!u.alive || u.team !== team) continue;
            if (u.inRect(x, y, w, h)) result.push(u);
        }
        return result;
    }

    findNearestDropOff(x: number, y: number, resType: ResourceType, team: number): Building | null {
        let best: Building | null = null;
        let bestDist = Infinity;
        for (const b of this.buildings) {
            if (b.team !== team || !b.canAcceptResource(resType)) continue;
            const d = Math.hypot(b.x - x, b.y - y);
            if (d < bestDist) { bestDist = d; best = b; }
        }
        return best;
    }

    findNearestEnemy(x: number, y: number, myTeam: number, range: number): Unit | null {
        let closest: Unit | null = null;
        let minDistSq = range * range;
        // Use spatial grid for fast lookup
        const nearby = this.spatialGrid.getInRange(x, y, range);
        for (let i = 0; i < nearby.length; i++) {
            const u = nearby[i];
            if (!u.alive || !this.isEnemy(myTeam, u.team)) continue;
            // Skip stealthed Ninja units — they are invisible to enemies
            if (u.isStealthed) continue;
            const dx = u.x - x, dy = u.y - y;
            const dSq = dx * dx + dy * dy;
            if (dSq < minDistSq) { minDistSq = dSq; closest = u; }
        }
        return closest;
    }

    /** Find an enemy unit at a world position (for right-click attack).
     *  Uses generous click tolerance — first tries exact hitbox,
     *  then finds nearest enemy within clickRadius.
     *  Uses visual center (u.y - 6) for proximity to match where units appear on screen. */
    findEnemyUnitAt(x: number, y: number, myTeam: number, clickRadius = 45): Unit | undefined {
        // Pass 1: exact hitbox match (generous — includes visual area)
        for (const u of this.units) {
            if (!u.alive) continue;
            if (!this.isEnemy(myTeam, u.team)) continue;
            if (this.fog && !this.fog.isVisible(u.x, u.y)) continue;
            if (u.containsPoint(x, y)) return u;
        }
        // Pass 2: nearest enemy within click tolerance radius
        // Use visual center (u.y - 6) because units are rendered above their logical position
        let best: Unit | undefined;
        let bestDist = clickRadius;
        for (const u of this.units) {
            if (!u.alive) continue;
            if (!this.isEnemy(myTeam, u.team)) continue;
            if (u.isStealthed) continue;
            if (this.fog && !this.fog.isVisible(u.x, u.y)) continue;
            const d = Math.hypot(u.x - x, (u.y - 6) - y);
            if (d < bestDist) { bestDist = d; best = u; }
        }
        return best;
    }

    /** Find an enemy building at a world position (for right-click attack).
     *  Uses generous click tolerance — tries exact hitbox then proximity. */
    findEnemyBuildingAt(x: number, y: number, myTeam: number, clickRadius = 25): Building | undefined {
        // Pass 1: exact hitbox
        const exact = this.buildings.find(b => b.alive && this.isEnemy(myTeam, b.team) && b.containsPoint(x, y) && (!this.fog || b.type === BuildingType.TownCenter || this.fog.isVisible(b.x, b.y)));
        if (exact) return exact;
        // Pass 2: nearest enemy building within tolerance
        let best: Building | undefined;
        let bestDist = clickRadius;
        for (const b of this.buildings) {
            if (!b.alive || !this.isEnemy(myTeam, b.team)) continue;
            if (this.fog && b.type !== BuildingType.TownCenter && !this.fog.isVisible(b.x, b.y)) continue;
            const d = Math.hypot(b.x - x, b.y - y);
            if (d < bestDist) { bestDist = d; best = b; }
        }
        return best;
    }

    /** Find nearest enemy building within range */
    findNearestEnemyBuildingInRange(x: number, y: number, myTeam: number, range: number): Building | null {
        let best: Building | null = null;
        let bestDist = range;
        for (const b of this.buildings) {
            if (!b.alive || !this.isEnemy(myTeam, b.team)) continue;
            const d = Math.hypot(b.x - x, b.y - y);
            if (d < bestDist) { bestDist = d; best = b; }
        }
        return best;
    }

    // Pre-bound callbacks to avoid per-frame closure allocations
    private _boundFindNearbyResource = (x: number, y: number, nodeType: import("../config/GameConfig").ResourceNodeType) => {
        let best: import("../entities/ResourceNode").ResourceNode | null = null;
        let bestDist = Infinity;
        for (const r of this.resources) {
            if (!r.alive || r.nodeType !== nodeType) continue;
            const d = Math.hypot(r.x - x, r.y - y);
            if (d < bestDist) { bestDist = d; best = r; }
        }
        return best;
    };

    private _boundFindNearbyUnbuiltBuilding = (x: number, y: number, team: number, maxDist: number) => {
        let best: Building | null = null;
        let bestDist = maxDist;
        for (const b of this.buildings) {
            if (!b.alive || b.team !== team || b.built) continue;
            const d = Math.hypot(b.x - x, b.y - y);
            if (d < bestDist) { bestDist = d; best = b; }
        }
        return best;
    };

    private _boundSpendResource = (team: number, cost: Record<string, number>) => {
        if (team === 0) return this.playerState.spend(cost);
        return true;
    };

    private _boundFindNearestDropOff = (x: number, y: number, resType: import("../config/GameConfig").ResourceType, team: number) => {
        return this.findNearestDropOff(x, y, resType, team);
    };

    private _boundFindNearestEnemy = (x: number, y: number, team: number, range: number) => {
        return this.findNearestEnemy(x, y, team, range);
    };

    private _boundFindNearestEnemyBuildingInRange = (x: number, y: number, team: number, range: number) => {
        return this.findNearestEnemyBuildingInRange(x, y, team, range);
    };

    // ---- Update all ----
    update(dt: number, particles: ParticleSystem): void {
        // Rebuild spatial grid for this frame
        this.spatialGrid.clear();
        for (const u of this.units) {
            if (u.alive) this.spatialGrid.insert(u);
        }

        // Update units
        for (const u of this.units) {
            // Tick death timer for dead units so they get cleaned up
            if (!u.alive) {
                u.deathTimer -= dt;
                continue;
            }
            u._allUnits = this.units; // for Magi heal
            u._findNearbyResource = this._boundFindNearbyResource;
            u._findNearbyUnbuiltBuilding = this._boundFindNearbyUnbuiltBuilding;
            u.update(
                dt,
                this._boundSpendResource,
                this._boundFindNearestDropOff,
                particles,
                this._boundFindNearestEnemy,
                this.tileMap,
                this._boundFindNearestEnemyBuildingInRange,
            );
        }

        // ---- UNIT SEPARATION (spatial-grid accelerated) ----
        const sepRadius = 16;       // base separation for same-team
        const combatSepRadius = 22; // separation between enemies in combat
        const sepRadiusSq = sepRadius * sepRadius;
        const combatSepRadiusSq = combatSepRadius * combatSepRadius;
        const MAX_SEPARATIONS_PER_UNIT = 4; // FPS FIX: Cap checks to prevent O(N^2) in huge clumps

        for (const a of this.units) {
            if (!a.alive) continue;
            const nearby = this.spatialGrid.getNearby(a.x, a.y);
            let separationsApplied = 0;

            for (let j = 0; j < nearby.length; j++) {
                if (separationsApplied >= MAX_SEPARATIONS_PER_UNIT) break;

                const b = nearby[j];
                if (b.id <= a.id || !b.alive) continue; // avoid double-processing
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const distSq = dx * dx + dy * dy;

                // Use larger separation radius when enemies are fighting each other
                const areEnemies = a.team !== b.team;
                const bothInCombat = areEnemies && (a.state === UnitState.Attacking || b.state === UnitState.Attacking);
                const activeSepRadius = bothInCombat ? combatSepRadius : sepRadius;
                const activeSepRadiusSq = bothInCombat ? combatSepRadiusSq : sepRadiusSq;

                if (distSq < activeSepRadiusSq && distSq > 0.01) {
                    const dist = Math.sqrt(distSq);
                    const overlap = (activeSepRadius - dist) * (bothInCombat ? 0.5 : 0.35);
                    const nx = dx / dist;
                    const ny = dy / dist;

                    separationsApplied++;

                    // Enemies in combat get full push force (no reduction)
                    // Same-team busy units get reduced push
                    const aBusy = !areEnemies && (a.state === UnitState.Attacking || a.state === UnitState.Gathering || a.state === UnitState.Building);
                    const bBusy = !areEnemies && (b.state === UnitState.Attacking || b.state === UnitState.Gathering || b.state === UnitState.Building);

                    // Further reduce push if both units are completely idle (just standing around)
                    // This lets large armies "settle" into a clump without constantly jiggling and eating CPU
                    const bothIdle = !areEnemies && a.state === UnitState.Idle && b.state === UnitState.Idle;
                    let idleMul = bothIdle ? 0.05 : 1;

                    const newAx = a.x - nx * overlap * (aBusy ? 0.1 : 1) * idleMul;
                    const newAy = a.y - ny * overlap * (aBusy ? 0.1 : 1) * idleMul;
                    const newBx = b.x + nx * overlap * (bBusy ? 0.1 : 1) * idleMul;
                    const newBy = b.y + ny * overlap * (bBusy ? 0.1 : 1) * idleMul;

                    const [ac, ar] = this.tileMap.worldToTile(newAx, newAy);
                    const [bc, br] = this.tileMap.worldToTile(newBx, newBy);

                    if (this.tileMap.isWalkable(ac, ar)) { a.x = newAx; a.y = newAy; }
                    if (this.tileMap.isWalkable(bc, br)) { b.x = newBx; b.y = newBy; }
                }
            }
        }

        // Update buildings (training + fire effects + tower attack)
        for (const b of this.buildings) {
            if (!b.alive) continue;
            const finished = b.update(
                dt,
                particles,
                (x, y, team, range) => this.findNearestEnemy(x, y, team, range),
            );
            if (finished) {
                const sx = b.rallyX + (Math.random() - 0.5) * 30;
                const sy = b.rallyY + (Math.random() - 0.5) * 30;
                const spawnedUnit = this.spawnUnit(finished, sx, sy, b.team);
                if (spawnedUnit) spawnedUnit.spawnBuildingId = b.id; // Track which building spawned this unit

                if (b.team === 0 && this.playerState.queuedPopulation > 0) {
                    this.playerState.queuedPopulation--;
                }
            }
        }

        // Recalculate max population from all built buildings (team 0)
        // Skip in free mode — keep at 999
        if (!this.freeMode) {
            let maxPop = 0;
            for (const b of this.buildings) {
                if (b.team === 0) maxPop += b.popProvided;
            }
            this.playerState.maxPopulation = maxPop;
        }

        // Update research progress
        this.playerState.updateResearch(dt);

        // Update age-up progress (player)
        const ageUpDone = this.playerState.updateAgeUp(dt);

        // Sync age-up visual state to player TC buildings
        for (const b of this.buildings) {
            if (b.team === 0 && b.type === BuildingType.TownCenter) {
                b.isUpgrading = this.playerState.isAgingUp;
                b.upgradeProgress = this.playerState.ageUpPercent;
            }
        }

        if (ageUpDone) {
            // Sync new age to all player entities
            for (const b of this.buildings) {
                if (b.team === 0) {
                    b.age = this.playerState.age;
                    b.isUpgrading = false;
                    b.upgradeProgress = 0;
                }
            }
            for (const res of this.resources) {
                res.age = this.playerState.age;
            }
            for (const u of this.units) {
                if (u.team === 0) u.age = this.playerState.age;
            }
        }

        // Apply upgrade bonuses to all friendly units
        for (const u of this.units) {
            if (!u.alive || u.team !== 0) continue;
            if (u.isVillager) {
                // Apply economy upgrades to villagers (per-resource)
                u.gatherFoodBonus = this.playerState.getGatherBonus(ResourceType.Food);
                u.gatherWoodBonus = this.playerState.getGatherBonus(ResourceType.Wood);
                u.gatherGoldBonus = this.playerState.getGatherBonus(ResourceType.Gold);
                u.gatherStoneBonus = this.playerState.getGatherBonus(ResourceType.Stone);
                u.gatherSpeedBonus = this.playerState.gatherSpeedBonus; // fallback
                u.carryCapacityBonus = this.playerState.carryCapacityBonus;
                u.speedBonus = this.playerState.villagerSpeedBonus;
            } else {
                // Apply military upgrades to soldiers
                const atkBonus = this.playerState.getAttackBonus(u.type);
                const armorBonus = this.playerState.getArmorBonus(u.type);
                const hpBonus = this.playerState.getHpBonus(u.type);
                const level = u.type === UnitType.Archer
                    ? Math.max(this.playerState.upgrades.rangedAttack, this.playerState.upgrades.rangedDefense)
                    : Math.max(this.playerState.upgrades.meleeAttack, this.playerState.upgrades.meleeDefense);
                u.applyUpgrades(atkBonus, armorBonus, hpBonus, level);
            }
        }

        // Cleanup dead units (keep briefly for death animation)
        this.units = this.units.filter(u => {
            if (u.alive) return true;
            // Keep dead unit until death animation finishes
            if (u.deathTimer > 0) return true;
            // Unit is being removed — decrement population
            if (u.team === 0) this.playerState.population--;
            return false;
        });

        // Cleanup dead resources — free tiles
        this.resources = this.resources.filter(r => {
            if (r.alive) return true;
            // Free the tiles when resource is depleted
            if (r.nodeType !== ResourceNodeType.Farm) {
                const [col, row] = this.tileMap.worldToTile(r.x, r.y);
                if (r.nodeType === ResourceNodeType.Tree) {
                    this.tileMap.setOccupied(col, row, 2, 2, false);
                } else if (r.nodeType === ResourceNodeType.GoldMine || r.nodeType === ResourceNodeType.StoneMine) {
                    // Free 3x3 mine area
                    this.tileMap.setOccupied(col - 1, row - 1, 3, 3, false);
                    this.tileMap.setMineOccupied(col - 1, row - 1, 3, 3, false);
                } else {
                    this.tileMap.setOccupied(col, row, 1, 1, false);
                }
            }
            return false;
        });

        // Cleanup destroyed buildings
        this.buildings = this.buildings.filter(b => {
            if (b.alive) return true;
            // Free the tiles
            this.tileMap.setBuildingOccupied(b.tileX, b.tileY, b.tileW, b.tileH, false);
            if (b.selected) b.selected = false;

            // If a farm building is destroyed, also destroy its internal resource node
            if (b.type === BuildingType.Farm) {
                const rx = (b.tileX + 1) * TILE_SIZE;
                const ry = (b.tileY + 1) * TILE_SIZE;
                const farmRes = this.resources.find(r => r.nodeType === ResourceNodeType.Farm && Math.abs(r.x - rx) < 5 && Math.abs(r.y - ry) < 5);
                if (farmRes) farmRes.alive = false;
            }

            return false;
        });
    }

    // ---- Helper: find valid passable tile near target ----
    private findValidTile(col: number, row: number, w = 1, h = 1): [number, number] | null {
        // Spiral search outward from desired position
        for (let radius = 0; radius < 30; radius++) {
            for (let dr = -radius; dr <= radius; dr++) {
                for (let dc = -radius; dc <= radius; dc++) {
                    if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue; // only border
                    const c = col + dc, r = row + dr;
                    if (c < 1 || r < 1 || c + w >= MAP_COLS - 1 || r + h >= MAP_ROWS - 1) continue;
                    if (this.isAreaPassable(c, r, w, h)) return [c, r];
                }
            }
        }
        return null;
    }

    private isAreaPassable(col: number, row: number, w: number, h: number): boolean {
        for (let r = row; r < row + h; r++) {
            for (let c = col; c < col + w; c++) {
                if (!this.tileMap.isPassable(c, r)) return false;
            }
        }
        return true;
    }

    /** Check if an area (with margin) has no water tiles nearby */
    private isAreaFarFromWater(col: number, row: number, w: number, h: number, margin: number): boolean {
        for (let r = row - margin; r < row + h + margin; r++) {
            for (let c = col - margin; c < col + w + margin; c++) {
                if (c < 0 || c >= MAP_COLS || r < 0 || r >= MAP_ROWS) continue;
                if (this.tileMap.getTerrainAt(c, r) === TerrainType.Water) return false;
            }
        }
        return true;
    }

    /** Find valid tile that is also away from water (used for Town Centers) */
    private findValidTileAwayFromWater(col: number, row: number, w: number, h: number, waterMargin = 4): [number, number] | null {
        for (let radius = 0; radius < 30; radius++) {
            for (let dr = -radius; dr <= radius; dr++) {
                for (let dc = -radius; dc <= radius; dc++) {
                    if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;
                    const c = col + dc, r = row + dr;
                    if (c < 1 || r < 1 || c + w >= MAP_COLS - 1 || r + h >= MAP_ROWS - 1) continue;
                    if (this.isAreaPassable(c, r, w, h) && this.isAreaFarFromWater(c, r, w, h, waterMargin)) {
                        return [c, r];
                    }
                }
            }
        }
        return null;
    }

    private findValidWorldPos(wx: number, wy: number): [number, number] | null {
        const [c, r] = this.tileMap.worldToTile(wx, wy);
        const found = this.findValidTile(c, r);
        if (!found) return null;
        return [found[0] * TILE_SIZE + TILE_SIZE / 2, found[1] * TILE_SIZE + TILE_SIZE / 2];
    }

    // ---- Initial game setup ----
    setupGame(enemyCount: number = 1, allyCount: number = 0): void {
        // === Player Town Center (away from water) ===
        const playerCol = 45, playerRow = 210;
        const playerTC = this.findValidTileAwayFromWater(playerCol, playerRow, 4, 4);
        if (playerTC) {
            this.spawnBuilding(BuildingType.TownCenter, playerTC[0], playerTC[1], 0);

            // 4 Villagers (no scouts natively)
            const tcWorldX = (playerTC[0] + 2) * TILE_SIZE; // Center of TC in world coords
            const tcWorldY = (playerTC[1] + 2) * TILE_SIZE;
            for (let i = 0; i < 4; i++) {
                // Spawn around the TC, similar to original logic
                const spawnX = tcWorldX + (Math.random() - 0.5) * 60; // Spread within ~30 world units
                const spawnY = tcWorldY + (Math.random() - 0.5) * 60;
                const vp = this.findValidWorldPos(spawnX, spawnY);
                if (vp) this.spawnUnit(UnitType.Villager, vp[0], vp[1], 0);
            }

            // Spawn resources around player TC
            this.spawnResourcesAroundTC(playerTC[0], playerTC[1], 4, 4);
        }

        // === Procedural Forests ===
        const numForests = Math.floor((MAP_COLS * MAP_ROWS) / 4500); // ~140 clusters on 800x800
        for (let c = 0; c < numForests; c++) {
            const cx = 20 + Math.random() * (MAP_COLS - 40);
            const cy = 20 + Math.random() * (MAP_ROWS - 40);
            const count = 15 + Math.floor(Math.random() * 15); // 15-30 trees per cluster
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * 10 * TILE_SIZE;
                const tx = cx * TILE_SIZE + Math.cos(angle) * dist;
                const ty = cy * TILE_SIZE + Math.sin(angle) * dist;
                if (tx < 0 || tx >= MAP_COLS * TILE_SIZE || ty < 0 || ty >= MAP_ROWS * TILE_SIZE) continue;
                const [tc, tr] = this.tileMap.worldToTile(tx, ty);
                if (!this.tileMap.isPassable(tc, tr)) continue;

                let tooClose = false;
                for (const r of this.resources) {
                    if (r.nodeType === ResourceNodeType.Tree) {
                        const d = Math.hypot(r.x - tx, r.y - ty);
                        if (d < TILE_SIZE * 1.8) { tooClose = true; break; }
                    }
                }
                if (tooClose) continue;

                this.spawnResource(ResourceNodeType.Tree, tx, ty, 150);
            }
        }

        // === Procedural Wild Berry Bushes ===
        const numBerries = Math.floor((MAP_COLS * MAP_ROWS) / 10000); // 1 cluster per 10k tiles
        for (let c = 0; c < numBerries; c++) {
            const cx = 20 + Math.random() * (MAP_COLS - 40);
            const cy = 20 + Math.random() * (MAP_ROWS - 40);
            const count = 8 + Math.floor(Math.random() * 8); // 8-15 bushes
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * 5 * TILE_SIZE; // Tight clusters
                const tx = cx * TILE_SIZE + Math.cos(angle) * dist;
                const ty = cy * TILE_SIZE + Math.sin(angle) * dist;
                if (tx < 0 || tx >= MAP_COLS * TILE_SIZE || ty < 0 || ty >= MAP_ROWS * TILE_SIZE) continue;
                const [tc, tr] = this.tileMap.worldToTile(tx, ty);
                if (!this.tileMap.isPassable(tc, tr)) continue;

                // Ensure bushes aren't completely stacked
                let tooClose = false;
                for (const r of this.resources) {
                    if (r.nodeType === ResourceNodeType.BerryBush) {
                        const d = Math.hypot(r.x - tx, r.y - ty);
                        if (d < TILE_SIZE * 1.5) { tooClose = true; break; }
                    }
                }
                if (tooClose) continue;

                this.spawnResource(ResourceNodeType.BerryBush, tx, ty, 100);
            }
        }

        // === AI bases — strategic placement ===
        // Generate possible spawn corners natively based on MAP_COLS and MAP_ROWS
        const allCorners = [
            { col: Math.floor(MAP_COLS * 0.15), row: Math.floor(MAP_ROWS * 0.85) },
            { col: Math.floor(MAP_COLS * 0.15), row: Math.floor(MAP_ROWS * 0.15) },
            { col: Math.floor(MAP_COLS * 0.50), row: Math.floor(MAP_ROWS * 0.90) },
            { col: Math.floor(MAP_COLS * 0.85), row: Math.floor(MAP_ROWS * 0.15) },
            { col: Math.floor(MAP_COLS * 0.85), row: Math.floor(MAP_ROWS * 0.85) },
            { col: Math.floor(MAP_COLS * 0.85), row: Math.floor(MAP_ROWS * 0.50) },
            { col: Math.floor(MAP_COLS * 0.50), row: Math.floor(MAP_ROWS * 0.10) },
            { col: Math.floor(MAP_COLS * 0.20), row: Math.floor(MAP_ROWS * 0.50) },
            { col: Math.floor(MAP_COLS * 0.65), row: Math.floor(MAP_ROWS * 0.70) },
            { col: Math.floor(MAP_COLS * 0.35), row: Math.floor(MAP_ROWS * 0.30) },
        ];

        // Calculate distance from player for each corner
        const pCol = playerTC ? playerTC[0] : playerCol;
        const pRow = playerTC ? playerTC[1] : playerRow;
        const cornersWithDist = allCorners.map(c => ({
            ...c,
            dist: Math.hypot(c.col - pCol, c.row - pRow)
        }));

        // Sort by distance to player: closest first
        cornersWithDist.sort((a, b) => a.dist - b.dist);

        // Ally corners = closest to player, Enemy corners = farthest from player
        const allyCorners = cornersWithDist.slice(0, Math.max(allyCount, 1));
        const enemyCorners = cornersWithDist.slice(Math.max(allyCount, 1));

        // Shuffle within each group for variety
        const shuffleArr = <T>(arr: T[]) => {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        };
        shuffleArr(allyCorners);
        shuffleArr(enemyCorners);

        // Assign: teams 1..allyCount are allies, teams (allyCount+1)..totalAI are enemies
        const totalAI = enemyCount;
        for (let e = 0; e < totalAI; e++) {
            const team = e + 1;
            const isAlly = team <= allyCount;
            const cornerPool = isAlly ? allyCorners : enemyCorners;
            const poolIndex = isAlly ? (e % allyCorners.length) : ((e - allyCount) % enemyCorners.length);
            const corner = cornerPool[poolIndex];

            const aiTC = this.findValidTileAwayFromWater(corner.col, corner.row, 4, 4);
            if (aiTC) {
                this.spawnBuilding(BuildingType.TownCenter, aiTC[0], aiTC[1], team);
                for (let i = 0; i < 4; i++) {
                    const vp = this.findValidWorldPos((aiTC[0] + 4) * TILE_SIZE + i * 18, (aiTC[1] + 4) * TILE_SIZE);
                    if (vp) this.spawnUnit(UnitType.Villager, vp[0], vp[1], team);
                }

                // Spawn resources around AI TC
                this.spawnResourcesAroundTC(aiTC[0], aiTC[1], 4, 4);
            }
        }

        // === Procedural Gold Mines ===
        const tcPositions: [number, number][] = [];
        if (playerTC) tcPositions.push([playerTC[0] + 2, playerTC[1] + 2]);
        for (const b of this.buildings) {
            if (b.team !== 0 && b.type === BuildingType.TownCenter) {
                tcPositions.push([b.tileX + 2, b.tileY + 2]);
            }
        }

        const numGoldMines = Math.floor((MAP_COLS * MAP_ROWS) / 10000); // 1 per 10k tiles
        for (let c = 0; c < numGoldMines; c++) {
            const gx = 20 + Math.random() * (MAP_COLS - 40);
            const gy = 20 + Math.random() * (MAP_ROWS - 40);

            let tooCloseToTC = false;
            for (const [tcx, tcy] of tcPositions) {
                if (Math.hypot(gx - tcx, gy - tcy) < 30) { tooCloseToTC = true; break; }
            }
            if (tooCloseToTC) continue;

            const mineCount = 4 + Math.floor(Math.random() * 3); // 4-6 tiles of gold
            for (let i = 0; i < mineCount; i++) {
                const ox = (i % 2) * TILE_SIZE * 0.8;
                const oy = Math.floor(i / 2) * TILE_SIZE * 0.8;
                const gp = this.findValidWorldPos(gx * TILE_SIZE + ox, gy * TILE_SIZE + oy);
                if (gp) this.spawnResource(ResourceNodeType.GoldMine, gp[0], gp[1], 800);
            }
        }

        // === Procedural Stone Mines ===
        const numStoneMines = Math.floor((MAP_COLS * MAP_ROWS) / 12000); // 1 per 12k tiles
        for (let c = 0; c < numStoneMines; c++) {
            const sx = 20 + Math.random() * (MAP_COLS - 40);
            const sy = 20 + Math.random() * (MAP_ROWS - 40);

            let tooCloseToTC = false;
            for (const [tcx, tcy] of tcPositions) {
                if (Math.hypot(sx - tcx, sy - tcy) < 30) { tooCloseToTC = true; break; }
            }
            if (tooCloseToTC) continue;

            const mineCount = 3 + Math.floor(Math.random() * 2); // 3-4 tiles of stone
            for (let i = 0; i < mineCount; i++) {
                const ox = (i % 2) * TILE_SIZE * 0.9;
                const oy = Math.floor(i / 2) * TILE_SIZE * 0.9;
                const sp = this.findValidWorldPos(sx * TILE_SIZE + ox, sy * TILE_SIZE + oy);
                if (sp) this.spawnResource(ResourceNodeType.StoneMine, sp[0], sp[1], 600);
            }
        }
    }

    /**
     * Spawn berry bushes, gold mines, and stone mines around a Town Center
     * in a circular pattern at radius ~6-7 tiles.
     */
    private spawnResourcesAroundTC(tcCol: number, tcRow: number, tcW: number, tcH: number): void {
        // Center of the TC in tile coords
        const centerCol = tcCol + tcW / 2;
        const centerRow = tcRow + tcH / 2;
        const centerX = centerCol * TILE_SIZE;
        const centerY = centerRow * TILE_SIZE;

        // Divide the circle into 3 sectors for each resource type (berry, gold, stone)
        // so they don't overlap. Each sector is ~120 degrees apart.
        const baseAngle = Math.random() * Math.PI * 2; // random starting rotation

        // === Berry Bushes — sector 1 (spread in ~120° arc) — CLOSE to TC for early food ===
        const berryAngleStart = baseAngle;
        for (let i = 0; i < 8; i++) {
            const angle = berryAngleStart + (i / 8) * (Math.PI * 0.7) + (Math.random() - 0.5) * 0.4;
            const dist = (6 + Math.random() * 3) * TILE_SIZE; // 6-9 tiles radius (abundant food)
            const bx = centerX + Math.cos(angle) * dist;
            const by = centerY + Math.sin(angle) * dist;
            const bp = this.findValidWorldPos(bx, by);
            if (bp) this.spawnResource(ResourceNodeType.BerryBush, bp[0], bp[1], 100);
        }

        // === Gold Mines — sector 2 (~120° offset from berries) — FAR from TC ===
        const goldAngle = baseAngle + Math.PI * 2 / 3;
        const goldDist = (10 + Math.random() * 2) * TILE_SIZE; // 10-12 tiles radius (far from TC)
        const goldCenterX = centerX + Math.cos(goldAngle) * goldDist;
        const goldCenterY = centerY + Math.sin(goldAngle) * goldDist;
        for (let i = 0; i < 4; i++) {
            const ox = (i % 2) * TILE_SIZE * 0.8;
            const oy = Math.floor(i / 2) * TILE_SIZE * 0.8;
            const gp = this.findValidWorldPos(goldCenterX + ox, goldCenterY + oy);
            if (gp) {
                // Safety check: don't spawn within 8 tiles of TC center
                const distToTC = Math.hypot(gp[0] - centerX, gp[1] - centerY);
                if (distToTC > 8 * TILE_SIZE) {
                    this.spawnResource(ResourceNodeType.GoldMine, gp[0], gp[1], 800);
                }
            }
        }

        // === Stone Mines — sector 3 (~240° offset from berries) — FAR from TC ===
        const stoneAngle = baseAngle + Math.PI * 4 / 3;
        const stoneDist = (11 + Math.random() * 2) * TILE_SIZE; // 11-13 tiles radius (far from TC)
        const stoneCenterX = centerX + Math.cos(stoneAngle) * stoneDist;
        const stoneCenterY = centerY + Math.sin(stoneAngle) * stoneDist;
        for (let i = 0; i < 3; i++) {
            const ox = (i % 2) * TILE_SIZE * 0.9;
            const oy = Math.floor(i / 2) * TILE_SIZE * 0.9;
            const sp = this.findValidWorldPos(stoneCenterX + ox, stoneCenterY + oy);
            if (sp) {
                // Safety check: don't spawn within 8 tiles of TC center
                const distToTC = Math.hypot(sp[0] - centerX, sp[1] - centerY);
                if (distToTC > 8 * TILE_SIZE) {
                    this.spawnResource(ResourceNodeType.StoneMine, sp[0], sp[1], 600);
                }
            }
        }
    }

    // ---- Render ----
    renderResources(ctx: CanvasRenderingContext2D, camX: number, camY: number, vpW: number, vpH: number): void {
        for (const r of this.resources) {
            if (r.x < camX - 40 || r.x > camX + vpW + 40) continue;
            if (r.y < camY - 40 || r.y > camY + vpH + 40) continue;
            r.render(ctx);
        }
    }

    renderBuildings(ctx: CanvasRenderingContext2D, camX?: number, camY?: number, vpW?: number, vpH?: number): void {
        for (const b of this.buildings) {
            if (camX !== undefined && camY !== undefined && vpW !== undefined && vpH !== undefined) {
                const bLeft = b.tileX * TILE_SIZE;
                const bTop = b.tileY * TILE_SIZE;
                const bRight = bLeft + b.tileW * TILE_SIZE;
                const bBottom = bTop + b.tileH * TILE_SIZE;
                const margin = 60;
                if (bRight < camX - margin || bLeft > camX + vpW + margin ||
                    bBottom < camY - margin || bTop > camY + vpH + margin) {
                    continue;
                }
            }
            b.render(ctx);
        }
    }

    renderUnits(ctx: CanvasRenderingContext2D, camX: number, camY: number, vpW: number, vpH: number): void {
        for (const u of this.units) {
            if (!u.alive) continue;
            if (u.isStealthed && u.team !== 0) continue;
            if (u.x < camX - 30 || u.x > camX + vpW + 30) continue;
            if (u.y < camY - 30 || u.y > camY + vpH + 30) continue;
            u.render(ctx);
        }
    }

    private renderList: { sortY: number, entity: any }[] = [];

    /** Combined Y-sorted render of all entities for pseudo-3D depth */
    renderAllYSorted(ctx: CanvasRenderingContext2D, camX: number, camY: number, vpW: number, vpH: number): void {
        let renderCount = 0;
        const pushItem = (sortY: number, entity: any) => {
            if (renderCount >= this.renderList.length) {
                this.renderList.push({ sortY, entity });
            } else {
                this.renderList[renderCount].sortY = sortY;
                this.renderList[renderCount].entity = entity;
            }
            renderCount++;
        };

        // Resources
        for (const r of this.resources) {
            if (r.x < camX - 40 || r.x > camX + vpW + 40) continue;
            if (r.y < camY - 40 || r.y > camY + vpH + 40) continue;
            // Hide enemy farms that spawn as ResourceNodes
            if (r.nodeType === ResourceNodeType.Farm && this.fog && !this.fog.isVisible(r.x, r.y)) continue;
            pushItem(r.y + r.radius, r);
        }

        // Buildings
        for (const b of this.buildings) {
            const bLeft = b.tileX * TILE_SIZE;
            const bTop = b.tileY * TILE_SIZE;
            const bRight = bLeft + b.tileW * TILE_SIZE;
            const bBottom = bTop + b.tileH * TILE_SIZE;
            const margin = 60;
            if (bRight < camX - margin || bLeft > camX + vpW + margin ||
                bBottom < camY - margin || bTop > camY + vpH + margin) {
                continue;
            }
            if (this.fog && this.isEnemy(0, b.team) && b.type !== BuildingType.TownCenter && !this.fog.isVisible(b.x, b.y)) continue;
            pushItem(bBottom, b);
        }

        // Units
        for (const u of this.units) {
            if (!u.alive) continue;
            if (u.isStealthed && u.team !== 0) continue;
            if (u.x < camX - 30 || u.x > camX + vpW + 30) continue;
            if (u.y < camY - 30 || u.y > camY + vpH + 30) continue;
            if (this.fog && this.isEnemy(0, u.team) && !this.fog.isVisible(u.x, u.y)) continue;
            pushItem(u.y, u);
        }

        // Unused slots push out to the end during sort to preserve the object pool length
        for (let i = renderCount; i < this.renderList.length; i++) {
            this.renderList[i].sortY = Infinity;
        }

        // Sort back-to-front (lower Y = further away = drawn first)
        this.renderList.sort((a, b) => a.sortY - b.sortY);

        // Draw all active items
        for (let i = 0; i < renderCount; i++) {
            this.renderList[i].entity.render(ctx);
        }
    }

    renderMinimap(ctx: CanvasRenderingContext2D, mx: number, my: number, mw: number, mh: number): void {
        const sx = mw / (MAP_COLS * TILE_SIZE);
        const sy = mh / (MAP_ROWS * TILE_SIZE);
        // Resources
        for (const r of this.resources) {
            if (r.nodeType === ResourceNodeType.Farm && this.fog && !this.fog.isVisible(r.x, r.y)) continue;
            ctx.fillStyle = r.minimapColor;
            ctx.fillRect(mx + r.x * sx - 1, my + r.y * sy - 1, 2, 2);
        }
        // Buildings
        for (const b of this.buildings) {
            if (this.fog && this.isEnemy(0, b.team) && b.type !== BuildingType.TownCenter && !this.fog.isVisible(b.x, b.y)) continue;
            ctx.fillStyle = this.getMinimapColor(b.team);
            const bw = b.tileW * TILE_SIZE * sx;
            const bh = b.tileH * TILE_SIZE * sy;
            ctx.fillRect(mx + (b.tileX * TILE_SIZE) * sx, my + (b.tileY * TILE_SIZE) * sy, Math.max(3, bw), Math.max(3, bh));
        }
        // Units
        for (const u of this.units) {
            if (!u.alive) continue;
            // Hide stealthed enemy Ninjas from minimap too
            if (u.isStealthed && u.team !== 0) continue;
            if (this.fog && this.isEnemy(0, u.team) && !this.fog.isVisible(u.x, u.y)) continue;
            ctx.fillStyle = this.getMinimapColor(u.team);
            ctx.fillRect(mx + u.x * sx - 1, my + u.y * sy - 1, 3, 3);
        }
    }

    /** Get minimap color based on alliance: blue = player, green = ally, red = enemy */
    private getMinimapColor(team: number): string {
        if (team === 0) return C.player;
        return this.isAlly(0, team) ? '#44cc88' : C.enemy;
    }
}
