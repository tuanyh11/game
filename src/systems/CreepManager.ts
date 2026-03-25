// ============================================================
//  CreepManager — Neutral monster camps (Warcraft III-style)
//  Handles spawning, aggro AI, leash, drops, and respawn
// ============================================================

import {
    UnitType, UnitState, TILE_SIZE, MAP_COLS, MAP_ROWS, ResourceType,
    CREEP_TEAM, CreepCampType, CREEP_CAMP_DATA, isCreepType,
    BuildingType, genId, CivilizationType,
} from "../config/GameConfig";
import { Unit } from "../entities/Unit";
import type { EntityManager } from "./EntityManager";
import type { TileMap } from "../map/TileMap";

// ---- Dragon equipment drop tables ----
// Western Dragon: Fire-themed, high-tier loot
const DRAGON_WEST_DROP_TABLE: string[] = [
    'war_axe', 'dragonbone_sword', 'frost_hammer',   // T2-T3 weapons
    'plate_armor', 'dragon_scale',                     // T2-T3 armor
    'blood_ring', 'crown_of_kings',                    // T2-T3 accessories
];
// Eastern Dragon: Storm-themed, high-tier loot
const DRAGON_EAST_DROP_TABLE: string[] = [
    'cursed_blade', 'dragonbone_sword', 'frost_hammer', // T2-T3 weapons
    'plate_armor', 'dragon_scale',                       // T2-T3 armor
    'blood_ring', 'crown_of_kings',                      // T2-T3 accessories
];

// ---- Camp instance ----
interface CreepCamp {
    id: number;
    type: CreepCampType;
    x: number;         // world coords (center)
    y: number;
    units: Unit[];      // current living creeps
    alive: boolean;     // false when all creeps killed
    respawnTimer: number; // countdown to respawn
}

export class CreepManager {
    camps: CreepCamp[] = [];
    private entityManager: EntityManager;
    private tileMap: TileMap;
    private updateTimer = 0;

    constructor(entityManager: EntityManager, tileMap: TileMap) {
        this.entityManager = entityManager;
        this.tileMap = tileMap;
    }

    // ===== SPAWN CAMPS =====
    spawnCamps(): void {
        // Get all TC positions to avoid spawning near them
        const tcPositions: { x: number; y: number }[] = [];
        for (const b of this.entityManager.buildings) {
            if (b.type === BuildingType.TownCenter) {
                tcPositions.push({ x: b.x, y: b.y });
            }
        }
        const minDistFromTC = TILE_SIZE * 40; // at least 40 tiles from any TC

        // Camp distribution: 5 wolf, 4 skeleton, 3 ogre, 1 dragon = 13 camps
        const campTypes: CreepCampType[] = [
            ...Array(5).fill(CreepCampType.WolfDen),
            ...Array(4).fill(CreepCampType.SkeletonTomb),
            ...Array(3).fill(CreepCampType.OgreCamp),
            CreepCampType.DragonLair,
            CreepCampType.DragonLairEast,
        ];

        for (const campType of campTypes) {
            const pos = this.findCampPosition(tcPositions, minDistFromTC);
            if (!pos) continue;

            const camp: CreepCamp = {
                id: genId(),
                type: campType,
                x: pos.x,
                y: pos.y,
                units: [],
                alive: true,
                respawnTimer: 0,
            };

            this.spawnCampUnits(camp);
            this.camps.push(camp);
        }
    }

    private findCampPosition(tcPositions: { x: number; y: number }[], minDist: number): { x: number; y: number } | null {
        const margin = TILE_SIZE * 30; // stay away from map edges
        for (let attempt = 0; attempt < 50; attempt++) {
            const x = margin + Math.random() * (MAP_COLS * TILE_SIZE - margin * 2);
            const y = margin + Math.random() * (MAP_ROWS * TILE_SIZE - margin * 2);

            // Check distance from all TCs
            let tooClose = false;
            for (const tc of tcPositions) {
                if (Math.hypot(x - tc.x, y - tc.y) < minDist) {
                    tooClose = true;
                    break;
                }
            }
            if (tooClose) continue;

            // Check distance from existing camps (min 25 tiles apart)
            let campTooClose = false;
            for (const c of this.camps) {
                if (Math.hypot(x - c.x, y - c.y) < TILE_SIZE * 25) {
                    campTooClose = true;
                    break;
                }
            }
            if (campTooClose) continue;

            // Check distance from resource nodes (min 15 tiles from any resource)
            let nearResource = false;
            for (const res of this.entityManager.resources) {
                if (Math.hypot(x - res.x, y - res.y) < TILE_SIZE * 15) {
                    nearResource = true;
                    break;
                }
            }
            if (nearResource) continue;

            // Check terrain is walkable
            const [col, row] = this.tileMap.worldToTile(x, y);
            if (!this.tileMap.isWalkable(col, row)) continue;

            return { x, y };
        }
        return null;
    }

    private spawnCampUnits(camp: CreepCamp): void {
        const data = CREEP_CAMP_DATA[camp.type];
        for (const spawn of data.units) {
            for (let i = 0; i < spawn.count; i++) {
                const angle = (i / spawn.count) * Math.PI * 2 + Math.random() * 0.5;
                const dist = TILE_SIZE * (1 + Math.random() * data.campRadius * 0.6);
                const ux = camp.x + Math.cos(angle) * dist;
                const uy = camp.y + Math.sin(angle) * dist;

                const unit = new Unit(spawn.type, ux, uy, CREEP_TEAM, CivilizationType.LaMa);
                unit.campOriginX = camp.x;
                unit.campOriginY = camp.y;
                unit.age = 1;

                this.entityManager.units.push(unit);
                camp.units.push(unit);
            }
        }
    }

    // ===== UPDATE (throttled to ~2 Hz) =====
    update(dt: number): void {
        this.updateTimer += dt;
        if (this.updateTimer < 0.5) return;
        this.updateTimer = 0;

        for (const camp of this.camps) {
            if (camp.alive) {
                this.updateCampAggro(camp);
                this.updateCampLeash(camp);
                this.checkCampDeath(camp);
            } else {
                // Respawn timer
                camp.respawnTimer -= 0.5;
                if (camp.respawnTimer <= 0) {
                    this.respawnCamp(camp);
                }
            }
        }
    }

    // ---- AGGRO: Detect nearby enemies and attack ----
    private updateCampAggro(camp: CreepCamp): void {
        const data = CREEP_CAMP_DATA[camp.type];
        const aggroDist = data.aggroRange * TILE_SIZE;
        const leashDist = data.leashRange * TILE_SIZE;

        for (const creep of camp.units) {
            if (!creep.alive) continue;
            // Skip if already fighting a live target
            if (creep.state === UnitState.Attacking && creep.attackTarget?.alive) continue;

            // Skip aggro if creep is far from camp (returning / leashing)
            const distFromCamp = Math.hypot(creep.x - camp.x, creep.y - camp.y);
            if (distFromCamp > leashDist * 0.8) continue;

            // Find nearest enemy within aggro range of the CAMP (not the creep)
            let nearestEnemy: Unit | null = null;
            let nearestDist = aggroDist;

            for (const u of this.entityManager.units) {
                if (!u.alive || u.team === CREEP_TEAM) continue;
                // Measure distance from CAMP center — creeps don't chase enemies that left the area
                const d = Math.hypot(u.x - camp.x, u.y - camp.y);
                if (d < nearestDist) {
                    nearestDist = d;
                    nearestEnemy = u;
                }
            }

            if (nearestEnemy) {
                // Wolf pack behavior: aggro entire pack
                if (camp.type === CreepCampType.WolfDen) {
                    for (const wolf of camp.units) {
                        if (wolf.alive && wolf.state !== UnitState.Attacking) {
                            wolf.attackUnit(nearestEnemy);
                        }
                    }
                    break; // all wolves aggro'd, done
                } else {
                    creep.attackUnit(nearestEnemy);
                }
            }
        }
    }

    // ---- LEASH: Return to camp if chased too far ----
    private updateCampLeash(camp: CreepCamp): void {
        const data = CREEP_CAMP_DATA[camp.type];
        const leashDist = data.leashRange * TILE_SIZE;

        for (const creep of camp.units) {
            if (!creep.alive) continue;

            const distFromCamp = Math.hypot(creep.x - camp.x, creep.y - camp.y);
            if (distFromCamp > leashDist) {
                // Too far from camp — disengage and return
                creep.state = UnitState.Idle;
                creep.attackTarget = null;
                creep.pathWaypoints = [];

                // Move back to camp
                const angle = Math.random() * Math.PI * 2;
                const returnDist = TILE_SIZE * 2;
                creep.moveTo(
                    camp.x + Math.cos(angle) * returnDist,
                    camp.y + Math.sin(angle) * returnDist
                );

                // Heal back to full when returning
                creep.hp = creep.maxHp;
            }
        }
    }

    // ---- CHECK DEATH: All creeps dead → award drops ----
    private checkCampDeath(camp: CreepCamp): void {
        const allDead = camp.units.every(u => !u.alive);
        if (!allDead) return;

        camp.alive = false;
        camp.respawnTimer = CREEP_CAMP_DATA[camp.type].respawnTime;

        // Find the team that killed the last creep (check nearest player/AI units)
        const killerTeam = this.findKillerTeam(camp);
        if (killerTeam !== null) {
            this.awardDrops(camp, killerTeam);
        }
    }

    private findKillerTeam(camp: CreepCamp): number | null {
        // Find the nearest non-creep unit to the camp center
        let nearest: Unit | null = null;
        let nearestDist = Infinity;

        for (const u of this.entityManager.units) {
            if (!u.alive || u.team === CREEP_TEAM) continue;
            const d = Math.hypot(u.x - camp.x, u.y - camp.y);
            if (d < nearestDist) {
                nearestDist = d;
                nearest = u;
            }
        }

        // Only award if someone is within reasonable range
        if (nearest && nearestDist < TILE_SIZE * 20) {
            return nearest.team;
        }
        return null;
    }

    private awardDrops(camp: CreepCamp, team: number): void {
        const data = CREEP_CAMP_DATA[camp.type];

        // Award gold to the team
        const ts = this.entityManager.getTeamState(team);
        if (ts) {
            ts.addResource(ResourceType.Gold, data.dropGold);
        }

        // Award XP to heroes near the camp
        const heroes = this.entityManager.units.filter(
            u => u.alive && u.team === team && u.isHero &&
                Math.hypot(u.x - camp.x, u.y - camp.y) < TILE_SIZE * 15
        );
        if (heroes.length > 0) {
            const xpPerHero = Math.floor(data.dropXP / heroes.length);
            for (const hero of heroes) {
                hero.addHeroXp(xpPerHero);
            }
        }

        // ---- EQUIPMENT DROPS (dragons only) ----
        if (camp.type === CreepCampType.DragonLair || camp.type === CreepCampType.DragonLairEast) {
            const dropTable = camp.type === CreepCampType.DragonLair
                ? DRAGON_WEST_DROP_TABLE
                : DRAGON_EAST_DROP_TABLE;

            // Drop 1-2 random items
            const dropCount = 1 + (Math.random() < 0.4 ? 1 : 0); // 40% chance for 2 items
            const usedIndices = new Set<number>();

            for (let d = 0; d < dropCount; d++) {
                // Pick a random item from drop table (no duplicates)
                let idx: number;
                let attempts = 0;
                do {
                    idx = Math.floor(Math.random() * dropTable.length);
                    attempts++;
                } while (usedIndices.has(idx) && attempts < 10);
                usedIndices.add(idx);

                const itemId = dropTable[idx];
                // Drop near camp center with slight offset
                const angle = Math.random() * Math.PI * 2;
                const dist = 15 + Math.random() * 20;
                const dropX = camp.x + Math.cos(angle) * dist;
                const dropY = camp.y + Math.sin(angle) * dist;

                this.entityManager.droppedItems.push({
                    itemId,
                    x: dropX,
                    y: dropY,
                    team,
                    timer: 120, // 120 seconds to pick up
                });
            }
        }
    }

    // ---- RESPAWN: Recreate camp units ----
    private respawnCamp(camp: CreepCamp): void {
        // Clean up dead unit references
        camp.units = [];
        camp.alive = true;
        camp.respawnTimer = 0;
        this.spawnCampUnits(camp);
    }

    // ===== RENDER CAMP DECORATIONS =====
    renderCamps(ctx: CanvasRenderingContext2D, camX: number, camY: number, vpW: number, vpH: number): void {
        for (const camp of this.camps) {
            // Viewport culling
            if (camp.x < camX - 100 || camp.x > camX + vpW + 100) continue;
            if (camp.y < camY - 100 || camp.y > camY + vpH + 100) continue;

            this.renderCampDecoration(ctx, camp);
        }
    }

    private renderCampDecoration(ctx: CanvasRenderingContext2D, camp: CreepCamp): void {
        const data = CREEP_CAMP_DATA[camp.type];
        const r = data.campRadius * TILE_SIZE;
        const x = camp.x, y = camp.y;
        const t = Date.now() / 1000;

        ctx.save();

        // ---- Dark ambient ground circle ----
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);

        switch (camp.type) {
            case CreepCampType.WolfDen:
                gradient.addColorStop(0, 'rgba(20, 30, 15, 0.45)');
                gradient.addColorStop(0.7, 'rgba(15, 25, 10, 0.25)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                break;
            case CreepCampType.SkeletonTomb:
                gradient.addColorStop(0, 'rgba(10, 20, 10, 0.5)');
                gradient.addColorStop(0.7, 'rgba(8, 15, 8, 0.3)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                break;
            case CreepCampType.OgreCamp:
                gradient.addColorStop(0, 'rgba(30, 20, 10, 0.45)');
                gradient.addColorStop(0.7, 'rgba(25, 15, 8, 0.25)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                break;
            case CreepCampType.DragonLair:
                gradient.addColorStop(0, 'rgba(40, 15, 5, 0.55)');
                gradient.addColorStop(0.7, 'rgba(30, 10, 3, 0.3)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                break;
            case CreepCampType.DragonLairEast:
                gradient.addColorStop(0, 'rgba(15, 10, 40, 0.55)');
                gradient.addColorStop(0.7, 'rgba(10, 5, 30, 0.3)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                break;
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // ---- Per-type decorations ----
        switch (camp.type) {
            case CreepCampType.WolfDen:
                this.drawWolfDen(ctx, x, y, r, t);
                break;
            case CreepCampType.SkeletonTomb:
                this.drawSkeletonTomb(ctx, x, y, r, t);
                break;
            case CreepCampType.OgreCamp:
                this.drawOgreCamp(ctx, x, y, r, t);
                break;
            case CreepCampType.DragonLair:
                this.drawDragonLair(ctx, x, y, r, t);
                break;
            case CreepCampType.DragonLairEast:
                this.drawDragonLairEast(ctx, x, y, r, t);
                break;
        }

        // ---- Respawn indicator ----
        if (!camp.alive) {
            const pulseAlpha = 0.15 + Math.sin(t * 2) * 0.08;
            ctx.fillStyle = `rgba(100, 100, 100, ${pulseAlpha})`;
            ctx.beginPath();
            ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
            ctx.fill();

            // Timer text
            const remaining = Math.ceil(camp.respawnTimer);
            ctx.font = 'bold 8px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
            ctx.fillText(`${remaining}s`, x, y + 3);
        }

        ctx.restore();
    }

    // ---- WOLF DEN DECORATIONS ----
    private drawWolfDen(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number): void {
        // ===== CAVE ENTRANCE (main feature) =====
        const caveX = x - r * 0.15;
        const caveY = y - r * 0.2;

        // Rocky hill / cliff behind cave
        ctx.fillStyle = '#3a3530';
        ctx.beginPath();
        ctx.moveTo(caveX - 22, caveY + 10);
        ctx.quadraticCurveTo(caveX - 20, caveY - 18, caveX - 8, caveY - 22);
        ctx.quadraticCurveTo(caveX, caveY - 28, caveX + 10, caveY - 22);
        ctx.quadraticCurveTo(caveX + 22, caveY - 16, caveX + 24, caveY + 10);
        ctx.closePath();
        ctx.fill();

        // Rock texture / layers
        ctx.fillStyle = '#2e2a25';
        ctx.beginPath();
        ctx.moveTo(caveX - 18, caveY + 5);
        ctx.quadraticCurveTo(caveX - 14, caveY - 14, caveX - 5, caveY - 18);
        ctx.quadraticCurveTo(caveX + 5, caveY - 22, caveX + 12, caveY - 16);
        ctx.quadraticCurveTo(caveX + 20, caveY - 10, caveX + 20, caveY + 5);
        ctx.closePath();
        ctx.fill();

        // Moss on rocks
        ctx.fillStyle = '#2a4a20';
        ctx.beginPath();
        ctx.ellipse(caveX - 14, caveY - 14, 5, 2, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(caveX + 14, caveY - 10, 4, 2, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Cave opening (dark arch)
        ctx.fillStyle = '#0a0805';
        ctx.beginPath();
        ctx.moveTo(caveX - 12, caveY + 10);
        ctx.quadraticCurveTo(caveX - 12, caveY - 6, caveX, caveY - 10);
        ctx.quadraticCurveTo(caveX + 12, caveY - 6, caveX + 12, caveY + 10);
        ctx.closePath();
        ctx.fill();

        // Cave depth gradient (darker inside)
        const caveGrad = ctx.createRadialGradient(caveX, caveY, 0, caveX, caveY, 12);
        caveGrad.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        caveGrad.addColorStop(0.6, 'rgba(5, 3, 2, 0.5)');
        caveGrad.addColorStop(1, 'rgba(10, 8, 5, 0)');
        ctx.fillStyle = caveGrad;
        ctx.beginPath();
        ctx.moveTo(caveX - 10, caveY + 8);
        ctx.quadraticCurveTo(caveX - 10, caveY - 4, caveX, caveY - 8);
        ctx.quadraticCurveTo(caveX + 10, caveY - 4, caveX + 10, caveY + 8);
        ctx.closePath();
        ctx.fill();

        // Glowing eyes peeking from inside (animated blink)
        const blinkCycle = (t * 0.5) % 4;
        if (blinkCycle > 0.3) { // eyes visible most of the time
            const eyeBright = 0.5 + Math.sin(t * 2) * 0.2;
            ctx.fillStyle = `rgba(255, 20, 10, ${eyeBright})`;
            ctx.fillRect(caveX - 4, caveY - 1, 1.5, 1);
            ctx.fillRect(caveX - 1, caveY - 1, 1.5, 1);
            // Eye glow
            ctx.fillStyle = `rgba(255, 30, 10, ${eyeBright * 0.2})`;
            ctx.beginPath();
            ctx.arc(caveX - 2, caveY - 0.5, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Stone arch details (lighter rock edges)
        ctx.strokeStyle = '#4a4540';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(caveX - 13, caveY + 10);
        ctx.quadraticCurveTo(caveX - 13, caveY - 6, caveX, caveY - 11);
        ctx.quadraticCurveTo(caveX + 13, caveY - 6, caveX + 13, caveY + 10);
        ctx.stroke();

        // Loose rocks around entrance
        ctx.fillStyle = '#4a4540';
        ctx.fillRect(caveX - 15, caveY + 6, 5, 3);
        ctx.fillRect(caveX + 11, caveY + 4, 4, 4);
        ctx.fillStyle = '#3a3530';
        ctx.fillRect(caveX - 16, caveY + 8, 3, 2);
        ctx.fillRect(caveX + 13, caveY + 7, 3, 2);
        ctx.fillRect(caveX - 8, caveY + 9, 4, 2);
        ctx.fillRect(caveX + 6, caveY + 9, 3, 2);

        // Claw marks on rock (territorial)
        ctx.strokeStyle = 'rgba(80, 70, 60, 0.6)';
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(caveX + 14 + i * 1.5, caveY - 8);
            ctx.lineTo(caveX + 15 + i * 1.5, caveY - 2);
            ctx.stroke();
        }

        // ===== DIRT PATH from cave =====
        ctx.fillStyle = 'rgba(60, 45, 30, 0.2)';
        ctx.beginPath();
        ctx.ellipse(caveX, caveY + 15, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Paw prints on dirt path
        ctx.fillStyle = 'rgba(40, 30, 20, 0.25)';
        for (let i = 0; i < 4; i++) {
            const px = caveX + 3 + i * 6 + Math.sin(i * 2) * 3;
            const py = caveY + 12 + i * 4;
            // Main pad
            ctx.beginPath();
            ctx.ellipse(px, py, 1.5, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            // Toe pads
            ctx.beginPath(); ctx.arc(px - 1.2, py - 1.8, 0.6, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(px + 1.2, py - 1.8, 0.6, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(px, py - 2.2, 0.5, 0, Math.PI * 2); ctx.fill();
        }

        // ===== Twisted dark trees (fewer, around cave) =====
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2 + 1.2;
            const dist = r * 0.75;
            const tx = x + Math.cos(angle) * dist;
            const ty = y + Math.sin(angle) * dist;

            // Trunk
            ctx.fillStyle = '#2a1a0a';
            ctx.fillRect(tx - 2, ty - 12, 4, 16);
            // Twisted branches
            ctx.strokeStyle = '#1a0f05';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(tx, ty - 12);
            ctx.quadraticCurveTo(tx + 7 * Math.sin(i), ty - 18, tx + 10 * Math.sin(i + 1), ty - 15);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(tx, ty - 9);
            ctx.quadraticCurveTo(tx - 6 * Math.cos(i), ty - 15, tx - 8, ty - 13);
            ctx.stroke();
            // Dead leaves
            ctx.fillStyle = '#1a2a0a';
            ctx.beginPath();
            ctx.arc(tx + 8 * Math.sin(i + 1), ty - 15, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // ===== Scattered prey bones =====
        ctx.fillStyle = '#c8c0b0';
        for (let i = 0; i < 6; i++) {
            const bx = x + Math.cos(i * 1.1 + 0.5) * r * 0.45;
            const by = y + Math.sin(i * 1.5 + 0.8) * r * 0.4;
            // Bone shaft
            ctx.fillRect(bx, by, 5, 1);
            // Bone knobs
            ctx.beginPath();
            ctx.arc(bx, by + 0.5, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(bx + 5, by + 0.5, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        // Skull (prey)
        ctx.fillStyle = '#d0c8b8';
        ctx.beginPath();
        ctx.ellipse(x + r * 0.3, y + r * 0.25, 3, 2.5, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x + r * 0.3 - 1.5, y + r * 0.25 - 1, 0.8, 0.8);
        ctx.fillRect(x + r * 0.3 + 0.5, y + r * 0.25 - 1, 0.8, 0.8);

        // ===== Glowing mushrooms =====
        for (let i = 0; i < 4; i++) {
            const mx = x + Math.cos(i * 1.7 + 1) * r * 0.55;
            const my = y + Math.sin(i * 2.1 + 0.5) * r * 0.5;
            const glow = 0.35 + Math.sin(t * 2 + i) * 0.2;
            // Mushroom glow aura
            ctx.fillStyle = `rgba(60, 220, 100, ${glow * 0.15})`;
            ctx.beginPath();
            ctx.arc(mx, my, 5, 0, Math.PI * 2);
            ctx.fill();
            // Cap
            ctx.fillStyle = `rgba(80, 255, 120, ${glow})`;
            ctx.beginPath();
            ctx.ellipse(mx, my - 1, 2.5, 1.5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Stem
            ctx.fillStyle = '#3a2a1a';
            ctx.fillRect(mx - 0.5, my, 1, 3);
        }

        // ===== Fog wisps (animated, creepy) =====
        for (let i = 0; i < 4; i++) {
            const fx = x + Math.cos(t * 0.2 + i * 1.5) * r * 0.6;
            const fy = y + Math.sin(t * 0.15 + i * 2) * r * 0.45;
            const fogAlpha = 0.06 + Math.sin(t * 0.8 + i) * 0.03;
            ctx.fillStyle = `rgba(150, 170, 150, ${fogAlpha})`;
            ctx.beginPath();
            ctx.ellipse(fx, fy, 15, 5, t * 0.05 + i, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ---- SKELETON TOMB DECORATIONS ----
    private drawSkeletonTomb(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number): void {
        // ===== CURSED GROUND =====
        ctx.fillStyle = 'rgba(10, 15, 10, 0.25)';
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.7, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // ===== CRUMBLING STONE CRYPT WALLS =====
        // Left wall (taller, cracked)
        ctx.fillStyle = '#3a3a42';
        ctx.fillRect(x - r * 0.52, y - r * 0.45, r * 0.12, r * 0.85);
        ctx.fillStyle = '#2a2a32';
        ctx.fillRect(x - r * 0.52, y - r * 0.45, r * 0.12, r * 0.08);
        // Cracks
        ctx.strokeStyle = 'rgba(20, 20, 25, 0.5)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.48, y - r * 0.3);
        ctx.lineTo(x - r * 0.45, y - r * 0.15);
        ctx.lineTo(x - r * 0.47, y);
        ctx.stroke();
        // Moss
        ctx.fillStyle = '#1a3a15';
        ctx.fillRect(x - r * 0.51, y + r * 0.2, r * 0.08, 3);

        // Right wall
        ctx.fillStyle = '#3a3a42';
        ctx.fillRect(x + r * 0.4, y - r * 0.45, r * 0.12, r * 0.85);
        ctx.fillStyle = '#2a2a32';
        ctx.fillRect(x + r * 0.4, y - r * 0.45, r * 0.12, r * 0.08);
        ctx.strokeStyle = 'rgba(20, 20, 25, 0.5)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.44, y - r * 0.2);
        ctx.lineTo(x + r * 0.46, y + 0.05);
        ctx.stroke();

        // Top lintel (crumbling)
        ctx.fillStyle = '#3a3a42';
        ctx.fillRect(x - r * 0.52, y - r * 0.45, r * 1.04, r * 0.08);
        // Broken chunks
        ctx.fillStyle = '#4a4a52';
        ctx.fillRect(x - r * 0.1, y - r * 0.5, 4, 3);
        ctx.fillRect(x + r * 0.15, y - r * 0.48, 3, 2);

        // ===== RUSTY IRON GATE (bent, broken) =====
        ctx.strokeStyle = '#4a3a30';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) {
            const gx = x - r * 0.3 + i * r * 0.15;
            const bend = i === 2 ? 3 : i === 3 ? -2 : 0; // bent bars
            ctx.beginPath();
            ctx.moveTo(gx, y - r * 0.42);
            ctx.quadraticCurveTo(gx + bend, y, gx, y + r * 0.35);
            ctx.stroke();
        }
        // Horizontal bar
        ctx.strokeStyle = '#3a2a20';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.35, y - r * 0.15);
        ctx.lineTo(x + r * 0.35, y - r * 0.15);
        ctx.stroke();

        // ===== OPEN COFFINS =====
        for (let i = 0; i < 2; i++) {
            const cx = x + (i === 0 ? -r * 0.35 : r * 0.25);
            const cy = y + r * 0.15;
            const angle = i === 0 ? -0.3 : 0.2;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);
            // Coffin body
            ctx.fillStyle = '#2a2220';
            ctx.fillRect(-4, -2, 8, 12);
            // Coffin lid (open, leaning)
            ctx.fillStyle = '#3a3230';
            ctx.fillRect(-5, -3, 3, 13);
            // Skeleton remains inside
            ctx.fillStyle = '#a09880';
            ctx.beginPath(); ctx.arc(0, 1, 2, 0, Math.PI * 2); ctx.fill(); // skull
            ctx.fillStyle = '#8a8070';
            ctx.fillRect(-1, 3, 2, 5); // body
            ctx.restore();
        }

        // ===== NECROMANTIC ALTAR (center) =====
        ctx.fillStyle = '#2a2530';
        ctx.fillRect(x - 6, y - r * 0.12, 12, 8);
        ctx.fillStyle = '#3a3540';
        ctx.fillRect(x - 7, y - r * 0.15, 14, 3);
        // Glowing green rune circle
        const runeGlow = 0.2 + Math.sin(t * 1.5) * 0.12;
        ctx.strokeStyle = `rgba(40, 200, 60, ${runeGlow})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(x, y - r * 0.04, r * 0.18, 0, Math.PI * 2);
        ctx.stroke();
        // Inner pentagram
        ctx.strokeStyle = `rgba(50, 220, 80, ${runeGlow * 0.7})`;
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 5; i++) {
            const a1 = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const a2 = ((i + 2) / 5) * Math.PI * 2 - Math.PI / 2;
            const pr = r * 0.16;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(a1) * pr, y - r * 0.04 + Math.sin(a1) * pr);
            ctx.lineTo(x + Math.cos(a2) * pr, y - r * 0.04 + Math.sin(a2) * pr);
            ctx.stroke();
        }
        // Altar glow
        ctx.fillStyle = `rgba(30, 150, 40, ${runeGlow * 0.08})`;
        ctx.beginPath();
        ctx.arc(x, y - r * 0.04, r * 0.22, 0, Math.PI * 2);
        ctx.fill();

        // ===== GREEN SOUL-FIRE TORCHES =====
        for (let i = 0; i < 2; i++) {
            const tx = x + (i === 0 ? -r * 0.48 : r * 0.45);
            const ty = y - r * 0.12;

            // Torch bracket
            ctx.fillStyle = '#3a3530';
            ctx.fillRect(tx - 1, ty, 2, 8);
            // Green flame
            const flicker = Math.sin(t * 10 + i * 4) * 1.5;
            const flameH = 5 + Math.sin(t * 14 + i * 2) * 2;
            ctx.fillStyle = `rgba(40, 200, 60, 0.7)`;
            ctx.beginPath();
            ctx.ellipse(tx, ty - 2 + flicker * 0.3, 3, flameH, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(100, 255, 120, 0.5)`;
            ctx.beginPath();
            ctx.ellipse(tx, ty - 2 + flicker * 0.3, 1.5, flameH * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Torch glow
            ctx.fillStyle = `rgba(40, 180, 60, ${0.04 + Math.sin(t * 6 + i) * 0.02})`;
            ctx.beginPath();
            ctx.arc(tx, ty - 2, 18, 0, Math.PI * 2);
            ctx.fill();
        }

        // ===== COBWEBS (thick, old) =====
        ctx.strokeStyle = 'rgba(180, 180, 190, 0.15)';
        ctx.lineWidth = 0.4;
        for (let i = 0; i < 4; i++) {
            const cx = x - r * 0.4 + i * r * 0.25;
            const cy = y - r * 0.4;
            for (let j = 0; j < 3; j++) {
                const angle = -0.3 + j * 0.4;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.quadraticCurveTo(cx + Math.cos(angle) * 8, cy + 6, cx + Math.cos(angle) * 14, cy + 14);
                ctx.stroke();
            }
        }

        // ===== SCATTERED SKULLS AND BONES =====
        ctx.fillStyle = '#b0a890';
        for (let i = 0; i < 5; i++) {
            const bx = x + Math.cos(i * 1.4 + 0.8) * r * 0.35;
            const by = y + Math.sin(i * 1.8 + 0.5) * r * 0.3;
            ctx.fillRect(bx, by, 4, 0.8);
            ctx.beginPath(); ctx.arc(bx, by + 0.4, 0.7, 0, Math.PI * 2); ctx.fill();
        }
        // Mini skulls
        ctx.fillStyle = '#c0b8a0';
        for (let i = 0; i < 3; i++) {
            const sx = x + Math.cos(i * 2.1 + 1.5) * r * 0.3;
            const sy = y + Math.sin(i * 2.5 + 0.8) * r * 0.25;
            ctx.beginPath(); ctx.arc(sx, sy, 1.8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#1a1818';
            ctx.fillRect(sx - 0.8, sy - 0.4, 0.5, 0.5);
            ctx.fillRect(sx + 0.3, sy - 0.4, 0.5, 0.5);
            ctx.fillStyle = '#c0b8a0';
        }

        // ===== GHOSTLY GREEN WISPS (rising from ground) =====
        for (let i = 0; i < 5; i++) {
            const wx = x + Math.sin(t * 0.4 + i * 1.3) * r * 0.35;
            const wy = y - ((t * 3 + i * 7) % 25);
            const alpha = 0.08 + Math.sin(t * 1.5 + i) * 0.04;
            ctx.fillStyle = `rgba(40, 180, 60, ${alpha})`;
            ctx.beginPath();
            ctx.ellipse(wx, wy, 3 + i * 0.5, 2, t * 0.1 + i, 0, Math.PI * 2);
            ctx.fill();
        }

        // ===== DARK FOG =====
        for (let i = 0; i < 3; i++) {
            const fx = x + Math.cos(t * 0.15 + i * 2) * r * 0.5;
            const fy = y + r * 0.2 + Math.sin(t * 0.2 + i * 1.5) * 3;
            const alpha = 0.05 + Math.sin(t * 0.5 + i) * 0.02;
            ctx.fillStyle = `rgba(15, 20, 15, ${alpha})`;
            ctx.beginPath();
            ctx.ellipse(fx, fy, 18, 5, t * 0.02 + i, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ---- OGRE CAMP DECORATIONS ----
    private drawOgreCamp(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number): void {
        // ===== TRAMPLED MUDDY GROUND =====
        ctx.fillStyle = 'rgba(30, 20, 10, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.7, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Mud patches
        ctx.fillStyle = 'rgba(50, 35, 20, 0.15)';
        for (let i = 0; i < 4; i++) {
            const mx = x + Math.cos(i * 1.6 + 0.3) * r * 0.35;
            const my = y + Math.sin(i * 2.1 + 0.7) * r * 0.25;
            ctx.beginPath();
            ctx.ellipse(mx, my, 6, 3, i * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // ===== CRUDE BONE-AND-HIDE SHELTERS =====
        for (let i = 0; i < 2; i++) {
            const sx = x + (i === 0 ? -r * 0.42 : r * 0.32);
            const sy = y + (i === 0 ? -r * 0.28 : r * 0.18);

            // Bone poles
            ctx.fillStyle = '#b0a890';
            ctx.fillRect(sx - 9, sy, 2.5, 13);
            ctx.fillRect(sx + 7, sy, 2.5, 13);
            // Cross bone
            ctx.fillRect(sx - 6, sy + 2, 13, 1.5);
            // Hide roof (thick, patchy)
            ctx.fillStyle = '#5a4030';
            ctx.beginPath();
            ctx.moveTo(sx - 11, sy + 3);
            ctx.lineTo(sx, sy - 7);
            ctx.lineTo(sx + 11, sy + 3);
            ctx.closePath();
            ctx.fill();
            // Hide patches
            ctx.fillStyle = '#4a3020';
            ctx.fillRect(sx - 5, sy - 3, 4, 4);
            ctx.fillRect(sx + 2, sy - 1, 3, 3);
            // Skull decoration on roof
            ctx.fillStyle = '#c8c0a8';
            ctx.beginPath();
            ctx.arc(sx, sy - 5, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1a1515';
            ctx.fillRect(sx - 0.8, sy - 5.5, 0.5, 0.5);
            ctx.fillRect(sx + 0.3, sy - 5.5, 0.5, 0.5);
        }

        // ===== LARGE TRIBAL BONFIRE =====
        // Fire pit stones
        ctx.fillStyle = '#3a3030';
        for (let i = 0; i < 8; i++) {
            const sa = (i / 8) * Math.PI * 2;
            const sx = x + Math.cos(sa) * 7;
            const sy = y + Math.sin(sa) * 4;
            ctx.beginPath();
            ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
        // Logs
        ctx.fillStyle = '#4a2a10';
        ctx.save();
        ctx.translate(x, y + 2);
        ctx.rotate(0.3);
        ctx.fillRect(-6, 0, 12, 2.5);
        ctx.restore();
        ctx.save();
        ctx.translate(x, y + 2);
        ctx.rotate(-0.4);
        ctx.fillRect(-5, -1, 10, 2.5);
        ctx.restore();

        // Fire flames (large, roaring)
        const flicker = Math.sin(t * 8) * 2;
        // Outer flame
        ctx.fillStyle = '#cc3300';
        ctx.beginPath();
        ctx.ellipse(x, y - 5 + flicker * 0.3, 6, 12 + Math.sin(t * 10) * 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Middle flame
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.ellipse(x, y - 5 + flicker * 0.3, 4, 9 + Math.sin(t * 12) * 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Inner flame
        ctx.fillStyle = '#ffaa22';
        ctx.beginPath();
        ctx.ellipse(x, y - 4, 2.5, 6 + Math.sin(t * 14) * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Core
        ctx.fillStyle = '#ffdd66';
        ctx.beginPath();
        ctx.ellipse(x, y - 3, 1.2, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fire glow
        const glowAlpha = 0.1 + Math.sin(t * 5) * 0.04;
        ctx.fillStyle = `rgba(255, 100, 20, ${glowAlpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 28, 0, Math.PI * 2);
        ctx.fill();

        // Sparks
        for (let i = 0; i < 5; i++) {
            const sx = x + Math.sin(t * 3 + i * 1.5) * 6;
            const sy = y - 12 - ((t * 12 + i * 6) % 20);
            const alpha = 0.4 + Math.sin(t * 5 + i) * 0.2;
            ctx.fillStyle = `rgba(255, ${120 + i * 25}, 20, ${alpha})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
            ctx.fill();
        }

        // ===== MEAT RACK (bone frame with hanging meat) =====
        const rackX = x + r * 0.5;
        const rackY = y - r * 0.15;
        // Frame poles
        ctx.fillStyle = '#b0a890';
        ctx.fillRect(rackX - 6, rackY, 2, 12);
        ctx.fillRect(rackX + 4, rackY, 2, 12);
        ctx.fillRect(rackX - 5, rackY + 1, 11, 1.5);
        // Hanging meat
        ctx.fillStyle = '#8a3020';
        ctx.fillRect(rackX - 3, rackY + 2, 2, 5);
        ctx.fillRect(rackX + 1, rackY + 2, 2, 6);
        // Bone sticking out
        ctx.fillStyle = '#c8c0a8';
        ctx.fillRect(rackX - 3.5, rackY + 4, 0.8, 3);

        // ===== SKULL TOTEMS ON SPIKES =====
        for (let i = 0; i < 3; i++) {
            const tx = x - r * 0.55 + i * r * 0.45;
            const ty = y + r * 0.35;
            // Spike
            ctx.fillStyle = '#6a5030';
            ctx.fillRect(tx - 1, ty - 8, 2, 12);
            // Skull
            ctx.fillStyle = '#c0b8a0';
            ctx.beginPath();
            ctx.arc(tx, ty - 10, 2.5, 0, Math.PI * 2);
            ctx.fill();
            // Skull eyes
            ctx.fillStyle = '#1a1515';
            ctx.fillRect(tx - 1.2, ty - 10.5, 0.7, 0.7);
            ctx.fillRect(tx + 0.5, ty - 10.5, 0.7, 0.7);
        }

        // ===== TRIBAL WAR DRUM =====
        const drumX = x - r * 0.45;
        const drumY = y + r * 0.22;
        ctx.fillStyle = '#5a3a20';
        ctx.beginPath();
        ctx.ellipse(drumX, drumY, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6a4a30';
        ctx.fillRect(drumX - 5, drumY - 6, 10, 6);
        ctx.fillStyle = '#8a6a48';
        ctx.beginPath();
        ctx.ellipse(drumX, drumY - 6, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Leather straps
        ctx.strokeStyle = '#4a3520';
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(drumX - 4, drumY - 5); ctx.lineTo(drumX - 4, drumY - 1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(drumX + 4, drumY - 5); ctx.lineTo(drumX + 4, drumY - 1); ctx.stroke();

        // ===== SCATTERED WEAPONS =====
        ctx.fillStyle = '#4a3020';
        // Club
        ctx.save();
        ctx.translate(x + r * 0.55, y - r * 0.1);
        ctx.rotate(0.6);
        ctx.fillRect(0, 0, 2, 10);
        ctx.fillStyle = '#3a1a08';
        ctx.beginPath(); ctx.ellipse(1, 11, 3, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // Crude axe
        ctx.fillStyle = '#5a4020';
        ctx.save();
        ctx.translate(x - r * 0.3, y + r * 0.35);
        ctx.rotate(-0.5);
        ctx.fillRect(0, 0, 1.5, 8);
        ctx.fillStyle = '#6a6a72';
        ctx.beginPath();
        ctx.moveTo(-1, 0); ctx.lineTo(-3, -1); ctx.lineTo(-1, 2); ctx.fill();
        ctx.restore();

        // ===== LOOT PILE =====
        ctx.fillStyle = '#c8a030';
        for (let i = 0; i < 5; i++) {
            const lx = x + r * 0.2 + Math.cos(i * 1.3) * 5;
            const ly = y + r * 0.3 + Math.sin(i * 1.7) * 3;
            ctx.fillRect(lx, ly, 3, 2);
        }
        // Goblet
        ctx.fillStyle = '#a08030';
        ctx.fillRect(x + r * 0.22, y + r * 0.28, 2, 3);

        // ===== THICK SMOKE =====
        for (let i = 0; i < 4; i++) {
            const sx = x + Math.sin(t * 0.25 + i * 1.5) * r * 0.2;
            const sy = y - 15 - ((t * 4 + i * 9) % 30);
            const smokeSize = 4 + ((t * 4 + i * 9) % 30) * 0.25;
            const alpha = 0.06 + Math.sin(t * 0.4 + i) * 0.025;
            ctx.fillStyle = `rgba(40, 30, 20, ${alpha})`;
            ctx.beginPath();
            ctx.ellipse(sx, sy, smokeSize, smokeSize * 0.5, t * 0.02 + i, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ---- DRAGON LAIR DECORATIONS ----
    private drawDragonLair(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number): void {
        // ===== SCORCHED EARTH (dark, charred ground) =====
        ctx.fillStyle = 'rgba(15, 5, 3, 0.35)';
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.75, r * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ash patches
        ctx.fillStyle = 'rgba(30, 25, 22, 0.2)';
        for (let i = 0; i < 5; i++) {
            const ax = x + Math.cos(i * 1.3 + 0.5) * r * 0.4;
            const ay = y + Math.sin(i * 1.7 + 0.3) * r * 0.3;
            ctx.beginPath();
            ctx.ellipse(ax, ay, 8, 4, i * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // ===== LAVA VEINS IN GROUND (glowing cracks) =====
        const lavaGlow = 0.3 + Math.sin(t * 1.5) * 0.15;
        ctx.strokeStyle = `rgba(255, 50, 10, ${lavaGlow})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + 0.3;
            const cx1 = x + Math.cos(angle) * r * 0.08;
            const cy1 = y + Math.sin(angle) * r * 0.06;
            const cx2 = x + Math.cos(angle) * r * 0.5;
            const cy2 = y + Math.sin(angle) * r * 0.35;
            ctx.beginPath();
            ctx.moveTo(cx1, cy1);
            ctx.quadraticCurveTo(
                cx1 + (cx2 - cx1) * 0.5 + Math.sin(i * 2.3) * 6,
                cy1 + (cy2 - cy1) * 0.5 + Math.cos(i * 1.7) * 4,
                cx2, cy2
            );
            ctx.stroke();
        }
        // Central lava glow
        ctx.fillStyle = `rgba(255, 40, 5, ${lavaGlow * 0.15})`;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // ===== JAGGED OBSIDIAN ROCKS =====
        for (let i = 0; i < 7; i++) {
            const angle = (i / 7) * Math.PI * 2 + 0.2;
            const dist = r * (0.5 + Math.sin(i * 2.7) * 0.15);
            const rx = x + Math.cos(angle) * dist;
            const ry = y + Math.sin(angle) * dist;
            const rH = 5 + (i % 3) * 4;

            // Rock body (dark, jagged)
            ctx.fillStyle = '#1a1215';
            ctx.beginPath();
            ctx.moveTo(rx - 4, ry + 2);
            ctx.lineTo(rx - 2, ry - rH);
            ctx.lineTo(rx + 1, ry - rH + 2);
            ctx.lineTo(rx + 4, ry - rH - 1);
            ctx.lineTo(rx + 5, ry + 2);
            ctx.closePath();
            ctx.fill();

            // Lava glow on rock base
            ctx.fillStyle = `rgba(200, 40, 5, ${0.1 + Math.sin(t * 2 + i) * 0.05})`;
            ctx.fillRect(rx - 4, ry, 9, 2);
        }

        // ===== BUBBLING LAVA POOL =====
        ctx.fillStyle = 'rgba(60, 10, 0, 0.6)';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.2, y + r * 0.1, r * 0.22, r * 0.1, -0.2, 0, Math.PI * 2);
        ctx.fill();
        // Lava surface
        const lavaShimmer = 0.4 + Math.sin(t * 2) * 0.15;
        ctx.fillStyle = `rgba(255, 60, 10, ${lavaShimmer})`;
        ctx.beginPath();
        ctx.ellipse(x - r * 0.2, y + r * 0.1, r * 0.15, r * 0.06, -0.2, 0, Math.PI * 2);
        ctx.fill();
        // Bright center
        ctx.fillStyle = `rgba(255, 150, 30, ${lavaShimmer * 0.6})`;
        ctx.beginPath();
        ctx.ellipse(x - r * 0.2, y + r * 0.1, r * 0.08, r * 0.03, -0.2, 0, Math.PI * 2);
        ctx.fill();
        // Lava bubbles
        for (let i = 0; i < 3; i++) {
            const bp = (t * 1.2 + i * 2.5) % 3;
            if (bp < 1.5) {
                const ba = 0.3 * (1 - bp / 1.5);
                ctx.fillStyle = `rgba(255, 80, 10, ${ba})`;
                ctx.beginPath();
                ctx.arc(x - r * 0.2 + Math.sin(i * 3) * 5, y + r * 0.1 - bp * 2, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // ===== MASSIVE DRAGON SKULL (trophy, ancient) =====
        const skullX = x + r * 0.15;
        const skullY = y - r * 0.15;
        // Skull base
        ctx.fillStyle = '#4a4540';
        ctx.beginPath();
        ctx.ellipse(skullX, skullY, 7, 5, 0.1, 0, Math.PI * 2);
        ctx.fill();
        // Snout
        ctx.fillStyle = '#3a3530';
        ctx.beginPath();
        ctx.moveTo(skullX + 5, skullY - 2);
        ctx.lineTo(skullX + 12, skullY - 1);
        ctx.lineTo(skullX + 12, skullY + 1);
        ctx.lineTo(skullX + 5, skullY + 2);
        ctx.closePath();
        ctx.fill();
        // Horns
        ctx.fillStyle = '#3a3020';
        ctx.beginPath(); ctx.moveTo(skullX - 3, skullY - 4); ctx.lineTo(skullX - 6, skullY - 10); ctx.lineTo(skullX - 1, skullY - 5); ctx.fill();
        ctx.beginPath(); ctx.moveTo(skullX + 3, skullY - 4); ctx.lineTo(skullX + 6, skullY - 10); ctx.lineTo(skullX + 1, skullY - 5); ctx.fill();
        // Empty eye sockets (faint red glow)
        const skullGlow = 0.15 + Math.sin(t * 1.5) * 0.1;
        ctx.fillStyle = `rgba(255, 30, 5, ${skullGlow})`;
        ctx.beginPath(); ctx.arc(skullX - 2, skullY - 1, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(skullX + 3, skullY - 1, 1.5, 0, Math.PI * 2); ctx.fill();
        // Teeth
        ctx.fillStyle = '#c0b8a0';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(skullX + 6 + i * 1.5, skullY + 1, 0.8, 2);
        }

        // ===== BONE PILES (fallen warriors) =====
        ctx.fillStyle = '#b0a890';
        for (let i = 0; i < 6; i++) {
            const bx = x + Math.cos(i * 1.1 + 2) * r * 0.4;
            const by = y + Math.sin(i * 1.5 + 1) * r * 0.3;
            ctx.fillRect(bx, by, 5, 1);
            ctx.beginPath(); ctx.arc(bx, by + 0.5, 1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(bx + 5, by + 0.5, 1, 0, Math.PI * 2); ctx.fill();
        }
        // Ribcage
        ctx.strokeStyle = '#a09880';
        ctx.lineWidth = 0.6;
        const ribX = x - r * 0.3;
        const ribY = y + r * 0.2;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.ellipse(ribX, ribY + i * 1.5, 4, 1.5, 0, 0, Math.PI);
            ctx.stroke();
        }
        // Human skull
        ctx.fillStyle = '#c8c0b0';
        ctx.beginPath(); ctx.arc(x + r * 0.35, y + r * 0.3, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a1515';
        ctx.fillRect(x + r * 0.35 - 1.2, y + r * 0.3 - 0.5, 0.8, 0.8);
        ctx.fillRect(x + r * 0.35 + 0.4, y + r * 0.3 - 0.5, 0.8, 0.8);

        // Ancient weapons (broken swords, shields)
        ctx.fillStyle = '#5a5560';
        // Broken sword
        ctx.save();
        ctx.translate(x - r * 0.35, y + r * 0.15);
        ctx.rotate(-0.4);
        ctx.fillRect(0, 0, 1.5, 10);
        ctx.fillRect(-1.5, 8, 4.5, 1.5);
        ctx.restore();
        // Shield (dented)
        ctx.fillStyle = '#4a4540';
        ctx.beginPath();
        ctx.ellipse(x + r * 0.4, y - r * 0.1, 4, 5, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3a3530';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.4 - 2, y - r * 0.1);
        ctx.lineTo(x + r * 0.4 + 2, y - r * 0.1);
        ctx.stroke();

        // ===== CHARRED DEAD TREES =====
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2 + 0.8;
            const tx = x + Math.cos(angle) * r * 0.65;
            const ty = y + Math.sin(angle) * r * 0.45;

            ctx.fillStyle = '#0f0808';
            ctx.fillRect(tx - 2, ty - 16, 4, 20);
            // Charred branches
            ctx.strokeStyle = '#0a0505';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(tx, ty - 16);
            ctx.quadraticCurveTo(tx + 7, ty - 22, tx + 10, ty - 19);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(tx, ty - 12);
            ctx.quadraticCurveTo(tx - 6, ty - 18, tx - 9, ty - 16);
            ctx.stroke();
            // Ember glow on trunk
            const emberGlow = 0.1 + Math.sin(t * 2 + i * 2) * 0.06;
            ctx.fillStyle = `rgba(255, 60, 10, ${emberGlow})`;
            ctx.fillRect(tx - 1, ty - 8, 2, 3);
        }

        // ===== THICK DARK SMOKE COLUMNS =====
        for (let i = 0; i < 5; i++) {
            const sx = x + Math.sin(t * 0.3 + i * 1.3) * r * 0.25;
            const sy = y - 8 - ((t * 5 + i * 8) % 35);
            const smokeSize = 5 + ((t * 5 + i * 8) % 35) * 0.3;
            const alpha = 0.08 + Math.sin(t * 0.5 + i) * 0.03;
            ctx.fillStyle = `rgba(20, 15, 12, ${alpha})`;
            ctx.beginPath();
            ctx.ellipse(sx, sy, smokeSize, smokeSize * 0.5, t * 0.03 + i, 0, Math.PI * 2);
            ctx.fill();
        }

        // ===== EMBER / FIRE PARTICLES =====
        for (let i = 0; i < 7; i++) {
            const fx = x + Math.cos(t * 1.2 + i * 0.9) * r * 0.3;
            const fy = y - 3 - ((t * 10 + i * 5) % 28);
            const alpha = 0.25 + Math.sin(t * 3 + i * 1.5) * 0.15;
            ctx.fillStyle = `rgba(255, ${50 + i * 20}, 5, ${alpha})`;
            ctx.beginPath();
            ctx.arc(fx, fy, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        // ===== DOOM AURA (pulsing red glow) =====
        const doomPulse = 0.03 + Math.sin(t * 1) * 0.015;
        ctx.fillStyle = `rgba(200, 20, 0, ${doomPulse})`;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }

    // ---- EASTERN DRAGON LAIR — Cursed storm temple ruins ----
    private drawDragonLairEast(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number): void {
        // ===== SCORCHED / CRACKED GROUND =====
        ctx.fillStyle = 'rgba(15, 10, 25, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.7, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lightning fissures in ground (glowing cracks)
        const crackGlow = 0.2 + Math.sin(t * 2.5) * 0.15;
        ctx.strokeStyle = `rgba(100, 150, 255, ${crackGlow})`;
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + 0.4;
            const cx1 = x + Math.cos(angle) * r * 0.1;
            const cy1 = y + Math.sin(angle) * r * 0.08;
            const cx2 = x + Math.cos(angle) * r * 0.5;
            const cy2 = y + Math.sin(angle) * r * 0.35;
            ctx.beginPath();
            ctx.moveTo(cx1, cy1);
            ctx.quadraticCurveTo(
                cx1 + (cx2 - cx1) * 0.5 + Math.sin(i * 2) * 5,
                cy1 + (cy2 - cy1) * 0.5 + Math.cos(i * 3) * 3,
                cx2, cy2
            );
            ctx.stroke();
        }
        // Crack glow spots
        ctx.fillStyle = `rgba(80, 120, 255, ${crackGlow * 0.3})`;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        // ===== RUINED STONE PILLARS (broken, ancient) =====
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + 0.5;
            const px = x + Math.cos(angle) * r * 0.55;
            const py = y + Math.sin(angle) * r * 0.4;
            const pillarH = 12 + (i % 2) * 6; // varying heights (broken)

            // Pillar base
            ctx.fillStyle = '#2a2530';
            ctx.fillRect(px - 3, py, 6, 3);

            // Pillar body
            ctx.fillStyle = '#3a3540';
            ctx.fillRect(px - 2.5, py - pillarH, 5, pillarH);

            // Cracks on pillar
            ctx.strokeStyle = 'rgba(50, 40, 60, 0.6)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(px - 1, py - pillarH);
            ctx.lineTo(px, py - pillarH + 4);
            ctx.lineTo(px + 1, py - pillarH + 2);
            ctx.stroke();

            // Broken top (jagged)
            ctx.fillStyle = '#4a4550';
            ctx.beginPath();
            ctx.moveTo(px - 3, py - pillarH);
            ctx.lineTo(px - 1, py - pillarH - 3);
            ctx.lineTo(px + 1, py - pillarH - 1);
            ctx.lineTo(px + 3, py - pillarH - 2);
            ctx.lineTo(px + 3, py - pillarH);
            ctx.closePath();
            ctx.fill();

            // Glowing rune on pillar
            const runeGlow = 0.15 + Math.sin(t * 1.5 + i * 1.5) * 0.1;
            ctx.fillStyle = `rgba(120, 80, 255, ${runeGlow})`;
            ctx.fillRect(px - 1, py - pillarH + 5, 2, 3);
            ctx.fillRect(px - 0.5, py - pillarH + 3, 1, 1.5);
        }

        // ===== SHATTERED TORII GATE (center, broken) =====
        // Left pillar (intact but weathered)
        ctx.fillStyle = '#5a1515';
        ctx.fillRect(x - r * 0.2, y - r * 0.35, 3, r * 0.5);
        // Right pillar (broken, tilted)
        ctx.save();
        ctx.translate(x + r * 0.18, y - r * 0.1);
        ctx.rotate(0.15);
        ctx.fillStyle = '#4a1010';
        ctx.fillRect(0, -r * 0.25, 3, r * 0.3);
        ctx.restore();
        // Broken top beam (hanging, cracked)
        ctx.fillStyle = '#6a1818';
        ctx.save();
        ctx.translate(x - r * 0.22, y - r * 0.36);
        ctx.rotate(-0.08);
        ctx.fillRect(0, 0, r * 0.3, 2.5);
        ctx.restore();
        // Glowing cracks on gate
        ctx.strokeStyle = `rgba(255, 60, 20, ${0.2 + Math.sin(t * 2) * 0.1})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.19, y - r * 0.2);
        ctx.lineTo(x - r * 0.18, y - r * 0.1);
        ctx.stroke();

        // ===== CURSED BLOOD POOL =====
        ctx.fillStyle = 'rgba(40, 5, 10, 0.5)';
        ctx.beginPath();
        ctx.ellipse(x + r * 0.15, y + r * 0.15, r * 0.25, r * 0.12, 0.2, 0, Math.PI * 2);
        ctx.fill();
        // Blood pool shimmer
        const bloodShimmer = 0.15 + Math.sin(t * 1.5) * 0.08;
        ctx.fillStyle = `rgba(120, 10, 20, ${bloodShimmer})`;
        ctx.beginPath();
        ctx.ellipse(x + r * 0.15 + Math.sin(t * 0.7) * 3, y + r * 0.15, 5, 2, t * 0.2, 0, Math.PI * 2);
        ctx.fill();
        // Bubbles
        for (let i = 0; i < 2; i++) {
            const bphase = (t * 1.5 + i * 3) % 4;
            if (bphase < 1.5) {
                const ba = 0.2 * (1 - bphase / 1.5);
                ctx.fillStyle = `rgba(80, 10, 15, ${ba})`;
                ctx.beginPath();
                ctx.arc(x + r * 0.12 + i * 6, y + r * 0.14 - bphase * 2, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // ===== DEAD TWISTED TREES =====
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2 + 1.8;
            const tx = x + Math.cos(angle) * r * 0.65;
            const ty = y + Math.sin(angle) * r * 0.45;

            ctx.fillStyle = '#1a1018';
            ctx.fillRect(tx - 1.5, ty - 14, 3, 18);
            // Dead branches (gnarled)
            ctx.strokeStyle = '#1a0f15';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(tx, ty - 14);
            ctx.quadraticCurveTo(tx + 6, ty - 20, tx + 9, ty - 18);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(tx, ty - 11);
            ctx.quadraticCurveTo(tx - 5, ty - 17, tx - 8, ty - 15);
            ctx.stroke();
            // Lightning scorch mark on trunk
            ctx.strokeStyle = `rgba(80, 60, 120, 0.3)`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(tx, ty - 12);
            ctx.lineTo(tx + 1, ty - 6);
            ctx.lineTo(tx - 0.5, ty - 2);
            ctx.stroke();
        }

        // ===== DRAGON SKULL TOTEMS (fierce guardians) =====
        for (let side = -1; side <= 1; side += 2) {
            const sx = x + side * r * 0.38;
            const sy = y - r * 0.1;

            // Totem pole
            ctx.fillStyle = '#2a2030';
            ctx.fillRect(sx - 2, sy - 8, 4, 14);

            // Dragon skull on top
            ctx.fillStyle = '#5a5560';
            ctx.beginPath();
            ctx.ellipse(sx, sy - 10, 4, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            // Horns
            ctx.fillStyle = '#4a4050';
            ctx.beginPath();
            ctx.moveTo(sx - 3, sy - 11);
            ctx.lineTo(sx - 5, sy - 16);
            ctx.lineTo(sx - 2, sy - 12);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(sx + 3, sy - 11);
            ctx.lineTo(sx + 5, sy - 16);
            ctx.lineTo(sx + 2, sy - 12);
            ctx.fill();
            // Empty eye sockets (glowing with fury)
            const skullGlow = 0.4 + Math.sin(t * 2 + side * 2) * 0.2;
            ctx.fillStyle = `rgba(150, 80, 255, ${skullGlow})`;
            ctx.fillRect(sx - 2.5, sy - 10.5, 1.5, 1.5);
            ctx.fillRect(sx + 1, sy - 10.5, 1.5, 1.5);
            // Eye glow aura
            ctx.fillStyle = `rgba(120, 60, 255, ${skullGlow * 0.15})`;
            ctx.beginPath();
            ctx.arc(sx, sy - 10, 6, 0, Math.PI * 2);
            ctx.fill();
            // Jaw
            ctx.fillStyle = '#4a4550';
            ctx.fillRect(sx - 2.5, sy - 8, 5, 1.5);
            // Fangs
            ctx.fillStyle = '#c0b8a0';
            ctx.fillRect(sx - 2, sy - 7, 0.8, 1.5);
            ctx.fillRect(sx + 1, sy - 7, 0.8, 1.5);
        }

        // ===== STORM ENERGY (crackling across ground) =====
        for (let i = 0; i < 3; i++) {
            const sparkPhase = (t * 3 + i * 2) % 3;
            if (sparkPhase < 1) {
                const sa = 0.3 * (1 - sparkPhase);
                const sx1 = x + Math.cos(t * 2 + i * 2) * r * 0.3;
                const sy1 = y + Math.sin(t * 1.5 + i * 2.5) * r * 0.2;
                ctx.strokeStyle = `rgba(140, 180, 255, ${sa})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(sx1, sy1);
                ctx.lineTo(sx1 + Math.sin(t * 10 + i) * 8, sy1 + Math.cos(t * 12 + i) * 5);
                ctx.stroke();
            }
        }

        // ===== DARK STORM CLOUDS (overhead, menacing) =====
        for (let i = 0; i < 4; i++) {
            const cx = x + Math.cos(t * 0.2 + i * 1.5) * r * 0.4;
            const cy = y - r * 0.5 + Math.sin(t * 0.3 + i * 2) * 3;
            const alpha = 0.08 + Math.sin(t * 0.6 + i) * 0.04;
            ctx.fillStyle = `rgba(30, 20, 50, ${alpha})`;
            ctx.beginPath();
            ctx.ellipse(cx, cy, 16, 5, t * 0.02 + i, 0, Math.PI * 2);
            ctx.fill();
        }

        // ===== SCATTERED BONE OFFERINGS =====
        ctx.fillStyle = '#8a8590';
        for (let i = 0; i < 4; i++) {
            const bx = x + Math.cos(i * 1.8 + 0.5) * r * 0.35;
            const by = y + Math.sin(i * 2.2 + 1) * r * 0.25;
            ctx.fillRect(bx, by, 4, 1);
            ctx.beginPath();
            ctx.arc(bx, by + 0.5, 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(bx + 4, by + 0.5, 0.8, 0, Math.PI * 2);
            ctx.fill();
        }

        // ===== OMINOUS PURPLE LIGHTNING PARTICLES =====
        for (let i = 0; i < 5; i++) {
            const px = x + Math.cos(t * 0.6 + i * 1.3) * r * 0.5;
            const py = y - 5 + Math.sin(t * 0.8 + i * 1.7) * r * 0.35;
            const alpha = 0.2 + Math.sin(t * 3 + i * 2) * 0.15;
            ctx.fillStyle = `rgba(140, 80, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
