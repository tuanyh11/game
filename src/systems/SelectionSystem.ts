// ============================================================
//  SelectionSystem — Mouse/keyboard input, selection, commands
// ============================================================

import { Camera } from "../core/Camera";
import { EntityManager } from "./EntityManager";
import { PlayerState } from "./PlayerState";
import { TileMap } from "../map/TileMap";
import { Unit } from "../entities/Unit";
import { Building } from "../entities/Building";
import { ResourceNode } from "../entities/ResourceNode";
import { ParticleSystem } from "../effects/ParticleSystem";
import { BuildingType, BUILDING_DATA, TILE_SIZE, C, UnitType, UnitState, ResourceNodeType, MAP_COLS, MAP_ROWS } from "../config/GameConfig";

export class SelectionSystem {
    selectedUnits: Unit[] = [];
    selectedBuilding: Building | null = null;
    selectedResource: ResourceNode | null = null;

    // Box selection
    private isBoxSelecting = false;
    private boxStartX = 0; private boxStartY = 0;
    private boxEndX = 0; private boxEndY = 0;

    // Build mode state
    public buildMode: BuildingType | null = null;
    public buildMenuOpen: boolean = false; // True when 'B' is pressed to show the building list
    private buildGhostCol = 0;
    buildGhostRow = 0;
    buildValid = false;

    // Mouse state
    private mouseScreenX = 0;
    private mouseScreenY = 0;

    // UI area detection (set by GameUI)
    uiBottomHeight = 180;
    uiTopHeight = 36;

    // Command indicators (visual feedback)
    private commandIndicators: { x: number; y: number; timer: number; type: 'attack' | 'move' | 'gather'; radius?: number; color?: string }[] = [];

    /** When true, skip all selection/command mouse handling (free mode placement active) */
    freePlacementActive = false;

    /** When true, block interactions because a menu is open */
    isPaused = false;

    private isTouchDevice = false;
    private longPressTimer: ReturnType<typeof setTimeout> | null = null;
    private touchStartX = 0;
    private touchStartY = 0;
    private isLongPressTriggered = false;

    constructor(
        private canvas: HTMLCanvasElement,
        private camera: Camera,
        private entityManager: EntityManager,
        private playerState: PlayerState,
        private tileMap: TileMap,
        private particleSystem: ParticleSystem,
    ) {
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        window.addEventListener('keydown', (e) => this.onKeyDown(e));

        // Touch support
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
        canvas.addEventListener('touchcancel', (e) => this.onTouchEnd(e));
    }

    private get hasSelection(): boolean {
        return this.selectedUnits.length > 0 || this.selectedBuilding !== null || this.selectedResource !== null;
    }

    private isInGameArea(e: MouseEvent): boolean {
        if (e.clientY <= this.uiTopHeight) return false;

        // When something is selected, the bottom panel is visible → exclude it (up to width 650)
        if (this.hasSelection) {
            if (e.clientX <= 650 && e.clientY >= this.camera.viewportHeight - this.uiBottomHeight) {
                return false;
            }
            return true;
        }

        // When nothing is selected, bottom panel is hidden → only exclude minimap area
        const minimapX = 12;
        const minimapY = this.camera.viewportHeight - this.uiBottomHeight + 10 - 11; // match minimap panel position
        const minimapSize = 180;
        if (e.clientX >= minimapX && e.clientX <= minimapX + minimapSize &&
            e.clientY >= minimapY && e.clientY <= minimapY + minimapSize + 12) {
            return false;
        }

        return true;
    }

    // ---- Mouse Down ----
    private onMouseDown(e: MouseEvent): void {
        if (this.isTouchDevice && e.type.startsWith('mouse')) return; // Ignore synthetic mouse events
        if (this.freePlacementActive || this.isPaused) return;
        if (e.button === 0) { // Left click
            if (this.buildMode) {
                // Don't place building if clicking on UI panels
                if (!this.isInGameArea(e)) return;
                this.handleBuildPlace(e.ctrlKey || e.metaKey);
                return;
            }
            if (!this.isInGameArea(e)) return;
            // Start box selection
            const world = this.camera.screenToWorld(e.clientX, e.clientY);
            this.isBoxSelecting = true;
            this.boxStartX = world.x; this.boxStartY = world.y;
            this.boxEndX = world.x; this.boxEndY = world.y;
        }

        if (e.button === 2) { // Right click
            if (this.buildMode) { this.buildMode = null; return; }
            if (this.buildMenuOpen) { this.buildMenuOpen = false; return; }

            // Check if right-clicking on minimap → move units there
            if (this.isInMinimapArea(e.clientX, e.clientY)) {
                this.handleMinimapRightClick(e.clientX, e.clientY);
                return;
            }

            if (!this.isInGameArea(e)) { return; }
            this.handleRightClick(e);
        }
    }

    /** Check if screen coordinates are inside the minimap */
    private isInMinimapArea(sx: number, sy: number): boolean {
        const mmX = 12;  // borderWidth + 8
        const mmY = this.camera.viewportHeight - this.uiBottomHeight + 10;
        const mmS = 164; // minimapSize(180) - 16
        return sx >= mmX && sx <= mmX + mmS && sy >= mmY && sy <= mmY + mmS;
    }

    /** Handle right-click on minimap: move selected units to world position */
    private handleMinimapRightClick(sx: number, sy: number): void {
        const myUnits = this.selectedUnits.filter(u => u.team === 0);
        if (myUnits.length === 0) return;

        const mmX = 12;
        const mmY = this.camera.viewportHeight - this.uiBottomHeight + 10;
        const mmS = 164;

        // Convert minimap coords to world coords
        const worldX = ((sx - mmX) / mmS) * MAP_COLS * TILE_SIZE;
        const worldY = ((sy - mmY) / mmS) * MAP_ROWS * TILE_SIZE;

        // Move in formation
        const spacing = 20;
        const cols = Math.ceil(Math.sqrt(myUnits.length));
        for (let i = 0; i < myUnits.length; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const tx = worldX + (col - cols / 2) * spacing;
            const ty = worldY + (row - cols / 2) * spacing;
            myUnits[i].moveTo(tx, ty, undefined, this.tileMap);
            myUnits[i].manualCommand = true;
        }
    }

    // ---- Mouse Up ----
    private onMouseUp(e: MouseEvent): void {
        if (this.isTouchDevice && e.type.startsWith('mouse')) return;
        if (this.freePlacementActive || this.isPaused) return;
        if (e.button === 0 && this.isBoxSelecting) {
            const world = this.camera.screenToWorld(e.clientX, e.clientY);
            this.boxEndX = world.x; this.boxEndY = world.y;
            this.finishSelection();
            this.isBoxSelecting = false;
        }
    }

    // ---- Mouse Move ----
    private onMouseMove(e: MouseEvent): void {
        if (this.isTouchDevice && e.type.startsWith('mouse')) return;
        this.mouseScreenX = e.clientX;
        this.mouseScreenY = e.clientY;

        if (this.isBoxSelecting) {
            const world = this.camera.screenToWorld(e.clientX, e.clientY);
            this.boxEndX = world.x; this.boxEndY = world.y;
        }

        // Build mode ghost
        if (this.buildMode) {
            const world = this.camera.screenToWorld(e.clientX, e.clientY);
            this.buildGhostCol = Math.floor(world.x / TILE_SIZE);
            this.buildGhostRow = Math.floor(world.y / TILE_SIZE);
            const data = BUILDING_DATA[this.buildMode];
            this.buildValid = this.tileMap.canPlace(
                this.buildGhostCol, this.buildGhostRow, data.size[0], data.size[1]
            );
        }

        // Update cursor based on hover target
        this.updateCursor(e);
    }

    // ---- Cursor Management ----
    private _currentCursor = 'default';
    private static readonly SWORD_CURSOR = `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj4KICA8IS0tIEJsYWRlIHNoYWRvdyAtLT4KICA8bGluZSB4MT0iMTAiIHkxPSIyNCIgeDI9IjIyIiB5Mj0iMTIiIHN0cm9rZT0iIzExMSIgc3Ryb2tlLXdpZHRoPSI1IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICA8IS0tIEJsYWRlIGJvZHkgLS0+CiAgPGxpbmUgeDE9IjEwIiB5MT0iMjMiIHgyPSIyMSIgeTI9IjEyIiBzdHJva2U9IiNiOGMwZDAiIHN0cm9rZS13aWR0aD0iMy41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICA8IS0tIEJsYWRlIGhpZ2hsaWdodCAtLT4KICA8bGluZSB4MT0iMTEiIHkxPSIyMiIgeDI9IjIwIiB5Mj0iMTMiIHN0cm9rZT0iI2U4ZWNmNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogIDwhLS0gQmxhZGUgdGlwIC0tPgogIDxsaW5lIHgxPSIxOSIgeTE9IjE0IiB4Mj0iMjMiIHkyPSIxMCIgc3Ryb2tlPSIjZTBlOGYwIiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPGxpbmUgeDE9IjIwIiB5MT0iMTMiIHgyPSIyNCIgeTI9IjkiIHN0cm9rZT0iI2Y0ZjhmZiIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICA8IS0tIENyb3NzIGd1YXJkIHNoYWRvdyAtLT4KICA8bGluZSB4MT0iMTUiIHkxPSIyMyIgeDI9IjkiIHkyPSIxNyIgc3Ryb2tlPSIjMTExIiBzdHJva2Utd2lkdGg9IjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogIDwhLS0gQ3Jvc3MgZ3VhcmQgZ29sZCAtLT4KICA8bGluZSB4MT0iMTUiIHkxPSIyMyIgeDI9IjkiIHkyPSIxNyIgc3Ryb2tlPSIjZGFhNTIwIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogIDwhLS0gR3VhcmQgZ2VtIC0tPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMjAiIHI9IjEuOCIgZmlsbD0iI2ZmMzMzMyIvPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMjAiIHI9IjAuOCIgZmlsbD0iI2ZmODg4OCIvPgogIDwhLS0gR3JpcCBzaGFkb3cgLS0+CiAgPGxpbmUgeDE9IjkiIHkxPSIyNCIgeDI9IjUiIHkyPSIyOCIgc3Ryb2tlPSIjMTExIiBzdHJva2Utd2lkdGg9IjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogIDwhLS0gR3JpcCBsZWF0aGVyIC0tPgogIDxsaW5lIHgxPSI5IiB5MT0iMjQiIHgyPSI1IiB5Mj0iMjgiIHN0cm9rZT0iIzhCNDUxMyIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICA8IS0tIEdyaXAgd3JhcHMgLS0+CiAgPGxpbmUgeDE9IjgiIHkxPSIyNSIgeDI9IjciIHkyPSIyNS41IiBzdHJva2U9IiNkYWE1MjAiIHN0cm9rZS13aWR0aD0iMS4yIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICA8bGluZSB4MT0iNyIgeTE9IjI2IiB4Mj0iNiIgeTI9IjI2LjgiIHN0cm9rZT0iI2RhYTUyMCIgc3Ryb2tlLXdpZHRoPSIxLjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogIDxsaW5lIHgxPSI2IiB5MT0iMjciIHgyPSI1LjIiIHkyPSIyNy44IiBzdHJva2U9IiNkYWE1MjAiIHN0cm9rZS13aWR0aD0iMS4yIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICA8IS0tIFBvbW1lbCAtLT4KICA8Y2lyY2xlIGN4PSI0LjUiIGN5PSIyOC41IiByPSIyLjUiIGZpbGw9IiMxMTEiLz4KICA8Y2lyY2xlIGN4PSI0LjUiIGN5PSIyOC41IiByPSIyIiBmaWxsPSIjZGFhNTIwIi8+CiAgPGNpcmNsZSBjeD0iNC41IiBjeT0iMjguNSIgcj0iMC44IiBmaWxsPSIjZmZkZDQ0Ii8+Cjwvc3ZnPgo=") 4 28, crosshair`;
    // Resource cursors (base64 from public/cursors/*.svg)
    private static readonly AXE_CURSOR = `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI5Ny4wNzQgMjk3LjA3NCI+DQo8ZGVmcz4NCiAgPCEtLSBIYW5kbGUgd29vZCBncmFkaWVudCBtYXRjaGluZyBjdXJzb3IgYXhlICM4QjY5MTQgLS0+DQogIDxsaW5lYXJHcmFkaWVudCBpZD0iaGFuZGxlV29vZCIgeDE9IjAiIHkxPSIxIiB4Mj0iMSIgeTI9IjAiPg0KICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM3YTVjMTAiLz4NCiAgICA8c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iIzhCNjkxNCIvPg0KICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2EwODAyMCIvPg0KICA8L2xpbmVhckdyYWRpZW50Pg0KICA8IS0tIEJsYWRlIHN0ZWVsIGdyYWRpZW50IG1hdGNoaW5nIGN1cnNvciBheGUgI2EwYThiOCAtLT4NCiAgPGxpbmVhckdyYWRpZW50IGlkPSJibGFkZVN0ZWVsIiB4MT0iMC44IiB5MT0iMCIgeDI9IjAuMSIgeTI9IjEiPg0KICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNkMGQ4ZTQiLz4NCiAgICA8c3RvcCBvZmZzZXQ9IjQwJSIgc3RvcC1jb2xvcj0iI2EwYThiOCIvPg0KICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzZiNzg4OCIvPg0KICA8L2xpbmVhckdyYWRpZW50Pg0KICA8IS0tIENsaXA6IG9ubHkgdGhlIGhhbmRsZSAoZGlhZ29uYWwgYmFuZCBmcm9tIGJvdHRvbS1sZWZ0IHRvIGNlbnRlcikgLS0+DQogIDxjbGlwUGF0aCBpZD0iaGFuZGxlQ2xpcCI+DQogICAgPHBvbHlnb24gcG9pbnRzPSIwLDI5NyAwLDIwMCAxODAsMCAyMDAsMjAgMzAsMjk3Ii8+DQogIDwvY2xpcFBhdGg+DQogIDwhLS0gQ2xpcDogb25seSB0aGUgYmxhZGUgKHVwcGVyLXJpZ2h0IGFyZWEpIC0tPg0KICA8Y2xpcFBhdGggaWQ9ImJsYWRlQ2xpcCI+DQogICAgPHBvbHlnb24gcG9pbnRzPSIxMjAsMTgwIDE4MCwwIDI5NywwIDI5NywyOTcgMjAwLDI5NyAxMjAsMjAwIi8+DQogIDwvY2xpcFBhdGg+DQo8L2RlZnM+DQoNCjwhLS0gPT09IFNIQURPVyBMQVlFUiAob2Zmc2V0KSA9PT0gLS0+DQo8cGF0aCBkPSJNMjc4LjUwNSw2Ny4xOTJjLTIuMDkyLTIuMDk2LTUuMjQtMi43MjMtNy45NzYtMS41ODdjLTIuNzM1LDEuMTMzLTQuNTE5LDMuODAzLTQuNTE5LDYuNzYzDQogIGMwLDE1LjczLTEyLjgxLDI4LjUyNi0yOC41NjEsMjguNTI2Yy0xMS42NzksMC0yMS43MzUtNy4wNTMtMjYuMTQ4LTE3LjEyMmwzMi45NzEtMzIuOThjNS43MTUtNS43MTYsNS43MTUtMTQuOTg3LDAtMjAuNzA1DQogIGwtMS41NzQtMS41NzJjLTIuODU3LTIuODU5LTYuNjA0LTQuMjg5LTEwLjM1Mi00LjI4OWMtMy43NDQsMC03LjQ5LDEuNDMtMTAuMzQ5LDQuMjg5bC0zMy43MzcsMzMuNzQ3bC0zNy41MS0xOC43NjENCiAgYy0yLjgxNy0xLjQwOC02LjIxOS0wLjg1Ni04LjQ0OSwxLjM3Yy0yLjIyNSwyLjIyOC0yLjc3Nyw1LjYzMi0xLjM2OSw4LjQ1MmwxOC43NTQsMzcuNTE3TDQuMjg2LDI0Ni4yOA0KICBDMS41NDIsMjQ5LjAyNCwwLDI1Mi43NDksMCwyNTYuNjMyYzAsMy44ODQsMS41NDIsNy42MDgsNC4yODYsMTAuMzU0bDEuNTc0LDEuNTczYzIuNzQ0LDIuNzQ2LDYuNDY5LDQuMjg5LDEwLjM1MSw0LjI4OQ0KICBjMy44ODEsMCw3LjYwNy0xLjU0MywxMC4zNTEtNC4yODlMMTgxLjUxMSwxMTMuNTdjMTAuMDY3LDQuNDE1LDE3LjExOSwxNC40NzUsMTcuMTE5LDI2LjE1NGMwLDE1LjY0OC0xMy4yMTYsMjguODY4LTI4Ljg2LDI4Ljg2OA0KICBjLTIuOTYsMC01LjYyOSwxLjc4My02Ljc2MSw0LjUyYy0xLjEzMywyLjczNS0wLjUwNyw1Ljg4NCwxLjU4NSw3Ljk3N2MxMS45NzgsMTEuOTgsMjguNTA0LDE4LjU3OSw0Ni41MjksMTguNTc5DQogIGMyMS42NDcsMCw0My41MTYtOS40NTcsNTkuOTk2LTI1Ljk0NGMxNS4wNjMtMTUuMDY3LDI0LjIwMi0zNC4zMjksMjUuNzI4LTU0LjIzN0MyOTguNDA3LDk5LjE1NCwyOTEuODkzLDgwLjU4MiwyNzguNTA1LDY3LjE5MnoiDQogIGZpbGw9IiMxMTEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIsMykiIG9wYWNpdHk9IjAuNSIvPg0KDQo8IS0tID09PSBIQU5ETEUgUE9SVElPTiAod29vZCBjb2xvciAjOEI2OTE0KSA9PT0gLS0+DQo8ZyBjbGlwLXBhdGg9InVybCgjaGFuZGxlQ2xpcCkiPg0KICA8IS0tIEhhbmRsZSBzaGFkb3cgb3V0bGluZSAtLT4NCiAgPHBhdGggZD0iTTI3OC41MDUsNjcuMTkyYy0yLjA5Mi0yLjA5Ni01LjI0LTIuNzIzLTcuOTc2LTEuNTg3Yy0yLjczNSwxLjEzMy00LjUxOSwzLjgwMy00LjUxOSw2Ljc2Mw0KICAgIGMwLDE1LjczLTEyLjgxLDI4LjUyNi0yOC41NjEsMjguNTI2Yy0xMS42NzksMC0yMS43MzUtNy4wNTMtMjYuMTQ4LTE3LjEyMmwzMi45NzEtMzIuOThjNS43MTUtNS43MTYsNS43MTUtMTQuOTg3LDAtMjAuNzA1DQogICAgbC0xLjU3NC0xLjU3MmMtMi44NTctMi44NTktNi42MDQtNC4yODktMTAuMzUyLTQuMjg5Yy0zLjc0NCwwLTcuNDksMS40My0xMC4zNDksNC4yODlsLTMzLjczNywzMy43NDdsLTM3LjUxLTE4Ljc2MQ0KICAgIGMtMi44MTctMS40MDgtNi4yMTktMC44NTYtOC40NDksMS4zN2MtMi4yMjUsMi4yMjgtMi43NzcsNS42MzItMS4zNjksOC40NTJsMTguNzU0LDM3LjUxN0w0LjI4NiwyNDYuMjgNCiAgICBDMS41NDIsMjQ5LjAyNCwwLDI1Mi43NDksMCwyNTYuNjMyYzAsMy44ODQsMS41NDIsNy42MDgsNC4yODYsMTAuMzU0bDEuNTc0LDEuNTczYzIuNzQ0LDIuNzQ2LDYuNDY5LDQuMjg5LDEwLjM1MSw0LjI4OQ0KICAgIGMzLjg4MSwwLDcuNjA3LTEuNTQzLDEwLjM1MS00LjI4OUwxODEuNTExLDExMy41N2MxMC4wNjcsNC40MTUsMTcuMTE5LDE0LjQ3NSwxNy4xMTksMjYuMTU0YzAsMTUuNjQ4LTEzLjIxNiwyOC44NjgtMjguODYsMjguODY4DQogICAgYy0yLjk2LDAtNS42MjksMS43ODMtNi43NjEsNC41MmMtMS4xMzMsMi43MzUtMC41MDcsNS44ODQsMS41ODUsNy45NzdjMTEuOTc4LDExLjk4LDI4LjUwNCwxOC41NzksNDYuNTI5LDE4LjU3OQ0KICAgIGMyMS42NDcsMCw0My41MTYtOS40NTcsNTkuOTk2LTI1Ljk0NGMxNS4wNjMtMTUuMDY3LDI0LjIwMi0zNC4zMjksMjUuNzI4LTU0LjIzN0MyOTguNDA3LDk5LjE1NCwyOTEuODkzLDgwLjU4MiwyNzguNTA1LDY3LjE5MnoiDQogICAgZmlsbD0idXJsKCNoYW5kbGVXb29kKSIgc3Ryb2tlPSIjMTExIiBzdHJva2Utd2lkdGg9IjQiLz4NCjwvZz4NCg0KPCEtLSA9PT0gQkxBREUgUE9SVElPTiAoc3RlZWwgY29sb3IgI2EwYThiOCkgPT09IC0tPg0KPGcgY2xpcC1wYXRoPSJ1cmwoI2JsYWRlQ2xpcCkiPg0KICA8IS0tIEJsYWRlIGJhc2UgLS0+DQogIDxwYXRoIGQ9Ik0yNzguNTA1LDY3LjE5MmMtMi4wOTItMi4wOTYtNS4yNC0yLjcyMy03Ljk3Ni0xLjU4N2MtMi43MzUsMS4xMzMtNC41MTksMy44MDMtNC41MTksNi43NjMNCiAgICBjMCwxNS43My0xMi44MSwyOC41MjYtMjguNTYxLDI4LjUyNmMtMTEuNjc5LDAtMjEuNzM1LTcuMDUzLTI2LjE0OC0xNy4xMjJsMzIuOTcxLTMyLjk4YzUuNzE1LTUuNzE2LDUuNzE1LTE0Ljk4NywwLTIwLjcwNQ0KICAgIGwtMS41NzQtMS41NzJjLTIuODU3LTIuODU5LTYuNjA0LTQuMjg5LTEwLjM1Mi00LjI4OWMtMy43NDQsMC03LjQ5LDEuNDMtMTAuMzQ5LDQuMjg5bC0zMy43MzcsMzMuNzQ3bC0zNy41MS0xOC43NjENCiAgICBjLTIuODE3LTEuNDA4LTYuMjE5LTAuODU2LTguNDQ5LDEuMzdjLTIuMjI1LDIuMjI4LTIuNzc3LDUuNjMyLTEuMzY5LDguNDUybDE4Ljc1NCwzNy41MTdMNC4yODYsMjQ2LjI4DQogICAgQzEuNTQyLDI0OS4wMjQsMCwyNTIuNzQ5LDAsMjU2LjYzMmMwLDMuODg0LDEuNTQyLDcuNjA4LDQuMjg2LDEwLjM1NGwxLjU3NCwxLjU3M2MyLjc0NCwyLjc0Niw2LjQ2OSw0LjI4OSwxMC4zNTEsNC4yODkNCiAgICBjMy44ODEsMCw3LjYwNy0xLjU0MywxMC4zNTEtNC4yODlMMTgxLjUxMSwxMTMuNTdjMTAuMDY3LDQuNDE1LDE3LjExOSwxNC40NzUsMTcuMTE5LDI2LjE1NGMwLDE1LjY0OC0xMy4yMTYsMjguODY4LTI4Ljg2LDI4Ljg2OA0KICAgIGMtMi45NiwwLTUuNjI5LDEuNzgzLTYuNzYxLDQuNTJjLTEuMTMzLDIuNzM1LTAuNTA3LDUuODg0LDEuNTg1LDcuOTc3YzExLjk3OCwxMS45OCwyOC41MDQsMTguNTc5LDQ2LjUyOSwxOC41NzkNCiAgICBjMjEuNjQ3LDAsNDMuNTE2LTkuNDU3LDU5Ljk5Ni0yNS45NDRjMTUuMDYzLTE1LjA2NywyNC4yMDItMzQuMzI5LDI1LjcyOC01NC4yMzdDMjk4LjQwNyw5OS4xNTQsMjkxLjg5Myw4MC41ODIsMjc4LjUwNSw2Ny4xOTJ6Ig0KICAgIGZpbGw9InVybCgjYmxhZGVTdGVlbCkiIHN0cm9rZT0iIzIyMiIgc3Ryb2tlLXdpZHRoPSIzIi8+DQo8L2c+DQoNCjwhLS0gPT09IEJMQURFIEhJR0hMSUdIVCAobGlnaHRlciBhcmVhIG9uIGJsYWRlIGZhY2UpID09PSAtLT4NCjxnIGNsaXAtcGF0aD0idXJsKCNibGFkZUNsaXApIj4NCiAgPHBhdGggZD0iTTI3OC41MDUsNjcuMTkyYy0yLjA5Mi0yLjA5Ni01LjI0LTIuNzIzLTcuOTc2LTEuNTg3Yy0yLjczNSwxLjEzMy00LjUxOSwzLjgwMy00LjUxOSw2Ljc2Mw0KICAgIGMwLDE1LjczLTEyLjgxLDI4LjUyNi0yOC41NjEsMjguNTI2Yy0xMS42NzksMC0yMS43MzUtNy4wNTMtMjYuMTQ4LTE3LjEyMmwzMi45NzEtMzIuOThjNS43MTUtNS43MTYsNS43MTUtMTQuOTg3LDAtMjAuNzA1DQogICAgbC0xLjU3NC0xLjU3MmMtMi44NTctMi44NTktNi42MDQtNC4yODktMTAuMzUyLTQuMjg5Yy0zLjc0NCwwLTcuNDksMS40My0xMC4zNDksNC4yODlsLTMzLjczNywzMy43NDdsLTM3LjUxLTE4Ljc2MQ0KICAgIGMtMi44MTctMS40MDgtNi4yMTktMC44NTYtOC40NDksMS4zN2MtMi4yMjUsMi4yMjgtMi43NzcsNS42MzItMS4zNjksOC40NTJsMTguNzU0LDM3LjUxNyINCiAgICBmaWxsPSJub25lIiBzdHJva2U9IiNkMGQ4ZTQiIHN0cm9rZS13aWR0aD0iNiIgb3BhY2l0eT0iMC41Ii8+DQo8L2c+DQoNCjwhLS0gPT09IEVER0UgU0hJTkUgKGJyaWdodCBsaW5lIG9uIGN1dHRpbmcgZWRnZSkgPT09IC0tPg0KPHBhdGggZD0iTTI2MCw3OCBRMjg1LDEwMCwgMjkwLDEzMCBRMjkzLDE1NSwgMjc4LDE3OCIgDQogIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2YwZjRmOCIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgb3BhY2l0eT0iMC43Ii8+DQoNCjwhLS0gPT09IEhBTkRMRSBHUkFJTiBERVRBSUxTID09PSAtLT4NCjxsaW5lIHgxPSI0MCIgeTE9IjIzMCIgeDI9IjM1IiB5Mj0iMjM1IiBzdHJva2U9IiNhMDgwMjAiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBvcGFjaXR5PSIwLjYiLz4NCjxsaW5lIHgxPSI2MCIgeTE9IjIxMCIgeDI9IjU1IiB5Mj0iMjE1IiBzdHJva2U9IiNhMDgwMjAiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBvcGFjaXR5PSIwLjYiLz4NCjxsaW5lIHgxPSI4MCIgeTE9IjE5MCIgeDI9Ijc1IiB5Mj0iMTk1IiBzdHJva2U9IiNhMDgwMjAiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBvcGFjaXR5PSIwLjYiLz4NCjxsaW5lIHgxPSIxMDAiIHkxPSIxNzAiIHgyPSI5NSIgeTI9IjE3NSIgc3Ryb2tlPSIjYTA4MDIwIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgb3BhY2l0eT0iMC42Ii8+DQo8bGluZSB4MT0iMTIwIiB5MT0iMTUwIiB4Mj0iMTE1IiB5Mj0iMTU1IiBzdHJva2U9IiNhMDgwMjAiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBvcGFjaXR5PSIwLjUiLz4NCg0KPC9zdmc+") 5 28, crosshair`;
    private static readonly PICKAXE_CURSOR = `url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBVcGxvYWRlZCB0bzogU1ZHIFJlcG8sIHd3dy5zdmdyZXBvLmNvbSwgR2VuZXJhdG9yOiBTVkcgUmVwbyBNaXhlciBUb29scyAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgDQoJIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDUxMS42NzIgNTExLjY3MiIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8cGF0aCBzdHlsZT0iZmlsbDojN2E4YTlhOyIgZD0iTTUxMS42NzIsMzkxLjk1MmMwLDAtOTcuNTMxLTEyOC41NzQtMTgwLjQ2My0yMTEuNDlDMjQ4LjI3OCw5Ny41MzEsMTE5LjcwNSwwLDExOS43MDUsMA0KCXMxMzYuMDA2LDAuMzI4LDI2My44MywxMjguMTM2QzUxMS4zNDQsMjU1Ljk0NSw1MTEuNjcyLDM5MS45NTIsNTExLjY3MiwzOTEuOTUyeiIvPg0KPHBhdGggc3R5bGU9ImZpbGw6IzhCNjkxNDsiIGQ9Ik0zODAuOTQzLDg1LjUwN0w5LjM2OSw0NTcuMDgyYy0xMi40OTIsMTIuNDkyLTEyLjQ5MiwzMi43MjksMCw0NS4yMjENCgljMTIuNDkyLDEyLjQ5MiwzMi43MjksMTIuNDkyLDQ1LjIyMSwwbDM3MS41NzQtMzcxLjU3NEwzODAuOTQzLDg1LjUwN3oiLz4NCjxyZWN0IHg9IjMyMi41ODkiIHk9Ijg3LjgxNyIgdHJhbnNmb3JtPSJtYXRyaXgoLTAuNzA3MSAtMC43MDcxIDAuNzA3MSAtMC43MDcxIDQ5NC4xOTE4IDUxOC45MDMzKSIgc3R5bGU9ImZpbGw6Izk1YTViNTsiIHdpZHRoPSI2My45NTEiIGhlaWdodD0iMTM4LjU2OSIvPg0KPHBhdGggc3R5bGU9ImZpbGw6IzQzNEE1NDsiIGQ9Ik0zNjUuODU5LDE2MC44ODFjLTQuMTU0LDQuMTY5LTEwLjkxNSw0LjE1NC0xNS4wNjgsMGMtNC4xNy00LjE2OS00LjE3LTEwLjkxNSwwLTE1LjA4NA0KCWM0LjE1My00LjE1MywxMC45MTQtNC4xNTMsMTUuMDY4LDBDMzcwLjAyOSwxNDkuOTY2LDM3MC4wMjksMTU2LjcxMiwzNjUuODU5LDE2MC44ODF6Ii8+DQo8L3N2Zz4=") 5 29, crosshair`;
    private static readonly BASKET_CURSOR = `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj4KICA8IS0tIEJhc2tldCBib2R5IHNoYWRvdyAtLT4KICA8ZWxsaXBzZSBjeD0iMTYiIGN5PSIyMiIgcng9IjEwIiByeT0iNiIgZmlsbD0iIzMzMyIvPgogIDwhLS0gQmFza2V0IGJvZHkgLS0+CiAgPGVsbGlwc2UgY3g9IjE2IiBjeT0iMjEiIHJ4PSI5IiByeT0iNS41IiBmaWxsPSIjYzg5MjNhIi8+CiAgPCEtLSBCYXNrZXQgd2VhdmUgbGluZXMgLS0+CiAgPGxpbmUgeDE9IjgiIHkxPSIyMSIgeDI9IjI0IiB5Mj0iMjEiIHN0cm9rZT0iI2EwNzgyOCIgc3Ryb2tlLXdpZHRoPSIwLjgiLz4KICA8bGluZSB4MT0iOSIgeTE9IjE5IiB4Mj0iMjMiIHkyPSIxOSIgc3Ryb2tlPSIjYTA3ODI4IiBzdHJva2Utd2lkdGg9IjAuOCIvPgogIDxsaW5lIHgxPSI5IiB5MT0iMjMiIHgyPSIyMyIgeTI9IjIzIiBzdHJva2U9IiNhMDc4MjgiIHN0cm9rZS13aWR0aD0iMC44Ii8+CiAgPGxpbmUgeDE9IjEyIiB5MT0iMTYiIHgyPSIxMiIgeTI9IjI2IiBzdHJva2U9IiNhMDc4MjgiIHN0cm9rZS13aWR0aD0iMC44Ii8+CiAgPGxpbmUgeDE9IjE2IiB5MT0iMTUuNSIgeDI9IjE2IiB5Mj0iMjYuNSIgc3Ryb2tlPSIjYTA3ODI4IiBzdHJva2Utd2lkdGg9IjAuOCIvPgogIDxsaW5lIHgxPSIyMCIgeTE9IjE2IiB4Mj0iMjAiIHkyPSIyNiIgc3Ryb2tlPSIjYTA3ODI4IiBzdHJva2Utd2lkdGg9IjAuOCIvPgogIDwhLS0gQmFza2V0IHJpbSAtLT4KICA8ZWxsaXBzZSBjeD0iMTYiIGN5PSIxNiIgcng9IjkiIHJ5PSIzIiBmaWxsPSJub25lIiBzdHJva2U9IiM4QjY5MTQiIHN0cm9rZS13aWR0aD0iMS41Ii8+CiAgPCEtLSBCZXJyeSAxIC0tPgogIDxjaXJjbGUgY3g9IjEzIiBjeT0iMTQiIHI9IjIuNSIgZmlsbD0iI2NjMjI0NCIvPgogIDxjaXJjbGUgY3g9IjEyLjUiIGN5PSIxMy41IiByPSIxIiBmaWxsPSIjZmY0NDY2Ii8+CiAgPCEtLSBCZXJyeSAyIC0tPgogIDxjaXJjbGUgY3g9IjE4IiBjeT0iMTMiIHI9IjIuNSIgZmlsbD0iIzg4MzNhYSIvPgogIDxjaXJjbGUgY3g9IjE3LjUiIGN5PSIxMi41IiByPSIxIiBmaWxsPSIjYWE1NWNjIi8+CiAgPCEtLSBCZXJyeSAzIC0tPgogIDxjaXJjbGUgY3g9IjE1LjUiIGN5PSIxMSIgcj0iMiIgZmlsbD0iI2NjMjI0NCIvPgogIDxjaXJjbGUgY3g9IjE1IiBjeT0iMTAuNSIgcj0iMC44IiBmaWxsPSIjZmY0NDY2Ii8+CiAgPCEtLSBMZWFmIC0tPgogIDxwYXRoIGQ9Ik0xOSAxMCBRMjEgOCAyMCAxMSIgZmlsbD0iIzQ0YWE0NCIgc3Ryb2tlPSIjMjI4ODIyIiBzdHJva2Utd2lkdGg9IjAuNSIvPgo8L3N2Zz4K") 16 21, crosshair`;

    private updateCursor(e: MouseEvent): void {
        let newCursor = 'default';

        if (!this.isPaused) {
            const hasOwnUnits = this.selectedUnits.length > 0 &&
                this.selectedUnits.some(u => u.team === 0);
            const hasVillagers = this.selectedUnits.some(u => u.isVillager && u.team === 0);
            const hasCombatUnits = hasOwnUnits && this.selectedUnits.some(u => !u.isVillager && u.team === 0);

            if (this.buildMode) {
                newCursor = 'crosshair';
            } else if (hasOwnUnits && this.isInGameArea(e)) {
                const world = this.camera.screenToWorld(e.clientX, e.clientY);

                // Priority 1: Enemy units/buildings → sword cursor
                if (hasCombatUnits || hasVillagers) {
                    let foundEnemy = false;

                    // Use the standard methods which correctly verify stealth and fog of war visibility
                    const enemyUnit = this.entityManager.findEnemyUnitAt(world.x, world.y, 0, 45);
                    if (enemyUnit) foundEnemy = true;

                    if (!foundEnemy) {
                        const enemyBuilding = this.entityManager.findEnemyBuildingAt(world.x, world.y, 0, 25);
                        if (enemyBuilding) foundEnemy = true;
                    }

                    if (foundEnemy) newCursor = 'sword';
                }

                // Priority 2: Resources → tool cursors (only with villagers)
                if (newCursor === 'default' && hasVillagers) {
                    const res = this.entityManager.findResourceAt(world.x, world.y);
                    if (res) {
                        switch (res.nodeType) {
                            case ResourceNodeType.Tree:
                                newCursor = 'axe';
                                break;
                            case ResourceNodeType.GoldMine:
                            case ResourceNodeType.StoneMine:
                                newCursor = 'pickaxe';
                                break;
                            case ResourceNodeType.BerryBush:
                            case ResourceNodeType.Farm:
                                newCursor = 'basket';
                                break;
                        }
                    }
                }
            }

            // Priority 3: Resources → tool cursors even WITHOUT selecting villagers
            // Shows resource type feedback whenever hovering over resources
            if (newCursor === 'default' && this.isInGameArea(e)) {
                const world = this.camera.screenToWorld(e.clientX, e.clientY);
                const res = this.entityManager.findResourceAt(world.x, world.y);
                if (res) {
                    switch (res.nodeType) {
                        case ResourceNodeType.Tree:
                            newCursor = 'axe';
                            break;
                        case ResourceNodeType.GoldMine:
                        case ResourceNodeType.StoneMine:
                            newCursor = 'pickaxe';
                            break;
                        case ResourceNodeType.BerryBush:
                        case ResourceNodeType.Farm:
                            newCursor = 'basket';
                            break;
                    }
                }
            }
        }

        if (newCursor !== this._currentCursor) {
            this._currentCursor = newCursor;
            switch (newCursor) {
                case 'sword': this.canvas.style.cursor = SelectionSystem.SWORD_CURSOR; break;
                case 'axe': this.canvas.style.cursor = SelectionSystem.AXE_CURSOR; break;
                case 'pickaxe': this.canvas.style.cursor = SelectionSystem.PICKAXE_CURSOR; break;
                case 'basket': this.canvas.style.cursor = SelectionSystem.BASKET_CURSOR; break;
                default: this.canvas.style.cursor = newCursor; break;
            }
        }
    }

    // ==========================================================
    //  TOUCH EVENT MAPPING
    // ==========================================================
    private onTouchStart(e: TouchEvent): void {
        this.isTouchDevice = true;
        if (this.freePlacementActive || this.isPaused) return;

        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            this.isLongPressTriggered = false;

            this.clearLongPress();
            this.longPressTimer = setTimeout(() => {
                this.isLongPressTriggered = true;
                this.isBoxSelecting = false; // Cancel drag box drawing
                this.simulateMouseEvent(e, 'mousedown', 2, this.touchStartX, this.touchStartY);
            }, 350); // 350ms for right click hold

            this.simulateMouseEvent(e, 'mousedown', 0, touch.clientX, touch.clientY);
        } else {
            // Cancel operations if multi-touch happens
            this.clearLongPress();
            if (this.isBoxSelecting) {
                this.isBoxSelecting = false;
            }
        }
    }

    private onTouchMove(e: TouchEvent): void {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const dx = touch.clientX - this.touchStartX;
            const dy = touch.clientY - this.touchStartY;

            // If finger moves more than 15 pixels, cancel the long press (user is dragging)
            if (Math.hypot(dx, dy) > 15) {
                this.clearLongPress();
            }

            if (!this.isLongPressTriggered) {
                this.simulateMouseEvent(e, 'mousemove', 0, touch.clientX, touch.clientY);
            }
        }
    }

    private onTouchEnd(e: TouchEvent): void {
        this.clearLongPress();
        if (!this.isLongPressTriggered && e.changedTouches.length === 1) {
            const touch = e.changedTouches[0];
            this.simulateMouseEvent(e, 'mouseup', 0, touch.clientX, touch.clientY);
        }
    }

    private clearLongPress() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    private simulateMouseEvent(originalEvent: TouchEvent, type: string, button: number, clientX: number, clientY: number) {
        // Create a mock MouseEvent to reuse the mouse handler code
        const mockE = {
            type: 'touch', // avoid the "isTouchDevice && e.type.startsWith('mouse') -> return"
            clientX, clientY, button,
            ctrlKey: originalEvent.ctrlKey, metaKey: originalEvent.metaKey,
            preventDefault: () => originalEvent.preventDefault(),
            stopPropagation: () => originalEvent.stopPropagation()
        } as unknown as MouseEvent;

        if (type === 'mousedown') this.onMouseDown(mockE);
        else if (type === 'mousemove') this.onMouseMove(mockE);
        else if (type === 'mouseup') this.onMouseUp(mockE);
    }

    // ---- Key Down ----
    private onKeyDown(e: KeyboardEvent): void {
        if (this.isPaused) return;

        if (e.key === 'Escape') {
            let consumed = false;
            if (this.buildMode) {
                this.buildMode = null; // Cancel build mode only
                consumed = true;
            } else if (this.buildMenuOpen) {
                this.buildMenuOpen = false; // Cancel build menu
                consumed = true;
            } else if (this.hasSelection) {
                this.clearSelection();
                consumed = true;
            }
            if (consumed) {
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                return;
            }
        }

        // Delete / Backspace → Kill own units / buildings
        if (e.key === 'Delete' || e.key === 'Backspace') {
            let deletedSomething = false;

            // Kill all selected OWN units
            const ownUnits = this.selectedUnits.filter(u => u.team === 0);
            for (const u of ownUnits) {
                if (u.alive) {
                    u.hp = 0;
                    u.alive = false;
                    u.deathTimer = 1.0;
                    // Spawn explosion effect similar to Unit.ts death
                    this.particleSystem.emit({
                        x: u.x, y: u.y, count: 12, spread: 10,
                        speed: [20, 60], angle: [0, Math.PI * 2],
                        life: [0.4, 1.0], size: [2, 5],
                        colors: ['#ff3333', '#882222', '#cc4444', '#660000'],
                        gravity: 80, shape: 'circle',
                    });
                }
            }
            if (ownUnits.length > 0) deletedSomething = true;

            // Destroy selected OWN building
            if (this.selectedBuilding && this.selectedBuilding.team === 0 && this.selectedBuilding.alive) {
                // Instantly deal massive damage to trigger exact destroy sequence
                this.selectedBuilding.takeDamage(this.selectedBuilding.hp + 9999, this.particleSystem);
                deletedSomething = true;
            }

            if (deletedSomething) {
                this.clearSelection();
                e.preventDefault();
                return;
            }
        }

        // Space → center camera on selected target
        if (e.key === ' ' || e.code === 'Space') {
            if (this.selectedUnits.length > 0) {
                let cx = 0, cy = 0;
                for (const u of this.selectedUnits) { cx += u.x; cy += u.y; }
                cx /= this.selectedUnits.length;
                cy /= this.selectedUnits.length;
                this.camera.centerOn(cx, cy);
                e.preventDefault();
            } else if (this.selectedBuilding) {
                this.camera.centerOn(this.selectedBuilding.x, this.selectedBuilding.y);
                e.preventDefault();
            } else if (this.selectedResource) {
                this.camera.centerOn(this.selectedResource.x, this.selectedResource.y);
                e.preventDefault();
            }
        }

        const key = e.key.toLowerCase();
        const hasVillager = this.selectedUnits.some(u => u.isVillager && u.team === 0);

        // Toggle Build Menu if Villager is selected and 'B' is pressed
        if (key === 'b' && hasVillager && !this.buildMode && !this.buildMenuOpen) {
            this.buildMenuOpen = true;
            return;
        }

        // Helper for cycling through specific building types
        const cycleBuilding = (bType: BuildingType): boolean => {
            if (this.buildMode || this.buildMenuOpen) return false;
            const buildings = this.entityManager.buildings.filter(b => b.team === 0 && b.type === bType && b.alive);
            if (buildings.length > 0) {
                this.clearSelection();

                if (typeof this._lastBuildingIndex[bType] !== 'number' || isNaN(this._lastBuildingIndex[bType])) {
                    this._lastBuildingIndex[bType] = -1;
                }

                this._lastBuildingIndex[bType] = (this._lastBuildingIndex[bType] + 1) % buildings.length;

                const b = buildings[this._lastBuildingIndex[bType]];
                if (b) {
                    b.selected = true;
                    this.selectedBuilding = b;
                    this.camera.centerOn(b.x, b.y);
                }
                return true;
            }
            return false;
        };

        // Select and Focus Town Center ('H')
        if (key === 'h' && !e.ctrlKey && !e.metaKey) {
            if (cycleBuilding(BuildingType.TownCenter)) return;
        }

        // Select and Focus Barracks (Ctrl + B)
        if (key === 'b' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (cycleBuilding(BuildingType.Barracks)) return;
        }

        // Select and Focus Stable (Ctrl + L)
        if (key === 'l' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (cycleBuilding(BuildingType.Stable)) return;
        }

        // Valid command keys
        const validKeys = ['q', 'w', 'e', 'r', 'a', 's', 'd', 'f', 'z', 'x', 'c', 'v', 'u', 'b', 't', 'n', 'l', 'm', 'i'];

        if (validKeys.includes(key) && this._hotkeyCallback) {
            this._hotkeyCallback(key);
        }

        // Control groups: Ctrl+0-9 to assign, 0-9 to recall, double-tap to focus camera
        const digit = parseInt(e.key);
        if (!isNaN(digit) && digit >= 0 && digit <= 9) {
            // Prevent Control Group assignment from stealing Ctrl+B etc if digit is evaluated (parseInt('b') is NaN so we're safe)
            if (e.ctrlKey || e.metaKey) {
                // Assign control group
                this.controlGroups[digit] = [...this.selectedUnits];
                this._controlGroupDirty = true;
                e.preventDefault();
            } else if (!validKeys.includes(key)) {
                // Recall control group (skip if it's a hotkey like q/w/e/r/a)
                if (this.controlGroups[digit] && this.controlGroups[digit].length > 0) {
                    const alive = this.controlGroups[digit].filter(u => u.alive);
                    this.controlGroups[digit] = alive;
                    if (alive.length > 0) {
                        // Double-tap detection: center camera on group
                        const now = performance.now();
                        if (this._lastRecallGroup === digit && now - this._lastRecallTime < 400) {
                            // Double-tap → focus camera on group center
                            let cx = 0, cy = 0;
                            for (const u of alive) { cx += u.x; cy += u.y; }
                            cx /= alive.length; cy /= alive.length;
                            this.camera.centerOn(cx, cy);
                        }
                        this._lastRecallGroup = digit;
                        this._lastRecallTime = now;

                        this.clearSelection();
                        for (const u of alive) u.selected = true;
                        this.selectedUnits = alive;
                    }
                }
            }
        }
    }

    // Control groups storage
    private controlGroups: Record<number, Unit[]> = {};
    _controlGroupDirty = false;
    private _lastRecallGroup = -1;
    private _lastRecallTime = 0;
    private _lastBuildingIndex: Record<string, number> = {};

    /** Get control groups for UI display */
    getControlGroups(): Record<number, Unit[]> { return this.controlGroups; }

    // Hotkey callback (set by GameUI)
    private _hotkeyCallback: ((key: string) => void) | null = null;
    setHotkeyCallback(cb: (key: string) => void) { this._hotkeyCallback = cb; }

    // ---- Selection Logic ----
    private finishSelection(): void {
        const dx = this.boxEndX - this.boxStartX;
        const dy = this.boxEndY - this.boxStartY;

        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
            // Click select
            const wx = this.boxStartX, wy = this.boxStartY;

            // ---- ATTACK ON LEFT-CLICK: If own units are selected and clicking on enemy → ATTACK ----
            const myUnits = this.selectedUnits.filter(u => u.team === 0 && u.alive);
            if (myUnits.length > 0) {
                // Check if clicking on an enemy unit → attack it
                const enemyUnit = this.entityManager.findEnemyUnitAt(wx, wy, 0);
                if (enemyUnit && !enemyUnit.isStealthed) {
                    for (const u of myUnits) {
                        u.attackUnit(enemyUnit, true);
                        u.manualCommand = true;
                    }
                    this.commandIndicators.push({ x: enemyUnit.x, y: enemyUnit.y, timer: 0.4, type: 'attack' });
                    return; // Keep current selection, don't clear
                }
                // Check if clicking on an enemy building → attack it
                const enemyBuilding = this.entityManager.findEnemyBuildingAt(wx, wy, 0);
                if (enemyBuilding) {
                    for (const u of myUnits) {
                        u.attackBuilding(enemyBuilding, true);
                        u.manualCommand = true;
                    }
                    this.commandIndicators.push({ x: enemyBuilding.x, y: enemyBuilding.y, timer: 0.4, type: 'attack' });
                    return; // Keep current selection, don't clear
                }
            }

            this.clearSelection();

            // Try select own unit first
            const unit = this.entityManager.findUnitAt(wx, wy, 0);
            if (unit) {
                unit.selected = true;
                this.selectedUnits = [unit];
                return;
            }

            // Try select own building
            const building = this.entityManager.findBuildingAt(wx, wy, 0);
            if (building) {
                building.selected = true;
                this.selectedBuilding = building;
                return;
            }

            // Try select enemy unit/building (for info)
            const clickedEnemyUnit = this.entityManager.findUnitAt(wx, wy);
            if (clickedEnemyUnit && !clickedEnemyUnit.isStealthed) {
                clickedEnemyUnit.selected = true;
                this.selectedUnits = [clickedEnemyUnit];
                return;
            }
            const clickedEnemyBuilding = this.entityManager.findBuildingAt(wx, wy);
            if (clickedEnemyBuilding) {
                clickedEnemyBuilding.selected = true;
                this.selectedBuilding = clickedEnemyBuilding;
                return;
            }

            // Try select resource node (for info)
            const resource = this.entityManager.findResourceAt(wx, wy);
            if (resource) {
                this.selectedResource = resource;
            }
        } else {
            this.clearSelection();
            // Box select own units
            const units = this.entityManager.findUnitsInRect(
                this.boxStartX, this.boxStartY, dx, dy, 0
            );
            for (const u of units) u.selected = true;
            this.selectedUnits = units;
        }
    }

    clearSelection(): void {
        for (const u of this.selectedUnits) u.selected = false;
        if (this.selectedBuilding) this.selectedBuilding.selected = false;
        this.selectedUnits = [];
        this.selectedBuilding = null;
        this.selectedResource = null;
        this.buildMenuOpen = false;
    }

    // ---- Right-click Commands ----
    private handleRightClick(e: MouseEvent): void {
        if (this.selectedUnits.length === 0) return;
        const myUnits = this.selectedUnits.filter(u => u.team === 0);
        if (myUnits.length === 0) return;

        const world = this.camera.screenToWorld(e.clientX, e.clientY);

        // Check if clicking NEAR enemy unit → ATTACK (generous 45px radius)
        const enemyUnit = this.entityManager.findEnemyUnitAt(world.x, world.y, 0);
        if (enemyUnit && !enemyUnit.isStealthed) {
            for (const u of myUnits) {
                u.attackUnit(enemyUnit, true);
                u.manualCommand = true;
            }
            this.commandIndicators.push({ x: enemyUnit.x, y: enemyUnit.y, timer: 0.4, type: 'attack' });
            return;
        }

        // Check if clicking NEAR enemy building → ATTACK BUILDING
        const enemyBuilding = this.entityManager.findEnemyBuildingAt(world.x, world.y, 0);
        if (enemyBuilding) {
            for (const u of myUnits) {
                u.attackBuilding(enemyBuilding, true);
                u.manualCommand = true;
            }
            this.commandIndicators.push({ x: enemyBuilding.x, y: enemyBuilding.y, timer: 0.4, type: 'attack' });
            return;
        }

        // Check if clicking on a resource → GATHER (villagers) or MOVE (others)
        const resource = this.entityManager.findResourceAt(world.x, world.y);
        if (resource) {
            const villagers = myUnits.filter(u => u.isVillager);
            const others = myUnits.filter(u => !u.isVillager);
            for (const u of villagers) {
                u.gatherFrom(resource, () =>
                    this.entityManager.findNearestDropOff(u.x, u.y, resource.resourceType, 0)
                );
                u.manualCommand = true;
            }
            // Non-villager units should still move to the position
            if (others.length > 0) {
                const spacing = 20;
                const cols = Math.ceil(Math.sqrt(others.length));
                for (let i = 0; i < others.length; i++) {
                    const row = Math.floor(i / cols);
                    const col = i % cols;
                    const tx = world.x + (col - cols / 2) * spacing;
                    const ty = world.y + (row - cols / 2) * spacing;
                    others[i].moveTo(tx, ty, undefined, this.tileMap);
                    others[i].manualCommand = true;
                }
            }
            // Show gather indicator — collision circle on the resource
            if (villagers.length > 0) {
                let gatherColor = '#44ff44';
                switch (resource.nodeType) {
                    case ResourceNodeType.Tree: gatherColor = '#44dd88'; break;
                    case ResourceNodeType.GoldMine: gatherColor = '#ffd700'; break;
                    case ResourceNodeType.StoneMine: gatherColor = '#99aacc'; break;
                    case ResourceNodeType.BerryBush: gatherColor = '#ee5577'; break;
                    case ResourceNodeType.Farm: gatherColor = '#aacc44'; break;
                }
                this.commandIndicators.push({
                    x: resource.x, y: resource.y,
                    timer: 0.6, type: 'gather',
                    radius: resource.radius,
                    color: gatherColor,
                });
            }
            return;
        }

        // Check if clicking on unbuilt friendly building → BUILD (villagers) or MOVE (others)
        const building = this.entityManager.findBuildingAt(world.x, world.y, 0);
        if (building && !building.built) {
            const villagers = myUnits.filter(u => u.isVillager);
            const others = myUnits.filter(u => !u.isVillager);
            for (const u of villagers) {
                u.buildAt(building);
                u.manualCommand = true;
            }
            // Non-villager units should still move to the position
            if (others.length > 0) {
                const spacing = 20;
                const cols = Math.ceil(Math.sqrt(others.length));
                for (let i = 0; i < others.length; i++) {
                    const row = Math.floor(i / cols);
                    const col = i % cols;
                    const tx = world.x + (col - cols / 2) * spacing;
                    const ty = world.y + (row - cols / 2) * spacing;
                    others[i].moveTo(tx, ty, undefined, this.tileMap);
                    others[i].manualCommand = true;
                }
            }
            return;
        }

        // Otherwise, move in formation
        const spacing = 20;
        const cols = Math.ceil(Math.sqrt(myUnits.length));
        for (let i = 0; i < myUnits.length; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const tx = world.x + (col - cols / 2) * spacing;
            const ty = world.y + (row - cols / 2) * spacing;
            myUnits[i].moveTo(tx, ty, undefined, this.tileMap);
            myUnits[i].manualCommand = true;
        }
        this.commandIndicators.push({ x: world.x, y: world.y, timer: 0.3, type: 'move' });
    }

    /** Update command indicator timers */
    updateIndicators(dt: number): void {
        for (let i = this.commandIndicators.length - 1; i >= 0; i--) {
            this.commandIndicators[i].timer -= dt;
            if (this.commandIndicators[i].timer <= 0) {
                this.commandIndicators.splice(i, 1);
            }
        }
    }

    // ---- Build Mode ----
    enterBuildMode(type: BuildingType): void {
        this.buildMode = type;
    }

    private handleBuildPlace(keepBuildMode = false): void {
        if (!this.buildMode || !this.buildValid) return;
        const data = BUILDING_DATA[this.buildMode];
        if (!this.playerState.canAfford(data.cost)) return;
        this.playerState.spend(data.cost);

        // Spawn building as UNDER CONSTRUCTION (startBuilt = false)
        const b = this.entityManager.spawnBuilding(this.buildMode, this.buildGhostCol, this.buildGhostRow, 0, false);
        if (b) {
            // If it's a farm, also spawn a farm resource node
            if (this.buildMode === BuildingType.Farm) {
                const fx = (this.buildGhostCol + 1) * TILE_SIZE;
                const fy = (this.buildGhostRow + 1) * TILE_SIZE;
                this.entityManager.spawnResource(
                    ResourceNodeType.Farm,
                    fx, fy, 300
                );
            }
            // Send selected villager(s) to BUILD the structure
            const villagers = this.selectedUnits.filter(u => u.isVillager && u.team === 0);
            for (const villager of villagers) {
                villager.buildAt(b);
                villager.manualCommand = true;
            }
        }
        // If Ctrl/Cmd held, stay in build mode for rapid placement
        if (!keepBuildMode) {
            this.buildMode = null;
        }
    }

    // ---- Render overlays ----
    renderOverlays(ctx: CanvasRenderingContext2D): void {
        // Command indicators (attack = red ring, move = green ring, gather = resource ring)
        for (const ind of this.commandIndicators) {
            const sx = ind.x - this.camera.x;
            const sy = ind.y - this.camera.y;

            ctx.save();
            if (ind.type === 'gather') {
                // Gather indicator: show collision circle of the resource
                const maxTime = 0.6;
                const progress = 1 - ind.timer / maxTime; // 0 → 1
                const baseRadius = ind.radius ?? 18;
                const pulseRadius = baseRadius + Math.sin(progress * Math.PI * 3) * 3;
                const alpha = Math.min(1, 1.2 - progress);
                const color = ind.color ?? '#44ff44';

                ctx.globalAlpha = alpha;

                // Outer glow ring
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(sx, sy, pulseRadius + 2, 0, Math.PI * 2);
                ctx.stroke();

                // Inner solid ring (collision boundary)
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(sx, sy, pulseRadius, 0, Math.PI * 2);
                ctx.stroke();

                // Subtle fill
                ctx.fillStyle = color;
                ctx.globalAlpha = alpha * 0.08;
                ctx.beginPath();
                ctx.arc(sx, sy, pulseRadius, 0, Math.PI * 2);
                ctx.fill();

            } else if (ind.type === 'attack') {
                const maxTime = 0.4;
                const progress = 1 - ind.timer / maxTime;
                const radius = 5 + progress * 20;
                const alpha = 1 - progress;
                ctx.globalAlpha = alpha;
                // Red attack ring
                ctx.strokeStyle = '#ff2222';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(sx, sy, radius, 0, Math.PI * 2);
                ctx.stroke();
                // Inner glow
                ctx.strokeStyle = '#ff6644';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(sx, sy, radius * 0.6, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                // Green move ring
                const maxTime = 0.3;
                const progress = 1 - ind.timer / maxTime;
                const radius = 5 + progress * 20;
                const alpha = 1 - progress;
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = '#44ff44';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(sx, sy, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Box selection rectangle
        if (this.isBoxSelecting) {
            const cam = this.camera;
            const x1 = this.boxStartX - cam.x, y1 = this.boxStartY - cam.y;
            const x2 = this.boxEndX - cam.x, y2 = this.boxEndY - cam.y;
            ctx.fillStyle = C.selectionBox;
            ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
            ctx.strokeStyle = C.selectionBoxBorder;
            ctx.lineWidth = 1;
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        }

        // Build mode ghost
        if (this.buildMode) {
            const data = BUILDING_DATA[this.buildMode];
            const gx = this.buildGhostCol * TILE_SIZE - this.camera.x;
            const gy = this.buildGhostRow * TILE_SIZE - this.camera.y;
            const gw = data.size[0] * TILE_SIZE;
            const gh = data.size[1] * TILE_SIZE;
            ctx.fillStyle = this.buildValid
                ? 'rgba(0, 255, 100, 0.25)'
                : 'rgba(255, 50, 50, 0.25)';
            ctx.fillRect(gx, gy, gw, gh);
            ctx.strokeStyle = this.buildValid
                ? 'rgba(0, 255, 100, 0.7)'
                : 'rgba(255, 50, 50, 0.7)';
            ctx.lineWidth = 2;
            ctx.strokeRect(gx, gy, gw, gh);

            // Building name
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(data.name, gx + 4, gy - 6);
        }

        // Selected resource highlight
        if (this.selectedResource && this.selectedResource.alive) {
            const res = this.selectedResource;
            const rx = res.x - this.camera.x;
            const ry = res.y - this.camera.y;
            if (res.nodeType === ResourceNodeType.Farm) {
                // Farm selection: rectangular
                const halfW = 26, halfH = 26;
                ctx.strokeStyle = C.selection;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(rx - halfW, ry - halfH, halfW * 2, halfH * 2);
                ctx.strokeStyle = 'rgba(0,255,100,0.3)';
                ctx.lineWidth = 3;
                ctx.strokeRect(rx - halfW - 2, ry - halfH - 2, halfW * 2 + 4, halfH * 2 + 4);
            } else {
                const rad = res.radius + 2;
                ctx.strokeStyle = C.selection;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(rx, ry, rad, 0, Math.PI * 2);
                ctx.stroke();
                // Outer glow
                ctx.strokeStyle = 'rgba(0,255,100,0.3)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(rx, ry, rad + 2, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }
}
