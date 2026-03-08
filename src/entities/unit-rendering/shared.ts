// ============================================================
//  Shared rendering utilities — CivColors, getCivColors
//  Single source of truth for civ-specific visual parameters
// ============================================================

import {
    CivilizationType, CIVILIZATION_DATA,
} from "../../config/GameConfig";
import type { Unit } from "../Unit";

/** Return type of getCivColors — shared across all renderers */
export type CivColors = ReturnType<typeof getCivColors>;

/** Get civilization-specific visual parameters */
export function getCivColors(unit: Unit) {
    const civ = unit.civilization;
    const civData = CIVILIZATION_DATA[civ];
    const accent = civData.accentColor;
    const secondary = civData.secondaryColor;
    const style = civData.helmetStyle;
    const teamBlue = unit.team === 0;

    // Base body colors per civilization — EACH CIV HAS A UNIQUE HUE
    // Team difference is subtle (lighter for player, darker for enemy)
    // so that civilizations are ALWAYS distinguishable
    let bodyLight: string, bodyMid: string, bodyDark: string;
    let skinColor = '#e8b87a';

    switch (civ) {
        case CivilizationType.BaTu:
            // GOLDEN / SANDY — warm desert tones (unique to BaTu)
            bodyLight = teamBlue ? '#c9a84c' : '#b8974a';
            bodyMid = teamBlue ? '#aa8a3a' : '#9a7a38';
            bodyDark = teamBlue ? '#8a6a28' : '#7a5a26';
            skinColor = '#d4a06a';
            break;
        case CivilizationType.DaiMinh:
            // CRIMSON RED — Chinese red (unique to DaiMinh)
            bodyLight = teamBlue ? '#cc3333' : '#bb2828';
            bodyMid = teamBlue ? '#aa2222' : '#991b1b';
            bodyDark = teamBlue ? '#881111' : '#771010';
            skinColor = '#e8c89a';
            break;
        case CivilizationType.Yamato:
            // BRIGHT INDIGO / VIOLET — samurai blue-violet (unique to Yamato)
            bodyLight = teamBlue ? '#5555aa' : '#4848a0';
            bodyMid = teamBlue ? '#444499' : '#3b3b8e';
            bodyDark = teamBlue ? '#333388' : '#2e2e7a';
            skinColor = '#eed8b0';
            break;
        case CivilizationType.LaMa:
            // IMPERIAL PURPLE / MAROON — Roman regal (unique to LaMa) 
            bodyLight = teamBlue ? '#8b2252' : '#7a1e48';
            bodyMid = teamBlue ? '#6a1a42' : '#5e1638';
            bodyDark = teamBlue ? '#4a1232' : '#40102a';
            break;
        case CivilizationType.Viking:
            // TEAL / STEEL BLUE-GREEN — Nordic cold (unique to Viking)
            bodyLight = teamBlue ? '#3a7a6a' : '#2e6e5e';
            bodyMid = teamBlue ? '#2a6a5a' : '#225e4e';
            bodyDark = teamBlue ? '#1a5a4a' : '#154e3e';
            break;
        default:
            bodyLight = teamBlue ? '#4488dd' : '#dd4444';
            bodyMid = teamBlue ? '#3377cc' : '#cc3333';
            bodyDark = teamBlue ? '#2266bb' : '#bb2222';
    }

    // Override body colors with slot color from lobby if set
    if (unit.slotColor) {
        const hex = unit.slotColor;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
        bodyLight = `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`;
        bodyMid = `rgb(${clamp(r * 0.8)},${clamp(g * 0.8)},${clamp(b * 0.8)})`;
        bodyDark = `rgb(${clamp(r * 0.6)},${clamp(g * 0.6)},${clamp(b * 0.6)})`;
    }

    return { accent, secondary, style, bodyLight, bodyMid, bodyDark, skinColor, teamBlue, civ };
}
