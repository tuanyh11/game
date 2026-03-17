const fs = require('fs');
const file = 'src/entities/unit-rendering/draw-knight-hero.ts';
let code = fs.readFileSync(file, 'utf8');

const imports = `
import { drawMusashiComplete } from './civs/heroes/draw-musashi';
import { drawSpartacusComplete } from './civs/heroes/draw-spartacus';
import { drawRagnarComplete } from './civs/heroes/draw-ragnar';
import { drawQiJiguangComplete } from './civs/heroes/draw-qijiguang';
import { drawZarathustraComplete } from './civs/heroes/draw-zarathustra';
`;

code = code.replace('import { drawBeautifulHorse } from "./draw-cavalry-unique";', 'import { drawBeautifulHorse } from "./draw-cavalry-unique";\n' + imports);

const startIdx = code.indexOf('export function drawHero(');
if (startIdx !== -1) {
    const newDrawHero = `export function drawHero(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number, moving: boolean, color: string, _symbol: string): void {
    const cv = getCivColors(unit);
    const legSwing = moving ? Math.sin(unit.animTimer * 12) * 3 : 0;
    const ht = unit.type;

    if (ht === UnitType.HeroMusashi) {
        drawMusashiComplete(unit, ctx, bob, moving, legSwing, cv);
    } else if (ht === UnitType.HeroSpartacus) {
        drawSpartacusComplete(unit, ctx, bob, moving, legSwing, cv);
    } else if (ht === UnitType.HeroRagnar) {
        drawRagnarComplete(unit, ctx, bob, moving, legSwing, cv);
    } else if (ht === UnitType.HeroQiJiguang) {
        drawQiJiguangComplete(unit, ctx, bob, moving, legSwing, cv);
    } else if (ht === UnitType.HeroZarathustra) {
        drawZarathustraComplete(unit, ctx, bob, moving, legSwing, cv);
    } else {
        // Fallback for unknown heroes
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(-5, -20 + bob, 10, 20);
    }

    // Hero level indicator
    if (unit.heroLevel > 1) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(\`\${unit.heroLevel}\`, 0, -32 + bob);
        ctx.textAlign = 'left';
    }
}
`;
    code = code.substring(0, startIdx) + newDrawHero;
    fs.writeFileSync(file, code);
    console.log('Successfully replaced drawHero');
} else {
    console.log('Failed to find drawHero');
}
