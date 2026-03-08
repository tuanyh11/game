// ============================================================
//  Building — Player/enemy buildings with construction system
// ============================================================

import {
    genId, TILE_SIZE, BuildingType, BUILDING_DATA, UnitType, UNIT_DATA,
    C, ResourceType, TOWER_ATTACK_DATA,
    CivilizationType, CIVILIZATION_DATA
} from "../config/GameConfig";
import { PlayerState } from "../systems/PlayerState";
import { ParticleSystem } from "../effects/ParticleSystem";
import type { Unit } from "./Unit";
import { renderBuilding } from "./building-rendering/BuildingRenderer";

export interface TrainQueueItem { unitType: UnitType; progress: number; time: number; }

// Build times per building type (seconds)
const BUILD_TIMES: Partial<Record<BuildingType, number>> = {
    [BuildingType.House]: 12,
    [BuildingType.Barracks]: 20,
    [BuildingType.Market]: 12,
    [BuildingType.Farm]: 8,
    [BuildingType.TownCenter]: 30,
    [BuildingType.Stable]: 22,
    [BuildingType.Tower]: 15,
    [BuildingType.HeroAltar]: 25,
    [BuildingType.Blacksmith]: 18,
};

export class Building {
    id: number;
    type: BuildingType;
    team: number;
    tileX: number; tileY: number;
    tileW: number; tileH: number;
    x: number; y: number;
    hp: number; maxHp: number;
    built: boolean;
    buildProgress = 0;
    buildTime: number;
    trainQueue: TrainQueueItem[] = [];
    selected = false;
    rallyX: number; rallyY: number;
    age = 1; // Current age affects visuals (1-4)
    alive = true;
    slotColor: string = '';  // custom color from lobby
    civilization: CivilizationType = CivilizationType.LaMa; // faction for this building

    // Age-up visual state (set externally by EntityManager/AIController)
    isUpgrading = false;
    upgradeProgress = 0; // 0-1

    // Construction effect timers
    private dustTimer = 0;
    private hammerTimer = 0;

    // Damage visual timers
    damageFlashTimer = 0;  // screen-flash when hit (public for renderer)
    private fireTimer = 0;         // fire effect when low HP

    // Tower attack
    private towerAttackCooldown = 0;
    towerTarget: Unit | null = null;
    // Tower attack animation state (public for renderer)
    towerAttackAnimTimer = 0;
    towerLastTargetX = 0;
    towerLastTargetY = 0;

    constructor(type: BuildingType, tileX: number, tileY: number, team: number, startBuilt = true) {
        this.id = genId();
        this.type = type;
        this.team = team;
        this.tileX = tileX; this.tileY = tileY;
        const data = BUILDING_DATA[type];
        this.tileW = data.size[0]; this.tileH = data.size[1];
        this.x = (tileX + this.tileW / 2) * TILE_SIZE;
        this.y = (tileY + this.tileH / 2) * TILE_SIZE;
        this.maxHp = data.hp;
        this.built = startBuilt;
        this.buildTime = BUILD_TIMES[type] ?? 15;

        if (startBuilt) {
            this.hp = data.hp;
            this.buildProgress = this.buildTime;
        } else {
            this.hp = Math.floor(data.hp * 0.1); // Start at 10% HP
        }

        this.rallyX = this.x + this.tileW * TILE_SIZE / 2 + 32;
        this.rallyY = this.y + this.tileH * TILE_SIZE / 2 + 32;
    }

    get data() { return BUILDING_DATA[this.type]; }
    get name() { return this.data.name; }
    get popProvided(): number { return this.built ? (this.data.popProvided ?? 0) : 0; }
    get isDropOff(): ResourceType[] | undefined { return this.built ? this.data.isDropOff : undefined; }
    get constructionPct(): number { return Math.min(1, this.buildProgress / this.buildTime); }

    canAcceptResource(resType: ResourceType): boolean {
        if (!this.built) return false;
        return this.data.isDropOff?.includes(resType) ?? false;
    }

    // ---- Construction ----
    /** Advance build; returns true when building completes this frame */
    advanceBuild(dt: number, particles: ParticleSystem): boolean {
        if (this.built) return false;
        this.buildProgress += dt;

        // Increase HP proportionally
        const pct = this.constructionPct;
        this.hp = Math.floor(this.maxHp * (0.1 + 0.9 * pct));

        // Dust effect
        this.dustTimer += dt;
        if (this.dustTimer >= 0.5) {
            this.dustTimer -= 0.5;
            const left = this.tileX * TILE_SIZE;
            const top = this.tileY * TILE_SIZE;
            particles.emitConstructionDust(left, top, this.tileW * TILE_SIZE, this.tileH * TILE_SIZE);
        }

        // Hammer spark effect
        this.hammerTimer += dt;
        if (this.hammerTimer >= 0.7) {
            this.hammerTimer -= 0.7;
            const cx = this.x + (Math.random() - 0.5) * this.tileW * TILE_SIZE * 0.5;
            const cy = this.y + (Math.random() - 0.5) * this.tileH * TILE_SIZE * 0.3;
            particles.emitHammerSpark(cx, cy);
        }

        if (this.buildProgress >= this.buildTime) {
            this.built = true;
            this.hp = this.maxHp;
            // Celebration burst!
            const left = this.tileX * TILE_SIZE;
            const top = this.tileY * TILE_SIZE;
            particles.emitBuildComplete(left, top, this.tileW * TILE_SIZE, this.tileH * TILE_SIZE);
            return true;
        }
        return false;
    }

    /** 
     * Repair building; returns true when building is fully repaired.
     * Consumes resources via spendResources callback (proportional to HP restored).
     */
    repairBuilding(dt: number, particles: ParticleSystem, spendResources: (team: number, cost: Record<string, number>) => boolean, team: number): boolean {
        if (!this.built || this.hp >= this.maxHp) return true; // Already full HP

        // Calculate how much HP to restore this frame based on build speed
        // Repairing usually takes longer than building, let's say 1.5x original build time
        const repairRate = this.maxHp / (this.buildTime * 1.5);
        let hpToRestore = Math.min(repairRate * dt, this.maxHp - this.hp);

        // Calculate cost per HP for each resource type
        const costPerHp: Record<string, number> = {};
        for (const [res, amount] of Object.entries(this.data.cost)) {
            // Repairing costs 50% of the original resource cost to go from 0 to maxHp
            costPerHp[res] = (amount * 0.5) / this.maxHp;
        }

        const costThisFrame: Record<string, number> = {};
        let canAfford = true;
        for (const [res, cps] of Object.entries(costPerHp)) {
            costThisFrame[res] = cps * hpToRestore;
        }

        // Try to spend. If the player doesn't have enough to repair at full speed, 
        // they can't repair right now.
        if (spendResources(team, costThisFrame)) {
            this.hp += hpToRestore;

            // Limit HP
            if (this.hp >= this.maxHp) {
                this.hp = this.maxHp;
                return true; // Finished repairing
            }

            // Hammer spark effect while repairing
            this.hammerTimer += dt;
            if (this.hammerTimer >= 0.7) {
                this.hammerTimer -= 0.7;
                const cx = this.x + (Math.random() - 0.5) * this.tileW * TILE_SIZE * 0.5;
                const cy = this.y + (Math.random() - 0.5) * this.tileH * TILE_SIZE * 0.3;
                particles.emitHammerSpark(cx, cy);
            }
        }

        return false;
    }

    // ---- Training ----
    canTrain(unitType: UnitType, ps: PlayerState, heroExists = false): boolean {
        if (!this.built) return false;
        if (!this.data.trainable?.includes(unitType)) return false;
        const ud = UNIT_DATA[unitType];
        if (ps.age < ud.ageRequired) return false;
        // Hero limit: only 1 hero per team
        const isHeroType = unitType === UnitType.HeroSpartacus || unitType === UnitType.HeroZarathustra || unitType === UnitType.HeroQiJiguang || unitType === UnitType.HeroMusashi || unitType === UnitType.HeroRagnar;
        if (isHeroType && heroExists) return false;

        return ps.canAfford(ud.cost) && ps.hasPopSpace(ps.queuedPopulation || 0);
    }

    addToQueue(unitType: UnitType, ps: PlayerState, trainSpeedMult = 1.0): boolean {
        if (!this.canTrain(unitType, ps)) return false;
        const ud = UNIT_DATA[unitType];
        if (!ps.spend(ud.cost)) return false;
        this.trainQueue.push({ unitType, progress: 0, time: ud.trainTime * trainSpeedMult });
        ps.queuedPopulation = (ps.queuedPopulation || 0) + 1;
        return true;
    }

    update(
        dt: number,
        particles?: ParticleSystem,
        findNearestEnemy?: (x: number, y: number, team: number, range: number) => Unit | null,
    ): UnitType | null {
        // Decay damage flash
        if (this.damageFlashTimer > 0) this.damageFlashTimer -= dt;

        // Fire effect when HP < 30% and built
        if (this.built && this.alive && this.hp < this.maxHp * 0.3 && this.hp > 0 && particles) {
            this.fireTimer += dt;
            if (this.fireTimer >= 0.15) {
                this.fireTimer -= 0.15;
                const left = this.tileX * TILE_SIZE;
                const top = this.tileY * TILE_SIZE;
                particles.emitBuildingFire(left, top, this.tileW * TILE_SIZE, this.tileH * TILE_SIZE);
            }
        }

        // ---- TOWER AUTO-ATTACK ----
        if (this.type === BuildingType.Tower && this.built && this.alive && findNearestEnemy && particles) {
            this.updateTowerAttack(dt, particles, findNearestEnemy);
        }

        if (!this.built) return null;
        if (this.trainQueue.length === 0) return null;
        const item = this.trainQueue[0];
        item.progress += dt;
        if (item.progress >= item.time) {
            this.trainQueue.shift();
            return item.unitType;
        }
        return null;
    }

    /** Tower auto-attack logic */
    private updateTowerAttack(
        dt: number,
        particles: ParticleSystem,
        findNearestEnemy: (x: number, y: number, team: number, range: number) => Unit | null,
    ): void {
        this.towerAttackCooldown = Math.max(0, this.towerAttackCooldown - dt);
        this.towerAttackAnimTimer = Math.max(0, this.towerAttackAnimTimer - dt);

        const ageIdx = Math.min(this.age, TOWER_ATTACK_DATA.length - 1);
        const stats = TOWER_ATTACK_DATA[ageIdx];
        if (stats.damage <= 0) return;

        // Find target — prefer current target if still in range
        if (this.towerTarget && (!this.towerTarget.alive || this.towerTarget.hp <= 0)) {
            this.towerTarget = null;
        }
        if (this.towerTarget) {
            const d = Math.hypot(this.towerTarget.x - this.x, this.towerTarget.y - this.y);
            if (d > stats.range * 1.2) this.towerTarget = null; // Lost target - leash
        }
        if (!this.towerTarget) {
            this.towerTarget = findNearestEnemy(this.x, this.y, this.team, stats.range);
        }
        if (!this.towerTarget) return;

        // Attack when cooldown ready
        if (this.towerAttackCooldown > 0) return;
        this.towerAttackCooldown = stats.attackSpeed;

        // Track attack animation state
        this.towerAttackAnimTimer = 0.35;
        this.towerLastTargetX = this.towerTarget.x;
        this.towerLastTargetY = this.towerTarget.y;

        const target = this.towerTarget;
        const angle = Math.atan2(target.y - this.y, target.x - this.x);

        // Deal damage
        target.hp -= stats.damage;

        // Visual: arrow projectile(s)
        for (let i = 0; i < stats.arrowCount; i++) {
            const spreadAngle = angle + (i - (stats.arrowCount - 1) / 2) * 0.08;
            const isFireArrow = this.age >= 4;

            // Arrow flight
            particles.emit({
                x: this.x,
                y: this.y - 20, // shoots from top of tower
                count: 2,
                spread: 0,
                speed: [250, 320],
                angle: [spreadAngle - 0.03, spreadAngle + 0.03],
                life: [0.3, 0.55],
                size: [3, 5],
                colors: isFireArrow ? ['#ff6600', '#ffaa00', '#ffdd00'] : ['#c9a84c', '#8a6f3e', '#ddc060'],
                gravity: 12,
                shape: 'rect',
            });

            // Fire trail for age 4
            if (isFireArrow) {
                particles.emit({
                    x: this.x,
                    y: this.y - 20,
                    count: 3,
                    spread: 2,
                    speed: [200, 260],
                    angle: [spreadAngle - 0.1, spreadAngle + 0.1],
                    life: [0.1, 0.25],
                    size: [2, 3],
                    colors: ['#ff4400', '#ff8800', '#ffcc00'],
                    gravity: 20,
                    shape: 'circle',
                });
            }
        }

        // Hit impact sparks at target
        particles.emit({
            x: target.x,
            y: target.y - 5,
            count: this.age >= 4 ? 6 : 4,
            spread: 5,
            speed: [30, 80],
            angle: [angle - 0.5, angle + 0.5],
            life: [0.15, 0.35],
            size: [1.5, 3],
            colors: this.age >= 4
                ? ['#ff4400', '#ff8800', '#ffcc00', '#fff'] // fire hit
                : ['#ffd700', '#fff', '#aaa'],
            gravity: 60,
            shape: 'circle',
        });
    }

    /** Take damage from an attacking unit. Returns true if building is destroyed. */
    takeDamage(amount: number, particles: ParticleSystem): boolean {
        this.hp -= amount;
        this.damageFlashTimer = 0.15;

        // Hit particles at a random position on the building
        const hitX = this.x + (Math.random() - 0.5) * this.tileW * TILE_SIZE * 0.6;
        const hitY = this.y + (Math.random() - 0.5) * this.tileH * TILE_SIZE * 0.4;
        particles.emitBuildingHit(hitX, hitY);

        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            const left = this.tileX * TILE_SIZE;
            const top = this.tileY * TILE_SIZE;
            particles.emitBuildingDestroyed(left, top, this.tileW * TILE_SIZE, this.tileH * TILE_SIZE);
            return true;
        }
        return false;
    }

    get trainProgress(): number {
        if (this.trainQueue.length === 0) return 0;
        return this.trainQueue[0].progress / this.trainQueue[0].time;
    }

    // ---- Collision ----
    containsPoint(px: number, py: number): boolean {
        const left = this.tileX * TILE_SIZE, top = this.tileY * TILE_SIZE;
        const right = left + this.tileW * TILE_SIZE, bottom = top + this.tileH * TILE_SIZE;
        return px >= left && px <= right && py >= top && py <= bottom;
    }

    // ---- Render (delegated to BuildingRenderer module) ----
    render(ctx: CanvasRenderingContext2D): void {
        renderBuilding(this, ctx);
    }

    get minimapColor(): string { return this.slotColor || (this.team === 0 ? C.player : C.enemy); }
}
