// ============================================================
//  AIController — Coordinator (thin wrapper)
//  All domain logic delegated to sub-modules in ./ai/
//  This file contains: constructor, update(), utility finders
// ============================================================

import {
    BuildingType, ResourceNodeType, UnitType, ResourceType, UnitState,
    C, TILE_SIZE, UPGRADE_DATA, UpgradeType, isRangedType, isCavalryType, MAP_COLS, MAP_ROWS, UNIT_DATA,
    CIV_ELITE_UNIT, CivilizationType
} from "../config/GameConfig";
import { EntityManager } from "./EntityManager";
import { PlayerState } from "./PlayerState";
import { ParticleSystem } from "../effects/ParticleSystem";
import { Unit } from "../entities/Unit";
import { Building } from "../entities/Building";

// Re-export config types for external consumers
export { AIDifficulty, AI_DIFFICULTY_NAMES, AI_DIFFICULTY_DESC } from "./ai/AIConfig";
import { AIDifficulty, DifficultyParams, DIFFICULTY_PARAMS, sharedIntel, AIStrategy, StrategyParams, STRATEGY_PARAMS } from "./ai/AIConfig";
import type { AIContext } from "./ai/AIContext";
import { DefenseStance } from "./ai/AIContext";
import type { AttackPatternRecord, DefenseTrainingPriority, Chokepoint, TrapState } from "./ai/AIContext";
import { DefenseLayer } from "./ai/AIContext";

// Domain modules
import { handleCombat, handleVillagerCombat, handleActiveAttacker, calculateCombatPower, evaluateBattlefield, triggerRetreat, selectBestTarget, callFocusFire, findAllyInCombat, advancedMicro } from "./ai/AICombatManager";
import { handleDefense, initiateCounterAttack, calculateForceAllocation } from "./ai/AIDefenseManager";
import { checkAllyStatus, coordinateWithAllies, tacticalReassessment, reportThreat, cleanupIntel } from "./ai/AIAllianceManager";
import { isPositionVisible, updateVision, getScoutedEnemyBuildings, hasScoutedEnemy, moveTowardEnemy, checkExplorationComplete, sendToExplore, returnScoutToArmy } from "./ai/AIVisionManager";
import { autoGather, smartVillagerManagement, autoBuild, autoAgeUp, autoResearch, autoTrain } from "./ai/AIEconomyManager";
import { sendAttackWave, rallyTroops, handleRaiding, analyzeEnemyComposition } from "./ai/AIAttackManager";

export class AIController implements AIContext {
    aiState: PlayerState;
    team = 1;
    strategy: AIStrategy;
    strategyParams: StrategyParams;
    timers = {
        gather: 0, build: 0, train: 0, attack: 0, combat: 0,
        defend: 0, scout: 0, ageUp: 0,
        allyCheck: 0, coordination: 0, tactical: 0,
        raid: 0, micro: 0,
    };
    attackWaveSize: number;
    wavesSent = 0;
    difficulty: AIDifficulty;
    params: DifficultyParams;
    baseX = 0;
    baseY = 0;
    waveState: 'gathering' | 'attacking' | 'counterattack' | 'pursuit' | 'retreating' = 'gathering';
    waveResetTimer = 0;
    rallyX = 0;
    rallyY = 0;
    retreatRallyX = 0;
    retreatRallyY = 0;
    retreatRegroupTimer = 0;
    knownEnemyPositions: Map<number, { x: number; y: number; time: number }> = new Map();

    // ===== SUPPORT SQUAD — Independent system =====
    supportSquad: Set<number> = new Set();
    supportSquadTarget: { x: number; y: number } | null = null;
    supportSquadTimer = 0;

    // Legacy (used by squad system)
    supportTarget: { x: number; y: number } | null = null;
    supportTimer = 0;
    counterAttackTarget: { x: number; y: number } | null = null;
    counterAttackTimer = 0;
    pursuitTarget: Unit | null = null;
    pursuitTimer = 0;
    lastDefenseEnemyCount = 0;
    defenseSuccessStreak = 0;
    forceAllocation = {
        garrisonRatio: 0.25, attackRatio: 0.50, supportRatio: 0.25,
        garrisonUnits: [] as Unit[], attackUnits: [] as Unit[], supportUnits: [] as Unit[],
    };
    scoutedEnemyBuildings: Map<number, { x: number; y: number; type: BuildingType; time: number; alive: boolean }> = new Map();
    scoutedEnemyUnits: Map<number, { x: number; y: number; time: number }> = new Map();
    exploredRegions: Set<string> = new Set();
    scoutTargets: { x: number; y: number }[] = [];
    explorationComplete = false;
    explorationCheckTimer = 0;
    defendingUnits: Set<number> = new Set();
    raidingUnits: Set<number> = new Set();
    raidTarget: { x: number; y: number } | null = null;
    raidCooldown = 0;
    raidActive = false;
    enemyComposition = { melee: 0, ranged: 0, cavalry: 0, heroes: 0, total: 0, lastUpdate: 0 };
    flankForce: Unit[] = [];
    flankTarget: { x: number; y: number } | null = null;

    // === TIER-1 DEFENSE: Early Warning System ===
    defenseStance: DefenseStance = DefenseStance.Peaceful;
    earlyWarningActive = false;
    earlyWarningEnemies: Unit[] = [];
    earlyWarningCooldown = 0;

    // === TIER-1 DEFENSE: Attack Direction Memory ===
    attackHistory: { direction: number; time: number; severity: number }[] = [];
    primaryThreatDirection = 0;
    threatDirectionConfidence = 0;

    // === TIER-1 DEFENSE: Tower Coordination ===
    towerDefenseActive = false;

    // === TIER-2 DEFENSE: Enhanced Attack Pattern Memory ===
    attackPatterns: AttackPatternRecord[] = [];
    averageAttackInterval = 0;
    lastAttackTime = 0;
    predictedNextAttackTime = 0;

    // === TIER-2 DEFENSE: Adaptive Defense Training ===
    defenseTrainingPriority: DefenseTrainingPriority = {
        needAntiMelee: 0, needAntiRanged: 0, needAntiCavalry: 0,
        needMoreTowers: false, suggestedUnitType: null, lastUpdate: 0,
    };

    // === TIER-2 DEFENSE: Layered Defense Roles ===
    defenseLayerAssignments: Map<number, DefenseLayer> = new Map();

    // === TIER-3 DEFENSE: Chokepoint Exploitation ===
    knownChokepoints: Chokepoint[] = [];
    chokepointScanDone = false;
    activeChokepointDefense: Chokepoint | null = null;

    // === TIER-3 DEFENSE: Bait & Trap ===
    trapState: TrapState | null = null;
    trapCooldown = 0;

    // Cached enemy detection result (avoids flawed waveState-based caching)
    _cachedHasEnemies = true;

    constructor(
        public entityManager: EntityManager,
        aiState: PlayerState,
        difficulty: AIDifficulty = AIDifficulty.Normal,
        team: number = 1,
        private logCallback?: (msg: string, color: string) => void
    ) {
        this.aiState = aiState;
        this.team = team;
        this.difficulty = difficulty;
        this.params = DIFFICULTY_PARAMS[difficulty];
        this.attackWaveSize = this.params.startingWaveSize;

        // ---- Pick strategy ----
        if (difficulty === AIDifficulty.Easy) {
            this.strategy = AIStrategy.Balanced;
        } else {
            const roll = Math.random();
            this.strategy = roll < 0.30 ? AIStrategy.Rush
                          : roll < 0.70 ? AIStrategy.Balanced
                          : AIStrategy.Boom;
        }
        this.strategyParams = STRATEGY_PARAMS[this.strategy];

        // Apply strategy garrison ratio
        this.forceAllocation.garrisonRatio = this.strategyParams.garrisonRatio;
        this.forceAllocation.attackRatio = 1 - this.strategyParams.garrisonRatio - 0.15;
        this.forceAllocation.supportRatio = 0.15;

        this.aiState.resources.supplies = 300 * this.params.resourceMult;
        this.aiState.resources.gold = 200 * this.params.resourceMult;
    }

    log(msg: string, color = '#66ccff') {
        // AI logs disabled
        // if (this.logCallback) {
        //     this.logCallback(`[AI Team ${this.team}]: ${msg}`, color);
        // }
    }

    // Throttle map: unitId -> last safeMoveTo timestamp
    private _lastMoveTime = new Map<number, number>();

    safeMoveTo(u: Unit, x: number, y: number, callback?: () => void): void {
        // NaN guard: reject invalid coordinates at the source
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;

        // --- TIER-5 BUGFIX: CHẶN PATHFINDING SPAM (cải tiến) ---
        // Chỉ áp dụng dedup khi unit đang di chuyển (Moving).
        // Nếu unit đang Idle hoặc Attacking thì CẦN nhận lệnh mới.
        if (u.state === UnitState.Moving) {
            // 1) Nếu điểm đến MỚI quá gần điểm đang đi (< 5 tiles), bỏ qua
            const distSq = (u.targetX - x) ** 2 + (u.targetY - y) ** 2;
            if (distSq < (TILE_SIZE * 5) ** 2) {
                return; // Destination too similar, keep current path
            }
            // 2) Throttle: không cho phép gọi moveTo quá nhanh (0.8s cooldown)
            const now = sharedIntel.gameTime;
            const lastTime = this._lastMoveTime.get(u.id) || 0;
            if (now - lastTime < 0.8) {
                return; // Too soon since last path reset
            }
            this._lastMoveTime.set(u.id, now);
        }

        const map = this.entityManager.map;
        if (map.isWaterAtWorld(x, y)) {
            const safe = map.findNearestWalkableWorld(x, y);
            if (safe) { u.moveTo(safe[0], safe[1], callback); }
            return;
        }
        u.moveTo(x, y, callback);
    }

    // ===== UPDATE — Main coordinator (delegates to domain modules) =====
    update(dt: number, particles: ParticleSystem): void {
        // NOTE: sharedIntel.gameTime is incremented ONCE in Game.ts before all AI updates
        for (const k in this.timers) (this.timers as any)[k] += dt;
        if (this.raidCooldown > 0) this.raidCooldown -= dt;

        // Calculate base position (fallback to unit centroid)
        const tc = this.entityManager.buildings.find(
            b => b.alive && b.team === this.team && b.type === BuildingType.TownCenter
        );
        if (tc) {
            this.baseX = tc.x;
            this.baseY = tc.y;
        } else {
            const units = this.entityManager.units.filter(u => u.alive && u.team === this.team && u.type !== UnitType.Scout);
            if (units.length > 0) {
                let sumX = 0, sumY = 0;
                for (const u of units) { sumX += u.x; sumY += u.y; }
                this.baseX = sumX / units.length;
                this.baseY = sumY / units.length;
            } else {
                this.baseX = (MAP_COLS * TILE_SIZE) / 2;
                this.baseY = (MAP_ROWS * TILE_SIZE) / 2;
            }
        }

        // Vision (throttled to 4 fps for performance)
        if (this.timers.combat >= 0.25 || this.timers.gather === 0) {
            updateVision(this);
        }

        // Passive income
        this.aiState.addResource(ResourceType.Supplies, 2 * this.params.resourceMult * dt);
        this.aiState.addResource(ResourceType.Gold, 0.8 * this.params.resourceMult * dt);

        // Update age-up progress (AI)
        const aiAgeUpDone = this.aiState.updateAgeUp(dt);

        // Sync age-up visual state to AI TC buildings
        for (const b of this.entityManager.buildings) {
            if (b.team === this.team && b.type === BuildingType.TownCenter) {
                b.isUpgrading = this.aiState.isAgingUp;
                b.upgradeProgress = this.aiState.ageUpPercent;
            }
        }

        if (aiAgeUpDone) {
            this.log(`🔥 Đã lên Đời ${this.aiState.age}! Công nghệ mở khóa!`, "#ffbb44");
            // Sync new age to all AI buildings & units
            for (const b of this.entityManager.buildings) {
                if (b.team === this.team && b.alive) {
                    b.age = this.aiState.age;
                    b.isUpgrading = false;
                    b.upgradeProgress = 0;
                }
            }
            for (const u of this.entityManager.units) {
                if (u.team === this.team && u.alive) u.age = this.aiState.age;
            }

            // ===== AGE-UP TIMING PUSH =====
            // Immediately trigger attack wave after aging up (power spike!)
            // Like AoE2's Castle Age push — leverage the tech advantage
            if (this.aiState.age >= 2 && this.waveState === 'gathering') {
                const military = this.entityManager.units.filter(
                    u => u.alive && u.team === this.team && !u.isVillager &&
                        (u.state === UnitState.Idle || u.state === UnitState.Moving)
                );
                // Only push if we have enough units (at least 60% of wave size)
                const minForPush = Math.ceil(this.attackWaveSize * 0.6);
                if (military.length >= minForPush) {
                    // Boost wave size for timing push (120% of normal)
                    this.attackWaveSize = Math.min(
                        this.params.maxWaveSize,
                        Math.ceil(this.attackWaveSize * 1.2)
                    );
                    this.timers.attack = 0; // Trigger attack ASAP
                    this.log(`⚔️ TIMING PUSH! Đời ${this.aiState.age} power spike! Tấn công ngay với ${military.length} quân!`, '#ff4400');
                }
            }
        }

        // Update research progress (AI)
        this.aiState.updateResearch(dt);

        // Wave state management (no longer handles 'supporting' — that's Support Squad now)
        if (this.waveState === 'attacking' ||
            this.waveState === 'counterattack' || this.waveState === 'pursuit') {
            this.waveResetTimer -= dt;
            if (this.waveResetTimer <= 0) {
                if (this.waveState === 'counterattack') {
                    this.waveState = 'attacking';
                    this.waveResetTimer = 30;
                    this.log(`⚔️ Phản công thành công! Chuyển sang tổng tấn công!`, '#ff4400');
                } else {
                    this.waveState = 'gathering';
                    this.counterAttackTarget = null;
                    this.pursuitTarget = null;
                }
            }
        }

        // ===== SUPPORT SQUAD MANAGEMENT =====
        if (this.supportSquad.size > 0) {
            this.supportSquadTimer -= dt;

            // Remove dead units from squad
            for (const id of this.supportSquad) {
                const unit = this.entityManager.units.find(u => u.id === id);
                if (!unit || !unit.alive) {
                    this.supportSquad.delete(id);
                }
            }

            // Auto-disband when timer expires
            if (this.supportSquadTimer <= 0) {
                // FIX: Check for ACTUAL ENEMIES near support target, not just any injured ally
                // The old check (any ally attacking + hp < maxHp) was too broad and kept
                // the squad active forever in late game
                let allyStillNeedsHelp = false;
                if (this.supportSquadTarget) {
                    const enemiesNearTarget = this.entityManager.units.some(
                        u => u.alive && !u.isVillager &&
                            this.entityManager.isEnemy(this.team, u.team) &&
                            Math.hypot(u.x - this.supportSquadTarget!.x, u.y - this.supportSquadTarget!.y) < TILE_SIZE * 20
                    );
                    allyStillNeedsHelp = enemiesNearTarget;
                }
                if (allyStillNeedsHelp && this.supportSquadTarget) {
                    // Extend timer but with a MAX extension count to prevent infinite loop
                    const extensions = ((this as any)._supportExtensions || 0) + 1;
                    (this as any)._supportExtensions = extensions;
                    if (extensions <= 3) {
                        this.supportSquadTimer = 15;
                        this.log(`🔄 Đồng minh vẫn cần giúp, gia hạn support squad! (${extensions}/3)`, '#00ffcc');
                    } else {
                        // Max extensions reached — force disband
                        this.log(`✅ Support Squad giải tán sau 3 lần gia hạn`, '#88ff88');
                        this.supportSquad.clear();
                        this.supportSquadTarget = null;
                        this.supportTarget = null;
                        (this as any)._supportExtensions = 0;
                    }
                } else {
                    // Disband squad — units return to normal duty
                    this.log(`✅ Support Squad giải tán (${this.supportSquad.size} lính trở về)`, '#88ff88');
                    this.supportSquad.clear();
                    this.supportSquadTarget = null;
                    this.supportTarget = null;
                    (this as any)._supportExtensions = 0;
                }
            }
        }

        // Retreating state
        if (this.waveState === 'retreating') {
            this.retreatRegroupTimer -= dt;
            if (this.retreatRegroupTimer <= 0) {
                // Single-pass: count military at rally + gather nearby enemies
                let atRallyCount = 0;
                const atRallyUnits: Unit[] = [];
                let ownPower = 0;
                for (const u of this.entityManager.units) {
                    if (!u.alive || u.team !== this.team || u.isVillager) continue;
                    const dist = Math.hypot(u.x - this.retreatRallyX, u.y - this.retreatRallyY);
                    if (dist < TILE_SIZE * 15) {
                        atRallyCount++;
                        atRallyUnits.push(u);
                        ownPower += u.attack + u.hp * 0.2;
                    }
                }
                let enemyPower = 0;
                for (const u of this.entityManager.units) {
                    if (!u.alive || !this.entityManager.isEnemy(this.team, u.team)) continue;
                    if (Math.hypot(u.x - this.retreatRallyX, u.y - this.retreatRallyY) < TILE_SIZE * 25) {
                        enemyPower += u.attack + u.hp * 0.2;
                    }
                }

                // === POST-RETREAT EVALUATION ===
                // Check reinforcements: are we stronger than before retreat?
                const preRetreatPower = (this as any)._preRetreatPower || 0;
                const reinforced = preRetreatPower > 0 && ownPower > preRetreatPower * 1.2;

                if ((ownPower > enemyPower * 1.2 && atRallyCount >= 4) || reinforced) {
                    this.waveState = 'counterattack';
                    this.counterAttackTarget = { x: this.retreatRallyX, y: this.retreatRallyY };
                    this.waveResetTimer = 30;
                    const reason = reinforced ? '🔥 VIỆN BINH ĐÃ ĐẾN!' : '💪 Đã tập hợp đủ lực lượng!';
                    this.log(`${reason} Phản công với ${atRallyCount} quân!`, '#ff8800');
                } else if (atRallyCount >= 3) {
                    this.retreatRegroupTimer = 10; // Wait more for reinforcements
                } else {
                    this.waveState = 'gathering';
                }
            }
        }

        // Decay timers
        if (this.supportTimer > 0) this.supportTimer -= dt;
        if (this.counterAttackTimer > 0) this.counterAttackTimer -= dt;
        if (this.pursuitTimer > 0) {
            this.pursuitTimer -= dt;
            if (this.pursuitTimer <= 0) {
                this.pursuitTarget = null;
                if (this.waveState === 'pursuit') this.waveState = 'gathering';
            }
        }

        // ===== DELEGATE TO DOMAIN MODULES =====
        // Scan for enemies periodically (every 0.5s) and cache the result
        let hasEnemies: boolean;
        if (this.timers.combat >= 0.5) {
            hasEnemies = 
                this.entityManager.units.some(u => u.alive && this.entityManager.isEnemy(this.team, u.team)) ||
                this.entityManager.buildings.some(b => b.alive && this.entityManager.isEnemy(this.team, b.team));
            this._cachedHasEnemies = hasEnemies;
        } else {
            hasEnemies = this._cachedHasEnemies;
        }

        if (!hasEnemies) {
            // No enemies found — but don't force-idle units that are actively attacking/moving
            // to prevent canceling in-progress attack waves
            if (this.waveState !== 'gathering') {
                this.waveState = 'gathering';
                this.supportTarget = null;
                this.counterAttackTarget = null;
                this.pursuitTarget = null;
            }
        } else {
            if (this.timers.combat >= 0.5) { this.timers.combat = 0; handleCombat(this); }
            // IMPORTANT: allyCheck runs BEFORE handleDefense so ally support gets priority
            if (this.timers.allyCheck >= 0.5) { this.timers.allyCheck = 0; checkAllyStatus(this); }
            if (this.timers.defend >= 0.5) { this.timers.defend = 0; handleDefense(this); }
            if (this.timers.coordination >= 5) { this.timers.coordination = 0; coordinateWithAllies(this); }
            if (this.timers.tactical >= 8) { this.timers.tactical = 0; tacticalReassessment(this); analyzeEnemyComposition(this); }
            if (this.difficulty !== AIDifficulty.Easy && this.timers.raid >= 15) { this.timers.raid = 0; handleRaiding(this); }
            if (this.difficulty === AIDifficulty.Hard && this.timers.micro >= 0.3) { this.timers.micro = 0; advancedMicro(this); }
            if (this.timers.scout >= this.params.patrolInterval) { this.timers.scout = 0; if (this.waveState === 'gathering') rallyTroops(this); }

            // Wave attack
            // FIX: Cap wavesSent contribution to max 5 waves worth of growth
            // Previously wavesSent grew infinitely, making attack delay 170s+ in late game
            const effectiveWavesSent = Math.min(this.wavesSent, 5);
            const baseAttackDelay = Math.min(
                this.params.attackInterval * 1.5, // Reduced cap from 2.0x to 1.5x
                this.params.attackInterval + effectiveWavesSent * this.params.attackWaveGrowth * 0.5
            );
            const attackDelay = baseAttackDelay * this.strategyParams.attackDelayMult;
            if (this.timers.attack >= attackDelay) { this.timers.attack = 0; sendAttackWave(this); }
        }

        // Economy & Training (run regardless of enemies)
        // In Free Mode, disable all economy and base building logic so it acts as a sandbox
        if (!this.entityManager.freeMode) {
            if (this.timers.ageUp > 5) { this.timers.ageUp = 0; autoAgeUp(this); autoResearch(this); }
            if (this.timers.gather >= 3) { this.timers.gather = 0; autoGather(this); smartVillagerManagement(this); }
            if (this.timers.build >= 12) { this.timers.build = 0; autoBuild(this); }
            if (this.timers.train >= this.params.trainInterval) { this.timers.train = 0; autoTrain(this); }

            // Auto-assign builders (throttled — runs with train timer)
            if (this.timers.train >= this.params.trainInterval * 0.5) {
                for (const b of this.entityManager.buildings) {
                    if (b.team !== this.team || b.built) continue;
                    const hasBuilder = this.entityManager.units.some(
                        u => u.alive && u.team === this.team && u.buildTarget === b
                    );
                    if (hasBuilder) continue;
                    const availableVillager = this.entityManager.units.find(
                        u => u.alive && u.team === this.team && u.isVillager && !u.manualCommand &&
                            (u.state === UnitState.Idle ||
                                (u.state === UnitState.Moving && !u.buildTarget && !u.targetResource))
                    );
                    if (availableVillager) availableVillager.buildAt(b);
                }
            }
        }



        cleanupIntel(this);
    }




    // ===== Utility methods (exposed via AIContext) =====

    calculateCombatPower(units: Unit[]): number {
        return calculateCombatPower(this, units);
    }

    selectBestTarget(attacker: Unit, range: number): Unit | null {
        return selectBestTarget(this, attacker, range);
    }

    callFocusFire(caller: Unit, target: Unit, aiUnits: Unit[]): void {
        callFocusFire(this, caller, target, aiUnits);
    }

    findAllyInCombat(x: number, y: number, range: number): Unit | null {
        return findAllyInCombat(this, x, y, range);
    }

    reportThreat(x: number, y: number, severity: number, targetTeam?: number): void {
        reportThreat(this, x, y, severity, targetTeam);
    }

    moveTowardEnemy(u: Unit): void {
        moveTowardEnemy(this, u);
    }

    checkExplorationComplete(): boolean {
        return checkExplorationComplete(this);
    }

    sendToExplore(u: Unit): void {
        sendToExplore(this, u);
    }

    returnScoutToArmy(u: Unit): void {
        returnScoutToArmy(this, u);
    }

    isPositionVisible(px: number, py: number): boolean {
        return isPositionVisible(this, px, py);
    }

    getScoutedEnemyBuildings(): Building[] {
        return getScoutedEnemyBuildings(this);
    }

    hasScoutedEnemy(): boolean {
        return hasScoutedEnemy(this);
    }

    evaluateBattlefield(): void {
        evaluateBattlefield(this);
    }

    handleVillagerCombat(u: Unit): void {
        handleVillagerCombat(this, u);
    }

    handleActiveAttacker(u: Unit, aiUnits: Unit[], isAggressive: boolean): void {
        handleActiveAttacker(this, u, aiUnits, isAggressive);
    }

    triggerRetreat(units: Unit[]): void {
        triggerRetreat(this, units);
    }

    calculateForceAllocation(): void {
        calculateForceAllocation(this);
    }

    initiateCounterAttack(military: Unit[], lastAttackedBuilding: Building): void {
        initiateCounterAttack(this, military, lastAttackedBuilding);
    }

    findNearestOwnTower(x: number, y: number): Building | null {
        let best: Building | null = null;
        let bestDist = Infinity;
        for (const b of this.entityManager.buildings) {
            if (!b.alive || b.team !== this.team || b.type !== BuildingType.Tower || !b.built) continue;
            const d = Math.hypot(b.x - x, b.y - y);
            if (d < bestDist) { bestDist = d; best = b; }
        }
        return best;
    }

    getOwnTowers(): Building[] {
        return this.entityManager.buildings.filter(
            b => b.alive && b.team === this.team && b.type === BuildingType.Tower && b.built
        );
    }

    getDefenseTrainingPriority(): DefenseTrainingPriority {
        return this.defenseTrainingPriority;
    }

    findNearestEnemyUnit(x: number, y: number, range: number): Unit | null {
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        return this.entityManager.findNearestEnemy(x, y, this.team, range);
    }

    findNearestEnemyBuilding(x: number, y: number, range: number) {
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        let best = null;
        let bestDist = range;
        for (const b of this.entityManager.buildings) {
            if (!b.alive || !this.entityManager.isEnemy(this.team, b.team)) continue;
            const d = Math.hypot(b.x - x, b.y - y);
            if (d < bestDist) { bestDist = d; best = b; }
        }
        return best;
    }

    findNearestAllyBuilding(x: number, y: number): Building | null {
        let best: Building | null = null;
        let bestDist = Infinity;
        for (const b of this.entityManager.buildings) {
            if (!b.alive || !this.entityManager.isAlly(this.team, b.team)) continue;
            const d = Math.hypot(b.x - x, b.y - y);
            if (d < bestDist) { bestDist = d; best = b; }
        }
        return best;
    }

    findNearestEnemyVillager(x: number, y: number, range: number): Unit | null {
        let best: Unit | null = null;
        let bestDist = range;
        for (const u of this.entityManager.units) {
            if (!u.alive || !this.entityManager.isEnemy(this.team, u.team)) continue;
            if (!u.isVillager) continue;
            const d = Math.hypot(u.x - x, u.y - y);
            if (d < bestDist) { bestDist = d; best = u; }
        }
        return best;
    }

    findNearestEnemyEcoBuilding(x: number, y: number, range: number): Building | null {
        let best: Building | null = null;
        let bestDist = range;
        for (const b of this.entityManager.buildings) {
            if (!b.alive || !this.entityManager.isEnemy(this.team, b.team)) continue;
            const d = Math.hypot(b.x - x, b.y - y);
            if (d < bestDist) { bestDist = d; best = b; }
        }
        return best;
    }

    findNearestResource(x: number, y: number) {
        let best = null;
        let bestDist = Infinity;
        for (const r of this.entityManager.resources) {
            if (!r.alive) continue;
            const d = Math.hypot(r.x - x, r.y - y);
            if (d < bestDist) { bestDist = d; best = r; }
        }
        return best;
    }

    findNearestResourceOfType(x: number, y: number, type: ResourceNodeType) {
        let best = null;
        let bestDist = Infinity;
        for (const r of this.entityManager.resources) {
            if (!r.alive || r.nodeType !== type) continue;
            const d = Math.hypot(r.x - x, r.y - y);
            if (d < bestDist) { bestDist = d; best = r; }
        }
        return best;
    }
}
