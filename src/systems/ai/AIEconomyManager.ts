// ============================================================
//  AI Economy Manager — Gather, build, train, age up, research
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
import { sharedIntel, AIDifficulty, AIStrategy } from "./AIConfig";
import type { DefenseTrainingPriority } from "./AIContext";
import { ParticleSystem } from "../../effects/ParticleSystem";
import { EntityManager } from "../EntityManager";
import { PlayerState } from "../PlayerState";
import { ResourceNode } from "../../entities/ResourceNode";



export function autoGather(ai: AIContext): void {
    const villagers = ai.entityManager.units.filter(
        u => u.alive && u.team === ai.team && u.isVillager && u.state === UnitState.Idle && !u.manualCommand
    );
    if (villagers.length === 0) return;

    const res = ai.aiState.resources;
    const needs: { type: ResourceNodeType; priority: number }[] = [
        { type: ResourceNodeType.GoldMine, priority: 200 / (res.gold + 1) },
        { type: ResourceNodeType.Tree, priority: 150 / (res.supplies + 1) },
    ];
    needs.sort((a, b) => b.priority - a.priority);

    for (let i = 0; i < villagers.length; i++) {
        const v = villagers[i];
        const targetType = needs[i % needs.length].type;

        let nearestRes = ai.findNearestResourceOfType(v.x, v.y, targetType);

        if (nearestRes) {
            v.gatherFrom(nearestRes, () =>
                ai.entityManager.findNearestDropOff(v.x, v.y, nearestRes!.resourceType, ai.team)
            );
        } else {
            // Fallback: try any resource
            const any = ai.findNearestResource(v.x, v.y);
            if (any) {
                v.gatherFrom(any, () =>
                    ai.entityManager.findNearestDropOff(v.x, v.y, any.resourceType, ai.team)
                );
            }
        }
    }
}

// ===================================================================
//  SMART VILLAGER MANAGEMENT
//  Ensures AI villagers never idle next to built farms or depleted resources
//  - Auto-assign idle villagers near farms to gather
//  - Detect unworked farms and dispatch workers
//  - Reassign villagers from depleted resources
// ===================================================================
export function smartVillagerManagement(ai: AIContext): void {
    const aiUnits = ai.entityManager.units.filter(
        u => u.alive && u.team === ai.team && u.isVillager && !u.manualCommand
    );
    const aiBuildings = ai.entityManager.buildings.filter(
        b => b.alive && b.team === ai.team && b.built
    );

    // === 1. IDLE VILLAGERS → Auto-assign to nearest resource ===
    const idleVillagers = aiUnits.filter(u => u.state === UnitState.Idle);
    for (const v of idleVillagers) {
        const nearest = ai.findNearestResource(v.x, v.y);
        if (nearest) {
            v.gatherFrom(nearest, () =>
                ai.entityManager.findNearestDropOff(v.x, v.y, nearest.resourceType, ai.team)
            );
        }
    }


    // === 3. VILLAGERS NEAR DEPLETED RESOURCES → Reassign immediately ===
    for (const v of aiUnits) {
        // Villager is gathering but target resource is dead/depleted
        if (v.state === UnitState.Gathering && v.targetResource && !v.targetResource.alive) {
            // Resource depleted! Find alternative immediately
            let sameType = ai.findNearestResourceOfType(v.x, v.y, v.targetResource.nodeType);



            if (sameType) {
                v.gatherFrom(sameType, () =>
                    ai.entityManager.findNearestDropOff(v.x, v.y, sameType!.resourceType, ai.team)
                );
            } else {
                // No same type resource or too far — fallback to any resource
                const anyRes = ai.findNearestResource(v.x, v.y);
                if (anyRes) {
                    v.gatherFrom(anyRes, () =>
                        ai.entityManager.findNearestDropOff(v.x, v.y, anyRes.resourceType, ai.team)
                    );
                }
            }
        }

        // Villager is idle and NOT near a farm → assigned by autoGather
        // BUT if they've been idle near a construction site, help build it
        if (v.state === UnitState.Idle) {
            // Check for unfinished buildings nearby that need a builder
            const unfinished = ai.entityManager.buildings.find(
                b => b.alive && b.team === ai.team && !b.built &&
                    Math.hypot(b.x - v.x, b.y - v.y) < TILE_SIZE * 8
            );
            if (unfinished) {
                // Check if no one is building it
                const hasBuilder = aiUnits.some(
                    u => u.buildTarget === unfinished && u.state === UnitState.Building
                );
                if (!hasBuilder) {
                    v.buildAt(unfinished);
                    continue;
                }
            }
        }
    }


}

export function autoBuild(ai: AIContext): void {
    const aiBuildings = ai.entityManager.buildings.filter(b => b.team === ai.team);

    // Recalc pop
    let maxPop = 0;
    for (const b of aiBuildings) if (b.built) maxPop += b.popProvided;
    ai.aiState.maxPopulation = maxPop;

    const aiUnits = ai.entityManager.units.filter(u => u.alive && u.team === ai.team);
    const pop = aiUnits.length;

    const tc = aiBuildings.find(b => b.type === BuildingType.TownCenter);
    if (!tc) return;

    // Helper: find a build position that keeps distance from existing buildings
    const findSafeBuildPosition = (
        minDistFromTC: number, maxDistFromTC: number,
        buildingSize: number, preferredAngle?: number
    ): { tileX: number; tileY: number } | null => {
        const allBuildings = ai.entityManager.buildings.filter(b => b.alive);
        const minGap = 3; // minimum tiles gap between buildings

        for (let attempt = 0; attempt < 20; attempt++) {
            const angle = preferredAngle !== undefined
                ? preferredAngle + (Math.random() - 0.5) * 0.8
                : Math.random() * Math.PI * 2;
            const dist = minDistFromTC + Math.random() * (maxDistFromTC - minDistFromTC);
            const tileX = Math.floor(tc.tileX + Math.cos(angle) * dist);
            const tileY = Math.floor(tc.tileY + Math.sin(angle) * dist);

            // Check: terrain is valid (not water, not occupied)
            if (!ai.entityManager.map.canPlace(tileX, tileY, buildingSize, buildingSize)) continue;

            // Check: is this position far enough from ALL existing buildings?
            let tooClose = false;
            for (const b of allBuildings) {
                // Calculate distance between building edges (not centers)
                const gapX = Math.max(0,
                    Math.abs(tileX + buildingSize / 2 - (b.tileX + b.tileW / 2))
                    - (buildingSize / 2 + b.tileW / 2)
                );
                const gapY = Math.max(0,
                    Math.abs(tileY + buildingSize / 2 - (b.tileY + b.tileH / 2))
                    - (buildingSize / 2 + b.tileH / 2)
                );
                if (gapX < minGap && gapY < minGap) {
                    tooClose = true;
                    break;
                }
            }
            if (!tooClose) {
                return { tileX, tileY };
            }
        }
        return null; // couldn't find safe position
    };

    // Build houses when near cap
    if (pop >= maxPop - 2 && ai.aiState.canAfford({ supplies: 30 })) {
        const pos = findSafeBuildPosition(5, 10, 2);
        if (pos) {
            ai.aiState.spend({ supplies: 30 });
            ai.entityManager.spawnBuilding(BuildingType.House, pos.tileX, pos.tileY, ai.team, false, undefined, ai.aiState.age);
        }
    }
    // Build additional Town Centers at age 2+ for expansion!
    if (ai.aiState.age >= 2 && ai.strategyParams.tcExpansion) {
        const tcCount = aiBuildings.filter(b => b.type === BuildingType.TownCenter && b.alive).length;
        const aiUnitsCount = aiUnits.length;
        // Build new TC when: age 2+, less than 3 TCs, have 15+ units (economy established)
        if (tcCount < 3 && aiUnitsCount >= 15 && ai.aiState.canAfford({ supplies: 375 })) {
            // Place new TC far from existing TCs (at least 15 tiles away)
            const existingTCs = aiBuildings.filter(b => b.type === BuildingType.TownCenter && b.alive);
            // Find position far from all existing TCs but near resources
            let bestPos: { tileX: number; tileY: number } | null = null;
            for (let attempt = 0; attempt < 30; attempt++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 15 + Math.random() * 15;
                const tileX = Math.floor(tc.tileX + Math.cos(angle) * dist);
                const tileY = Math.floor(tc.tileY + Math.sin(angle) * dist);

                // Must be far from all existing TCs
                let farEnough = true;
                for (const existingTC of existingTCs) {
                    if (Math.hypot(tileX - existingTC.tileX, tileY - existingTC.tileY) < 15) {
                        farEnough = false;
                        break;
                    }
                }
                if (!farEnough) continue;

                // Must be far from other buildings
                const allBldgs = ai.entityManager.buildings.filter(b => b.alive);
                let tooClose = false;
                for (const b of allBldgs) {
                    const gapX = Math.max(0, Math.abs(tileX + 1.5 - (b.tileX + b.tileW / 2)) - (1.5 + b.tileW / 2));
                    const gapY = Math.max(0, Math.abs(tileY + 1.5 - (b.tileY + b.tileH / 2)) - (1.5 + b.tileH / 2));
                    if (gapX < 3 && gapY < 3) { tooClose = true; break; }
                }
                if (tooClose) continue;

                // Check if there are resources nearby (within 12 tiles)
                const nearbyResources = ai.entityManager.resources.filter(
                    r => r.alive && Math.hypot(r.x - tileX * TILE_SIZE, r.y - tileY * TILE_SIZE) < TILE_SIZE * 12
                );
                if (nearbyResources.length >= 3) {
                    bestPos = { tileX, tileY };
                    break;
                }
            }

            if (bestPos) {
                ai.aiState.spend({ supplies: 375 });
                ai.entityManager.spawnBuilding(BuildingType.TownCenter, bestPos.tileX, bestPos.tileY, ai.team, false, undefined, ai.aiState.age);
                ai.log(`🏰 Xây Nhà Chính mới để mở rộng lãnh thổ! (TC #${tcCount + 1})`, '#ff8844');
            }
        }
    }

    // Build barracks if none
    const hasBarracks = aiBuildings.some(b => b.type === BuildingType.Barracks && b.built);
    if (!hasBarracks && ai.aiState.canAfford({ supplies: 175 })) {
        const pos = findSafeBuildPosition(5, 8, 3, Math.PI * 0.25); // prefer NE
        if (pos) {
            ai.aiState.spend({ supplies: 175 });
            ai.entityManager.spawnBuilding(BuildingType.Barracks, pos.tileX, pos.tileY, ai.team, false, undefined, ai.aiState.age);
        }
    }

    // Build stable at age 2+ (for cavalry!)
    if (ai.aiState.age >= 2) {
        const hasStable = aiBuildings.some(b => b.type === BuildingType.Stable);
        if (!hasStable && ai.aiState.canAfford({ supplies: 175, gold: 50 })) {
            const pos = findSafeBuildPosition(5, 9, 3, Math.PI * 0.75); // prefer NW
            if (pos) {
                ai.aiState.spend({ supplies: 175, gold: 50 });
                ai.entityManager.spawnBuilding(BuildingType.Stable, pos.tileX, pos.tileY, ai.team, false, undefined, ai.aiState.age);
                ai.log('🐴 Xây chuồng ngựa — mở khóa kỵ binh!', '#ccaa44');
            }
        }
    }

    // Build tower at age 2+ (TIER-2: strategic placement toward threat direction)
    if (ai.aiState.age >= 2) {
        const towerCount = aiBuildings.filter(b => b.type === BuildingType.Tower).length;
        const dtp = ai.getDefenseTrainingPriority();
        const maxTowers = dtp.needMoreTowers ? 4 : 2; // Tier-2: build more if needed

        if (towerCount < maxTowers && ai.aiState.canAfford({ supplies: 175 })) {
            // Tier-2: Place towers toward primary threat direction if known
            let angle: number;
            if (ai.threatDirectionConfidence > 0.3 && towerCount >= 2) {
                // Place additional towers toward where attacks come from
                const spread = (towerCount - 2) * 0.5;
                angle = ai.primaryThreatDirection + (Math.random() - 0.5) * spread;
            } else {
                angle = towerCount === 0 ? Math.PI * 1.5 : towerCount === 1 ? Math.PI * 0.5
                    : towerCount === 2 ? Math.PI : Math.PI * 0.25;
            }
            const pos = findSafeBuildPosition(4, 7, 2, angle);
            if (pos) {
                ai.aiState.spend({ supplies: 175 });
                ai.entityManager.spawnBuilding(BuildingType.Tower, pos.tileX, pos.tileY, ai.team, false, undefined, ai.aiState.age);
                if (dtp.needMoreTowers) {
                    ai.log(`🗼 Xây tháp phòng thủ chiến lược (${towerCount + 1}/${maxTowers})!`, '#ffaa00');
                }
            }
        }
    }

    // Build Hero Altar at age 2+
    if (ai.aiState.age >= 2) {
        const hasAltar = aiBuildings.some(b => b.type === BuildingType.HeroAltar);
        if (!hasAltar && ai.aiState.canAfford({ gold: 200, supplies: 100 })) {
            const pos = findSafeBuildPosition(5, 8, 3, Math.PI * 1.25); // prefer SW
            if (pos) {
                ai.aiState.spend({ gold: 200, supplies: 100 });
                ai.entityManager.spawnBuilding(BuildingType.HeroAltar, pos.tileX, pos.tileY, ai.team, false, undefined, ai.aiState.age);
            }
        }
    }

    // Build Blacksmith at age 2+
    if (ai.aiState.age >= 2) {
        const hasBlacksmith = aiBuildings.some(b => b.type === BuildingType.Blacksmith);
        if (!hasBlacksmith && ai.aiState.canAfford({ supplies: 150, gold: 50 })) {
            const pos = findSafeBuildPosition(5, 9, 2, Math.PI * 1.75); // prefer SE
            if (pos) {
                ai.aiState.spend({ supplies: 150, gold: 50 });
                ai.entityManager.spawnBuilding(BuildingType.Blacksmith, pos.tileX, pos.tileY, ai.team, false, undefined, ai.aiState.age);
            }
        }
    }

    // Build Market (Kho Tài Nguyên) — SMART: near distant resource clusters!
    // First Market: near TC for convenience (any age)
    const markets = aiBuildings.filter(b => b.type === BuildingType.Market && b.alive);
    if (markets.length === 0 && ai.aiState.canAfford({ supplies: 100 })) {
        const pos = findSafeBuildPosition(5, 8, 2, Math.PI);
        if (pos) {
            ai.aiState.spend({ supplies: 100 });
            ai.entityManager.spawnBuilding(BuildingType.Market, pos.tileX, pos.tileY, ai.team, false, undefined, ai.aiState.age);
            ai.log('📦 Xây Kho Tài Nguyên gần nhà chính.', '#88cc66');
        }
    }

    // Additional Markets: auto-build near distant resources (wood/gold/stone)
    // Check if any villager is gathering too far from a drop-off
    if (markets.length < 4 && ai.aiState.canAfford({ supplies: 100 })) {
        const gatherers = ai.entityManager.units.filter(
            u => u.alive && u.team === ai.team && u.isVillager &&
                (u.state === UnitState.Gathering || u.state === UnitState.Moving) &&
                u.targetResource && u.targetResource.alive
        );

        // Find gatherers who are far from any drop-off
        for (const v of gatherers) {
            const res = v.targetResource!;
            const nearestDropOff = ai.entityManager.findNearestDropOff(
                res.x, res.y, res.resourceType, ai.team
            );
            const dropDist = nearestDropOff
                ? Math.hypot(res.x - nearestDropOff.x, res.y - nearestDropOff.y)
                : Infinity;

            // If resource is > 10 tiles from nearest drop-off, build one nearby!
            if (dropDist > TILE_SIZE * 10) {
                // Make sure we don't build too close to existing Markets
                const tooCloseToMarket = markets.some(
                    m => Math.hypot(m.x - res.x, m.y - res.y) < TILE_SIZE * 8
                );
                if (tooCloseToMarket) continue;

                // Build Market near the resource
                const resTileX = Math.floor(res.x / TILE_SIZE);
                const resTileY = Math.floor(res.y / TILE_SIZE);

                // Try to find a safe position near the resource (not near TC)
                const allBldgs = ai.entityManager.buildings.filter(b => b.alive);
                let bestPos: { tileX: number; tileY: number } | null = null;
                for (let attempt = 0; attempt < 15; attempt++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 2 + Math.random() * 3;
                    const tryX = Math.floor(resTileX + Math.cos(angle) * dist);
                    const tryY = Math.floor(resTileY + Math.sin(angle) * dist);

                    let ok = true;
                    for (const b of allBldgs) {
                        const gapX = Math.max(0, Math.abs(tryX + 1 - (b.tileX + b.tileW / 2)) - (1 + b.tileW / 2));
                        const gapY = Math.max(0, Math.abs(tryY + 1 - (b.tileY + b.tileH / 2)) - (1 + b.tileH / 2));
                        if (gapX < 2 && gapY < 2) { ok = false; break; }
                    }
                    if (ok) { bestPos = { tileX: tryX, tileY: tryY }; break; }
                }

                if (bestPos) {
                    ai.aiState.spend({ supplies: 100 });
                    ai.entityManager.spawnBuilding(BuildingType.Market, bestPos.tileX, bestPos.tileY, ai.team, false, undefined, ai.aiState.age);
                    const resName = res.nodeType === ResourceNodeType.Tree ? 'rừng gỗ'
                        : res.nodeType === ResourceNodeType.GoldMine ? 'mỏ vàng'
                            : 'tài nguyên';
                    ai.log(`📦 Xây Kho Tài Nguyên gần ${resName} (xa nhà chính ${Math.round(dropDist / TILE_SIZE)} tiles)!`, '#88cc66');
                    break; // Only build one per tick
                }
            }
        }
    }
}

// ===== AGE ADVANCEMENT =====
export function autoAgeUp(ai: AIContext): void {
    // Strategy-aware: check if villager count meets threshold
    const villCount = ai.entityManager.units.filter(
        u => u.alive && u.team === ai.team && u.isVillager
    ).length;
    const ageIdx = Math.min(ai.aiState.age - 1, 2); // 0,1,2 for age 1→2, 2→3, 3→4
    const threshold = ai.strategyParams.ageUpVillagerThreshold[ageIdx];

    // Rush: threshold is 99 → effectively never voluntarily age up based on villager count
    // But force age-up if AI has enough military power (10+ military units) to not fall behind
    const militaryCount = ai.entityManager.units.filter(
        u => u.alive && u.team === ai.team && !u.isVillager
    ).length;
    const rushForceAgeUp = ai.strategy === AIStrategy.Rush && militaryCount >= 10;

    if (villCount < threshold && ai.strategy !== AIStrategy.Boom && !rushForceAgeUp) return;

    // Start age-up if eligible and not already in progress
    if (!ai.aiState.isAgingUp && ai.aiState.canAgeUp()) {
        ai.aiState.ageUp();
        ai.log(`⏳ [${ai.strategy.toUpperCase()}] Bắt đầu lên Đời ${ai.aiState.ageUpTargetAge}...`, "#ffbb44");
    }
}

export function autoResearch(ai: AIContext): void {
    if (ai.aiState.activeResearch) return; // Already researching

    const aiUnits = ai.entityManager.units.filter(u => u.alive && u.team === ai.team);

    // Count army composition for smart upgrade prioritization
    const meleeCount = aiUnits.filter(u => 
        u.type === UnitType.Spearman || u.type === UnitType.Swordsman
    ).length;
    const rangedCount = aiUnits.filter(u => u.type === UnitType.Archer).length;
    const cavalryCount = aiUnits.filter(u =>
        u.type === UnitType.Scout || u.type === UnitType.Knight
    ).length;
    const totalMilitary = meleeCount + rangedCount + cavalryCount;

    // === PRIORITY 1: Military upgrades based on army composition ===
    const militaryUpgrades: UpgradeType[] = [];
    
    if (totalMilitary > 0) {
        // Sort military upgrades by what the AI actually has most of
        const compPriority: [UpgradeType, number][] = [
            [UpgradeType.MeleeAttack, meleeCount],
            [UpgradeType.MeleeDefense, meleeCount],
            [UpgradeType.RangedAttack, rangedCount],
            [UpgradeType.RangedDefense, rangedCount],
            [UpgradeType.CavalryAttack, cavalryCount],
        ];
        // Sort by count descending — prioritize upgrades for units we have more of
        compPriority.sort((a, b) => b[1] - a[1]);
        for (const [upType] of compPriority) {
            militaryUpgrades.push(upType);
        }
    } else {
        // No military yet — default order
        militaryUpgrades.push(
            UpgradeType.MeleeAttack, UpgradeType.RangedAttack,
            UpgradeType.MeleeDefense, UpgradeType.RangedDefense,
            UpgradeType.CavalryAttack
        );
    }

    // Try military upgrades first
    for (const up of militaryUpgrades) {
        if (ai.aiState.canResearch(up)) {
            ai.aiState.startResearch(up);
            ai.log(`🔬 Nâng cấp quân sự: ${UPGRADE_DATA[up].name}`, "#aa88ff");
            return;
        }
    }

    // === PRIORITY 2: Economy upgrades (Market) ===
    const econUpgrades = [
        UpgradeType.GatherSupplies,
        UpgradeType.GatherGold,
        UpgradeType.CarryCapacity, UpgradeType.VillagerSpeed,
    ];
    for (const up of econUpgrades) {
        if (ai.aiState.canResearch(up)) {
            ai.aiState.startResearch(up);
            ai.log(`🔬 Nâng cấp kinh tế: ${UPGRADE_DATA[up].name}`, "#88aaff");
            return;
        }
    }

    // === PRIORITY 3: Special upgrades (age 3+) ===
    const specialUpgrades = [
        UpgradeType.EliteAttack, UpgradeType.EliteDefense,
        UpgradeType.MeleeHealth, UpgradeType.Architecture,
        UpgradeType.Cartography, UpgradeType.Trade,
    ];
    for (const up of specialUpgrades) {
        if (ai.aiState.canResearch(up)) {
            ai.aiState.startResearch(up);
            ai.log(`🔬 Nghiên cứu đặc biệt: ${UPGRADE_DATA[up].name}`, "#ffaa88");
            return;
        }
    }
}

export function autoTrain(ai: AIContext): void {
    const aiBuildings = ai.entityManager.buildings.filter(b => b.team === ai.team && b.built);
    const aiUnits = ai.entityManager.units.filter(u => u.alive && u.team === ai.team);

    // Count villagers
    const villCount = aiUnits.filter(u => u.isVillager).length;
    const maxVill = ai.strategyParams.maxVillagers;

    // Strategy-aware age-up saving
    const ageIdx = Math.min(ai.aiState.age - 1, 2);
    const ageThreshold = ai.strategyParams.ageUpVillagerThreshold[ageIdx];
    const shouldAgeUp = villCount >= ageThreshold;

    let savingForAgeUp = false;
    if (shouldAgeUp && !ai.aiState.isAgingUp && ai.aiState.age < 4) {
        savingForAgeUp = true;
    }

    // If saving for age up and NOT actively under heavy attack, skip training
    if (savingForAgeUp && !ai.earlyWarningActive && ai.defendingUnits.size === 0) {
        return; // Halt all training to save resources for Age Up
    }

    // ==== RUSH STRATEGY: Train military BEFORE villagers ====
    if (ai.strategyParams.trainMilitaryFirst && villCount >= 5) {
        // Train military first (handled below), then villagers only if excess food
    } else {
        // Normal/Boom: Train villagers from ALL TCs
        const allTCs = aiBuildings.filter(b => b.type === BuildingType.TownCenter && b.built);
        const tcMaxVill = Math.min(maxVill, allTCs.length * 8);
        if (villCount < tcMaxVill) {
            for (const tcBldg of allTCs) {
                if (tcBldg.trainQueue.length < 2 && ai.aiState.canAfford({ supplies: 50 })) {
                    ai.aiState.spend({ supplies: 50 });
                    tcBldg.trainQueue.push({ unitType: UnitType.Villager, progress: 0, time: 15 });
                }
            }
        }
    }

    // PRIORITY: Train Scout early if we haven't scouted enemy yet!
    const hasScout = aiUnits.some(u => u.type === UnitType.Scout);
    if (!hasScout && !ai.hasScoutedEnemy()) {
        // Train scout from barracks if no stable yet
        const trainBuilding = aiBuildings.find(
            b => (b.type === BuildingType.Barracks || b.type === BuildingType.Stable)
                && b.built && b.trainQueue.length < 2
        );
        if (trainBuilding && ai.aiState.canAfford({ supplies: 80 })) {
            ai.aiState.spend({ supplies: 80 });
            trainBuilding.trainQueue.push({ unitType: UnitType.Scout, progress: 0, time: 20 });
            ai.log('🔍 Huấn luyện Trinh Sát để khám phá bản đồ!', '#ffcc00');
        }
    }

    // BOOM: skip barracks/stable military training until boomMilitaryAge
    // (hero training still allowed below)
    let skipMilitaryTraining = false;
    if (ai.aiState.age < ai.strategyParams.boomMilitaryAge && ai.strategy === AIStrategy.Boom) {
        // Boom: don't train military yet, focus on economy
        // BUT still train if under attack!
        if (!ai.earlyWarningActive && ai.defendingUnits.size === 0) {
            skipMilitaryTraining = true;
        }
    }

    // Train military from ALL Barracks — ADAPTIVE COUNTER-COMPOSITION!
    if (!skipMilitaryTraining) {
    const allBarracks = aiBuildings.filter(b => b.type === BuildingType.Barracks && b.built && b.trainQueue.length < 3);
    for (const barracks of allBarracks) {
        // Count current army composition for smart training
        const spearCount = aiUnits.filter(u => u.type === UnitType.Spearman).length;
        const archerCount = aiUnits.filter(u => u.type === UnitType.Archer).length;
        const swordCount = aiUnits.filter(u => u.type === UnitType.Swordsman).length;

        let unitType = UnitType.Spearman;
        let cost: Record<string, number> = { supplies: 60 };

        if (ai.aiState.age >= 2) {
            const totalInfantry = spearCount + archerCount + swordCount;
            const archerRatio = totalInfantry > 0 ? archerCount / totalInfantry : 0;
            const swordRatio = totalInfantry > 0 ? swordCount / totalInfantry : 0;

            // ===== COUNTER-COMPOSITION LOGIC =====
            // Analyze what enemy is building and counter it!
            const ec = ai.enemyComposition;
            const enemyTotal = ec.total;

            // === TIER-2: ADAPTIVE DEFENSE TRAINING ===
            // If we have learned attack patterns, prioritize counter-units
            const dtp = ai.getDefenseTrainingPriority();
            const hasPatternData = dtp.lastUpdate > 0 && (sharedIntel.gameTime - dtp.lastUpdate) < 120;

            if (hasPatternData && ai.difficulty !== AIDifficulty.Easy) {
                // Use learned patterns to train counter-units for defense
                const maxNeed = Math.max(dtp.needAntiMelee, dtp.needAntiRanged, dtp.needAntiCavalry);
                if (maxNeed > 0.3) {
                    if (dtp.needAntiMelee >= dtp.needAntiRanged && dtp.needAntiMelee >= dtp.needAntiCavalry
                        && ai.aiState.canAfford({ supplies: 25, gold: 45 })) {
                        // Enemy heavy melee → Archers
                        unitType = UnitType.Archer;
                        cost = { supplies: 25, gold: 45 };
                    } else if (dtp.needAntiCavalry >= dtp.needAntiMelee && dtp.needAntiCavalry >= dtp.needAntiRanged) {
                        // Enemy heavy cavalry → Spearmen
                        unitType = UnitType.Spearman;
                        cost = { supplies: 60 };
                    } else if (dtp.needAntiRanged > 0.3 && ai.aiState.canAfford({ supplies: 60, gold: 30 })) {
                        // Enemy heavy ranged → Swordsmen (fast close-in)
                        unitType = UnitType.Swordsman;
                        cost = { supplies: 60, gold: 30 };
                    }
                }
            } else if (enemyTotal >= 3 && ai.difficulty !== AIDifficulty.Easy) {
                const enemyMeleeRatio = ec.melee / enemyTotal;
                const enemyRangedRatio = ec.ranged / enemyTotal;
                const enemyCavRatio = ec.cavalry / enemyTotal;

                // Counter-triangle: Melee > Cavalry > Ranged > Melee
                if (enemyMeleeRatio > 0.5 && ai.aiState.canAfford({ supplies: 25, gold: 45 })) {
                    // Enemy heavy melee → Build ARCHERS (ranged kite)
                    unitType = UnitType.Archer;
                    cost = { supplies: 25, gold: 45 };
                } else if (enemyRangedRatio > 0.4 && ai.aiState.canAfford({ supplies: 60, gold: 75 })) {
                    // Enemy heavy ranged → Need CAVALRY rush (fast close-in)
                    // Will be handled by stable training priority (below)
                    // For barracks, build fast Swordsmen to close gap
                    unitType = UnitType.Swordsman;
                    cost = { supplies: 60, gold: 30 };
                } else if (enemyCavRatio > 0.3) {
                    // Enemy heavy cavalry → Build SPEARMEN (anti-cavalry)
                    unitType = UnitType.Spearman;
                    cost = { supplies: 60 };
                } else {
                    // Balanced enemy → maintain balanced army
                    if (archerRatio < 0.3 && ai.aiState.canAfford({ supplies: 25, gold: 45 })) {
                        unitType = UnitType.Archer;
                        cost = { supplies: 25, gold: 45 };
                    } else if (ai.aiState.age >= 2 && swordRatio < 0.25 && ai.aiState.canAfford({ supplies: 60, gold: 30 })) {
                        unitType = UnitType.Swordsman;
                        cost = { supplies: 60, gold: 30 };
                    }
                }
            } else {
                // No intel yet → standard balanced training
                if (archerRatio < 0.3 && ai.aiState.canAfford({ supplies: 25, gold: 45 })) {
                    unitType = UnitType.Archer;
                    cost = { supplies: 25, gold: 45 };
                } else if (ai.aiState.age >= 3 && swordRatio < 0.25 && ai.aiState.canAfford({ supplies: 60, gold: 30 })) {
                    unitType = UnitType.Swordsman;
                    cost = { supplies: 60, gold: 30 };
                } else if (ai.aiState.age >= 2 && Math.random() < 0.4 && ai.aiState.canAfford({ supplies: 60, gold: 30 })) {
                    unitType = UnitType.Swordsman;
                    cost = { supplies: 60, gold: 30 };
                }
            }

            // Age 3+: chance to train civ-unique elite unit (strategy-aware)!
            if (ai.aiState.age >= 3 && Math.random() < ai.strategyParams.eliteTrainChance) {
                const aiCiv = ai.entityManager.getCivForTeam(ai.team);
                if (aiCiv) {
                    const eliteType = CIV_ELITE_UNIT[aiCiv];
                    const eliteCost = UNIT_DATA[eliteType].cost;
                    if (ai.aiState.canAfford(eliteCost)) {
                        unitType = eliteType;
                        cost = eliteCost as Record<string, number>;
                    }
                }
            }
        }

        if (ai.aiState.canAfford(cost)) {
            ai.aiState.spend(cost);
            barracks.trainQueue.push({ unitType, progress: 0, time: UNIT_DATA[unitType].trainTime });
        }
    }

    // Train cavalry from Stable (age 2+) — COUNTER-COMPOSITION CAVALRY
    if (ai.aiState.age >= 2) {
        const stable = aiBuildings.find(b => b.type === BuildingType.Stable && b.built && b.trainQueue.length < 2);
        if (stable) {
            const scoutCount = aiUnits.filter(u => u.type === UnitType.Scout).length;
            const knightCount = aiUnits.filter(u => u.type === UnitType.Knight).length;

            let unitType: UnitType;

            // Counter-composition: Heavy ranged → Rush with Knights!
            const ec = ai.enemyComposition;
            const enemyHeavyRanged = ec.total >= 3 && (ec.ranged / ec.total) > 0.4;

            if (scoutCount < 2) {
                // Always maintain 2 scouts for scouting/raiding
                unitType = UnitType.Scout;
            } else if (enemyHeavyRanged && ai.aiState.age >= 3) {
                // COUNTER: Rush knights into ranged backline!
                unitType = UnitType.Knight;
            } else if (ai.aiState.age >= 3) {
                // Age 3+: prioritize Knights, occasional Scout for raids
                if (knightCount < 4 || Math.random() < 0.7) {
                    unitType = UnitType.Knight;
                } else if (ai.raidActive && scoutCount < 4) {
                    unitType = UnitType.Scout; // Extra scouts for raiding
                } else {
                    unitType = UnitType.Knight;
                }
            } else {
                // Age 2: mostly Scouts (Knights not available yet)
                unitType = UnitType.Scout;
            }

            const cost = UNIT_DATA[unitType].cost;
            if (ai.aiState.canAfford(cost)) {
                ai.aiState.spend(cost);
                stable.trainQueue.push({ unitType, progress: 0, time: UNIT_DATA[unitType].trainTime });
                if (unitType === UnitType.Knight) {
                    ai.log('⚔️ Huấn luyện Kỵ Sĩ từ chuồng ngựa!', '#ffaa44');
                }
            }
        }
    }
    } // end skipMilitaryTraining guard
    // Train HERO from Hero Altar (limit 1 hero)
    const hasHero = aiUnits.some(u => u.isHero);
    if (!hasHero) {
        const altar = aiBuildings.find(b => b.type === BuildingType.HeroAltar && b.trainQueue.length === 0);
        if (altar) {
            const aiCiv = ai.entityManager.getCivForTeam(ai.team);
            if (aiCiv) {
                const civHeroes: Record<CivilizationType, UnitType> = {
                    [CivilizationType.LaMa]: UnitType.HeroSpartacus,
                    [CivilizationType.BaTu]: UnitType.HeroZarathustra,
                    [CivilizationType.DaiMinh]: UnitType.HeroQiJiguang,
                    [CivilizationType.Yamato]: UnitType.HeroMusashi,
                    [CivilizationType.Viking]: UnitType.HeroRagnar,
                };
                const heroType = civHeroes[aiCiv];
                if (heroType) {
                    const heroCost = UNIT_DATA[heroType].cost;
                    if (ai.aiState.canAfford(heroCost)) {
                        ai.aiState.spend(heroCost);
                        altar.trainQueue.push({ unitType: heroType, progress: 0, time: UNIT_DATA[heroType].trainTime });
                    }
                }
            }
        }
    }
}
