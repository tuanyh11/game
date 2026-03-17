import { Unit } from "../Unit";
import { CIVILIZATION_DATA, CivilizationType, UnitState } from "../../config/GameConfig";
import { CivColors } from "./shared";

export function drawBeautifulHorse(
    ctx: CanvasRenderingContext2D,
    walkBob: number,
    legSwing: number,
    baseColor: string,
    maneColor: string,
    darkColor: string,
    hoofColor: string
) {
    const drawLeg = (xl: number, isFront: boolean, isBack: boolean) => {
        ctx.fillStyle = isBack ? darkColor : baseColor;

        // Tính toán các khớp nối (khớp vai/hông, đầu gối, cổ chân)
        // Tạo chuyển động xoay (rotation) mượt mà hơn thay vì chỉ tịnh tiến (translate)
        const phase = isFront ? (isBack ? Math.PI : 0) : (isBack ? 0 : Math.PI);
        const swing = Math.sin(legSwing * 0.5 + phase);

        // Nâng chân lên khi đưa về phía trước
        const lift = Math.max(0, -swing) * 6;

        const kneeX = xl + swing * 4 + (isFront ? 2 : -2);
        const kneeY = 8 - lift * 0.5;

        const ankleX = xl + swing * 8 + (isFront ? 1 : -3);
        const ankleY = 16 - lift;

        const hoofX = ankleX + (isFront ? 2 : 1) + (swing > 0 ? swing * 2 : 0);
        const hoofY = ankleY + 2;

        ctx.beginPath();
        // Đùi / Vai
        if (isFront) {
            ctx.moveTo(xl - 3, 0);
            ctx.lineTo(xl + 6, 0);
        } else {
            ctx.moveTo(xl - 5, 0);
            ctx.lineTo(xl + 5, 0);
        }
        ctx.lineTo(kneeX + 2, kneeY);
        ctx.lineTo(kneeX - 2, kneeY);
        ctx.fill();

        // Ống chân
        ctx.beginPath();
        ctx.moveTo(kneeX - 2, kneeY);
        ctx.lineTo(kneeX + 2, kneeY);
        ctx.lineTo(ankleX + 1, ankleY);
        ctx.lineTo(ankleX - 1, ankleY);
        ctx.fill();

        // Móng ngựa
        ctx.fillStyle = hoofColor;
        ctx.beginPath();
        ctx.moveTo(ankleX - 1, ankleY);
        ctx.lineTo(ankleX + 2, ankleY);
        ctx.lineTo(hoofX + 2, hoofY);
        ctx.lineTo(hoofX - 2, hoofY);
        ctx.fill();
    };

    drawLeg(-12, false, true); // back-rear
    drawLeg(10, true, true);  // back-front

    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(-16, -12 + walkBob); // rear top
    ctx.quadraticCurveTo(-10, -18 + walkBob, 10, -18 + walkBob); // back
    ctx.quadraticCurveTo(18, -18 + walkBob, 20, -10 + walkBob); // shoulder
    ctx.quadraticCurveTo(22, -2 + walkBob, 10, 2 + walkBob); // chest
    ctx.quadraticCurveTo(0, 4 + walkBob, -14, 2 + walkBob); // belly
    ctx.quadraticCurveTo(-22, 0 + walkBob, -16, -12 + walkBob); // butt
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.moveTo(-14, 2 + walkBob);
    ctx.quadraticCurveTo(0, 4 + walkBob, 10, 2 + walkBob);
    ctx.quadraticCurveTo(22, -2 + walkBob, 20, -10 + walkBob);
    ctx.lineTo(20, -8 + walkBob);
    ctx.quadraticCurveTo(10, 4 + walkBob, -14, 4 + walkBob);
    ctx.fill();

    // Muscle highlights (thigh & shoulder)
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-18, -6 + walkBob);
    ctx.quadraticCurveTo(-14, 0 + walkBob, -8, -2 + walkBob);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(16, -12 + walkBob);
    ctx.quadraticCurveTo(10, -6 + walkBob, 14, 0 + walkBob);
    ctx.stroke();

    drawLeg(-16, false, false); // front-rear
    drawLeg(14, true, false);  // front-front

    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(10, -16 + walkBob);
    ctx.quadraticCurveTo(18, -26 + walkBob, 14, -34 + walkBob); // back neck
    ctx.lineTo(22, -32 + walkBob); // head connect
    ctx.quadraticCurveTo(26, -18 + walkBob, 16, -10 + walkBob); // front
    ctx.fill();

    ctx.fillStyle = maneColor;
    ctx.beginPath();
    ctx.moveTo(10, -16 + walkBob);
    ctx.quadraticCurveTo(18, -26 + walkBob, 14, -34 + walkBob);
    ctx.lineTo(10, -32 + walkBob);
    ctx.quadraticCurveTo(14, -24 + walkBob, 6, -14 + walkBob);
    ctx.fill();

    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(14, -34 + walkBob);
    ctx.lineTo(22, -32 + walkBob);
    ctx.lineTo(28, -20 + walkBob); // snout
    ctx.lineTo(30, -22 + walkBob); // lip
    ctx.lineTo(16, -36 + walkBob);
    ctx.fill();

    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.moveTo(22, -26 + walkBob);
    ctx.lineTo(28, -20 + walkBob);
    ctx.lineTo(30, -22 + walkBob);
    ctx.lineTo(26, -27 + walkBob);
    ctx.fill();

    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(14, -35 + walkBob);
    ctx.lineTo(12, -40 + walkBob);
    ctx.lineTo(17, -36 + walkBob);
    ctx.fill();
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.moveTo(14.5, -35.5 + walkBob);
    ctx.lineTo(13, -39 + walkBob);
    ctx.lineTo(16, -36 + walkBob);
    ctx.fill();

    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(19, -32 + walkBob, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Bridle (Dây cương)
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Nose band
    ctx.moveTo(27, -20 + walkBob);
    ctx.lineTo(24, -25 + walkBob);
    // Cheek strap
    ctx.lineTo(20, -32 + walkBob);
    // Brow band
    ctx.moveTo(18, -34 + walkBob);
    ctx.lineTo(22, -30 + walkBob);
    // Reins connecting down
    ctx.moveTo(24, -25 + walkBob);
    ctx.quadraticCurveTo(15, -15 + walkBob, 2, -10 + walkBob);
    ctx.stroke();

    // Gold bit
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(24, -25 + walkBob, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Tail (More flowing)
    ctx.fillStyle = maneColor;
    ctx.beginPath();
    ctx.moveTo(-16, -14 + walkBob);
    ctx.quadraticCurveTo(-28, -12 + walkBob, -30, 0 + walkBob);
    ctx.quadraticCurveTo(-24, 6 + walkBob, -26, 12 + walkBob);
    ctx.quadraticCurveTo(-20, 2 + walkBob, -16, -10 + walkBob);
    ctx.fill();
    // Tail strands highlight
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-18, -12 + walkBob);
    ctx.quadraticCurveTo(-26, -5 + walkBob, -26, 8 + walkBob);
    ctx.stroke();
}

export function drawCavalryDust(unit: Unit, ctx: CanvasRenderingContext2D, isMoving: boolean) {
    if (!isMoving) return;
    const civ = unit.civilization;
    let dustColor: string;
    let pColor: string;
    switch (civ) {
        case CivilizationType.BaTu: dustColor = '#c9a060'; pColor = '#e0c090'; break;
        case CivilizationType.Viking: dustColor = '#6a6a68'; pColor = '#8a8a88'; break;
        default: dustColor = '#8a7a60'; pColor = '#a89a80';
    }

    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 5; i++) {
        const lift = (unit.animTimer * 15 + i * 7) % 10;
        const spread = Math.sin(unit.animTimer * 8 + i) * 6;
        const dx = -16 - i * 3 + spread;
        const dy = 16 - lift;
        const size = 3 - (lift / 5);
        if (size > 0.5) {
            ctx.fillStyle = i % 2 === 0 ? dustColor : pColor;
            ctx.beginPath();
            ctx.arc(dx, dy, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const stomp = Math.sin(unit.animTimer * 18);
    if (stomp > 0.8) {
        ctx.fillStyle = dustColor;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(10, 20, 6, 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}


export function drawWarElephant(unit: Unit, ctx: CanvasRenderingContext2D, age: number, totalBob: number, isMoving: boolean, cv?: CivColors) {
    const bodyColor = '#7a7a7a';
    const darkSkin = '#5a5a5a';
    const shadowColor = 'rgba(0, 0, 0, 0.3)';
    const civColor = cv ? cv.bodyMid : CIVILIZATION_DATA[unit.civilization].secondaryColor;
    const isAttacking = unit.attackCooldown > 0 && unit.state === UnitState.Attacking;

    ctx.save();

    const rearing = 0; // No rearing — ranged bow attack
    ctx.translate(0, 0);
    ctx.rotate(rearing);

    ctx.save();
    ctx.scale(0.7, 0.7); // Compact but visible

    const walkBob = isMoving ? Math.sin(totalBob * 0.4) * 2 : 0;
    const legSwing = isMoving ? Math.sin(totalBob * 0.4) : 0; // Legs still when shooting

    // Simple elephant leg
    const drawLeg = (x: number, y: number, isDark: boolean, swing: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(swing);
        ctx.fillStyle = isDark ? darkSkin : bodyColor;
        ctx.fillRect(-4, 0, 8, 14);
        ctx.fillStyle = '#ccc';
        ctx.fillRect(-3, 13, 2, 1.5);
        ctx.fillRect(-0.5, 13, 2, 1.5);
        ctx.fillRect(2, 13, 2, 1.5);
        ctx.restore();
    };

    // Back legs
    drawLeg(-14, 2, true, -legSwing * 0.5);
    drawLeg(10, 2, true, legSwing * 0.5);

    // Tail
    ctx.strokeStyle = darkSkin;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, -6);
    ctx.quadraticCurveTo(-26, 0, -24, 8 + Math.sin(totalBob * 0.8) * 2);
    ctx.stroke();
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-24, 9 + Math.sin(totalBob * 0.8) * 2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, walkBob);

    // Body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(-8, -18);
    ctx.quadraticCurveTo(18, -18, 22, -4);
    ctx.quadraticCurveTo(18, 10, -4, 8);
    ctx.quadraticCurveTo(-22, 8, -20, -4);
    ctx.quadraticCurveTo(-18, -16, -8, -18);
    ctx.fill();

    // Belly shadow
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.moveTo(22, -4);
    ctx.quadraticCurveTo(18, 10, -4, 8);
    ctx.quadraticCurveTo(-22, 8, -20, -4);
    ctx.quadraticCurveTo(-4, 4, 22, -4);
    ctx.fill();

    // Body armor
    ctx.fillStyle = civColor;
    ctx.beginPath();
    ctx.moveTo(-8, -3);
    ctx.quadraticCurveTo(-12, 5, -4, 7);
    ctx.quadraticCurveTo(8, 7, 14, 0);
    ctx.lineTo(6, -3);
    ctx.fill();
    ctx.fillStyle = '#999';
    for (let r = 0; r < 2; r++)
        for (let c = 0; c < 3; c++)
            ctx.fillRect(-4 + c * 5, -1 + r * 3, 1, 1);

    // Front legs
    drawLeg(-18, 2, false, legSwing * 0.6);
    drawLeg(14, 2, false, -legSwing * 0.6);

    // Head
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(20, -8, 11, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.beginPath();
    ctx.moveTo(30, -4);
    if (isAttacking) {
        ctx.quadraticCurveTo(40, -16, 32, -24);
    } else {
        ctx.quadraticCurveTo(36 + legSwing * 4, 2, 28 + legSwing * 8, 12);
    }
    ctx.lineWidth = 6;
    ctx.strokeStyle = bodyColor;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Head armor
    ctx.fillStyle = civColor;
    ctx.beginPath();
    ctx.arc(20, -10, 8, -Math.PI * 0.8, Math.PI * 0.3);
    ctx.lineTo(32, -5);
    ctx.lineTo(24, 0);
    ctx.fill();
    ctx.strokeStyle = civColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Tusks
    ctx.fillStyle = '#fffff0';
    ctx.beginPath();
    ctx.moveTo(24, -2);
    ctx.quadraticCurveTo(38, 4, 44, -8);
    ctx.quadraticCurveTo(36, -2, 30, -2);
    ctx.fill();

    // Ear
    const earFlap = isMoving ? Math.sin(totalBob * 0.6) * 3 : 0;
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(12 - earFlap / 2, -8, 6 + earFlap, 10, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = darkSkin;
    ctx.beginPath();
    ctx.ellipse(12 - earFlap / 2, -8, 4 + earFlap / 2, 7, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(23, -12, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Riding Carpet
    ctx.fillStyle = civColor;
    ctx.fillRect(-14, -20, 28, 10);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(-14, -20, 28, 10);
    ctx.fillStyle = civColor;
    ctx.fillRect(-12, -19, 24, 1);
    ctx.fillRect(-12, -12, 24, 1);
    // Center diamond
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(0, -18); ctx.lineTo(4, -15); ctx.lineTo(0, -12); ctx.lineTo(-4, -15);
    ctx.fill();
    ctx.fillStyle = '#cc2222';
    ctx.beginPath();
    ctx.moveTo(0, -17); ctx.lineTo(2, -15); ctx.lineTo(0, -13); ctx.lineTo(-2, -15);
    ctx.fill();
    // Tassels
    ctx.fillStyle = civColor;
    for (let i = 0; i < 5; i++) ctx.fillRect(-12 + i * 5.5, -10, 1.5, 3);

    // Simple platform
    ctx.fillStyle = '#3a200d';
    ctx.fillRect(-10, -26, 20, 6);
    ctx.fillStyle = civColor;
    ctx.fillRect(-10, -26, 20, 1);
    ctx.fillRect(-10, -21, 20, 1);

    ctx.restore(); // END MOUNT SCALE

    // Rider
    ctx.save();
    ctx.translate(0, 2 + walkBob);
    ctx.scale(1.3, 1.3); // Scale rider to match elephant

    // ── Pullback animation (same system as Ba Tu archer) ──
    let pullback = 0;
    if (isAttacking) {
        const maxCd = unit.civAttackSpeed;
        const pullPhase = 1 - (unit.attackCooldown / maxCd);
        if (pullPhase > 0.3 && pullPhase < 0.9) {
            pullback = (pullPhase - 0.3) / 0.6;
        } else if (pullPhase >= 0.9) {
            pullback = 1;
        }
    }

    // Quiver on back (drawn first — behind body)
    ctx.save();
    ctx.translate(-5, -20);
    ctx.rotate(0.15);
    ctx.fillStyle = '#8a3a20';
    ctx.fillRect(-1, -4, 3, 10);
    ctx.fillStyle = civColor;
    ctx.fillRect(-1, -4, 3, 1);
    // Arrow tips
    ctx.fillStyle = '#ddd';
    ctx.fillRect(-0.5, -6, 0.7, 2);
    ctx.fillRect(0.5, -7, 0.7, 3);
    ctx.fillRect(1.5, -6, 0.7, 2);
    ctx.restore();

    // Torso — chainmail + tabard
    ctx.fillStyle = '#ccc';
    ctx.fillRect(-4, -22, 8, 7);
    ctx.fillStyle = civColor;
    ctx.fillRect(-3, -22, 6, 7);

    // Helmet (Kulah Khud)
    ctx.fillStyle = civColor;
    ctx.beginPath();
    ctx.arc(0, -25, 4, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = civColor;
    ctx.fillRect(-0.5, -30, 1, 4); // Spike
    ctx.fillStyle = '#999'; // Chainmail aventail
    ctx.fillRect(-4, -25, 8, 3);
    // Face
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(-3, -24, 6, 3);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, -23, 1, 1);
    ctx.fillRect(2, -23, 1, 1);

    // ── FRONT ARM (Right — holding Bow) ──
    ctx.save();
    let bowArmRot = isAttacking ? (-Math.PI / 2 + 0.2) : (-Math.PI / 6);
    ctx.translate(4, -19); // Right shoulder
    ctx.rotate(bowArmRot);

    // Upper arm — sleeve
    ctx.fillStyle = civColor;
    ctx.fillRect(-1.5, 0, 3, 4);
    // Bracer
    ctx.fillStyle = '#999';
    ctx.fillRect(-1.5, 4, 3, 3);

    // Bow — drawn at hand position
    ctx.save();
    ctx.translate(0, 7);
    ctx.rotate(-bowArmRot + (isAttacking ? 0.05 * pullback : 0.15));

    // Persian bow arc
    const bc = '#c9a84c';
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-3, 0, 8, -Math.PI * 0.42, Math.PI * 0.42);
    ctx.stroke();
    ctx.strokeStyle = bc;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(-3, 0, 8, -Math.PI * 0.32, -Math.PI * 0.1); ctx.stroke();
    ctx.beginPath(); ctx.arc(-3, 0, 8, Math.PI * 0.1, Math.PI * 0.32); ctx.stroke();
    // Grip
    ctx.fillStyle = '#6a3020';
    ctx.fillRect(-1, -1.5, 2, 3);

    // ── BOWSTRING & ARROW ──
    const bTopX = -3 + 8 * Math.cos(-Math.PI * 0.42);
    const bTopY = 0 + 8 * Math.sin(-Math.PI * 0.42);
    const bBotX = -3 + 8 * Math.cos(Math.PI * 0.42);
    const bBotY = 0 + 8 * Math.sin(Math.PI * 0.42);
    const maxPull = 10;
    const stringMidX = bTopX - pullback * maxPull;

    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(bTopX, bTopY);
    ctx.lineTo(stringMidX, 0);
    ctx.lineTo(bBotX, bBotY);
    ctx.stroke();

    // Arrow (visible when pulling)
    const hideArrow = isAttacking && pullback === 0 && unit.attackCooldown > unit.civAttackSpeed * 0.8;
    if (!hideArrow && isAttacking) {
        ctx.fillStyle = '#bb9966';
        ctx.fillRect(stringMidX, -0.4, 12, 0.8);
        // Arrowhead
        ctx.fillStyle = '#ddd';
        ctx.beginPath();
        ctx.moveTo(stringMidX + 12, -1.2);
        ctx.lineTo(stringMidX + 14.5, 0);
        ctx.lineTo(stringMidX + 12, 1.2);
        ctx.fill();
        // Feathers
        ctx.fillStyle = '#cc2222';
        ctx.fillRect(stringMidX, -1.2, 2, 0.8);
        ctx.fillRect(stringMidX, 0.4, 2, 0.8);
    }

    ctx.restore(); // End bow context

    // Hand gripping bow
    ctx.fillStyle = '#d4a373';
    ctx.beginPath(); ctx.arc(0, 8, 1.5, 0, Math.PI * 2); ctx.fill();

    ctx.restore(); // End Front Arm

    // ── BACK ARM (Left — drawstring pull) — drawn LAST (on top) ──
    ctx.save();
    ctx.translate(-3, -19); // Left shoulder

    let shoulderRot = 0;
    let elbowBend = 0;
    if (isAttacking) {
        shoulderRot = 0.0 - pullback * 0.4;
        elbowBend = -Math.PI / 4 - pullback * (Math.PI / 2.5);
    } else {
        shoulderRot = 0.1;
        elbowBend = -Math.PI / 5;
    }
    ctx.rotate(shoulderRot);

    // Upper arm
    ctx.fillStyle = civColor;
    ctx.fillRect(-2, 0, 4, 4);

    // Elbow → forearm
    ctx.save();
    ctx.translate(0, 4);
    ctx.rotate(elbowBend);

    // Forearm with bracer
    ctx.fillStyle = '#999';
    ctx.fillRect(-1.5, 0, 3, 3);
    // Hand
    ctx.fillStyle = '#d4a373';
    ctx.beginPath(); ctx.arc(0, 4.5, 2, 0, Math.PI * 2); ctx.fill();

    ctx.restore(); // End forearm
    ctx.restore(); // End back arm

    ctx.restore();
    ctx.restore();

    drawCavalryDust(unit, ctx, isMoving);
}


export function drawFireLancer(unit: Unit, ctx: CanvasRenderingContext2D, age: number, totalBob: number, isMoving: boolean) {
    const cv = getCivColors(unit);
    const civColor = cv.bodyMid;
    const isAttacking = unit.attackCooldown > unit.civAttackSpeed * 0.8;

    ctx.save();

    const rearing = (isAttacking && !isMoving) ? -0.2 : 0;
    ctx.translate(0, rearing ? -4 : 0);
    ctx.rotate(rearing);

    // --- SCALE ONLY THE MOUNT ---
    ctx.save();
    ctx.scale(0.80, 0.80);

    // Horse Body
    const walkBob = isMoving ? Math.sin(totalBob * 0.5) * 2 : 0;
    // If moving, gallop. If attacking, thrust legs for rearing impact.
    const legSwing = isMoving ? Math.sin(totalBob * 0.5) * 4 : (isAttacking ? Math.sin(unit.animTimer * 20) * 3 : 0);

    // Use upgraded horse drawing
    // Fire Lancer gets a cool black and grey warhorse
    drawBeautifulHorse(ctx, walkBob, legSwing, '#555555', '#111111', '#333333', '#000000');

    // Ming Dynasty Barding (Horse Armor)
    // Neck armor (Crinet)
    ctx.fillStyle = civColor;
    ctx.beginPath();
    ctx.moveTo(10, -20 + walkBob);
    ctx.lineTo(20, -30 + walkBob);
    ctx.lineTo(16, -10 + walkBob);
    ctx.fill();

    // Body armor (Crupper & Flanchard)
    ctx.fillStyle = civColor;
    ctx.beginPath();
    ctx.moveTo(-16, -15 + walkBob); // rear
    ctx.quadraticCurveTo(0, -18 + walkBob, 12, -10 + walkBob); // back line
    ctx.quadraticCurveTo(18, -4 + walkBob, 14, 2 + walkBob); // chest front
    ctx.quadraticCurveTo(0, 8 + walkBob, -14, 4 + walkBob); // bottom edge
    ctx.lineTo(-20, -4 + walkBob); // back thigh
    ctx.fill();

    // Armor scales mapping
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-15, -12 + walkBob + i * 4);
        ctx.quadraticCurveTo(0, -10 + walkBob + i * 4, 12, -6 + walkBob + i * 4);
        ctx.stroke();
    }

    // Gold trims
    ctx.fillStyle = cv.bodyLight;
    // Bottom trim with tassels
    ctx.beginPath();
    ctx.moveTo(-15, 4 + walkBob);
    ctx.quadraticCurveTo(0, 8 + walkBob, 15, 2 + walkBob);
    ctx.lineTo(15, 4 + walkBob);
    ctx.quadraticCurveTo(0, 10 + walkBob, -16, 6 + walkBob);
    ctx.fill();

    // Chest protection mirror
    ctx.fillStyle = '#eeeeee';
    ctx.beginPath();
    ctx.arc(14, -2 + walkBob, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = cv.bodyLight;
    ctx.stroke();

    // Red decorative tassels hanging from chest
    ctx.fillStyle = cv.accent;
    ctx.fillRect(13, 0 + walkBob, 1.5, 4);
    ctx.fillRect(15, 0 + walkBob, 1.5, 4);

    // Saddle Blanket
    ctx.fillStyle = '#331111';
    ctx.fillRect(-8, -19 + walkBob, 12, 4);
    ctx.fillStyle = cv.bodyLight;
    ctx.fillRect(-8, -15 + walkBob, 12, 1);

    ctx.restore(); // END MOUNT SCALE

    // Rider 
    ctx.save();
    ctx.translate(0, 4); // Shift rider down to match smaller horse
    ctx.translate(0, -14 + walkBob);
    ctx.rotate(-rearing * 0.8);

    // Rider Leg — only the front leg visible (2D side view)
    ctx.fillStyle = '#2a2018';
    ctx.save();
    ctx.translate(1, -1);
    ctx.rotate(0.15);
    // Thigh
    ctx.fillRect(-2.5, 0, 5, 6);
    // Knee guard
    ctx.fillStyle = '#444';
    ctx.fillRect(-2, 5, 4, 2);
    // Shin
    ctx.fillStyle = '#2a2018';
    ctx.fillRect(-2, 7, 4, 5);
    // Boot
    ctx.fillStyle = '#1a1008';
    ctx.fillRect(-3, 11, 6, 3);
    ctx.fillStyle = cv.bodyLight;
    ctx.fillRect(-2.5, 12, 5, 0.6);
    ctx.restore();

    // ── 披风 (Riding Cloak) — drawn behind body, flutters in wind ──
    ctx.save();
    ctx.translate(-5, -14);
    const windStr = isMoving ? 1.0 : 0.15;
    const w1 = Math.sin(unit.animTimer * 7) * 6 * windStr;
    const w2 = Math.sin(unit.animTimer * 11 + 1) * 3 * windStr;
    const w3 = Math.sin(unit.animTimer * 5 + 2) * 4 * windStr;

    // Main cloak body — deep red silk
    ctx.fillStyle = cv.accent;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-4 + w1, 6, -8 + w1, 14);
    ctx.quadraticCurveTo(-10 + w2, 22, -6 + w3, 28);
    ctx.lineTo(-1 + w3 * 0.3, 22);
    ctx.quadraticCurveTo(1, 10, 2, 0);
    ctx.fill();

    // Lighter inner fold
    ctx.fillStyle = cv.bodyLight;
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.quadraticCurveTo(-2 + w1 * 0.4, 8, -5 + w1 * 0.6, 16);
    ctx.lineTo(-2 + w3 * 0.2, 13);
    ctx.quadraticCurveTo(0, 6, 1, 2);
    ctx.fill();

    // Gold silk trim along edge
    ctx.strokeStyle = cv.bodyLight;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-4 + w1, 6, -8 + w1, 14);
    ctx.quadraticCurveTo(-10 + w2, 22, -6 + w3, 28);
    ctx.stroke();

    // Gold fringe at bottom
    ctx.fillStyle = cv.bodyLight;
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(-7 + w3 + i * 2, 27 + i * 0.5, 1, 2);
    }
    ctx.restore();

    // ── RIDER TORSO — 布面甲 (Cloth-Covered Brigandine) ──
    // Red cloth base over iron plates — distinctive Ming armor
    ctx.fillStyle = cv.bodyMid;
    ctx.fillRect(-6, -14, 12, 13);

    // Quilted horizontal stitching lines
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(-5, -12 + i * 2.5);
        ctx.lineTo(5, -12 + i * 2.5);
        ctx.stroke();
    }

    // Iron studs visible under cloth (rivets)
    ctx.fillStyle = '#888';
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
            ctx.beginPath();
            ctx.arc(-4 + col * 3, -11 + row * 3, 0.7, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Gold collar trim (护领)
    ctx.fillStyle = cv.bodyLight;
    ctx.fillRect(-6, -14, 12, 1.5);
    // Collar pattern
    ctx.fillStyle = '#c99a20';
    ctx.fillRect(-4, -14, 2, 1.5);
    ctx.fillRect(2, -14, 2, 1.5);

    // Chest protection mirror (护心镜) — polished bronze
    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    ctx.arc(0, -9, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = cv.bodyLight;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // Mirror center dot
    ctx.fillStyle = cv.bodyLight;
    ctx.beginPath();
    ctx.arc(0, -9, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Waist sash (腰带)
    ctx.fillStyle = cv.bodyLight;
    ctx.fillRect(-6, -3, 12, 2);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-1, -3, 2, 2);

    // Hanging armor skirt (甲裙) — cloth strips
    ctx.fillStyle = cv.bodyDark;
    ctx.fillRect(-5, -1, 3, 4);
    ctx.fillRect(-1, -1, 3, 4);
    ctx.fillRect(3, -1, 3, 4);
    // Gold trim at top
    ctx.fillStyle = cv.bodyLight;
    ctx.fillRect(-5, -1, 10, 0.5);

    // Shoulder guards (肩甲) — layered plates
    ctx.fillStyle = cv.bodyMid;
    ctx.fillRect(-8, -13, 3, 6);
    ctx.fillStyle = '#888'; // Iron studs on shoulder
    ctx.fillRect(-7, -12, 1, 1);
    ctx.fillRect(-7, -10, 1, 1);
    ctx.fillStyle = '#daab2b';
    ctx.fillRect(-8, -13, 3, 1);

    // ── HEAD — Ming Dynasty Helmet (明盔) ──
    // Face
    ctx.fillStyle = '#e8c89a';
    ctx.fillRect(-3, -19, 6, 5);

    // Thin moustache + goatee
    ctx.fillStyle = '#222';
    ctx.fillRect(-2, -16, 4, 0.7);
    ctx.fillRect(-0.5, -15.5, 1, 2);

    // Iron helmet bowl (凤翅盔 — Phoenix Wing Helmet)
    // Main dome — riveted iron plates
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(0, -20, 5.5, Math.PI, 0);
    ctx.fill();
    // Plate seam lines
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(0, -20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-3, -25); ctx.lineTo(-4, -20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(3, -25); ctx.lineTo(4, -20); ctx.stroke();

    // Tall spike finial (盔枪) — signature Ming feature
    ctx.fillStyle = '#555';
    ctx.fillRect(-0.8, -29, 1.6, 5);
    ctx.fillStyle = '#daab2b'; // Gold tip
    ctx.beginPath();
    ctx.moveTo(-1, -29);
    ctx.lineTo(0, -31);
    ctx.lineTo(1, -29);
    ctx.fill();

    // Red silk tassel ball (红缨) on spike
    const tassWave = isMoving ? Math.sin(unit.animTimer * 10) * 2 : Math.sin(unit.animTimer * 3) * 0.3;
    ctx.fillStyle = '#cc2222';
    ctx.beginPath();
    ctx.arc(0 + tassWave * 0.2, -29, 2, 0, Math.PI * 2);
    ctx.fill();
    // Tassel strands flowing down
    ctx.fillStyle = '#aa1111';
    ctx.fillRect(-0.7 + tassWave * 0.15, -27, 0.7, 3);
    ctx.fillRect(0.3 + tassWave * 0.15, -27, 0.7, 2.5);

    // Wide gold brim (盔沿)
    ctx.fillStyle = '#daab2b';
    ctx.fillRect(-6.5, -20, 13, 1.5);
    ctx.fillStyle = '#c99a20';
    ctx.fillRect(-7, -19, 14, 0.5);

    // Phoenix Wing ear guards (凤翅) — sweep upward
    ctx.fillStyle = '#555';
    // Left wing
    ctx.beginPath();
    ctx.moveTo(-5.5, -19);
    ctx.lineTo(-8, -22);
    ctx.lineTo(-6, -18);
    ctx.fill();
    // Right wing
    ctx.beginPath();
    ctx.moveTo(5.5, -19);
    ctx.lineTo(8, -22);
    ctx.lineTo(6, -18);
    ctx.fill();
    // Gold trim on wings
    ctx.strokeStyle = '#daab2b';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(-5.5, -19); ctx.lineTo(-8, -22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5.5, -19); ctx.lineTo(8, -22); ctx.stroke();

    // Cheek guards (护颊) — hanging plates
    ctx.fillStyle = '#555';
    ctx.fillRect(-5.5, -19, 2, 5);
    ctx.fillRect(3.5, -19, 2, 5);
    ctx.fillStyle = '#daab2b';
    ctx.fillRect(-5.5, -19, 2, 0.5);
    ctx.fillRect(3.5, -19, 2, 0.5);

    // Neck guard (顿项) — layered plates with gold rivets
    ctx.fillStyle = civColor;
    ctx.fillRect(-5, -15, 10, 3);
    ctx.fillStyle = '#daab2b';
    ctx.fillRect(-5, -15, 10, 0.5);
    ctx.fillRect(-5, -13.5, 10, 0.5);
    // Gold rivets
    ctx.fillStyle = '#daab2b';
    ctx.fillRect(-3, -14, 1, 1);
    ctx.fillRect(2, -14, 1, 1);

    // ── LEFT ARM + Shield (藤牌) — drawn after body so visible ──
    ctx.save();
    ctx.translate(-6, -10);
    ctx.rotate(-0.1);

    // Upper arm (armor sleeve)
    ctx.fillStyle = '#992222';
    ctx.fillRect(-2, 0, 4, 5);
    ctx.fillStyle = '#888';
    ctx.fillRect(-1, 1, 1, 1);

    // Forearm + hand
    ctx.fillStyle = '#444';
    ctx.fillRect(-1.5, 4, 3, 3);
    ctx.fillStyle = '#e8c89a';
    ctx.fillRect(-1, 6, 2, 2);

    // Round Shield (藤牌)
    ctx.save();
    ctx.translate(0, 4);

    // Shield body
    ctx.fillStyle = '#5c3a21';
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // Red lacquer ring
    ctx.strokeStyle = '#aa2222';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.stroke();

    // Gold trim outer ring
    ctx.strokeStyle = '#daab2b';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.stroke();

    // Iron boss center
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#daab2b';
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // End shield
    ctx.restore(); // End left arm

    // ── RIGHT ARM holding Fire Lance ──
    ctx.save();
    if (isAttacking) {
        ctx.translate(6, -8);
        ctx.rotate(Math.PI / 6); // Thrust forward
    } else {
        ctx.translate(4, -8);
        ctx.rotate(-Math.PI / 8); // Carry upright
    }

    // Upper arm (armor sleeve)
    ctx.fillStyle = '#992222';
    ctx.fillRect(-2, -2, 4, 6);
    // Arm armor studs
    ctx.fillStyle = '#888';
    ctx.fillRect(-1, 0, 1, 1);
    ctx.fillRect(-1, 3, 1, 1);

    // Forearm bracer
    ctx.fillStyle = '#444';
    ctx.fillRect(-1.5, 4, 3, 4);
    ctx.fillStyle = '#daab2b';
    ctx.fillRect(-1.5, 4, 3, 0.5);

    // Hand gripping pole
    ctx.fillStyle = '#e8c89a';
    ctx.fillRect(-1.5, 7, 3, 3);

    // Pole — long wooden shaft
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(-2, -4, 38, 2);

    // Red cloth grip wrap
    ctx.fillStyle = '#aa2222';
    ctx.fillRect(2, -5, 6, 4);
    ctx.fillStyle = '#882020';
    ctx.fillRect(3, -4, 1, 2);
    ctx.fillRect(6, -4, 1, 2);

    // Spearhead (柳叶枪 — willow leaf spear)
    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(36, -3);
    ctx.lineTo(42, -4);
    ctx.lineTo(44, -3);
    ctx.lineTo(42, -2);
    ctx.fill();
    // Edge highlight
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.moveTo(36, -3);
    ctx.lineTo(44, -3);
    ctx.stroke();

    // Red tassel below blade (枪缨)
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(34, -6, 2, 2);
    ctx.fillRect(34, -1, 2, 2);
    ctx.fillRect(33, -5, 1, 3);
    ctx.fillRect(33, 0, 1, 2);

    // Butt spike (枪纂)
    ctx.fillStyle = '#888';
    ctx.fillRect(-3, -4, 2, 2);

    ctx.restore(); // Restore weapon
    ctx.restore(); // Restore rider Y-offset
    ctx.restore(); // Restore toplevel unit translate

    drawCavalryDust(unit, ctx, isMoving);
}

export function drawYabusame(unit: Unit, ctx: CanvasRenderingContext2D, age: number, totalBob: number, isMoving: boolean) {
    const cv = getCivColors(unit);
    const civColor = CIVILIZATION_DATA[unit.civilization].secondaryColor;
    const isAttacking = unit.attackCooldown > 0 && unit.state === UnitState.Attacking;

    ctx.save();

    // No rearing — ranged bow attack, stays steady

    // --- SCALE ONLY THE MOUNT ---
    ctx.save();
    ctx.scale(0.80, 0.80);

    // Horse Body
    const walkBob = isMoving ? Math.sin(totalBob * 0.4) * 2 : 0;
    const legSwing = isMoving ? Math.sin(totalBob * 0.6) * 6 : 0; // Legs still when shooting

    // Use upgraded horse drawing
    // Yabusame gets a brown horse
    drawBeautifulHorse(ctx, walkBob, legSwing, '#6e472a', '#222222', '#4a2c11', '#111111');

    // Japanese Horse Armor (Umayoroi)
    // Bamen (Dragon face plate)
    ctx.fillStyle = cv.bodyMid;
    ctx.beginPath();
    ctx.moveTo(27, -20 + walkBob);
    ctx.lineTo(30, -22 + walkBob);
    ctx.lineTo(26, -26 + walkBob);
    ctx.lineTo(22, -26 + walkBob);
    ctx.fill();
    ctx.strokeStyle = '#daab2b';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Gold horns on bamen
    ctx.fillStyle = '#daab2b';
    ctx.fillRect(24, -28 + walkBob, 1, 3);
    ctx.fillRect(25, -28 + walkBob, 1, 3);

    // Neck Armor
    ctx.fillStyle = cv.bodyMid;
    ctx.beginPath();
    ctx.moveTo(10, -18 + walkBob);
    ctx.lineTo(18, -28 + walkBob);
    ctx.lineTo(13, -10 + walkBob);
    ctx.fill();

    // Body Armor (Scales)
    ctx.fillStyle = cv.bodyMid;
    ctx.beginPath();
    ctx.moveTo(-16, -14 + walkBob); // rear
    ctx.lineTo(-4, -18 + walkBob); // back line
    ctx.lineTo(12, -10 + walkBob); // front
    ctx.quadraticCurveTo(18, -4 + walkBob, 16, 2 + walkBob); // chest front
    ctx.lineTo(-14, 2 + walkBob); // bottom edge
    ctx.lineTo(-20, -4 + walkBob); // back thigh
    ctx.fill();

    // Armor lacing detail (Odoshi)
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(-12, -8 + walkBob, 26, 1);
    ctx.fillRect(-14, -4 + walkBob, 28, 1);
    ctx.fillRect(-16, 0 + walkBob, 30, 1);

    // Samurai Horse Tack (Kura & Shita-gura)
    // Saddle pad / blanket
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(-8, -19 + walkBob, 14, 5);
    ctx.fillStyle = '#daab2b'; // gold trim
    ctx.fillRect(-8, -15 + walkBob, 14, 1);

    // Shirigai (Crupper straps over the horse's rump with tassels)
    ctx.strokeStyle = '#881111';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-8, -18 + walkBob);
    ctx.quadraticCurveTo(-14, -14 + walkBob, -18, -10 + walkBob);
    ctx.stroke();
    // Tassel dropping from crupper
    ctx.fillStyle = '#cc3333';
    ctx.beginPath();
    ctx.moveTo(-16, -12 + walkBob);
    ctx.lineTo(-17, -8 + walkBob);
    ctx.lineTo(-15, -8 + walkBob);
    ctx.fill();

    // Chest strap (Munagai) with large Agemaki bow
    ctx.beginPath();
    ctx.moveTo(6, -18 + walkBob);
    ctx.quadraticCurveTo(10, -14 + walkBob, 12, -4 + walkBob);
    ctx.stroke();
    // Agemaki knot (red tassel decoration on chest)
    ctx.fillStyle = '#cc3333';
    ctx.beginPath();
    ctx.arc(10, -10 + walkBob, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -10 + walkBob);
    ctx.lineTo(8, -6 + walkBob);
    ctx.lineTo(12, -6 + walkBob);
    ctx.fill();

    ctx.restore(); // END MOUNT SCALE

    // Rider 
    ctx.save();
    ctx.translate(0, 4); // Shift rider down 4px
    ctx.translate(0, -14 + walkBob);

    // ── Pullback animation ──
    let pullback = 0;
    let attackProgress = 0;
    if (isAttacking) {
        const maxCd = unit.civAttackSpeed;
        const pullPhase = 1 - (unit.attackCooldown / maxCd);
        attackProgress = pullPhase;
        if (pullPhase > 0.3 && pullPhase < 0.9) {
            pullback = (pullPhase - 0.3) / 0.6;
        } else if (pullPhase >= 0.9) {
            pullback = 1;
        }
    }

    // Rider Legs
    ctx.fillStyle = '#222';
    ctx.fillRect(-4, -2, 8, 10);
    // Thigh guards (Haidate)
    ctx.fillStyle = cv.bodyDark;
    ctx.fillRect(-5, -2, 10, 5);
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(-5, 0, 10, 1);

    // Japanese Box Stirrup (Abumi) & Boots
    ctx.fillStyle = '#222';
    ctx.fillRect(-2, 7, 5, 2); // Foot in stirrup
    ctx.fillStyle = '#cc3333'; // Red lacquer stirrup
    ctx.beginPath();
    ctx.moveTo(-4, 9);
    ctx.lineTo(4, 9);
    ctx.lineTo(4, 7);
    ctx.lineTo(-1, 5);
    ctx.lineTo(-2, 7);
    ctx.fill();

    // Quiver (Yebira) on back
    ctx.fillStyle = '#3a200d';
    ctx.fillRect(-6, -16, 5, 12);
    // Arrows sticking out
    ctx.fillStyle = '#eeeeee';
    ctx.fillRect(-5, -20, 1, 4);
    ctx.fillRect(-3, -19, 1, 3);
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(-6, -20, 3, 2);

    // Rider Torso (Samurai Do)
    ctx.fillStyle = cv.bodyDark;
    ctx.fillRect(-6, -13, 11, 11);
    // Armor lacing
    ctx.fillStyle = '#cc3333';
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(-6, -11 + i * 3, 11, 1);
    }
    // Shoulder guards (Sode)
    ctx.fillStyle = cv.bodyDark;
    ctx.fillRect(-8, -13, 3, 6);
    ctx.fillRect(4, -13, 3, 6);
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(-8, -11, 3, 1);
    ctx.fillRect(4, -11, 3, 1);

    // Rider Head (Jingasa / Kabuto)
    ctx.fillStyle = '#ffccaa'; // Face
    ctx.fillRect(-4, -18, 8, 6);
    // Menpo (face mask)
    ctx.fillStyle = '#222';
    ctx.fillRect(-4, -15, 8, 3);
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(-2, -14, 4, 1); // fierce mouth

    // Jingasa hat with crest
    ctx.fillStyle = cv.bodyDark;
    ctx.beginPath();
    ctx.moveTo(-9, -16);
    ctx.lineTo(9, -16);
    ctx.lineTo(0, -23);
    ctx.fill();
    ctx.strokeStyle = '#cca84c'; // Gold crest rim
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── FRONT ARM (Right — holds Yumi bow) — anchored at shoulder ──
    ctx.save();
    const bowArmRot = isAttacking ? (-Math.PI / 2 + 0.2) : (-Math.PI / 6);
    ctx.translate(5, -12); // Right shoulder pivot
    ctx.rotate(bowArmRot);

    // Upper arm (Do sleeve)
    ctx.fillStyle = cv.bodyDark;
    ctx.fillRect(-2, 0, 4, 5);
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(-2, 0, 4, 1); // Red lacing
    // Kote (bracer)
    ctx.fillStyle = '#222';
    ctx.fillRect(-1.5, 4, 3, 3);
    // Hand
    ctx.fillStyle = '#ffccaa';
    ctx.beginPath(); ctx.arc(0, 8, 1.8, 0, Math.PI * 2); ctx.fill();

    // Yumi Bow — at hand position
    ctx.save();
    ctx.translate(0, 9);
    ctx.rotate(-bowArmRot + (isAttacking ? 0.05 * pullback : 0.15));

    // Asymmetrical Yumi (Long upper, short lower)
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -18); // Long upper limb
    ctx.quadraticCurveTo(7, -5, 0, 0);
    ctx.quadraticCurveTo(5, 4, 0, 8); // Short lower limb
    ctx.stroke();

    // Tsukamaki (red grip wrap)
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(-1, -2, 2, 4);

    // Bowstring & Arrow
    const maxPull = 8;
    const stringMidX = -pullback * maxPull;

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(stringMidX, -3);
    ctx.lineTo(0, 8);
    ctx.stroke();

    // Arrow (Ya)
    const hideArrow = isAttacking && pullback === 0 && unit.attackCooldown > unit.civAttackSpeed * 0.8;
    if (!hideArrow && isAttacking) {
        ctx.fillStyle = '#ddd';
        ctx.fillRect(stringMidX, -3.4, 14, 0.8);
        // Arrowhead (Yanone)
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.moveTo(stringMidX + 14, -4.5);
        ctx.lineTo(stringMidX + 17, -3);
        ctx.lineTo(stringMidX + 14, -1.5);
        ctx.fill();
        // Fletching (Hane) — red
        ctx.fillStyle = '#cc3333';
        ctx.fillRect(stringMidX, -4.5, 2, 1);
        ctx.fillRect(stringMidX, -2, 2, 1);
    }

    ctx.restore(); // End bow
    ctx.restore(); // End front arm

    // ── BACK ARM (Left — pulls bowstring) — anchored at shoulder ──
    ctx.save();
    ctx.translate(-6, -12); // Left shoulder pivot

    let shoulderRot = 0;
    let elbowBend = 0;
    if (isAttacking) {
        shoulderRot = -pullback * 0.4;
        elbowBend = -Math.PI / 4 - pullback * (Math.PI / 2.5);
    } else {
        shoulderRot = 0.1;
        elbowBend = -Math.PI / 5;
    }
    ctx.rotate(shoulderRot);

    // Upper arm
    ctx.fillStyle = cv.bodyDark;
    ctx.fillRect(-2, 0, 4, 5);
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(-2, 0, 4, 1); // Red lacing

    // Elbow → forearm
    ctx.save();
    ctx.translate(0, 5);
    ctx.rotate(elbowBend);

    // Kote (bracer)
    ctx.fillStyle = '#222';
    ctx.fillRect(-1.5, 0, 3, 3);
    // Hand
    ctx.fillStyle = '#ffccaa';
    ctx.beginPath(); ctx.arc(0, 4.5, 1.8, 0, Math.PI * 2); ctx.fill();

    ctx.restore(); // End forearm
    ctx.restore(); // End back arm

    ctx.restore(); // Restore rider Y-offset
    ctx.restore(); // Restore toplevel unit translate

    drawCavalryDust(unit, ctx, isMoving);
}

export function drawBearRider(unit: Unit, ctx: CanvasRenderingContext2D, age: number, totalBob: number, isMoving: boolean) {
    const cv = getCivColors(unit);
    const civColor = cv.bodyMid;
    const isRaging = unit.hp < unit.maxHp * 0.3;
    const isAttacking = unit.attackCooldown > unit.civAttackSpeed * 0.8;

    const rearing = (isAttacking && !isMoving) ? -0.15 : 0;
    ctx.translate(0, rearing ? -3 : 0);
    ctx.rotate(rearing);

    ctx.save();
    ctx.scale(0.90, 0.90); // Armored war bear

    // =====================================
    // WAR BEAR (Grizzly -> Polar Bear)
    // =====================================
    ctx.save();
    const walkBob = isMoving ? Math.sin(totalBob * 0.4) * 3 : 0;
    const legSwing = isMoving ? Math.sin(totalBob * 0.6) * 5 : (isAttacking ? Math.sin(unit.animTimer * 25) * 4 : 0);

    // Choose Fur color based on Age
    const isPolar = age >= 4;
    const bearColor = isPolar ? '#e0e5eb' : '#5c3a21'; // Polar white/gray vs Grizzly brown
    const darkBearColor = isPolar ? '#a0aab5' : '#3a200d';
    const highlightColor = isPolar ? '#ffffff' : '#7a4f2b';

    // Helper to draw massive furry bear legs with claws
    const drawBearLeg = (x: number, y: number, sw: number, isDark: boolean) => {
        ctx.fillStyle = isDark ? darkBearColor : bearColor;
        ctx.beginPath();
        // Thick massive legs tapering to huge paws
        ctx.moveTo(x - 5, y);
        ctx.lineTo(x + 6, y);
        ctx.lineTo(x + 5 - sw, y + 11);
        ctx.lineTo(x + 8 - sw, y + 13); // paw front
        ctx.lineTo(x - 5 - sw, y + 13); // paw back
        ctx.lineTo(x - 6 - sw, y + 8);
        ctx.fill();

        // Brutal Claws (Black/Dark grey for Polar, bone for Grizzly)
        ctx.fillStyle = isPolar ? '#222222' : '#cccccc';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x + 2 - sw + i * 2.5, y + 13);
            ctx.lineTo(x + 3.5 - sw + i * 2.5, y + 16);
            ctx.lineTo(x + 1 - sw + i * 2.5, y + 13);
            ctx.fill();
        }

        // Age 4 Iron Leg Bracers
        if (isPolar && !isDark) {
            ctx.fillStyle = '#444444';
            ctx.fillRect(x - 4 - sw, y + 5, 8, 4);
            ctx.fillStyle = '#111111'; ctx.fillRect(x - 4 - sw, y + 7, 8, 0.5); // band
        }
    };

    // Back Legs
    drawBearLeg(-14, 4, -legSwing, true);
    drawBearLeg(10, 4, legSwing, true);

    // Tail (stubby and furry)
    ctx.fillStyle = bearColor;
    ctx.beginPath(); ctx.arc(-22, -2 + walkBob, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = darkBearColor;
    ctx.beginPath(); ctx.arc(-23, -1 + walkBob, 2.5, 0, Math.PI * 2); ctx.fill();

    // ==================
    // TORSO (Massive, hulking frame)
    // ==================
    ctx.fillStyle = bearColor;
    ctx.beginPath();
    ctx.moveTo(-22, walkBob);
    ctx.quadraticCurveTo(-16, -16 + walkBob, -5, -18 + walkBob); // Back curve
    ctx.lineTo(-2, -20 + walkBob); // Extra fur spike
    ctx.lineTo(3, -17 + walkBob);
    ctx.quadraticCurveTo(12, -21 + walkBob, 17, -16 + walkBob); // Massive Shoulder hump
    ctx.quadraticCurveTo(34, -5 + walkBob, 28, 5 + walkBob); // Deep, thick Chest
    ctx.quadraticCurveTo(15, 16 + walkBob, 0, 12 + walkBob); // Hanging Belly
    ctx.quadraticCurveTo(-15, 12 + walkBob, -22, walkBob); // Rear curve
    ctx.fill();

    // Belly & shadow shading for more depth
    ctx.fillStyle = darkBearColor;
    ctx.beginPath();
    ctx.moveTo(28, 5 + walkBob);
    ctx.quadraticCurveTo(15, 16 + walkBob, 0, 12 + walkBob);
    ctx.quadraticCurveTo(-15, 12 + walkBob, -22, walkBob);
    ctx.quadraticCurveTo(-5, 8 + walkBob, 18, 0 + walkBob);
    ctx.fill();

    // Fur Highlights (extra shaggy details)
    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-16, -9 + walkBob); ctx.lineTo(-10, -7 + walkBob);
    ctx.moveTo(6, -12 + walkBob); ctx.lineTo(12, -9 + walkBob);
    ctx.moveTo(-6, 2 + walkBob); ctx.lineTo(0, 4 + walkBob);
    ctx.stroke();

    // Front Legs
    drawBearLeg(-18, 4, legSwing, false);
    drawBearLeg(14, 4, -legSwing, false);

    // ==================
    // BEAR BARDING (Age 4 Polar Armor)
    // ==================
    if (isPolar) {
        // Heavy Iron Chest Plate
        ctx.fillStyle = '#444444';
        ctx.beginPath();
        ctx.moveTo(10, -10 + walkBob);
        ctx.lineTo(26, -5 + walkBob);
        ctx.quadraticCurveTo(30, 2 + walkBob, 20, 8 + walkBob);
        ctx.lineTo(10, -10 + walkBob);
        ctx.fill();
        // Thick Iron Bosses/Rivets on Chest
        ctx.fillStyle = '#111111';
        ctx.beginPath(); ctx.arc(22, -1 + walkBob, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(17, 4 + walkBob, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(15, -4 + walkBob, 1.5, 0, Math.PI * 2); ctx.fill();
    }

    // ==================
    // HEAD & SNOUT
    // ==================
    ctx.fillStyle = bearColor;
    ctx.beginPath();
    ctx.arc(22, -9 + walkBob, 9, 0, Math.PI * 2);
    ctx.fill();

    // Snout and Mouth
    if (isAttacking || isRaging) {
        // Terrifying open-mouth roar
        ctx.fillStyle = bearColor;
        ctx.beginPath(); // Top jaw
        ctx.moveTo(26, -13 + walkBob);
        ctx.lineTo(38, -9 + walkBob); // nose tip stretches out
        ctx.lineTo(28, -5 + walkBob);
        ctx.fill();
        ctx.beginPath(); // Bottom jaw drops low
        ctx.moveTo(26, -4 + walkBob);
        ctx.lineTo(36, -1 + walkBob);
        ctx.lineTo(22, 1 + walkBob);
        ctx.fill();

        // Deep red inner mouth
        ctx.fillStyle = '#660000';
        ctx.beginPath();
        ctx.moveTo(28, -5 + walkBob);
        ctx.lineTo(35, -6 + walkBob);
        ctx.lineTo(26, -2 + walkBob);
        ctx.fill();

        // Huge Sharp Fangs
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(33, -9 + walkBob, 1.5, 3); // Top fang
        ctx.fillRect(32, -3 + walkBob, 1.5, -2.5); // Bottom fang

        // Nose
        ctx.fillStyle = '#111111';
        ctx.beginPath(); ctx.arc(38, -9 + walkBob, 2.5, 0, Math.PI * 2); ctx.fill();
    } else {
        // Closed mouth massive snout
        ctx.fillStyle = bearColor;
        ctx.beginPath();
        ctx.ellipse(28, -6 + walkBob, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Nose
        ctx.fillStyle = '#111111';
        ctx.beginPath(); ctx.arc(34, -7 + walkBob, 2.5, 0, Math.PI * 2); ctx.fill();
        // Snout Line
        ctx.strokeStyle = darkBearColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(34, -5 + walkBob); ctx.lineTo(26, -3 + walkBob); ctx.stroke();
    }

    // Iron Head Armor (Age 4)
    if (isPolar) {
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.arc(22, -12 + walkBob, 7, Math.PI, Math.PI * 2.2);
        ctx.lineTo(15, -12 + walkBob);
        ctx.fill();
        ctx.fillStyle = '#111111'; // Helmet rim
        ctx.fillRect(14, -12 + walkBob, 14, 1.5);
    } else {
        // Ears (Only fully visible if unarmored)
        ctx.fillStyle = bearColor;
        ctx.beginPath(); ctx.arc(17, -17 + walkBob, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = darkBearColor;
        ctx.beginPath(); ctx.arc(17, -17 + walkBob, 2, 0, Math.PI * 2); ctx.fill();
    }

    // ==================
    // EYES (Glowing state)
    // ==================
    if (isRaging) {
        // Berserk Mode - Red trail for Grizzly, Bright Ice Blue for Polar
        const rageColor = isPolar ? 'rgba(0, 200, 255, 0.9)' : 'rgba(255, 30, 0, 0.9)';
        const eyeColor = isPolar ? '#e0ffff' : '#ffcccc'; // White hot center

        ctx.fillStyle = rageColor;
        ctx.beginPath();
        const trailLen = 10 + Math.random() * 5;
        ctx.moveTo(25, -11 + walkBob);
        ctx.quadraticCurveTo(15, -13 + walkBob, 25 - trailLen, -15 + walkBob - Math.random() * 2);
        ctx.lineTo(25, -9 + walkBob);
        ctx.fill();

        ctx.fillStyle = eyeColor;
        ctx.fillRect(23, -12 + walkBob, 2.5, 2.5);
    } else {
        // Normal intimidating eye
        ctx.fillStyle = isPolar ? '#66ccff' : '#111111'; // Icy blue for polar, black for grizzly
        ctx.fillRect(24, -12 + walkBob, 2.5, 2.5);
    }

    // Heavy Angry eyebrow
    if (!isPolar) {
        ctx.strokeStyle = darkBearColor;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(21, -15 + walkBob); ctx.lineTo(27, -12 + walkBob); ctx.stroke();
    }


    // War Harness & Armor
    ctx.fillStyle = '#222';
    ctx.fillRect(-8, -16 + walkBob, 16, 14);
    // Civ war blanket
    ctx.fillStyle = civColor;
    ctx.fillRect(-10, -14 + walkBob, 20, 10);
    // Gold trim
    ctx.fillStyle = cv.bodyLight;
    ctx.fillRect(-10, -5 + walkBob, 20, 1);
    ctx.fillRect(-10, -14 + walkBob, 20, 1);

    // Spiked Iron Collar
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.moveTo(8, -14 + walkBob);
    ctx.lineTo(20, -18 + walkBob);
    ctx.lineTo(20, -10 + walkBob);
    ctx.lineTo(8, -8 + walkBob);
    ctx.fill();
    ctx.fillStyle = '#aaa';
    // Spikes
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(10 + i * 4, -17 + walkBob);
        ctx.lineTo(12 + i * 4, -22 + walkBob);
        ctx.lineTo(14 + i * 4, -17 + walkBob);
        ctx.fill();
    }

    // Iron chain barding on sides
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 0.8;
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 5; c++) {
            ctx.beginPath();
            ctx.arc(-6 + c * 4 + (r % 2) * 2, -10 + r * 3 + walkBob, 1.5, 0, Math.PI);
            ctx.stroke();
        }
    }

    ctx.restore(); // Undo bear scale
    ctx.restore(); // END GLOBAL SCALE

    drawCavalryDust(unit, ctx, isMoving);
}
import { getCivColors } from "./shared";

export function drawEquites(unit: Unit, ctx: CanvasRenderingContext2D, age: number, totalBob: number, isMoving: boolean) {
    const cv = getCivColors(unit);
    const civColor = CIVILIZATION_DATA[unit.civilization].secondaryColor;
    const isAttacking = unit.attackCooldown > unit.civAttackSpeed * 0.8;
    const isBlocking = unit.centurionBlockCooldown > 11; // Visual shield flare immediately after blocking
    const pilumReady = unit.passiveCooldown <= 0;

    ctx.save();

    const rearing = (isAttacking && !isMoving) ? -0.2 : 0;
    ctx.translate(0, rearing ? -4 : 0);
    ctx.rotate(rearing);

    // --- SCALE ONLY THE MOUNT ---
    ctx.save();
    ctx.scale(0.80, 0.80);

    // Horse Body
    const walkBob = isMoving ? Math.sin(totalBob * 0.5) * 2 : 0;
    const legSwing = isMoving ? Math.sin(totalBob * 0.5) * 4 : (isAttacking ? Math.sin(unit.animTimer * 20) * 3 : 0);

    // Use upgraded horse drawing
    // Equites gets a light gray/white horse
    drawBeautifulHorse(ctx, walkBob, legSwing, '#cccccc', '#dddddd', '#999999', '#444444');

    // Roman Barding (Horse Armor)
    ctx.fillStyle = cv.bodyMid; // Roman red blanket -> player color
    ctx.beginPath();
    ctx.moveTo(-12, -18 + walkBob);
    ctx.lineTo(10, -18 + walkBob);
    ctx.lineTo(14, -4 + walkBob);
    ctx.lineTo(-14, -4 + walkBob);
    ctx.fill();

    ctx.fillStyle = '#daab2b'; // gold trim
    ctx.beginPath();
    ctx.moveTo(-14, -4 + walkBob);
    ctx.lineTo(14, -4 + walkBob);
    ctx.lineTo(15, -2 + walkBob);
    ctx.lineTo(-15, -2 + walkBob);
    ctx.fill();

    ctx.restore(); // END MOUNT SCALE. Back to 1.0 for Rider.

    // Rider 
    // Shift rider down by ~4 pixels because the horse is 15% smaller
    ctx.save();
    ctx.translate(0, -10 + walkBob); // Originally -14
    ctx.rotate(-rearing * 0.8);

    // Rider Legs
    ctx.fillStyle = '#c9a84c'; // Bronze greaves
    ctx.fillRect(-4, -2, 8, 10);

    // Rider Torso (Lorica Segmentata)
    ctx.fillStyle = age >= 4 ? cv.bodyDark : cv.bodyMid; // Iron bands -> player color
    ctx.fillRect(-6, -14, 12, 12);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#444';
    ctx.strokeRect(-6, -14, 12, 3);
    ctx.strokeRect(-6, -11, 12, 3);
    ctx.strokeRect(-6, -8, 12, 3);
    ctx.strokeRect(-6, -5, 12, 3);

    // Rider Head (Galea Helmet)
    ctx.fillStyle = '#ffccaa'; // Skin
    ctx.fillRect(-3, -18, 6, 6);

    // Helmet base & crest
    ctx.fillStyle = age >= 4 ? cv.bodyDark : cv.bodyMid; // bronze helmet -> player color
    ctx.beginPath();
    ctx.arc(0, -18, 5, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-4, -18, 2, 4); // cheek guard

    // Red Crest
    ctx.fillStyle = '#b71c1c';
    ctx.beginPath();
    ctx.arc(0, -22, 6, Math.PI, Math.PI * 2);
    ctx.fill();

    // Shield (Scutum)
    ctx.save();
    if (isBlocking) {
        ctx.translate(-4, -14);
        ctx.rotate(-Math.PI / 8);
    } else {
        ctx.translate(-6, -10);
    }
    ctx.fillStyle = cv.bodyMid; // Shield color
    ctx.fillRect(-4, -6, 12, 18);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#c9a84c'; // Gold rim
    ctx.strokeRect(-4, -6, 12, 18);
    // Boss
    ctx.fillStyle = '#c9a84c';
    ctx.beginPath();
    ctx.arc(2, 3, 3, 0, Math.PI * 2);
    ctx.fill();
    // Wings decal
    ctx.strokeStyle = '#c9a84c';
    ctx.beginPath();
    ctx.moveTo(2, 3);
    ctx.lineTo(-2, -3);
    ctx.moveTo(2, 3);
    ctx.lineTo(-2, 9);
    ctx.stroke();

    // Impact glow if blocking
    if (isBlocking) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(-6, -8, 16, 22);
    }
    ctx.restore();

    // Weapon Arm
    ctx.save();
    if (isAttacking) {
        ctx.translate(6, -6);
        ctx.rotate(Math.PI / (pilumReady ? 8 : 4));
    } else {
        ctx.translate(2, -6);
        ctx.rotate(-Math.PI / (pilumReady ? 12 : 6));
    }

    if (pilumReady) {
        // Pilum (Javelin)
        ctx.fillStyle = '#5c3a21'; // wooden shaft
        ctx.fillRect(0, -2, 20, 2);
        ctx.fillStyle = '#999999'; // long iron shank
        ctx.fillRect(20, -1, 10, 1);
        ctx.fillStyle = '#dddddd'; // tip
        ctx.beginPath();
        ctx.moveTo(30, -2);
        ctx.lineTo(34, -0.5);
        ctx.lineTo(30, 1);
        ctx.fill();
    } else {
        // Gladius/Spatha (Sword)
        ctx.fillStyle = '#c9a84c'; // hilt
        ctx.fillRect(-2, -2, 4, 3);
        ctx.fillStyle = '#eeeeee'; // blade
        ctx.beginPath();
        ctx.moveTo(2, -2);
        ctx.lineTo(16, -1);
        ctx.lineTo(18, 0.5);
        ctx.lineTo(16, 2);
        ctx.lineTo(2, 2);
        ctx.fill();
    }

    ctx.restore(); // Restore weapon rotation
    ctx.restore(); // Restore rider Y-offset
    ctx.restore(); // Restore top-level Equites rotation and translation

    drawCavalryDust(unit, ctx, isMoving);
}
