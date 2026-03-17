// ============================================================
//  Building Colors — Civilization-specific building color palettes
//  Extracted from Building.ts
// ============================================================

import { CivilizationType, CIVILIZATION_DATA, C } from "../../config/GameConfig";
import type { Building } from "../Building";

export type CivBuildingColors = {
    roofMain: string; roofLight: string; roofDark: string;
    wallMain: string; wallDark: string; wallHi: string;
    accentColor: string; teamColor: string; flagEmoji: string;
    civ: CivilizationType;
};

export function getCivBuildingColors(b: Building): CivBuildingColors {
    const civ = b.civilization;
    const civData = CIVILIZATION_DATA[civ];
    const age = b.age;
    const teamColor = b.slotColor || (b.team === 0 ? civData.accentColor : C.enemy);

    let roofMain: string, roofLight: string, roofDark: string;
    let wallMain: string, wallDark: string, wallHi: string;
    let accentColor: string, flagEmoji: string;

    switch (civ) {
        case CivilizationType.BaTu:
            roofMain = age >= 4 ? '#c9a84c' : age >= 3 ? '#b08040' : age >= 2 ? '#a08030' : '#8a6a20';
            roofLight = age >= 4 ? '#d9b85c' : age >= 3 ? '#c09050' : '#b09040';
            roofDark = age >= 4 ? '#9a7830' : age >= 3 ? '#806020' : '#6a5010';
            wallMain = age >= 3 ? '#e0d0b0' : age >= 2 ? '#d0c0a0' : '#c0b090';
            wallDark = age >= 3 ? '#b0a080' : '#a09070';
            wallHi = age >= 3 ? '#f0e0c0' : '#e0d0b0';
            accentColor = '#c9a84c';
            flagEmoji = '☀';
            break;
        case CivilizationType.DaiMinh:
            roofMain = age >= 4 ? '#aa2222' : age >= 3 ? '#882222' : age >= 2 ? '#773333' : '#663333';
            roofLight = age >= 4 ? '#cc3333' : age >= 3 ? '#993333' : '#884444';
            roofDark = age >= 4 ? '#661111' : age >= 3 ? '#551111' : '#441111';
            wallMain = age >= 3 ? '#8a8078' : age >= 2 ? '#7a7068' : '#6a6058';
            wallDark = age >= 3 ? '#5a5048' : '#4a4038';
            wallHi = age >= 3 ? '#9a9088' : '#8a8078';
            accentColor = '#dd3333';
            flagEmoji = '龍';
            break;
        case CivilizationType.Yamato:
            roofMain = age >= 4 ? '#1a1a2a' : age >= 3 ? '#2a2a3a' : age >= 2 ? '#3a3a4a' : '#4a3a30';
            roofLight = age >= 4 ? '#2a2a3a' : age >= 3 ? '#3a3a4a' : '#4a4a5a';
            roofDark = age >= 4 ? '#0a0a1a' : age >= 3 ? '#1a1a2a' : '#2a2a3a';
            wallMain = age >= 3 ? '#f0e8d8' : age >= 2 ? '#e0d8c8' : '#d0c8b8';
            wallDark = age >= 3 ? '#c0b8a8' : '#b0a898';
            wallHi = '#f8f0e0';
            accentColor = '#cc3333';
            flagEmoji = '菊';
            break;
        case CivilizationType.LaMa:
            roofMain = age >= 4 ? '#b08020' : age >= 3 ? '#3a4a6a' : age >= 2 ? '#3a5a8a' : '#6a2a10';
            roofLight = age >= 4 ? '#c09030' : age >= 3 ? '#4a5a7a' : '#4a6a9a';
            roofDark = age >= 4 ? '#906010' : age >= 3 ? '#2a3a5a' : '#2a4a7a';
            wallMain = age >= 3 ? '#c0b8a8' : age >= 2 ? '#a8a098' : '#8a8078';
            wallDark = age >= 3 ? '#8a8278' : '#6a6258';
            wallHi = age >= 3 ? '#d0c8b8' : '#b8b0a8';
            accentColor = '#daa520';
            flagEmoji = '🦅';
            break;
        case CivilizationType.Viking:
            roofMain = age >= 4 ? '#4a5a3a' : age >= 3 ? '#3a4a2a' : age >= 2 ? '#5a4a30' : '#6a5a40';
            roofLight = age >= 4 ? '#5a6a4a' : age >= 3 ? '#4a5a3a' : '#6a5a40';
            roofDark = age >= 4 ? '#2a3a1a' : age >= 3 ? '#1a2a0a' : '#3a2a10';
            wallMain = age >= 3 ? '#6a5a48' : age >= 2 ? '#5a4a38' : '#7a6a50';
            wallDark = age >= 3 ? '#4a3a28' : '#3a2a18';
            wallHi = age >= 3 ? '#7a6a58' : '#8a7a60';
            accentColor = '#5588bb';
            flagEmoji = '⚡';
            break;
        default:
            roofMain = '#6a2a10'; roofLight = '#7a3a18'; roofDark = '#5a2010';
            wallMain = '#8a8888'; wallDark = '#6a6a68'; wallHi = '#9a9a98';
            accentColor = '#daa520'; flagEmoji = '';
    }

    return { roofMain, roofLight, roofDark, wallMain, wallDark, wallHi, accentColor, teamColor, flagEmoji, civ };
}

export function darkenColor(hex: string, factor: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r * factor)},${Math.floor(g * factor)},${Math.floor(b * factor)})`;
}
