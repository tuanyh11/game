// ============================================================
//  Unit — Core state, lifecycle & update loop
//  Rendering  → UnitRenderer  | Combat   → UnitCombat
//  Movement   → UnitMovement  | Economy  → UnitEconomy
//  Abilities  → EliteAbilitySystem + HeroSkillSystem
//  Hero data  → HeroSkillsData
// ============================================================

import {
    genId, UnitType, UnitState, UNIT_DATA, ResourceType, ResourceNodeType,
    C, TILE_SIZE, MAP_COLS, MAP_ROWS, TerrainType,
    CivilizationType, CIVILIZATION_DATA, CIV_UNIT_MODIFIERS,
    isInfantryType, isCavalryType, isRangedType, isCivElite
} from "../config/GameConfig";
import { ResourceNode } from "./ResourceNode";

export { HeroSkill, getHeroSkills, HERO_SKILLS, HERO_XP_TABLE, HERO_MAX_LEVEL } from "../config/HeroSkillsData";
import { HeroSkill, getHeroSkills, HERO_XP_TABLE, HERO_MAX_LEVEL } from "../config/HeroSkillsData";

import { Building } from "./Building";
import { ParticleSystem } from "../effects/ParticleSystem";

// Shared types
import type { TileMapRef } from "../types/TileMapRef";

// Rendering delegated to UnitRenderer
import { renderUnit } from "./unit-rendering/UnitRenderer";
// Combat delegated to Combat Strategies
import { CombatStrategyFactory } from "./combat/CombatStrategyFactory";
// Movement delegated to UnitMovement
import { unitDoMove, unitChaseMove, unitIsTileOfTarget, unitEscapeToWalkableTile } from "./unit-movement/UnitMovement";
// Economy delegated to UnitEconomy
import { unitDoGather, unitDoBuilding, unitDropOff } from "./unit-economy/UnitEconomy";
// Elite abilities delegated to per-unit ability files
import { updateEliteAbility } from "./unit-abilities/EliteAbilitySystem";
// Hero skill auto-cast system
import { updateHeroSkills } from "./unit-abilities/HeroSkillSystem";

export class Unit {
    id: number;
    type: UnitType;
    team: number;
    slotColor: string = '';  // custom color from lobby
    civilization: CivilizationType;  // faction type
    x: number; y: number;
    hp: number; maxHp: number;
    speed: number;
    attack: number;
    armor = 0;
    state = UnitState.Idle;
    selected = false;
    alive = true;
    upgradeLevel = 0; // 0-3, affects visuals
    age = 1; // Current age (1-4), affects visuals
    spawnBuildingId = -1; // ID of the building that spawned this unit (-1 = none)

    // Hero XP/Level system
    heroXp = 0;
    heroLevel = 1;
    heroSkillCooldowns: number[] = [0, 0, 0]; // cooldown timers for each skill
    heroSkillActive: number[] = [0, 0, 0];     // active buff timers
    heroSkillVfxTimer = 0;              // VFX pulse timer (public for renderer)
    heroLevelUpTimer = 0;               // level-up visual effect timer (public for renderer)
    _baseSpeed = 0;                              // store base speed for buffs (public for HeroSkillSystem)
    _baseAttack = 0;                             // store base attack for buffs (public for HeroSkillSystem)
    civRange = 0;                               // civ-modified attack range
    civAttackSpeed = 0;                         // civ-modified attack speed

    // Movement
    targetX = 0; targetY = 0;
    moveCallback: (() => void) | null = null;

    // Gathering
    targetResource: ResourceNode | null = null;
    carriedType: ResourceType | null = null;
    carriedAmount = 0;
    carryCapacity = 10;
    // Economy upgrade bonuses (applied from PlayerState)
    gatherSpeedBonus = 0;   // generic fallback (backward compat)
    gatherFoodBonus = 0;    // +% food gather
    gatherWoodBonus = 0;    // +% wood gather
    gatherGoldBonus = 0;    // +% gold gather
    gatherStoneBonus = 0;   // +% stone gather
    carryCapacityBonus = 0; // flat bonus (e.g. +5)
    speedBonus = 0;         // multiplier bonus (e.g. 0.10 = +10%)

    // Drop-off
    targetBuilding: Building | null = null;

    // Building (for villager)
    buildTarget: Building | null = null;

    // Combat
    attackTarget: Unit | null = null;
    attackBuildingTarget: Building | null = null;  // Building attack target
    manualAttackCommand = false;  // true when player explicitly orders attack (bypasses leash)
    manualCommand = false;        // true when player issues ANY command, prevents AI override
    attackCooldown = 0;
    deathTimer = 0;
    frozenTimer = 0;  // visual freeze effect (countdown)
    healingTimer = 0; // visual heal effect (countdown)
    slowTimer = 0;    // movement slow debuff (countdown)
    healReductionTimer = 0; // heal reduction debuff (countdown)

    // Pathfinding (public for UnitMovement)
    pathWaypoints: { x: number; y: number }[] = [];
    pathIndex = 0;
    stuckTimer = 0;
    stuckCount = 0;
    lastX = 0;
    lastY = 0;

    // Animation
    animFrame = 0;
    animTimer = 0;
    idleTimer = 0;
    facingRight = true;

    // Effect timers
    gatherEffectTimer = 0;
    buildSwingTimer = 0;
    attackAnimTimer = 0;

    // ---- Passive Unit Abilities (civ-specific) ---- (public for UnitCombat)
    passiveCooldown = 0;
    passiveBuffTimer = 0;
    passiveHitCounter = 0;
    passiveChargeReady = false;
    passiveWasMoving = false;
    // Elite unit passives (public for UnitCombat)
    ninjaDashCooldown = 0;
    isStealthed = false;
    ninjaDashTimer = 0;
    ninjaDashTargetX = 0;
    ninjaDashTargetY = 0;
    ninjaDashStartX = 0;
    ninjaDashStartY = 0;
    ninjaPierceTimer = 0;
    // Ulfhednar (public for UnitCombat)
    ulfhednarRageActive = false;
    ulfhednarRageTimer = 0;
    ulfhednarRageCooldown = 0;
    ulfhednarRageReady = true;
    ulfhednarLightningCount = 0;
    ulfhednarLightningTimer = 0;
    ulfhednarRageHP = 0;
    // Magi (public for UnitCombat)
    magiCooldown = 0;
    magiCastActive = false;
    magiCastTimer = 0;
    magiFreezeTargets: Unit[] = [];
    // Cẩm Y Vệ (public for renderer + UnitCombat)
    camYVeCooldown = 0;
    camYVeComboActive = false;
    camYVeComboTimer = 0;
    camYVeComboPhase = -1;
    camYVeComboTargetX = 0;
    camYVeComboTargetY = 0;
    camYVeOrigX = 0;
    camYVeOrigY = 0;
    camYVeVisible = true;
    camYVeSlashAngles = [0, Math.PI * 0.7, -Math.PI * 0.7];
    // Centurion (public for UnitCombat)
    centurionMode: 'spear' | 'sword' = 'spear';
    centurionPilumCooldown = 0;
    centurionMeleeHits = 0;
    centurionSpearRange = 130;
    centurionSwordRange = 35;
    centurionBlockCooldown = 0;
    centurionBlockActive = false;
    centurionBlockTimer = 0;
    centurionJavelinReady = false;
    centurionShielding = false;

    constructor(type: UnitType, x: number, y: number, team: number, civilization: CivilizationType = CivilizationType.LaMa) {
        this.id = genId();
        this.type = type;
        this.team = team;
        this.civilization = civilization;
        this.x = x; this.y = y;
        const data = UNIT_DATA[type];

        // Apply civilization global bonuses
        const civData = CIVILIZATION_DATA[civilization];
        const b = civData.bonuses;

        let hpMult = 1.0;
        let atkMult = 1.0;
        let spdMult = 1.0;
        let rngMult = 1.0;
        let atkSpdMult = 1.0;

        if (isInfantryType(type)) {
            hpMult = b.infantryHp;
            atkMult = b.infantryAttack;
        } else if (isCavalryType(type)) {
            hpMult = b.cavalryHp;
            atkMult = b.cavalryAttack;
        } else if (isRangedType(type)) {
            atkMult = b.archerAttack;
            rngMult = b.archerRange;
        }

        // Apply per-unit civ modifiers (Tactical Triangle)
        const civMods = CIV_UNIT_MODIFIERS[civilization];
        const unitMod = civMods?.[type];
        if (unitMod) {
            hpMult *= unitMod.hp ?? 1.0;
            atkMult *= unitMod.attack ?? 1.0;
            spdMult *= unitMod.speed ?? 1.0;
            rngMult *= unitMod.range ?? 1.0;
            atkSpdMult *= unitMod.attackSpeed ?? 1.0;
        }

        this.hp = Math.round(data.hp * hpMult);
        this.maxHp = Math.round(data.hp * hpMult);
        this.speed = Math.round(data.speed * spdMult);
        this.attack = Math.round(data.attack * atkMult);
        this._baseSpeed = Math.round(data.speed * spdMult);
        this._baseAttack = Math.round(data.attack * atkMult);
        this.civRange = Math.round(data.range * rngMult);
        this.civAttackSpeed = data.attackSpeed * atkSpdMult;
    }

    get name() {
        // Return civ-specific name if it exists, otherwise default
        const civMods = CIV_UNIT_MODIFIERS[this.civilization];
        const unitMod = civMods?.[this.type];
        return unitMod?.name ?? UNIT_DATA[this.type].name;
    }
    get isVillager() { return this.type === UnitType.Villager; }
    get isHero() { return this.type === UnitType.HeroSpartacus || this.type === UnitType.HeroZarathustra || this.type === UnitType.HeroQiJiguang || this.type === UnitType.HeroMusashi || this.type === UnitType.HeroRagnar; }
    get isCarrying() { return this.carriedAmount > 0; }
    get data() { return UNIT_DATA[this.type]; }
    get isDead() { return this.hp <= 0; }
    get heroSkills(): HeroSkill[] { return getHeroSkills(this.type); }
    get xpToNextLevel(): number {
        if (this.heroLevel >= HERO_MAX_LEVEL) return 0;
        return HERO_XP_TABLE[this.heroLevel + 1] - this.heroXp;
    }
    get xpProgress(): number {
        if (this.heroLevel >= HERO_MAX_LEVEL) return 1;
        const prev = HERO_XP_TABLE[this.heroLevel];
        const next = HERO_XP_TABLE[this.heroLevel + 1];
        return (this.heroXp - prev) / (next - prev);
    }

    /** Add XP to hero, check for level up */
    addHeroXp(amount: number): void {
        if (!this.isHero || this.heroLevel >= HERO_MAX_LEVEL) return;
        this.heroXp += amount;
        while (this.heroLevel < HERO_MAX_LEVEL && this.heroXp >= HERO_XP_TABLE[this.heroLevel + 1]) {
            this.heroLevel++;
            this.heroLevelUpTimer = 2.0; // 2 seconds of level-up visual
            // Level-up stat bonuses (reduced)
            const hpBonus = 15 + this.heroLevel * 3;
            this.maxHp += hpBonus;
            this.hp = Math.min(this.hp + hpBonus, this.maxHp);
            this._baseAttack += 2;
            this.attack = this._baseAttack;
        }
    }

    /** Apply upgrade bonuses from PlayerState */
    applyUpgrades(attackBonus: number, armorBonus: number, hpBonus: number, level: number): void {
        const base = UNIT_DATA[this.type];
        this.attack = base.attack + attackBonus;
        this.armor = armorBonus;
        const newMax = base.hp + hpBonus;
        if (newMax !== this.maxHp) {
            const ratio = this.hp / this.maxHp;
            this.maxHp = newMax;
            this.hp = Math.ceil(ratio * newMax);
        }
        this.upgradeLevel = level;
    }

    // ---- Commands ----
    moveTo(tx: number, ty: number, callback?: () => void, tileMap?: TileMapRef): void {
        // Clamp target to safe map bounds (2 tile margin)
        tx = Math.max(TILE_SIZE * 2, Math.min(tx, (MAP_COLS - 2) * TILE_SIZE));
        ty = Math.max(TILE_SIZE * 2, Math.min(ty, (MAP_ROWS - 2) * TILE_SIZE));

        // ===== WATER-SAFE MOVEMENT =====
        // If target is on water/impassable, redirect to nearest walkable shore tile
        if (tileMap) {
            const [tc, tr] = tileMap.worldToTile(tx, ty);
            if (!tileMap.isWalkable(tc, tr)) {
                // Spiral search: find nearest walkable tile, preferring tiles closer to THIS unit
                let bestX = tx, bestY = ty;
                let bestDist = Infinity;
                let found = false;

                for (let radius = 1; radius <= 15 && !found; radius++) {
                    for (let dr = -radius; dr <= radius; dr++) {
                        for (let dc = -radius; dc <= radius; dc++) {
                            if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;
                            const nc = tc + dc, nr = tr + dr;
                            if (nc < 2 || nc >= MAP_COLS - 2 || nr < 2 || nr >= MAP_ROWS - 2) continue;
                            if (tileMap.isWalkable(nc, nr)) {
                                const [wx, wy] = tileMap.tileToWorld(nc, nr);
                                // Prefer the shore tile closest to the unit (shortest walk)
                                const distFromUnit = Math.hypot(wx - this.x, wy - this.y);
                                if (distFromUnit < bestDist) {
                                    bestDist = distFromUnit;
                                    bestX = wx;
                                    bestY = wy;
                                    found = true;
                                }
                            }
                        }
                    }
                }
                tx = bestX;
                ty = bestY;
            }
        }

        this.targetX = tx; this.targetY = ty;
        this.state = UnitState.Moving;
        this.moveCallback = callback ?? null;
        this.targetResource = null;
        this.targetBuilding = null;
        this.buildTarget = null;
        this.attackTarget = null;
        this.attackBuildingTarget = null;
        this.manualAttackCommand = false;
        this.pathWaypoints = [];
        this.pathIndex = 0;
        this.stuckTimer = 0;
        this.stuckCount = 0;
        if (tx > this.x) this.facingRight = true;
        else if (tx < this.x) this.facingRight = false;
    }

    /** Command to attack a specific unit */
    attackUnit(target: Unit, manual = false): void {
        this.attackTarget = target;
        this.attackBuildingTarget = null;
        this.targetResource = null;
        this.buildTarget = null;
        this.targetBuilding = null;
        this.moveCallback = null;
        this.pathWaypoints = [];
        this.pathIndex = 0;
        this.stuckTimer = 0;
        this.stuckCount = 0;
        this.manualAttackCommand = manual;
        this.state = UnitState.Attacking;
        // Centurion: default to spear mode (ranged) when given a new attack target
        if (this.type === UnitType.Centurion) {
            this.centurionMode = 'spear';
            this.civRange = this.centurionSpearRange;
        }
    }

    /** Command to attack a building */
    attackBuilding(target: Building, manual = false): void {
        this.attackBuildingTarget = target;
        this.attackTarget = null;
        this.targetResource = null;
        this.buildTarget = null;
        this.targetBuilding = null;
        this.moveCallback = null;
        this.pathWaypoints = [];
        this.pathIndex = 0;
        this.stuckTimer = 0;
        this.stuckCount = 0;
        this.manualAttackCommand = manual;
        this.state = UnitState.Attacking;
        // Centurion: default to spear mode (ranged) when given a new attack target
        if (this.type === UnitType.Centurion) {
            this.centurionMode = 'spear';
            this.civRange = this.centurionSpearRange;
        }
    }

    gatherFrom(node: ResourceNode, findDropOff: () => Building | null): void {
        this.targetResource = node;
        this.buildTarget = null;
        this.attackTarget = null;
        this.attackBuildingTarget = null;
        this.state = UnitState.Moving;
        // Stand at the EDGE of the resource, not on top of it
        const gatherStandoff = node.radius + 6;
        const dx = this.x - node.x, dy = this.y - node.y;
        const d = Math.hypot(dx, dy) || 1;
        this.targetX = node.x + (dx / d) * gatherStandoff;
        this.targetY = node.y + (dy / d) * gatherStandoff;
        this.pathWaypoints = [];
        this.pathIndex = 0;
        this.stuckTimer = 0;
        this.stuckCount = 0;
        this.moveCallback = () => {
            if (this.targetResource && !this.targetResource.isDepleted) {
                this.state = UnitState.Gathering;
                this.gatherEffectTimer = 0;
            }
        };
        this._findDropOff = findDropOff;
    }

    /** Command villager to build/repair a building */
    buildAt(building: Building): void {
        if (!this.isVillager) return;
        this.buildTarget = building;
        this.targetResource = null;
        this.targetBuilding = null;
        this.attackTarget = null;
        this.attackBuildingTarget = null;
        this.state = UnitState.Moving;
        this.targetX = building.x;
        this.targetY = building.y;
        this.pathWaypoints = [];
        this.pathIndex = 0;
        this.stuckTimer = 0;
        this.stuckCount = 0;
        this.moveCallback = () => {
            if (this.buildTarget && (!this.buildTarget.built || this.buildTarget.hp < this.buildTarget.maxHp)) {
                this.state = UnitState.Building;
                this.buildSwingTimer = 0;
            } else {
                this.state = UnitState.Idle;
                this.buildTarget = null;
            }
        };
    }

    returnResources(building: Building): void {
        this.targetBuilding = building;
        this.targetX = building.x; this.targetY = building.y;
        this.state = UnitState.Returning;
        this.moveCallback = null;
    }

    private _findDropOff: (() => Building | null) | null = null;
    /** Callback to find nearest resource of a given type (set by EntityManager) */
    _findNearbyResource: ((x: number, y: number, nodeType: ResourceNodeType) => import("./ResourceNode").ResourceNode | null) | null = null;
    /** Callback to find nearest unbuilt building (set by EntityManager) */
    _findNearbyUnbuiltBuilding: ((x: number, y: number, team: number, maxDist: number) => Building | null) | null = null;
    /** Set by EntityManager — used by Magi for healing nearby allies */
    _allUnits: Unit[] = [];

    // ---- Update (called every frame) ----
    update(
        dt: number,
        spendResource: (team: number, cost: Record<string, number>) => boolean,
        findNearestDropOff: (x: number, y: number, resType: ResourceType, team: number) => Building | null,
        particles: ParticleSystem,
        findNearestEnemy?: (x: number, y: number, team: number, range: number) => Unit | null,
        tileMap?: TileMapRef,
        findNearestEnemyBuilding?: (x: number, y: number, team: number, range: number) => import("./Building").Building | null,
    ): void {
        // Death handling
        if (this.hp <= 0) {
            if (this.alive) {
                this.alive = false;
                this.deathTimer = 1.0;
                // Death particles
                particles.emit({
                    x: this.x, y: this.y, count: 12, spread: 10,
                    speed: [20, 60], angle: [0, Math.PI * 2],
                    life: [0.4, 1.0], size: [2, 5],
                    colors: ['#ff3333', '#882222', '#cc4444', '#660000'],
                    gravity: 80, shape: 'circle',
                });
            }
            this.deathTimer -= dt;
            return;
        }

        this.animTimer += dt;
        this.idleTimer += dt;
        if (this.animTimer > 0.15) { this.animTimer -= 0.15; this.animFrame = (this.animFrame + 1) % 4; }
        this.attackCooldown = Math.max(0, this.attackCooldown - dt);
        this.passiveCooldown = Math.max(0, this.passiveCooldown - dt);
        this.passiveBuffTimer = Math.max(0, this.passiveBuffTimer - dt);
        if (this.slowTimer > 0) this.slowTimer = Math.max(0, this.slowTimer - dt);
        if (this.healReductionTimer > 0) this.healReductionTimer = Math.max(0, this.healReductionTimer - dt);
        if (this.frozenTimer > 0) {
            this.frozenTimer = Math.max(0, this.frozenTimer - dt);
            this.animTimer += dt; // keep animTimer for visual sparkle
            return; // ❄️ FROZEN — skip ALL actions (movement, attack, etc.)
        }
        if (this.healingTimer > 0) this.healingTimer = Math.max(0, this.healingTimer - dt);
        // Track movement → attack transitions for charge abilities
        if (this.state === UnitState.Moving) this.passiveWasMoving = true;

        // ---- ELITE ABILITIES (delegated to per-unit ability files) ----
        updateEliteAbility(this, dt, {
            particles,
            findNearestEnemy,
            allUnits: this._allUnits,
        });

        // ---- PASSIVE & ATTACK ANIM ----
        if (this.state === UnitState.Attacking) {
            this.attackAnimTimer += dt;
            if (this.passiveWasMoving) { this.passiveChargeReady = true; this.passiveWasMoving = false; }
            // Viking Shield Wall / La Mã Testudo passive regen & defense
            this.applyPassiveIdle(dt, particles);
        } else {
            this.attackAnimTimer = 0;
            // Passive idle effects while not attacking
            if (this.state === UnitState.Idle) this.applyPassiveIdle(dt, particles);
        }

        // ---- HERO SKILL SYSTEM (delegated to HeroSkillSystem) ----
        if (this.isHero) {
            updateHeroSkills(this, dt, particles, findNearestEnemy, findNearestEnemyBuilding);
        }


        switch (this.state) {
            case UnitState.Idle: {
                this.manualCommand = false; // Reset so AI can take over again
                // Auto-attack nearby enemy UNITS first
                const aggroRange = this.data.sight * TILE_SIZE * 0.6;
                if (findNearestEnemy) {
                    const enemy = findNearestEnemy(this.x, this.y, this.team, aggroRange);
                    if (enemy) {
                        this.attackUnit(enemy);
                        break;
                    }
                }
                // No enemy units — auto-attack nearby enemy BUILDINGS (military only)
                if (!this.isVillager && findNearestEnemyBuilding) {
                    const enemyBldg = findNearestEnemyBuilding(this.x, this.y, this.team, aggroRange);
                    if (enemyBldg) {
                        this.attackBuilding(enemyBldg);
                    }
                }
                break;
            }

            case UnitState.Moving:
            case UnitState.Returning:
                this.doMove(dt, particles, tileMap);
                break;

            case UnitState.Gathering:
                this.doGather(dt, findNearestDropOff, particles);
                break;

            case UnitState.Building:
                this.doBuilding(dt, particles, spendResource);
                break;

            case UnitState.Attacking:
                this.doAttack(dt, particles, findNearestEnemy, tileMap, findNearestEnemyBuilding);
                break;
        }
    }

    // ---- CHASE MOVE (delegated to UnitMovement) ----
    chaseMove(dx: number, dy: number, dist: number, dt: number, tileMap?: TileMapRef): void {
        unitChaseMove(this, dx, dy, dist, dt, tileMap);
    }

    isTileOfTarget(col: number, row: number): boolean {
        return unitIsTileOfTarget(this, col, row);
    }

    private doMove(dt: number, particles: ParticleSystem, tileMap?: TileMapRef): void {
        unitDoMove(this, dt, particles, tileMap);
    }

    escapeToWalkableTile(tileMap: TileMapRef, destX: number, destY: number): boolean {
        return unitEscapeToWalkableTile(this, tileMap, destX, destY);
    }

    // ---- GATHER STATE (delegated to UnitEconomy) ----
    private doGather(
        dt: number,
        findNearestDropOff: (x: number, y: number, resType: ResourceType, team: number) => Building | null,
        particles: ParticleSystem,
    ): void {
        unitDoGather(this, dt, findNearestDropOff, particles);
    }

    // ---- BUILDING STATE (delegated to UnitEconomy) ----
    private doBuilding(dt: number, particles: ParticleSystem, spendResource: (team: number, cost: Record<string, number>) => boolean): void {
        unitDoBuilding(this, dt, particles, spendResource);
    }

    // ---- ATTACK STATE (delegated to UnitCombat) ----
    private doAttack(
        dt: number,
        particles: ParticleSystem,
        findNearestEnemy?: (x: number, y: number, team: number, range: number) => Unit | null,
        tileMap?: TileMapRef,
        findNearestEnemyBuilding?: (x: number, y: number, team: number, range: number) => import("./Building").Building | null,
    ): void {
        const strategy = CombatStrategyFactory.getStrategy(this.type);
        strategy.doAttack({ unit: this, dt, particles, findNearestEnemy, tileMap, findNearestEnemyBuilding });
    }

    // ---- DROP OFF (delegated to UnitEconomy) ----
    _onDropOff: ((type: ResourceType, amount: number) => void) | null = null;
    setDropOffCallback(cb: (type: ResourceType, amount: number) => void) { this._onDropOff = cb; }

    dropOff(particles: ParticleSystem): void {
        unitDropOff(this, particles);
    }

    // ---- Passive Ability (delegated to CombatStrategy) ----
    private applyPassiveIdle(dt: number, particles: any): void {
        const strategy = CombatStrategyFactory.getStrategy(this.type);
        strategy.applyPassiveIdle(this, dt, particles);
    }

    /** Called when this unit takes damage — returns modified damage amount.
     *  pierceBlock: if true, ignore Centurion Scutum Block (e.g. Ulfhednar rage) */
    applyPassiveDefense(incomingDmg: number, particles: any, pierceBlock = false): number {
        const strategy = CombatStrategyFactory.getStrategy(this.type);
        return strategy.applyPassiveDefense(this, incomingDmg, particles, pierceBlock);
    }

    // ---- Collision ----
    get radius(): number { return 10; }

    containsPoint(px: number, py: number): boolean {
        const hitW = 16, hitH = 20;
        return px >= this.x - hitW && px <= this.x + hitW &&
            py >= this.y - hitH - 6 && py <= this.y + hitH;
    }

    inRect(rx: number, ry: number, rw: number, rh: number): boolean {
        return this.x >= rx && this.x <= rx + rw && this.y >= ry && this.y <= ry + rh;
    }

    // ---- Render (delegated to UnitRenderer) ----
    render(ctx: CanvasRenderingContext2D): void {
        renderUnit(this, ctx);
    }

    get minimapColor(): string { return this.slotColor || (this.team === 0 ? C.player : C.enemy); }
}

