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

/** Darken a hex color by a factor (0 = black, 1 = original) */
function darken(hex: string, factor: number): string {
    // Handle rgb() format
    const rgbMatch = hex.match(/rgb\((\d+),(\d+),(\d+)\)/);
    let r: number, g: number, b: number;
    if (rgbMatch) {
        r = parseInt(rgbMatch[1]); g = parseInt(rgbMatch[2]); b = parseInt(rgbMatch[3]);
    } else {
        // hex format
        const h = hex.replace('#', '');
        r = parseInt(h.slice(0, 2), 16);
        g = parseInt(h.slice(2, 4), 16);
        b = parseInt(h.slice(4, 6), 16);
    }
    r = Math.round(r * factor); g = Math.round(g * factor); b = Math.round(b * factor);
    return `rgb(${r},${g},${b})`;
}

/** Get civilization-specific visual parameters */
export function getCivColors(unit: Unit) {
    const civ = unit.civilization;
    const civData = CIVILIZATION_DATA[civ];
    const accent = civData.accentColor;
    const secondary = civData.secondaryColor;
    const style = civData.helmetStyle;
    const teamBlue = unit.team === 0;
    const lvl = unit.upgradeLevel;

    // Base body colors per civilization — EACH CIV HAS A UNIQUE HUE
    // Team difference is subtle (lighter for player, darker for enemy)
    // so that civilizations are ALWAYS distinguishable
    let bodyLight: string, bodyMid: string, bodyDark: string;
    let skinColor = '#e8b87a';

    // Weapon/armor metal colors — get fiercer at lvl 3
    let metalLight: string, metalDark: string, bladeColor: string;

    switch (civ) {
        case CivilizationType.BaTu:
            // GOLDEN / SANDY — warm desert tones (unique to BaTu)
            bodyLight = teamBlue ? '#c9a84c' : '#b8974a';
            bodyMid = teamBlue ? '#aa8a3a' : '#9a7a38';
            bodyDark = teamBlue ? '#8a6a28' : '#7a5a26';
            skinColor = '#d4a06a';
            metalLight = '#ddd'; metalDark = '#aaa'; bladeColor = '#ccc';
            break;
        case CivilizationType.DaiMinh:
            // CRIMSON RED — Chinese red (unique to DaiMinh)
            bodyLight = teamBlue ? '#cc3333' : '#bb2828';
            bodyMid = teamBlue ? '#aa2222' : '#991b1b';
            bodyDark = teamBlue ? '#881111' : '#771010';
            skinColor = '#e8c89a';
            metalLight = '#ddd'; metalDark = '#aaa'; bladeColor = '#ccc';
            break;
        case CivilizationType.Yamato:
            // BRIGHT INDIGO / VIOLET — samurai blue-violet (unique to Yamato)
            bodyLight = teamBlue ? '#5555aa' : '#4848a0';
            bodyMid = teamBlue ? '#444499' : '#3b3b8e';
            bodyDark = teamBlue ? '#333388' : '#2e2e7a';
            skinColor = '#eed8b0';
            metalLight = '#ddd'; metalDark = '#aaa'; bladeColor = '#ccc';
            break;
        case CivilizationType.LaMa:
            // IMPERIAL PURPLE / MAROON — Roman regal (unique to LaMa) 
            bodyLight = teamBlue ? '#8b2252' : '#7a1e48';
            bodyMid = teamBlue ? '#6a1a42' : '#5e1638';
            bodyDark = teamBlue ? '#4a1232' : '#40102a';
            metalLight = '#ddd'; metalDark = '#aaa'; bladeColor = '#ccc';
            break;
        case CivilizationType.Viking:
            // TEAL / STEEL BLUE-GREEN — Nordic cold (unique to Viking)
            bodyLight = teamBlue ? '#3a7a6a' : '#2e6e5e';
            bodyMid = teamBlue ? '#2a6a5a' : '#225e4e';
            bodyDark = teamBlue ? '#1a5a4a' : '#154e3e';
            metalLight = '#ddd'; metalDark = '#aaa'; bladeColor = '#ccc';
            break;
        default:
            bodyLight = teamBlue ? '#4488dd' : '#dd4444';
            bodyMid = teamBlue ? '#3377cc' : '#cc3333';
            bodyDark = teamBlue ? '#2266bb' : '#bb2222';
            metalLight = '#ddd'; metalDark = '#aaa'; bladeColor = '#ccc';
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

    // ===== UPGRADE LEVEL 3 — FIERCE DARKENING =====
    // At max upgrade, armor becomes darker and more menacing
    if (lvl >= 3) {
        // Darken body/armor by 35% — makes everything look battle-hardened
        bodyLight = darken(bodyLight, 0.65);
        bodyMid = darken(bodyMid, 0.60);
        bodyDark = darken(bodyDark, 0.55);

        // Weapon metals become dark/obsidian-like per civ
        switch (civ) {
            case CivilizationType.BaTu:
                // Dark damascus steel — dark gold with black edge
                metalLight = '#4a3a20'; metalDark = '#2a1a08'; bladeColor = '#1a1410';
                break;
            case CivilizationType.DaiMinh:
                // Blood-soaked dark iron blades
                metalLight = '#3a1a1a'; metalDark = '#220808'; bladeColor = '#180808';
                break;
            case CivilizationType.Yamato:
                // Cursed black steel (tamahagane turned dark)
                metalLight = '#1a1a2a'; metalDark = '#0a0a18'; bladeColor = '#080812';
                break;
            case CivilizationType.Viking:
                // Uru-dark iron — almost black with green tint
                metalLight = '#1a2a20'; metalDark = '#0a1a10'; bladeColor = '#081208';
                break;
            default: // LaMa
                // Imperial obsidian — dark maroon-black
                metalLight = '#2a1020'; metalDark = '#180810'; bladeColor = '#100808';
                break;
        }
    }

    return { accent, secondary, style, bodyLight, bodyMid, bodyDark, skinColor, teamBlue, civ, metalLight, metalDark, bladeColor, lvl };
}
