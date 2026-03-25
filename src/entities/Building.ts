// ============================================================
//  Building — Player/enemy buildings with construction system
// ============================================================

import {
    genId, TILE_SIZE, BuildingType, BUILDING_DATA, UnitType, UNIT_DATA,
    C, ResourceType, TOWER_ATTACK_DATA,
    CivilizationType, CIVILIZATION_DATA,
    TowerUpgradeType, TOWER_UPGRADE_DATA,
} from "../config/GameConfig";
import { PlayerState } from "../systems/PlayerState";
import { ParticleSystem } from "../effects/ParticleSystem";
import type { Unit } from "./Unit";
import { renderBuilding } from "./building-rendering/BuildingRenderer";
import { audioSystem } from "../systems/AudioSystem";

export interface TrainQueueItem { unitType: UnitType; progress: number; time: number; }
export const MAX_QUEUE_SIZE = 10;

// Build times per building type (seconds)
const BUILD_TIMES: Partial<Record<BuildingType, number>> = {
    [BuildingType.House]: 10,
    [BuildingType.Barracks]: 16,
    [BuildingType.Market]: 10,
    [BuildingType.TownCenter]: 25,
    [BuildingType.Stable]: 18,
    [BuildingType.Tower]: 12,
    [BuildingType.HeroAltar]: 20,
    [BuildingType.Blacksmith]: 15,
    [BuildingType.Wall]: 10,
    [BuildingType.StoragePit]: 10,
    [BuildingType.Granary]: 10,
    [BuildingType.GovernmentCenter]: 12,
    [BuildingType.Armory]: 12,
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
    /** Seconds of invulnerability remaining (second chance shield) */
    invulnerableTimer = 0;
    slotColor: string = '';  // custom color from lobby
    civilization: CivilizationType = CivilizationType.LaMa; // faction for this building
    onBuildComplete: (() => void) | null = null; // callback when construction finishes
    farmResource: import('./ResourceNode').ResourceNode | null = null; // linked farm resource node

    // Age-up visual state (set externally by EntityManager/AIController)
    isUpgrading = false;
    upgradeProgress = 0; // 0-1

    // Research visual state (set externally by EntityManager)
    isResearching = false;
    researchProgress = 0; // 0-1

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

    // Tower upgrade system
    towerUpgrade: TowerUpgradeType = TowerUpgradeType.None;
    towerUpgradeProgress = 0;  // 0 → upgradeTime
    towerUpgradeTime = 0;      // total time needed
    isTowerUpgrading = false;

    /** Deterministic visual pseudo-random (does NOT consume seeded Math.random) */
    private _vrngState = 0;
    private _visualRng(): number {
        this._vrngState = (this._vrngState * 1103515245 + 12345) & 0x7fffffff;
        return this._vrngState / 0x7fffffff;
    }

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
        this._vrngState = this.id * 2654435761; // Seed visual RNG from building ID
    }

    get data() { return BUILDING_DATA[this.type]; }
    get name() {
        if (this.type === BuildingType.Tower && this.towerUpgrade !== TowerUpgradeType.None) {
            return TOWER_UPGRADE_DATA[this.towerUpgrade].name;
        }
        return this.data.name;
    }
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
            const cx = this.x + (this._visualRng() - 0.5) * this.tileW * TILE_SIZE * 0.5;
            const cy = this.y + (this._visualRng() - 0.5) * this.tileH * TILE_SIZE * 0.3;
            particles.emitHammerSpark(cx, cy);
        }

        if (this.buildProgress >= this.buildTime) {
            this.built = true;
            this.hp = this.maxHp;
            // Fire onBuildComplete callback (e.g. spawn farm resource)
            if (this.onBuildComplete) {
                this.onBuildComplete();
                this.onBuildComplete = null;
            }
            // Celebration burst!
            const left = this.tileX * TILE_SIZE;
            const top = this.tileY * TILE_SIZE;
            const cx = left + this.tileW * TILE_SIZE / 2;
            const cy = top + this.tileH * TILE_SIZE / 2;
            particles.emitBuildComplete(left, top, this.tileW * TILE_SIZE, this.tileH * TILE_SIZE);
            audioSystem.playSFXWithPitch('./sounds/universfield-game-level-complete-143022_soLe8QkZ.mp3', 0.3, 1.0, cx, cy);
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
                const cx = this.x + (this._visualRng() - 0.5) * this.tileW * TILE_SIZE * 0.5;
                const cy = this.y + (this._visualRng() - 0.5) * this.tileH * TILE_SIZE * 0.3;
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

        return ps.canAfford(ud.cost);
    }

    addToQueue(unitType: UnitType, ps: PlayerState, trainSpeedMult = 1.0): boolean {
        if (this.trainQueue.length >= MAX_QUEUE_SIZE) return false;
        if (!this.canTrain(unitType, ps)) return false;
        const ud = UNIT_DATA[unitType];
        if (!ps.spend(ud.cost)) return false;
        this.trainQueue.push({ unitType, progress: 0, time: ud.trainTime * trainSpeedMult });
        ps.queuedPopulation = (ps.queuedPopulation || 0) + 1;
        return true;
    }

    /** Cancel a queued training item at the given index. Refunds resources. */
    cancelQueueItem(index: number, ps: PlayerState): boolean {
        if (index < 0 || index >= this.trainQueue.length) return false;
        const item = this.trainQueue[index];
        const ud = UNIT_DATA[item.unitType];
        // Refund cost
        if (ud.cost.supplies) ps.resources.supplies += ud.cost.supplies;
        if (ud.cost.supplies) ps.resources.supplies += ud.cost.supplies;
        if (ud.cost.gold) ps.resources.gold += ud.cost.gold;
        if (ud.cost.supplies) ps.resources.supplies += ud.cost.supplies;
        // Remove from queue
        this.trainQueue.splice(index, 1);
        ps.queuedPopulation = Math.max(0, (ps.queuedPopulation || 0) - 1);
        return true;
    }

    update(
        dt: number,
        particles?: ParticleSystem,
        findNearestEnemy?: (x: number, y: number, team: number, range: number) => Unit | null,
        hasPopSpace: boolean = true,
        findEnemiesInRange?: (x: number, y: number, team: number, range: number) => Unit[],
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

        // ---- TOWER UPGRADE PROGRESS ----
        if (this.isTowerUpgrading && this.type === BuildingType.Tower) {
            this.updateTowerUpgrade(dt, particles!);
        }

        // ---- TOWER AUTO-ATTACK ----
        if (this.type === BuildingType.Tower && this.built && this.alive && !this.isTowerUpgrading && findNearestEnemy && particles) {
            this.updateTowerAttack(dt, particles, findNearestEnemy, findEnemiesInRange);
        }

        if (!this.built) return null;
        if (this.trainQueue.length === 0) return null;
        const item = this.trainQueue[0];
        
        // Pause training at 0% if there's no population space
        if (!hasPopSpace) {
            item.progress = 0;
            return null;
        }

        item.progress += dt;
        if (item.progress >= item.time) {
            this.trainQueue.shift();
            return item.unitType;
        }
        return null;
    }

    /** Get effective tower stats (base + upgrade multipliers) */
    getTowerStats(): { damage: number; range: number; attackSpeed: number; arrowCount: number; splashRadius: number; slowPct: number; slowDuration: number } {
        const ageIdx = Math.min(this.age, TOWER_ATTACK_DATA.length - 1);
        const base = TOWER_ATTACK_DATA[ageIdx];
        const upg = TOWER_UPGRADE_DATA[this.towerUpgrade];
        return {
            damage: Math.round(base.damage * upg.damageMult),
            range: Math.round(base.range * upg.rangeMult),
            attackSpeed: +(base.attackSpeed * upg.attackSpeedMult).toFixed(2),
            arrowCount: Math.max(1, base.arrowCount + upg.arrowCountBonus),
            splashRadius: upg.splashRadius,
            slowPct: upg.slowPct,
            slowDuration: upg.slowDuration,
        };
    }

    /** Start a tower upgrade */
    startTowerUpgrade(type: TowerUpgradeType): boolean {
        if (this.type !== BuildingType.Tower || !this.built || !this.alive) return false;
        if (this.towerUpgrade !== TowerUpgradeType.None) return false; // already upgraded
        if (this.isTowerUpgrading) return false;
        const data = TOWER_UPGRADE_DATA[type];
        this.isTowerUpgrading = true;
        this.towerUpgradeProgress = 0;
        this.towerUpgradeTime = data.upgradeTime;
        this.towerUpgrade = type; // pre-set so UI knows
        return true;
    }

    /** Advance tower upgrade progress */
    private updateTowerUpgrade(dt: number, particles: ParticleSystem): void {
        this.towerUpgradeProgress += dt;

        // Dust effect during upgrade
        this.dustTimer += dt;
        if (this.dustTimer >= 0.5) {
            this.dustTimer -= 0.5;
            const left = this.tileX * TILE_SIZE;
            const top = this.tileY * TILE_SIZE;
            particles.emitConstructionDust(left, top, this.tileW * TILE_SIZE, this.tileH * TILE_SIZE);
        }

        if (this.towerUpgradeProgress >= this.towerUpgradeTime) {
            this.isTowerUpgrading = false;
            // Apply HP bonus
            const upg = TOWER_UPGRADE_DATA[this.towerUpgrade];
            this.maxHp += upg.hpBonus;
            this.hp += upg.hpBonus;
            // Celebration
            const left = this.tileX * TILE_SIZE;
            const top = this.tileY * TILE_SIZE;
            particles.emitBuildComplete(left, top, this.tileW * TILE_SIZE, this.tileH * TILE_SIZE);
            audioSystem.playSFXWithPitch('./sounds/universfield-game-level-complete-143022_soLe8QkZ.mp3', 0.3, 1.0, this.x, this.y);
        }
    }

    private updateTowerAttack(
        dt: number,
        particles: ParticleSystem,
        findNearestEnemy: (x: number, y: number, team: number, range: number) => Unit | null,
        findEnemiesInRange?: (x: number, y: number, team: number, range: number) => Unit[],
    ): void {
        this.towerAttackCooldown = Math.max(0, this.towerAttackCooldown - dt);
        this.towerAttackAnimTimer = Math.max(0, this.towerAttackAnimTimer - dt);

        const stats = this.getTowerStats();
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
        const upg = TOWER_UPGRADE_DATA[this.towerUpgrade];

        // Deal damage
        target.hp -= stats.damage;

        // Apply slow effect (Ice tower)
        if (stats.slowPct > 0 && stats.slowDuration > 0) {
            target.slowAmount = stats.slowPct;
            target.slowTimer = stats.slowDuration;
        }

        // Splash damage (Fire/Cannon towers)
        if (stats.splashRadius > 0 && findEnemiesInRange) {
            const splashDmg = Math.round(stats.damage * 0.4);
            const splashTargets = findEnemiesInRange(target.x, target.y, this.team, stats.splashRadius);
            for (const st of splashTargets) {
                if (st.id === target.id) continue; // Already took full damage
                st.hp -= splashDmg;
                if (stats.slowPct > 0 && stats.slowDuration > 0) {
                    st.slowAmount = stats.slowPct * 0.5; // Half slow on splash
                    st.slowTimer = stats.slowDuration * 0.5;
                }
            }
            // Splash visual
            particles.emit({
                x: target.x, y: target.y,
                count: 8, spread: stats.splashRadius * 0.3,
                speed: [20, 60], angle: [0, Math.PI * 2],
                life: [0.2, 0.5], size: [2, 5],
                colors: this.towerUpgrade === TowerUpgradeType.Cannon
                    ? ['#ff6600', '#ff9900', '#333', '#666']
                    : ['#ff4400', '#ff8800', '#ffcc00'],
                gravity: 40, shape: 'circle',
            });
        }

        // Visual: arrow/projectile(s)
        const isFireUpgrade = this.towerUpgrade === TowerUpgradeType.Fire;
        const isIceUpgrade = this.towerUpgrade === TowerUpgradeType.Ice;
        const isCannonUpgrade = this.towerUpgrade === TowerUpgradeType.Cannon;

        if (isCannonUpgrade) {
            // Cannonball projectile
            particles.emit({
                x: this.x, y: this.y - 20,
                count: 3, spread: 2,
                speed: [200, 280],
                angle: [angle - 0.05, angle + 0.05],
                life: [0.35, 0.6], size: [5, 8],
                colors: ['#333', '#555', '#222'],
                gravity: 25, shape: 'circle',
            });
            // Muzzle flash
            particles.emit({
                x: this.x, y: this.y - 22,
                count: 5, spread: 4,
                speed: [40, 100],
                angle: [angle - 0.4, angle + 0.4],
                life: [0.1, 0.2], size: [3, 6],
                colors: ['#ff8800', '#ffcc00', '#fff'],
                gravity: 0, shape: 'circle',
            });
        } else {
            for (let i = 0; i < stats.arrowCount; i++) {
                const spreadAngle = angle + (i - (stats.arrowCount - 1) / 2) * 0.08;
                const isFireArrow = this.age >= 4 || isFireUpgrade;

                let arrowColors = ['#c9a84c', '#8a6f3e', '#ddc060'];
                if (isFireArrow) arrowColors = ['#ff6600', '#ffaa00', '#ffdd00'];
                if (isIceUpgrade) arrowColors = ['#88ccff', '#aaddff', '#66aaee'];

                particles.emit({
                    x: this.x, y: this.y - 20,
                    count: 2, spread: 0,
                    speed: [250, 320],
                    angle: [spreadAngle - 0.03, spreadAngle + 0.03],
                    life: [0.3, 0.55], size: [3, 5],
                    colors: arrowColors,
                    gravity: 12, shape: 'rect',
                });

                // Fire trail
                if (isFireArrow) {
                    particles.emit({
                        x: this.x, y: this.y - 20,
                        count: 3, spread: 2,
                        speed: [200, 260],
                        angle: [spreadAngle - 0.1, spreadAngle + 0.1],
                        life: [0.1, 0.25], size: [2, 3],
                        colors: ['#ff4400', '#ff8800', '#ffcc00'],
                        gravity: 20, shape: 'circle',
                    });
                }

                // Ice trail
                if (isIceUpgrade) {
                    particles.emit({
                        x: this.x, y: this.y - 20,
                        count: 2, spread: 2,
                        speed: [180, 240],
                        angle: [spreadAngle - 0.1, spreadAngle + 0.1],
                        life: [0.1, 0.3], size: [2, 3],
                        colors: ['#aaddff', '#cceeFF', '#fff'],
                        gravity: 10, shape: 'circle',
                    });
                }
            }
        }

        // Hit impact sparks at target
        let hitColors = ['#ffd700', '#fff', '#aaa'];
        if (isFireUpgrade || this.age >= 4) hitColors = ['#ff4400', '#ff8800', '#ffcc00', '#fff'];
        if (isIceUpgrade) hitColors = ['#88ccff', '#aaddff', '#fff', '#cceeFF'];
        if (isCannonUpgrade) hitColors = ['#ff6600', '#ff9900', '#333', '#666', '#fff'];

        particles.emit({
            x: target.x, y: target.y - 5,
            count: isCannonUpgrade ? 8 : (isFireUpgrade ? 6 : 4),
            spread: isCannonUpgrade ? 10 : 5,
            speed: [30, 80],
            angle: [angle - 0.5, angle + 0.5],
            life: [0.15, 0.35], size: [1.5, 3],
            colors: hitColors,
            gravity: 60, shape: 'circle',
        });
    }

    /** Take damage from an attacking unit. Returns true if building is destroyed. */
    takeDamage(amount: number, particles: ParticleSystem): boolean {
        // Invulnerability shield (second chance)
        if (this.invulnerableTimer > 0) return false;
        this.hp -= amount;
        this.damageFlashTimer = 0.15;

        // Hit particles at a deterministic-visual position on the building
        const hitX = this.x + (this._visualRng() - 0.5) * this.tileW * TILE_SIZE * 0.6;
        const hitY = this.y + (this._visualRng() - 0.5) * this.tileH * TILE_SIZE * 0.4;
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
