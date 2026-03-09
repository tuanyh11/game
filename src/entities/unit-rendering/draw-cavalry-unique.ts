import { Unit } from "../Unit";
import { CIVILIZATION_DATA, CivilizationType } from "../../config/GameConfig";

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


export function drawWarElephant(unit: Unit, ctx: CanvasRenderingContext2D, age: number, totalBob: number, isMoving: boolean) {
    const bodyColor = '#7a7a7a'; // Slightly lighter grey for base
    const darkSkin = '#5a5a5a'; // Darker grey for shading
    const shadowColor = 'rgba(0, 0, 0, 0.3)';
    const civColor = CIVILIZATION_DATA[unit.civilization].secondaryColor;
    const isAttacking = unit.attackCooldown > unit.civAttackSpeed * 0.8;

    ctx.save();

    const rearing = (isAttacking && !isMoving) ? -0.1 : 0;
    ctx.translate(0, rearing ? -2 : 0);
    ctx.rotate(rearing);

    ctx.save();
    ctx.scale(0.60, 0.60); // --- SCALE ONLY THE MOUNT ---

    // Elephant animation bob
    // If moving, trot. If attacking, stomp.
    const walkBob = isMoving ? Math.sin(totalBob * 0.4) * 2 : 0;
    const isStomping = isAttacking && unit.animTimer > 0;
    const stompFactor = isStomping ? Math.sin(unit.animTimer * 15) : 0;
    const legSwing = isMoving ? Math.sin(totalBob * 0.4) : (isStomping ? stompFactor * 0.5 : 0);

    // Helper to draw articulated elephant leg
    const drawElephantLeg = (x: number, y: number, w: number, h: number, isDark: boolean, swingAngle: number) => {
        ctx.save();
        ctx.translate(x + w / 2, y); // Pivot at shoulder/hip
        ctx.rotate(swingAngle);

        ctx.fillStyle = isDark ? darkSkin : bodyColor;
        // main leg column (drawn from pivot down)
        ctx.fillRect(-w / 2, 0, w, h);

        // leg shading
        if (!isDark) {
            ctx.fillStyle = shadowColor;
            ctx.fillRect(-w / 2, 0, w * 0.2, h); // inner shadow
        }

        // Toes
        ctx.fillStyle = '#cccccc'; // Toe nail color
        const toeW = w / 3;
        ctx.beginPath();
        ctx.arc(-w / 2 + toeW * 0.5, h, toeW * 0.4, Math.PI, 0);
        ctx.arc(-w / 2 + toeW * 1.5, h, toeW * 0.4, Math.PI, 0);
        ctx.arc(-w / 2 + toeW * 2.5, h, toeW * 0.4, Math.PI, 0);
        ctx.fill();

        ctx.restore();
    };

    // Back legs (Darker)
    // back-rear (moves opposite to front-rear)
    drawElephantLeg(-16, 2, 10, 16, true, -legSwing * 0.5);
    // back-front (moves with front-rear roughly)
    drawElephantLeg(8, 2, 10, 16, true, legSwing * 0.5);

    // Tail
    ctx.beginPath();
    ctx.moveTo(-22, -8);
    // Tail shakes with walk
    ctx.quadraticCurveTo(-28, -2, -26, 8 + Math.sin(totalBob * 0.8) * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = darkSkin;
    ctx.stroke();
    // Tail hair
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-26, 9 + Math.sin(totalBob * 0.8) * 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Body bobbing up and down
    ctx.translate(0, walkBob);

    // Main Body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    // More organic body shape instead of perfect ellipse
    ctx.moveTo(-10, -22);
    ctx.quadraticCurveTo(20, -22, 25, -5); // Back to head
    ctx.quadraticCurveTo(20, 15, -5, 12);  // Belly
    ctx.quadraticCurveTo(-28, 12, -24, -5); // Rear
    ctx.quadraticCurveTo(-20, -20, -10, -22); // Rear to back
    ctx.fill();

    // Body shading (Bottom)
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.moveTo(25, -5);
    ctx.quadraticCurveTo(20, 15, -5, 12);
    ctx.quadraticCurveTo(-28, 12, -24, -5);
    ctx.quadraticCurveTo(-5, 5, 25, -5);
    ctx.fill();

    // Body Armor (Barding) - Metallic plates on the flanks
    ctx.fillStyle = '#778899'; // Steel blueish grey
    ctx.beginPath();
    ctx.moveTo(-10, -5);
    ctx.quadraticCurveTo(-15, 6, -5, 10);
    ctx.quadraticCurveTo(10, 10, 16, 0);
    ctx.lineTo(8, -5);
    ctx.fill();
    // Armor studs
    ctx.fillStyle = '#silver';
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
            ctx.fillRect(-6 + c * 5, -2 + r * 4, 1.5, 1.5);
        }
    }

    // Front legs
    // Front-rear leg
    drawElephantLeg(-22, 2, 10, 18, false, legSwing * 0.6);
    // Front-front leg (If stomping, lift it high)
    const stompLift = isStomping ? -Math.max(0, stompFactor) * 0.5 : 0;
    drawElephantLeg(14, 2, 10, 18, false, stompLift - legSwing * 0.6);

    // Head
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(22, -10, 14, 0, Math.PI * 2);
    ctx.fill();

    // Head highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(22, -12, 10, 0, Math.PI * 2);
    ctx.fill();

    // Trunk (Base part connects here)
    ctx.beginPath();
    ctx.moveTo(34, -5);
    if (isAttacking) {
        // High swinging trunk (Shortened)
        ctx.quadraticCurveTo(46, -20, 36, -30);
    } else {
        // Normal swaying trunk (Shortened)
        ctx.quadraticCurveTo(42 + legSwing * 5, 4, 32 + legSwing * 10, 16);
    }
    ctx.lineWidth = 8;
    ctx.strokeStyle = bodyColor;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Trunk shading
    ctx.lineWidth = 2;
    ctx.strokeStyle = shadowColor;
    if (isAttacking) {
        ctx.beginPath(); ctx.moveTo(34, -5); ctx.quadraticCurveTo(44, -20, 35, -28); ctx.stroke();
    } else {
        ctx.beginPath(); ctx.moveTo(34, -5); ctx.quadraticCurveTo(40 + legSwing * 5, 4, 30 + legSwing * 10, 14); ctx.stroke();
    }

    // === Steel Head Helmet (Chanfron) ===
    // Main dome over the forehead
    ctx.fillStyle = '#778899'; // Steel
    ctx.beginPath();
    ctx.arc(22, -12, 10.5, -Math.PI * 0.8, Math.PI * 0.3); // Covers top and front of head
    ctx.lineTo(38, -6);  // Down the trunk
    ctx.lineTo(34, 4);   // Bottom trunk plate
    ctx.lineTo(26, 0);   // Back up to cheek
    ctx.fill();

    // Gold trim on helmet
    ctx.strokeStyle = '#eebb00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(22, -12, 10.5, -Math.PI * 0.8, Math.PI * 0.3);
    ctx.lineTo(38, -6);
    ctx.lineTo(34, 4);
    ctx.lineTo(26, 0);
    ctx.closePath();
    ctx.stroke();

    // Protective cheek plate
    ctx.fillStyle = '#667788';
    ctx.beginPath();
    ctx.arc(22, -6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eebb00'; // Gold boss on cheek
    ctx.beginPath();
    ctx.arc(22, -6, 2, 0, Math.PI * 2);
    ctx.fill();


    // Tusks
    // Right Tusk (Background)
    ctx.fillStyle = '#ddddcc';
    ctx.beginPath();
    ctx.moveTo(26, -4);
    ctx.quadraticCurveTo(40, 2, 44, -10);
    ctx.quadraticCurveTo(38, -4, 30, -4);
    ctx.fill();

    // Left Tusk (Foreground)
    ctx.fillStyle = '#fffff0'; // Ivory white
    ctx.beginPath();
    ctx.moveTo(28, -2);
    ctx.quadraticCurveTo(44, 6, 52, -10); // Longer, sharper
    ctx.quadraticCurveTo(42, -2, 34, -2);
    ctx.fill();

    // Gold Tusk Rings & Steel Caps
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffd700'; // Gold ring at base
    ctx.beginPath(); ctx.moveTo(33, 1); ctx.lineTo(36, -3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(40, 2); ctx.lineTo(43, -4); ctx.stroke();
    // Steel tip
    ctx.fillStyle = '#eeeeee';
    ctx.beginPath();
    ctx.moveTo(47, -3);
    ctx.quadraticCurveTo(50, -4, 52, -10);
    ctx.quadraticCurveTo(46, -6, 47, -3);
    ctx.fill();

    // Ear (Flapping with walk cycle)
    const earFlap = isMoving ? Math.sin(totalBob * 0.6) * 4 : 0;
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(14 - earFlap / 2, -10, 8 + earFlap, 14, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Inner ear shadow
    ctx.fillStyle = darkSkin;
    ctx.beginPath();
    ctx.ellipse(14 - earFlap / 2, -10, 5 + earFlap / 2, 10, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(26, -14, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // === Ornate Persian Carpet ===
    // Base rug
    ctx.fillStyle = civColor;
    ctx.fillRect(-16, -24, 32, 16);
    // Dark border
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.strokeRect(-16, -24, 32, 16);

    // Golden ornate trim
    ctx.fillStyle = '#eebb00';
    ctx.fillRect(-14, -22, 28, 2); // Top inner border
    ctx.fillRect(-14, -12, 28, 2); // Bottom inner border
    ctx.fillRect(-14, -22, 2, 12); // Left border
    ctx.fillRect(12, -22, 2, 12);  // Right border

    // Intricate center diamond motif
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(6, -16);
    ctx.lineTo(0, -12);
    ctx.lineTo(-6, -16);
    ctx.fill();
    ctx.fillStyle = '#cc2222'; // Ruby center
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(3, -16);
    ctx.lineTo(0, -14);
    ctx.lineTo(-3, -16);
    ctx.fill();

    // Heavy Gold Tassels hanging from the bottom edge
    ctx.fillStyle = '#eebb00';
    for (let i = 0; i < 7; i++) {
        ctx.fillRect(-14 + i * 4.5, -8, 2, 5);
        ctx.fillStyle = '#cc2222'; // Red tie on tassel
        ctx.fillRect(-14 + i * 4.5, -7, 2, 1);
        ctx.fillStyle = '#eebb00';
    }

    // === Royal Howdah (Platform) ===
    // Platform Base
    ctx.fillStyle = '#3a200d'; // Polished dark wood
    ctx.fillRect(-12, -32, 24, 10);
    ctx.fillStyle = '#2a1606';
    ctx.fillRect(-14, -22, 28, 4); // Heavy base rim

    // Golden Railing
    ctx.strokeStyle = '#eebb00';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let col = -10; col <= 10; col += 5) {
        ctx.moveTo(col, -32); ctx.lineTo(col, -22);
    }
    ctx.stroke();

    // Pillars
    ctx.fillStyle = '#2a1606';
    ctx.fillRect(-12, -48, 3, 16); // rear pillar
    ctx.fillRect(9, -48, 3, 16);   // front pillar
    // Golden brackets on pillars
    ctx.fillStyle = '#eebb00';
    ctx.fillRect(-13, -42, 5, 2);
    ctx.fillRect(8, -42, 5, 2);

    // Silk Curtains drawn back
    ctx.fillStyle = civColor;
    ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.moveTo(-9, -44); ctx.quadraticCurveTo(-2, -38, -9, -32); ctx.fill();
    ctx.beginPath(); ctx.moveTo(9, -44); ctx.quadraticCurveTo(2, -38, 9, -32); ctx.fill();
    ctx.globalAlpha = 1.0;

    // Roof & Canopy
    ctx.fillStyle = '#2a1606';
    ctx.fillRect(-14, -48, 28, 4); // Roof rim

    // Ornate Dome
    ctx.fillStyle = civColor;
    ctx.beginPath();
    ctx.arc(0, -48, 10, Math.PI, 0); // Large dome
    ctx.fill();

    // Golden Finials & Trim
    ctx.fillStyle = '#eebb00';
    ctx.fillRect(-14, -48, 28, 1); // rim trim
    ctx.beginPath(); ctx.moveTo(-2, -58); ctx.lineTo(2, -58); ctx.lineTo(0, -64); ctx.fill(); // Top spire
    ctx.fillRect(-1, -58, 2, 10);

    ctx.restore(); // END MOUNT SCALE

    // Rider in Howdah
    ctx.save();
    ctx.translate(0, 10); // Shift rider down because Howdah dropped 10px

    // === Elite Palace Guard Rider ===
    ctx.fillStyle = '#cccccc'; // Chainmail Torso
    ctx.fillRect(-5, -36, 10, 8);

    // Civ colored sash/tabard
    ctx.fillStyle = civColor;
    ctx.fillRect(-3, -36, 6, 8);

    // Shield slung on back
    ctx.fillStyle = '#daab2b';
    ctx.beginPath(); ctx.arc(-4, -32, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(-4, -32, 2, 0, Math.PI * 2); ctx.fill();

    // Helmet (Persian Kulah Khud / Spiked Helmet)
    ctx.fillStyle = '#eeeeee';
    ctx.beginPath();
    ctx.arc(0, -40, 4.5, Math.PI, 0); // Steel dome
    ctx.fill();
    ctx.fillStyle = '#daab2b';
    ctx.fillRect(-1, -48, 2, 4); // Spike

    // Chainmail aventail (neck guard)
    ctx.fillStyle = '#999999';
    ctx.fillRect(-5, -40, 10, 4);

    // Rider face (visible eyes)
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(-3, -39, 6, 3);
    ctx.fillStyle = '#111'; // fiery eyes looking forward
    ctx.fillRect(0, -38, 1.5, 1);
    ctx.fillRect(2, -38, 1.5, 1);

    if (isAttacking) {
        // Attack Animation - Thrusting heavy spear
        ctx.save();
        ctx.translate(2, -34);
        ctx.rotate(Math.PI / 4 + 0.3); // thrust forward

        ctx.fillStyle = '#5c3a21'; // Wood shaft
        ctx.fillRect(-1, -16, 3, 36);

        // Lavish Spear Head
        ctx.fillStyle = '#daab2b'; // Gold socket
        ctx.fillRect(-1.5, -18, 4, 3);
        ctx.fillStyle = '#eeeeee'; // Steel broad tip
        ctx.beginPath();
        ctx.moveTo(-2, -18);
        ctx.lineTo(3, -18);
        ctx.lineTo(0.5, -28);
        ctx.fill();
        ctx.restore();
    } else {
        // Idle Spear (held proudly upright with royal pennant)
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(2, -48, 2, 26);

        // Pennant flag
        ctx.fillStyle = civColor;
        ctx.beginPath();
        ctx.moveTo(4, -46);
        ctx.lineTo(14, -44);
        ctx.lineTo(4, -40);
        ctx.fill();

        // Lavish Spear Head
        ctx.fillStyle = '#daab2b'; // Gold socket
        ctx.fillRect(1.5, -50, 3, 2);
        ctx.fillStyle = '#eeeeee'; // Steel tip
        ctx.beginPath();
        ctx.moveTo(1, -50);
        ctx.lineTo(4, -50);
        ctx.lineTo(2.5, -58);
        ctx.fill();
    }

    ctx.restore(); // Restore rider translate
    ctx.restore(); // Restore main unit

    drawCavalryDust(unit, ctx, isMoving);
}

export function drawFireLancer(unit: Unit, ctx: CanvasRenderingContext2D, age: number, totalBob: number, isMoving: boolean) {
    const civColor = CIVILIZATION_DATA[unit.civilization].secondaryColor;
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
    ctx.fillStyle = '#daab2b';
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
    ctx.strokeStyle = '#daab2b';
    ctx.stroke();

    // Red decorative tassels hanging from chest
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(13, 0 + walkBob, 1.5, 4);
    ctx.fillRect(15, 0 + walkBob, 1.5, 4);

    // Saddle Blanket
    ctx.fillStyle = '#331111';
    ctx.fillRect(-8, -19 + walkBob, 12, 4);
    ctx.fillStyle = '#daab2b';
    ctx.fillRect(-8, -15 + walkBob, 12, 1);

    ctx.restore(); // END MOUNT SCALE

    // Rider 
    ctx.save();
    ctx.translate(0, 4); // Shift rider down to match smaller horse
    ctx.translate(0, -14 + walkBob);
    ctx.rotate(-rearing * 0.8);

    // Rider Legs
    ctx.fillStyle = '#333'; // Dark pants
    ctx.fillRect(-4, -2, 8, 10);
    ctx.fillStyle = '#222'; // Boots
    ctx.fillRect(-4, 6, 4, 4);

    // Flowing Cape (Ming Red)
    // Drawn behind the body
    ctx.fillStyle = '#aa1111';
    ctx.beginPath();
    ctx.moveTo(-5, -13);
    const capeWind = isMoving ? Math.sin(totalBob * 2) * 4 : 0;
    ctx.quadraticCurveTo(-14 + capeWind, -8, -10 + capeWind, 2);
    ctx.lineTo(-4 + capeWind * 0.5, -2);
    ctx.fill();

    // Rider Torso (Ming Brigandine Armor)
    ctx.fillStyle = civColor; // Base armor color
    ctx.fillRect(-6, -14, 12, 12);

    // Iron studs pattern for Brigandine
    ctx.fillStyle = '#111';
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            ctx.fillRect(-4 + i * 4, -12 + j * 3, 1.5, 1.5);
        }
    }
    // Waist belt
    ctx.fillStyle = '#daab2b';
    ctx.fillRect(-6, -8, 12, 2);
    // Chest plate / mirror
    ctx.fillStyle = '#eeeeee';
    ctx.beginPath();
    ctx.arc(0, -11, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Rider Head (Ming Iron Helmet with Red Tassel)
    ctx.fillStyle = '#ffccaa'; // Face
    ctx.fillRect(-4, -18, 8, 5);

    // Massive Red Tassel covering the top
    ctx.fillStyle = '#cc2222';
    ctx.beginPath();
    ctx.arc(0, -23, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-6, -19);
    ctx.quadraticCurveTo(0, -17, 6, -19);
    ctx.lineTo(0, -25);
    ctx.fill();

    // Iron Helmet Bowl & Brim
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(0, -19, 4.5, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#daab2b'; // Gold brim
    ctx.fillRect(-5, -19, 10, 1.5);

    // Neck Guard (Brigandine flaps)
    ctx.fillStyle = civColor;
    ctx.fillRect(-5, -17.5, 10, 3.5);

    // Fire Lance Weapon
    ctx.save();
    if (isAttacking) {
        ctx.translate(6, -6);
        ctx.rotate(Math.PI / 6); // Thrust
    } else {
        ctx.translate(2, -6);
        ctx.rotate(-Math.PI / 8); // Carry
    }

    // Pole
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(0, -4, 34, 2);

    // Spear tip (Leaf shaped)
    ctx.fillStyle = '#eeeeee';
    ctx.beginPath();
    ctx.moveTo(34, -3);
    ctx.lineTo(40, -3);
    ctx.lineTo(34, -5);
    ctx.fill();

    // Bamboo Powder Tube (Highly detailed)
    ctx.fillStyle = '#d4a359'; // Bamboo wood
    ctx.fillRect(20, -7, 12, 8);
    // Iron banding
    ctx.fillStyle = '#222';
    ctx.fillRect(22, -7, 2, 8);
    ctx.fillRect(28, -7, 2, 8);
    // Red fuse/cloth wrap
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(25, -7, 2, 8);

    // Ember tracking (Glowing constantly, bursting when charge is ready)
    ctx.fillStyle = unit.passiveChargeReady && !isAttacking ? '#ffaa00' : '#ff4400';
    ctx.beginPath();
    const emberSize = (unit.passiveChargeReady && !isAttacking) ? (2 + Math.random() * 1.5) : (1 + Math.random());
    ctx.arc(32.5, -3, emberSize, 0, Math.PI * 2);
    ctx.fill();

    if (unit.passiveChargeReady && !isAttacking) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(32.5, -3, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore(); // Restore weapon
    ctx.restore(); // Restore rider Y-offset
    ctx.restore(); // Restore toplevel unit translate

    drawCavalryDust(unit, ctx, isMoving);
}

export function drawYabusame(unit: Unit, ctx: CanvasRenderingContext2D, age: number, totalBob: number, isMoving: boolean) {
    const civColor = CIVILIZATION_DATA[unit.civilization].secondaryColor;
    const isAttacking = unit.attackCooldown > unit.civAttackSpeed * 0.8;

    ctx.save();

    const rearing = (isAttacking && !isMoving) ? -0.2 : 0;
    ctx.translate(0, rearing ? -4 : 0);
    ctx.rotate(rearing);

    // --- SCALE ONLY THE MOUNT ---
    ctx.save();
    ctx.scale(0.80, 0.80);

    // Horse Body
    const walkBob = isMoving ? Math.sin(totalBob * 0.4) * 2 : 0;
    const legSwing = isMoving ? Math.sin(totalBob * 0.6) * 6 : (isAttacking ? Math.sin(unit.animTimer * 18) * 4 : 0);

    // Use upgraded horse drawing
    // Yabusame gets a brown horse
    drawBeautifulHorse(ctx, walkBob, legSwing, '#6e472a', '#222222', '#4a2c11', '#111111');

    // Japanese Horse Armor (Umayoroi)
    // Bamen (Dragon face plate)
    ctx.fillStyle = civColor;
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
    ctx.fillStyle = civColor;
    ctx.beginPath();
    ctx.moveTo(10, -18 + walkBob);
    ctx.lineTo(18, -28 + walkBob);
    ctx.lineTo(13, -10 + walkBob);
    ctx.fill();

    // Body Armor (Scales)
    ctx.fillStyle = civColor;
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
    ctx.rotate(-rearing * 0.8);

    // Rider Legs
    ctx.fillStyle = '#222';
    ctx.fillRect(-4, -2, 8, 10);
    // Thigh guards (Haidate)
    ctx.fillStyle = civColor;
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
    ctx.fillStyle = civColor;
    ctx.fillRect(-6, -13, 11, 11);
    // Armor lacing
    ctx.fillStyle = '#cc3333';
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(-6, -11 + i * 3, 11, 1);
    }
    // Shoulder guards (Sode)
    ctx.fillStyle = civColor;
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
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.moveTo(-9, -16);
    ctx.lineTo(9, -16);
    ctx.lineTo(0, -23);
    ctx.fill();
    ctx.strokeStyle = '#cca84c'; // Gold crest rim
    ctx.lineWidth = 1;
    ctx.stroke();

    // Japanese Yumi (Asymmetrical Bow)
    ctx.save();
    if (isAttacking) {
        ctx.translate(6, -8);
        ctx.rotate(Math.PI / 8);
    } else {
        ctx.translate(2, -8);
        ctx.rotate(-Math.PI / 12);
    }

    // Bow curve (Long top, short bottom)
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.quadraticCurveTo(8, -5, 0, 10);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#111';
    ctx.stroke();

    // Grip
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(2.5, -5, 3, 5);

    // String and Nocked Arrow
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -22);
    // Only draw the arrow pulled back if the attack is in the wind up phase
    if (isAttacking && unit.attackCooldown > unit.civAttackSpeed * 0.2) {
        // Drawn back string
        ctx.lineTo(-6, -4);
        ctx.lineTo(0, 10);
        ctx.stroke();

        // Nocked Arrow
        ctx.strokeStyle = '#dddddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-6, -4);
        ctx.lineTo(14, -4);
        ctx.stroke();

        ctx.fillStyle = '#888'; // Arrowhead
        ctx.beginPath();
        ctx.moveTo(14, -5);
        ctx.lineTo(17, -4);
        ctx.lineTo(14, -3);
        ctx.fill();

        ctx.fillStyle = '#cc3333'; // Fletching
        ctx.fillRect(-6, -5, 3, 2);
    } else {
        // Relaxed string
        ctx.lineTo(0, 10);
        ctx.stroke();
    }

    ctx.restore(); // Restore weapon
    ctx.restore(); // Restore rider Y-offset
    ctx.restore(); // Restore toplevel unit translate

    drawCavalryDust(unit, ctx, isMoving);
}

export function drawBearRider(unit: Unit, ctx: CanvasRenderingContext2D, age: number, totalBob: number, isMoving: boolean) {
    const civColor = CIVILIZATION_DATA[unit.civilization].secondaryColor;
    const isRaging = unit.hp < unit.maxHp * 0.3;
    const isAttacking = unit.attackCooldown > unit.civAttackSpeed * 0.8;

    const rearing = (isAttacking && !isMoving) ? -0.15 : 0;
    ctx.translate(0, rearing ? -3 : 0);
    ctx.rotate(rearing);

    ctx.save();
    ctx.scale(0.80, 0.80); // --- SCALE ONLY THE MOUNT ---

    // =====================================
    // BEAR MOUNT (Grizzly -> Polar Bear)
    // =====================================
    ctx.save();
    ctx.scale(0.85, 0.85); // Shrink the bear part relatively
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


    // Saddle / Harness
    ctx.fillStyle = '#222'; // belly strap
    ctx.fillRect(-8, -16 + walkBob, 16, 18);
    ctx.fillStyle = civColor; // civ blanket
    ctx.fillRect(-10, -12 + walkBob, 20, 8);
    ctx.fillStyle = '#eebb00'; // gold trim
    ctx.fillRect(-10, -5 + walkBob, 20, 1);

    ctx.restore(); // Undo the 0.85 bear scale

    // =====================================
    // BEAR RIDER (Viking Ulfhednar)
    // =====================================
    ctx.save();
    ctx.scale(1.15, 1.15); // Rider remains large and imposing
    ctx.translate(-2, -12 + walkBob * 0.8); // Adjusted to sit down onto the relatively smaller bear
    ctx.rotate(-rearing * 0.8);

    // Rider Legs (Leather pants & Iron greaves)
    ctx.fillStyle = '#3a200d'; // Dark leather pants
    ctx.fillRect(-5, -2, 9, 11);
    ctx.fillStyle = isPolar ? '#222222' : '#333333'; // Heavy boots
    ctx.fillRect(-6, 6, 6, 5);
    // Age 4 Iron shin guards
    if (isPolar) {
        ctx.fillStyle = '#555555';
        ctx.fillRect(-5, 4, 4, 3);
        ctx.fillStyle = '#111111'; ctx.fillRect(-5, 5, 4, 0.5); // strap
    }

    // Shield on Back (Viking Round Shield)
    ctx.save();
    ctx.translate(-7, -10);
    ctx.rotate(-0.3); // Slung over shoulder
    ctx.fillStyle = '#4a2c11'; // Dark wood
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    // Shield Rim
    ctx.strokeStyle = '#222222'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.stroke();
    // Shield Boss
    ctx.fillStyle = '#666666';
    ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
    // Painted Pattern (Blood red / Civ color quarters)
    ctx.fillStyle = civColor;
    ctx.beginPath(); ctx.arc(0, 0, 8.5, 0, Math.PI / 2); ctx.lineTo(0, 0); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, 8.5, Math.PI, Math.PI * 1.5); ctx.lineTo(0, 0); ctx.fill();
    ctx.restore();

    // ==================
    // TORSO (Chainmail & Bear Pelt)
    // ==================
    // Chainmail Base
    ctx.fillStyle = '#555555';
    ctx.fillRect(-6, -14, 11, 14);
    // Chainmail texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 3; c++) {
            ctx.beginPath(); ctx.arc(-5 + c * 3 + (r % 2), -12 + r * 3, 1, 0, Math.PI); ctx.fill();
        }
    }

    // Civ Color Tabard/Sash
    ctx.fillStyle = civColor;
    ctx.fillRect(-4, -13, 7, 10);
    ctx.fillStyle = '#111111'; // Thick Leather Belt
    ctx.fillRect(-6, -3, 11, 2);
    ctx.fillStyle = '#ddaa00'; // Belt buckle
    ctx.fillRect(-2, -3.5, 3, 3);

    // Thick Bear Fur Cape (Ulfhednar Trait)
    const capeColor = isPolar ? '#e0e5eb' : '#4a2c11';
    const darkCapeColor = isPolar ? '#a0aab5' : '#2a1a08';
    ctx.fillStyle = capeColor;
    ctx.beginPath();
    ctx.moveTo(-6, -15);
    ctx.quadraticCurveTo(-14, -5, -9, 10); // Cape flaring out back
    ctx.quadraticCurveTo(-3, 6, -6, -4);
    ctx.fill();
    // Cape fur texture
    ctx.strokeStyle = darkCapeColor; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(-7, 1); ctx.moveTo(-11, 3); ctx.lineTo(-8, 6); ctx.stroke();

    // ==================
    // HEAD (Bear Skull Headdress)
    // ==================
    ctx.fillStyle = '#ffccaa'; // Human Skin
    ctx.fillRect(-3, -18, 6, 6); // Face peeking out

    // Fierce war paint
    ctx.fillStyle = '#880000'; // Blood red stripe across eyes
    ctx.fillRect(-3, -16, 6, 2);

    // The Bear Skull / Pelt Headdress
    // Top of the bear head resting over helmet
    ctx.fillStyle = capeColor; // Fur matches cape
    ctx.beginPath();
    ctx.arc(-1, -19, 6.5, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fill();

    // Animal snout extending forward over brow
    ctx.fillStyle = capeColor;
    ctx.beginPath();
    ctx.moveTo(3, -24);
    ctx.lineTo(8, -20);
    ctx.lineTo(5, -17);
    ctx.fill();

    // Skull bone face plate (Terrifying mask)
    ctx.fillStyle = '#ddddcc'; // Bone color
    ctx.beginPath();
    ctx.moveTo(-3, -21); // Forehead
    ctx.lineTo(6, -21); // Top of snout
    ctx.lineTo(7, -18); // Nose tip
    ctx.lineTo(3, -16); // Upper jaw
    ctx.lineTo(-3, -16); // Cheek
    ctx.fill();

    // Hollow Bear Skull Eyes with glowing embers
    ctx.fillStyle = '#111111'; // Eye socket
    ctx.beginPath(); ctx.ellipse(1.5, -19, 2, 1.5, Math.PI / 6, 0, Math.PI * 2); ctx.fill();
    // Berserker glow inside the skull socket
    ctx.fillStyle = isPolar ? '#00ffff' : '#ff3300';
    ctx.fillRect(1, -19.5, 1, 1);

    // =====================================
    // WEAPON: DOUBLE-BITTED BATTLE AXE
    // =====================================
    ctx.save();
    if (isAttacking) {
        ctx.translate(6, -7);
        ctx.rotate(Math.PI / 3); // Chop completely down
    } else {
        // Shifted significantly down and right to avoid blocking the Bear Skull mask
        ctx.translate(6, 2);
        ctx.rotate(Math.PI / 12); // Slightly tilted forward
    }

    ctx.scale(0.65, 0.65); // Scale down the axe as requested

    // Heavy Iron-reinforced Handle
    ctx.fillStyle = '#3a2010'; // Dark wood
    ctx.fillRect(-2, -26, 4, 38);
    // Leather grips
    ctx.fillStyle = '#111111';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(-2, -12 + i * 4, 4, 2);
    }

    // Massive Double Axe Head
    ctx.fillStyle = '#888888'; // Dark steel
    ctx.beginPath();
    // Front Blade (Bearded drop)
    ctx.moveTo(1, -22);
    ctx.lineTo(12, -26);
    ctx.quadraticCurveTo(16, -12, 12, 0); // Sweeping beard
    ctx.lineTo(1, -6);
    // Back Blade (Spike/Breaker)
    ctx.lineTo(-8, -4);
    ctx.quadraticCurveTo(-12, -12, -9, -24);
    ctx.lineTo(1, -22);
    ctx.fill();

    // Honed Edges (Bright Steel)
    ctx.fillStyle = '#dddddd';
    ctx.beginPath();
    ctx.moveTo(9, -24); ctx.quadraticCurveTo(13, -12, 10, -2); ctx.lineTo(12, -2); ctx.quadraticCurveTo(16, -12, 12, -26); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-6, -22); ctx.quadraticCurveTo(-10, -12, -6, -6); ctx.lineTo(-8, -6); ctx.quadraticCurveTo(-12, -12, -9, -24); ctx.fill();

    // Runic Engravings (Age 4 has glowing runes)
    if (age >= 4) {
        ctx.strokeStyle = isPolar ? '#00ccff' : '#ff6600'; // Ice blue or Fire orange runes
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(4, -20); ctx.lineTo(6, -16); ctx.lineTo(3, -12); ctx.lineTo(7, -8); ctx.stroke();
    }

    // Gore/Blood on the Axe if raging
    if (isRaging) {
        ctx.fillStyle = 'rgba(180, 0, 0, 0.9)';
        ctx.beginPath();
        // Blood splattered along the sweeping edge
        ctx.moveTo(10, -26);
        ctx.quadraticCurveTo(16, -12, 10, -4);
        ctx.lineTo(6, -8);
        ctx.lineTo(6, -20);
        ctx.fill();
        // Drips
        ctx.fillRect(11, -2, 1, 3);
        ctx.fillRect(14, -10, 1, 2);
    }

    ctx.restore(); // END WEAPON SCALE & ROTATION
    ctx.restore(); // END RIDER SCALE & ROTATION
    ctx.restore(); // END GLOBAL MOUNT SCALE

    drawCavalryDust(unit, ctx, isMoving);
}

export function drawEquites(unit: Unit, ctx: CanvasRenderingContext2D, age: number, totalBob: number, isMoving: boolean) {
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
    ctx.fillStyle = '#b71c1c'; // Roman red blanket
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
    ctx.fillStyle = '#cccccc'; // Iron bands
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
    ctx.fillStyle = '#c9a84c'; // bronze helmet
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
    ctx.fillStyle = '#b71c1c';
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
