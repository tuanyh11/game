// ============================================================
//  Rendering logic for the Target Dummy (Free Mode testing)
// ============================================================

import { Unit } from "../Unit";
import { C } from "../../config/GameConfig";
import { getCivColors } from "./shared";

export function drawTargetDummy(unit: Unit, ctx: CanvasRenderingContext2D, age: number, bob: number): void {
    const isMoving = unit.state === 1 || unit.state === 3; // Moving / Returning
    const legOffset = isMoving ? Math.sin(unit.animTimer * 20) * 3 : 0;

    // Impact shake if recently attacked
    let shakeX = 0;
    if (unit.hp < unit.maxHp) {
        // Since it has infinite HP, any damage makes it shake, but we use animTimer
        if (Math.random() < 0.1) shakeX = (Math.random() - 0.5) * 4;
    }

    ctx.save();
    ctx.translate(shakeX, 0);

    // X-shaped wooden base (legs)
    ctx.fillStyle = '#6b4f3b';
    ctx.fillRect(-6, 16 + bob, 12, 3);
    ctx.fillRect(-2, 12 + bob, 4, 7);

    // Thick wooden central pole
    ctx.fillStyle = '#8c6849';
    ctx.fillRect(-3, -10 + bob, 6, 24);

    // Wood grain detail on pole
    ctx.fillStyle = '#6b4f3b';
    ctx.fillRect(-2, -8 + bob, 1, 10);
    ctx.fillRect(1, -2 + bob, 1, 8);

    // Horizontal arm brace
    ctx.fillStyle = '#8c6849';
    ctx.fillRect(-9, -2 + bob, 18, 4);

    // Left arm target (Shield)
    ctx.fillStyle = '#a62e2e'; // Red painted shield
    ctx.beginPath();
    ctx.arc(-10, 0 + bob, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-10, 0 + bob, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-10, 0 + bob, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Right arm (Sword/Stick)
    ctx.fillStyle = '#5c4331';
    ctx.fillRect(8, -8 + bob, 2, 12);

    // Head (Straw sack / Wooden block)
    ctx.fillStyle = '#d1b98a'; // Straw color
    ctx.fillRect(-5, -20 + bob, 10, 12);

    // Tied rope around neck
    ctx.fillStyle = '#5c4331';
    ctx.fillRect(-6, -9 + bob, 12, 2);

    // Straw texture lines
    ctx.fillStyle = '#b89d6e';
    ctx.fillRect(-3, -18 + bob, 1, 6);
    ctx.fillRect(2, -16 + bob, 1, 5);

    // Painted Target on chest/pole
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 4 + bob, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a62e2e';
    ctx.beginPath();
    ctx.arc(0, 4 + bob, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}
