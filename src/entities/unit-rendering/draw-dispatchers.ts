// ============================================================
//  Scout + Swordsman dispatchers — route to per-civ renderers
//  Extracted from UnitRenderer.ts
// ============================================================

import { CivilizationType } from "../../config/GameConfig";
import type { Unit } from "../Unit";
import { getCivColors } from "./shared";
import { drawScout_BaTu } from "./civs/BaTuRenderer";
import { drawScout_DaiMinh } from "./civs/DaiMinhRenderer";
import { drawScout_Yamato } from "./civs/YamatoRenderer";
import { drawScout_LaMa } from "./civs/LaMaRenderer";
import { drawScout_Viking } from "./civs/VikingRenderer";
import { drawSwords_BaTu } from "./civs/BaTuRenderer";
import { drawSwords_DaiMinh } from "./civs/DaiMinhRenderer";
import { drawSwords_Yamato } from "./civs/YamatoRenderer";
import { drawSwords_LaMa } from "./civs/LaMaRenderer";
import { drawSwords_Viking } from "./civs/VikingRenderer";
import { drawSwordsFinish } from "./draw-swords-finish";

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
