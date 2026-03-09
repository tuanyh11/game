// ============================================================
//  Scout + Swordsman dispatchers — route to per-civ renderers
//  Extracted from UnitRenderer.ts
// ============================================================

import { CivilizationType } from "../../config/GameConfig";
import type { Unit } from "../Unit";
import { getCivColors } from "./shared";
import { drawScout_BaTu, drawSwords_BaTu, drawSpears_BaTu, drawArchers_BaTu } from "./civs/BaTuRenderer";
import { drawScout_DaiMinh, drawSwords_DaiMinh, drawSpears_DaiMinh, drawArchers_DaiMinh } from "./civs/DaiMinhRenderer";
import { drawScout_Yamato, drawSwords_Yamato, drawSpears_Yamato, drawArchers_Yamato } from "./civs/YamatoRenderer";
import { drawScout_LaMa, drawSwords_LaMa, drawSpears_LaMa, drawArchers_LaMa } from "./civs/LaMaRenderer";
import { drawScout_Viking, drawSwords_Viking, drawSpears_Viking, drawArchers_Viking } from "./civs/VikingRenderer";
import { drawSwordsFinish, drawSpearsFinish, drawArchersFinish } from "./draw-swords-finish";

export function drawScout(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean): void {
    const cv = getCivColors(unit);
    const civ = cv.civ;
    const legOffset = moving ? Math.sin(unit.animTimer * 22) * 4 : 0;
    const lvl = unit.upgradeLevel;

    switch (civ) {
        case CivilizationType.BaTu:
            drawScout_BaTu(unit, ctx, age, bob, moving, legOffset, lvl, cv);
            break;
        case CivilizationType.DaiMinh:
            drawScout_DaiMinh(unit, ctx, age, bob, moving, legOffset, lvl, cv);
            break;
        case CivilizationType.Yamato:
            drawScout_Yamato(unit, ctx, age, bob, moving, legOffset, lvl, cv);
            break;
        case CivilizationType.Viking:
            drawScout_Viking(unit, ctx, age, bob, moving, legOffset, lvl, cv);
            break;
        default:
            drawScout_LaMa(unit, ctx, age, bob, moving, legOffset, lvl, cv);
            break;
    }
}

export function drawSwordsman(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean): void {
    const cv = getCivColors(unit);
    const legOffset = moving ? Math.sin(unit.animTimer * 22) * 3 : 0;
    const lvl = unit.upgradeLevel;
    const civ = cv.civ;

    // ---- CIVILIZATION-SPECIFIC SWORDSMAN ----
    switch (civ) {
        case CivilizationType.BaTu:
            drawSwords_BaTu(unit, ctx, age, bob, legOffset, lvl, cv);
            break;
        case CivilizationType.DaiMinh:
            drawSwords_DaiMinh(unit, ctx, age, bob, legOffset, lvl, cv);
            break;
        case CivilizationType.Yamato:
            drawSwords_Yamato(unit, ctx, age, bob, legOffset, lvl, cv);
            break;
        case CivilizationType.Viking:
            drawSwords_Viking(unit, ctx, age, bob, legOffset, lvl, cv);
            break;
        default:
            drawSwords_LaMa(unit, ctx, age, bob, legOffset, lvl, cv);
            break;
    }
}

export function drawSpearman(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean): void {
    const cv = getCivColors(unit);
    const legOffset = moving ? Math.sin(unit.animTimer * 22) * 3 : 0;
    const lvl = unit.upgradeLevel;
    const civ = cv.civ;

    // ---- CIVILIZATION-SPECIFIC SPEARMAN ----
    switch (civ) {
        case CivilizationType.BaTu:
            drawSpears_BaTu(unit, ctx, age, bob, legOffset, lvl, cv);
            break;
        case CivilizationType.DaiMinh:
            drawSpears_DaiMinh(unit, ctx, age, bob, legOffset, lvl, cv);
            break;
        case CivilizationType.Yamato:
            drawSpears_Yamato(unit, ctx, age, bob, legOffset, lvl, cv);
            break;
        case CivilizationType.Viking:
            drawSpears_Viking(unit, ctx, age, bob, legOffset, lvl, cv);
            break;
        default:
            drawSpears_LaMa(unit, ctx, age, bob, legOffset, lvl, cv);
            break;
    }
}

export function drawArcher(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean): void {
    const cv = getCivColors(unit);
    const legOffset = moving ? Math.sin(unit.animTimer * 22) * 3 : 0;
    const lvl = unit.upgradeLevel;
    const civ = cv.civ;

    switch (civ) {
        case CivilizationType.BaTu:
            drawArchers_BaTu(unit, ctx, age, bob, legOffset, lvl, cv);
            break;
        case CivilizationType.DaiMinh:
            drawArchers_DaiMinh(unit, ctx, age, bob, legOffset, lvl, cv);
            break;
        case CivilizationType.Yamato:
            drawArchers_Yamato(unit, ctx, age, bob, legOffset, lvl, cv);
            break;
        case CivilizationType.Viking:
            drawArchers_Viking(unit, ctx, age, bob, legOffset, lvl, cv);
            break;
        default:
            drawArchers_LaMa(unit, ctx, age, bob, legOffset, lvl, cv);
            break;
    }
}
