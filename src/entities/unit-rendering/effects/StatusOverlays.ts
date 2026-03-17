// ============================================================
//  Status Overlays — Frozen, Healing, Hero Buff Aura, Level Up
//  Extracted from UnitRenderer.ts
// ============================================================

import { UnitType } from "../../../config/GameConfig";
import type { Unit } from "../../Unit";

export function renderFrozenOverlay(unit: Unit, ctx: CanvasRenderingContext2D, totalBob: number): void {
    ctx.globalAlpha = 0.35; ctx.fillStyle = '#88ddff';
    ctx.fillRect(-10, -20 + totalBob, 20, 32);
    ctx.globalAlpha = 0.2; ctx.fillStyle = '#aaeeff';
    ctx.fillRect(-8, -18 + totalBob, 16, 28);
    ctx.globalAlpha = 0.5; ctx.fillStyle = '#fff';
    ctx.fillRect(-10, -20 + totalBob, 4, 4); ctx.fillRect(6, -20 + totalBob, 4, 4);
    ctx.fillRect(-10, 8 + totalBob, 4, 4); ctx.fillRect(6, 8 + totalBob, 4, 4);
    ctx.globalAlpha = 0.3; ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-6, -16 + totalBob); ctx.lineTo(0, -8 + totalBob); ctx.lineTo(4, -14 + totalBob);
    ctx.moveTo(-4, 0 + totalBob); ctx.lineTo(2, 6 + totalBob); ctx.lineTo(6, 2 + totalBob);
    ctx.stroke();
    const sparkT = unit.animTimer * 3;
    for (let sp = 0; sp < 3; sp++) {
        const sx = Math.sin(sparkT + sp * 2.1) * 8;
        const sy = -10 + totalBob + Math.cos(sparkT * 1.5 + sp) * 12;
        ctx.globalAlpha = 0.4 + Math.sin(sparkT * 4 + sp) * 0.3;
        ctx.fillStyle = '#fff'; ctx.fillRect(sx - 1, sy - 1, 2, 2);
    }
    ctx.globalAlpha = 1;
}

export function renderHealingOverlay(unit: Unit, ctx: CanvasRenderingContext2D, totalBob: number): void {
    const healAlpha = Math.min(unit.healingTimer, 0.6);
    ctx.globalAlpha = healAlpha * 0.4; ctx.strokeStyle = '#44ff88'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0 + totalBob, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = healAlpha * 0.15; ctx.fillStyle = '#44ff88';
    ctx.beginPath(); ctx.arc(0, 0 + totalBob, 12, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = healAlpha * 0.8; ctx.fillStyle = '#44ff88';
    const crossY = -24 + totalBob + Math.sin(unit.animTimer * 6) * 2;
    ctx.fillRect(-1, crossY - 3, 2, 6); ctx.fillRect(-3, crossY - 1, 6, 2);
    for (let hs = 0; hs < 2; hs++) {
        const hsx = Math.sin(unit.animTimer * 5 + hs * 3.14) * 6;
        const hsy = -5 + totalBob - (unit.animTimer * 20 + hs * 10) % 20;
        ctx.globalAlpha = healAlpha * (0.3 + Math.sin(unit.animTimer * 8 + hs) * 0.2);
        ctx.fillStyle = '#88ffaa'; ctx.fillRect(hsx - 1, hsy - 1, 2, 2);
    }
    ctx.globalAlpha = 1;
}

export function renderHeroBuffAura(unit: Unit, ctx: CanvasRenderingContext2D, x: number, y: number): void {
    for (let i = 0; i < 3; i++) {
        if (unit.heroSkillActive[i] > 0) {
            const t = unit.heroSkillVfxTimer;
            const pulse = Math.sin(t * 6 + i * 2) * 0.15 + 0.3;
            const pulse2 = Math.sin(t * 4 + i * 1.5) * 0.1 + 0.2;
            const breathe = Math.sin(t * 3) * 2;

            let innerColor = '#ff440066', outerColor = '#ff880044', ringColor = '#ff6600';
            switch (unit.type) {
                case UnitType.HeroSpartacus:
                case UnitType.HeroMusashi:
                case UnitType.HeroRagnar:
                    if (i === 0) { innerColor = '#ff220066'; outerColor = '#ff660044'; ringColor = '#ff4400'; }
                    else { innerColor = '#ffd70066'; outerColor = '#ffee8844'; ringColor = '#ffd700'; }
                    break;
                case UnitType.HeroZarathustra:
                    if (i === 1) { innerColor = '#88ddff66'; outerColor = '#aaeeff44'; ringColor = '#88ddff'; }
                    else { innerColor = '#44ff4466'; outerColor = '#88ff8844'; ringColor = '#44ff44'; }
                    break;
                case UnitType.HeroQiJiguang:
                    if (i === 1) { innerColor = '#88ffaa66'; outerColor = '#aaffcc44'; ringColor = '#88ffaa'; }
                    else { innerColor = '#ff444466'; outerColor = '#ff666644'; ringColor = '#ff4444'; }
                    break;
            }

            ctx.globalAlpha = pulse; ctx.fillStyle = innerColor;
            ctx.beginPath(); ctx.arc(x, y - 2, 14 + breathe, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = pulse2; ctx.fillStyle = outerColor;
            ctx.beginPath(); ctx.arc(x, y - 2, 20 + i * 2 + breathe, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = pulse * 0.7; ctx.strokeStyle = ringColor; ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 6]); ctx.lineDashOffset = -t * 40 + i * 20;
            ctx.beginPath(); ctx.arc(x, y - 2, 18 + i * 3 + breathe * 0.5, 0, Math.PI * 2); ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = pulse * 0.9; ctx.fillStyle = ringColor;
            for (let s = 0; s < 3; s++) {
                const angle = t * 3 + s * Math.PI * 2 / 3 + i * 1.5;
                const orbitR = 16 + i * 2 + breathe;
                ctx.fillRect(x + Math.cos(angle) * orbitR - 1, (y - 2) + Math.sin(angle) * orbitR * 0.6 - 1, 2, 2);
            }
            ctx.globalAlpha = 1;
        }
    }
}

export function renderHeroLevelUp(unit: Unit, ctx: CanvasRenderingContext2D, x: number, y: number): void {
    if (unit.heroLevelUpTimer <= 0) return;
    const t = unit.heroLevelUpTimer;
    const progress = (2 - t) / 2;
    const radius1 = progress * 28, radius2 = progress * 22;
    const fade = Math.min(1, t * 0.9);

    ctx.globalAlpha = fade * 0.8; ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y - 4, radius1, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = fade * 0.5; ctx.strokeStyle = '#ffee88'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y - 4, radius2, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = fade * 0.15; ctx.fillStyle = '#ffd700';
    ctx.beginPath(); ctx.arc(x, y - 4, radius2, 0, Math.PI * 2); ctx.fill();

    ctx.globalAlpha = fade;
    for (let i = 0; i < 8; i++) {
        const a = progress * 4 + i * Math.PI / 4;
        const orbitR = radius1 * 0.85;
        ctx.fillStyle = i % 2 === 0 ? '#ffd700' : '#fff';
        ctx.save(); ctx.translate(x + Math.cos(a) * orbitR, y - 4 + Math.sin(a) * orbitR);
        ctx.rotate(a); ctx.fillRect(-1.5, -1.5, 3, 3); ctx.restore();
    }
    ctx.globalAlpha = 1;

    if (t > 1) {
        const textY = y - 32 - (2 - t) * 4;
        ctx.font = "bold 11px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00000088'; ctx.fillText(`LEVEL ${unit.heroLevel}!`, x + 1, textY + 1);
        ctx.fillStyle = '#ffd700'; ctx.fillText(`LEVEL ${unit.heroLevel}!`, x, textY);
        ctx.textAlign = 'left';
    }
}
