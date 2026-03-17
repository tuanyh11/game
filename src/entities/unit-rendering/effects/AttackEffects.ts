// ============================================================
//  Attack Effects — weapon swing animations & impact effects
//  Extracted from UnitRenderer.ts
// ============================================================

import { UnitType, CivilizationType } from "../../../config/GameConfig";
import type { Unit } from "../../Unit";

export function renderAttackWeapon(unit: Unit, ctx: CanvasRenderingContext2D, totalBob: number, swingCycle: number, swingPhase: number): void {
    switch (unit.type) {
        case UnitType.Spearman: {
            // Spear animation is now fully handled by the civ-specific renderers
            // (LaMaRenderer, VikingRenderer, BaTuRenderer, DaiMinhRenderer, YamatoRenderer)
            // We just break here to avoid drawing a duplicate generic spear.
            break;
        }
        case UnitType.Swordsman: {
            const slashAngle = swingCycle * 1.2 - 0.3;
            ctx.translate(6, -4 + totalBob);
            ctx.rotate(slashAngle);

            if (unit.civilization === CivilizationType.Viking || 
                unit.civilization === CivilizationType.Yamato || 
                unit.civilization === CivilizationType.BaTu || 
                unit.civilization === CivilizationType.DaiMinh || 
                unit.civilization === CivilizationType.LaMa) {
                // These civilizations now draw their own fully animated swords 
                // in their respective civ renderer files (e.g. YamatoRenderer.ts).
                // We do nothing here to prevent drawing a second overlapping sword.
            } else {
                // Generic sword (Fallback for any other future civs)
                ctx.fillStyle = '#ccc';
                ctx.fillRect(-1, -16, 3, 14);
                ctx.fillStyle = '#8B5E3C';
                ctx.fillRect(-3, -3, 7, 3);
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(-1, 0, 3, 2);
                if (Math.abs(swingCycle) > 0.5) {
                    ctx.globalAlpha = 0.4;
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(0, -8, 14, slashAngle - 0.8, slashAngle + 0.2); ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }
            break;
        }
        case UnitType.Archer: {
            // draw-archer.ts already renders the correct civ-specific bow and the arrow nocked on the string.
            // We just need a subtle pullback / tension visual here if any, or we can leave it empty
            // because drawArcher handles the bowstring pullback based on attack cooldown.
            // (Note: Since we removed the duplicate bow, we don't draw anything here to avoid clipping over the detailed civ bows).
            break;
        }
        case UnitType.ChuKoNu: {
            const daoAngle = Math.sin(swingPhase) * 1.2;
            ctx.translate(8, -4 + totalBob);
            ctx.rotate(-Math.PI / 4 + daoAngle);
            ctx.fillStyle = '#3a1a0a'; ctx.fillRect(-1.5, 0, 3, 8);
            ctx.fillStyle = '#c9a84c'; ctx.fillRect(-1.5, 1, 3, 1); ctx.fillRect(-1.5, 4, 3, 1);
            ctx.fillStyle = '#ffd700'; ctx.fillRect(-3, -1, 6, 1.5);
            ctx.fillStyle = '#ccc'; ctx.fillRect(-1, -18, 2.5, 18);
            ctx.fillStyle = '#ddd'; ctx.fillRect(-2, -20, 4, 3);
            ctx.fillStyle = '#fff'; ctx.fillRect(0.5, -18, 0.5, 16);
            break;
        }
        case UnitType.Immortal: {
            const castPulse = Math.sin(swingPhase * 2) * 0.3;
            ctx.translate(8, -8 + totalBob);
            ctx.rotate(castPulse - 0.2);
            ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-1, -18, 2, 24);
            ctx.fillStyle = unit.magiCastActive ? '#44ddff' : '#8866cc';
            ctx.fillRect(-3, -22, 6, 5);
            ctx.fillStyle = unit.magiCastActive ? '#88eeff' : '#aa88dd';
            ctx.fillRect(-2, -21, 4, 3);
            ctx.globalAlpha = 0.4 + Math.sin(swingPhase * 4) * 0.3;
            ctx.fillStyle = unit.magiCastActive ? '#44ddff' : '#8866cc';
            ctx.beginPath(); ctx.arc(0, -20, 5, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
            break;
        }
        case UnitType.Ninja: {
            const katanaAngle = swingCycle * 1.8 - 0.2;
            ctx.translate(5, -5 + totalBob);
            ctx.rotate(katanaAngle);
            ctx.fillStyle = '#ddd'; ctx.fillRect(-1, -18, 2, 16);
            ctx.fillStyle = '#fff'; ctx.fillRect(0, -18, 1, 14);
            ctx.fillStyle = '#c9a84c'; ctx.fillRect(-3, -3, 6, 2);
            ctx.fillStyle = '#222'; ctx.fillRect(-1, -1, 2, 5);
            ctx.fillStyle = '#444'; ctx.fillRect(-1, 0, 2, 1); ctx.fillRect(-1, 2, 2, 1);
            if (Math.abs(swingCycle) > 0.6) {
                ctx.globalAlpha = 0.3; ctx.fillStyle = '#6600bb';
                ctx.fillRect(-2, -16, 4, 12); ctx.globalAlpha = 1;
            }
            break;
        }
        case UnitType.Centurion: {
            if (unit.centurionMode === 'spear') {
                const cd = unit.centurionPilumCooldown;

                let bodyTilt = 0;
                if (cd > 2.7) {
                    bodyTilt = 0.2 * ((3.0 - cd) / 0.3);
                } else if (cd > 1.0) {
                    bodyTilt = 0;
                } else if (cd > 0.15) {
                    bodyTilt = -0.25 * (1 - ((cd - 0.15) / 0.85));
                } else {
                    bodyTilt = -0.25 + (0.45 * (cd <= 0 ? 1 : 1 - (cd / 0.15)));
                }

                ctx.save();
                if (bodyTilt !== 0) {
                    ctx.translate(0, 16 + totalBob); // Pivot at feet
                    ctx.rotate(bodyTilt);
                    ctx.translate(0, -(16 + totalBob));
                }

                // Helper to render the held pilum
                const drawHeldPilum = (alpha: number, headAngle: number = 0) => {
                    ctx.save();
                    ctx.rotate(headAngle);

                    // Wooden shaft
                    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-1.5, -12, 3, 22);
                    // Iron shank
                    ctx.fillStyle = '#a0a8b8'; ctx.fillRect(-0.5, -24, 1, 12);
                    // Weight block
                    ctx.fillStyle = '#4a3a2a'; ctx.fillRect(-2, -13, 4, 3);
                    ctx.fillStyle = '#8a8888'; ctx.fillRect(-2.5, -12, 5, 1);
                    // Spearhead
                    ctx.fillStyle = '#ccc';
                    ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(-2, -24); ctx.lineTo(2, -24); ctx.closePath(); ctx.fill();
                    ctx.fillStyle = '#fff'; ctx.fillRect(0, -29, 0.5, 5);

                    if (alpha > 0) {
                        ctx.globalAlpha = alpha;
                        ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, -28); ctx.stroke();
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath(); ctx.arc(0, -30, 2 + Math.random() * 2, 0, Math.PI * 2); ctx.fill();
                        ctx.globalAlpha = 1;
                    }

                    ctx.restore();
                };

                // Time timeline from 3.0 down to 0.0:
                // >= 2.7: Follow-through right after releasing the spear (No spear in hand)
                // >= 1.0: Standing back/Idle (No spear in hand)
                // >= 0.15: Winding up arm and holding new spear
                // < 0.15: Forward swing to throw spear
                if (cd > 2.7) {
                    // === FOLLOW-THROUGH (Empty hand after throw) ===
                    const followProgress = (3.0 - cd) / 0.3; // 0.0 to 1.0
                    const throwAngle = 0.8 + followProgress * 0.4;

                    ctx.save();
                    ctx.translate(-6, -6 + totalBob); // Changed from 6 to -6
                    ctx.rotate(throwAngle);

                    // Left Arm reaching forward
                    ctx.fillStyle = '#e8c8a0'; ctx.fillRect(-2, -2, 4, 9);
                    ctx.fillStyle = '#8b0000'; ctx.fillRect(-2.5, 2, 5, 5);
                    ctx.restore();

                } else if (cd > 1.0) {
                    // === IDLE (Empty Hand) ===
                    ctx.save();
                    ctx.translate(-4, -4 + totalBob); // Changed from 4 to -4
                    ctx.rotate(0.3);

                    ctx.fillStyle = '#e8c8a0'; ctx.fillRect(-2, -2, 4, 9);
                    ctx.fillStyle = '#8b0000'; ctx.fillRect(-2.5, 2, 5, 5);
                    ctx.restore();

                } else if (cd > 0.15) {
                    // === WIND-UP PHASE (Prep) ===
                    const prepProgress = 1 - ((cd - 0.15) / 0.85); // 0.0 to 1.0
                    const restAngle = 0.3;
                    const readyAngle = -1.6;
                    let windAngle = restAngle + (readyAngle - restAngle) * prepProgress;

                    if (prepProgress > 0.8) {
                        const intensity = (prepProgress - 0.8) * 6;
                        windAngle += Math.sin(unit.animTimer * 40) * 0.05 * intensity;
                    }

                    ctx.save();
                    ctx.translate(-4 - (prepProgress * 4), -4 + totalBob + (prepProgress * 2)); // Changed 4 to -4
                    ctx.rotate(windAngle);

                    // Left Arm pulling back
                    ctx.fillStyle = '#e8c8a0'; ctx.fillRect(-2, -2, 4, 9);
                    ctx.fillStyle = '#8b0000'; ctx.fillRect(-2.5, 2, 5, 5);

                    // Move spear slightly up in the hand
                    ctx.translate(0, 4);
                    const glowAlpha = prepProgress > 0.5 ? (prepProgress - 0.5) * 0.8 : 0;

                    // Tilt the spear back (aiming forward relative to the arm's pulled-back angle)
                    // The arm rotates back (negative), so we rotate the spear forward (positive) to keep it pointing at the target
                    const aimAngle = prepProgress * 1.5;
                    drawHeldPilum(glowAlpha, aimAngle);

                    ctx.restore();

                } else {
                    // === FORWARD SWING (Release) ===
                    const swingProgress = cd <= 0 ? 1 : 1 - (cd / 0.15); // 0.0 to 1.0
                    const startAngle = -1.6;
                    const endAngle = 0.8;
                    const throwAngle = startAngle + (endAngle - startAngle) * swingProgress;

                    ctx.save();
                    ctx.translate(-6 - (swingProgress * 6), -2 + totalBob - (Math.sin(swingProgress * Math.PI) * 4)); // Shifted x over to -6
                    ctx.rotate(throwAngle);

                    // Left Arm 
                    ctx.fillStyle = '#e8c8a0'; ctx.fillRect(-2, -2, 4, 9);
                    ctx.fillStyle = '#8b0000'; ctx.fillRect(-2.5, 2, 5, 5);

                    ctx.translate(0, 4);
                    // Counter-rotate the spear exactly opposite to the throwAngle to keep it flying flat/straight right before release
                    drawHeldPilum(1.0, -throwAngle - 0.5); // The -0.5 acts as slight horizontal leveling

                    // Speed trail
                    ctx.globalAlpha = 0.4;
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(-1, -25); ctx.lineTo(-1, -25 + (swingProgress * 20)); ctx.stroke();
                    ctx.globalAlpha = 1;

                    ctx.restore();
                }

                ctx.restore(); // Restore body tilt container
            } else {
                // SWORD MODE STAB (from the LEFT side)
                const stabAngle = swingCycle * 0.8 - 0.3;
                ctx.translate(-6, -4 + totalBob); // Changed from 6 to -6
                ctx.rotate(stabAngle);
                ctx.fillStyle = '#ccc'; ctx.fillRect(-1, -14, 3, 12);
                ctx.fillStyle = '#ddd';
                ctx.beginPath(); ctx.moveTo(0.5, -17); ctx.lineTo(-2, -14); ctx.lineTo(3, -14); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#c9a84c'; ctx.fillRect(-3, -3, 7, 3);
                ctx.fillStyle = '#aa2222'; ctx.fillRect(-1, 0, 3, 2);
            }
            break;
        }
        case UnitType.Ulfhednar: {
            const swordSwing = swingCycle * 1.2 - 0.3;
            ctx.save();
            ctx.translate(6, -5 + totalBob); ctx.rotate(swordSwing);
            ctx.fillStyle = unit.ulfhednarRageActive ? '#88ccff' : '#ccc'; ctx.fillRect(-1, -16, 3, 14);
            ctx.fillStyle = unit.ulfhednarRageActive ? '#aaddff' : '#eee'; ctx.fillRect(-1, -16, 1, 14);
            ctx.fillStyle = unit.ulfhednarRageActive ? '#88ccff' : '#ddd';
            ctx.beginPath(); ctx.moveTo(0.5, -18); ctx.lineTo(-2, -16); ctx.lineTo(3, -16); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#c9a84c'; ctx.fillRect(-3, -3, 7, 2);
            ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-1, -1, 3, 4);
            ctx.fillStyle = '#c9a84c'; ctx.fillRect(-1, 3, 3, 2);
            ctx.restore();
            if (unit.ulfhednarRageActive) {
                ctx.globalAlpha = 0.4; ctx.fillStyle = '#4488ff';
                ctx.beginPath(); ctx.arc(2, -4 + totalBob, 14, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 0.7; ctx.strokeStyle = '#88eeff'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(8, -14 + totalBob); ctx.lineTo(5, -8 + totalBob);
                ctx.lineTo(10, -4 + totalBob); ctx.lineTo(6, 2 + totalBob); ctx.stroke();
                ctx.globalAlpha = 1;
            } else if (Math.abs(swingCycle) > 0.5) {
                ctx.globalAlpha = 0.2; ctx.fillStyle = '#ff6600';
                ctx.beginPath(); ctx.arc(2, -2 + totalBob, 10, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
            }
            break;
        }
        case UnitType.Scout: {
            const civ = unit.civilization;
            switch (civ) {
                case CivilizationType.BaTu: {
                    // Curved scimitar slash
                    const slashAngle = swingCycle * 1.2 - 0.2;
                    ctx.translate(5, -4 + totalBob);
                    ctx.rotate(slashAngle);
                    ctx.fillStyle = '#8a6a30';
                    ctx.fillRect(-1, -1, 2, 4);
                    ctx.fillStyle = '#eee';
                    ctx.beginPath();
                    ctx.moveTo(-1, -10);
                    ctx.quadraticCurveTo(2, -5, 0, -1);
                    ctx.lineTo(1, -1);
                    ctx.quadraticCurveTo(3, -5, 0, -10);
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = '#ffd700';
                    ctx.fillRect(-2, -1, 4, 1.5);
                    if (Math.abs(swingCycle) > 0.5) {
                        ctx.globalAlpha = 0.3;
                        ctx.strokeStyle = '#ffd700';
                        ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.arc(0, -4, 12, slashAngle - 0.6, slashAngle + 0.2); ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                    break;
                }
                case CivilizationType.DaiMinh: {
                    // Dual short swords (crossed)
                    const slash1 = swingCycle * 1.0;
                    const slash2 = Math.sin(swingPhase + 1.5) * 1.0;
                    ctx.translate(5, -4 + totalBob);
                    ctx.save();
                    ctx.rotate(slash1 - 0.4);
                    ctx.fillStyle = '#ccc'; ctx.fillRect(-1, -12, 2, 11);
                    ctx.fillStyle = '#ffd700'; ctx.fillRect(-2, -2, 4, 1.5);
                    ctx.fillStyle = '#5a2a2a'; ctx.fillRect(-1, -1, 2, 3);
                    ctx.restore();
                    ctx.save();
                    ctx.translate(-2, 0);
                    ctx.rotate(slash2 + 0.3);
                    ctx.fillStyle = '#ccc'; ctx.fillRect(-1, -10, 2, 9);
                    ctx.fillStyle = '#ffd700'; ctx.fillRect(-2, -2, 4, 1.5);
                    ctx.fillStyle = '#5a2a2a'; ctx.fillRect(-1, -1, 2, 3);
                    ctx.restore();
                    break;
                }
                case CivilizationType.Yamato: {
                    // Tanto quick stab
                    const stabAngle = swingCycle * 0.9 - 0.3;
                    ctx.translate(5, -3 + totalBob);
                    ctx.rotate(stabAngle);
                    ctx.fillStyle = '#333'; ctx.fillRect(-1, -1, 2, 4);
                    ctx.fillStyle = '#cc3333'; ctx.fillRect(-1, 0, 2, 2);
                    ctx.fillStyle = '#ffd700'; ctx.fillRect(-2, -2, 4, 1.5);
                    ctx.fillStyle = '#eee'; ctx.fillRect(-0.5, -10, 1.5, 8);
                    ctx.fillStyle = '#fff'; ctx.fillRect(0, -9, 0.5, 7);
                    if (Math.abs(swingCycle) > 0.6) {
                        ctx.globalAlpha = 0.25;
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath(); ctx.arc(0, -5, 12, stabAngle - 0.5, stabAngle + 0.15); ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                    break;
                }
                case CivilizationType.Viking: {
                    // Dual hatchets chop
                    const chop1 = swingCycle * 1.3 - 0.5;
                    const chop2 = Math.sin(swingPhase + 1.2) * 1.3;
                    ctx.translate(5, -4 + totalBob);
                    ctx.save();
                    ctx.rotate(chop1);
                    ctx.fillStyle = '#5a3a18'; ctx.fillRect(-1, -2, 2, 10);
                    ctx.fillStyle = '#bbb';
                    ctx.beginPath(); ctx.moveTo(1, -6); ctx.lineTo(5, -4); ctx.lineTo(5, 0); ctx.lineTo(1, -2); ctx.closePath(); ctx.fill();
                    ctx.restore();
                    ctx.save();
                    ctx.translate(-3, 0);
                    ctx.rotate(chop2);
                    ctx.fillStyle = '#5a3a18'; ctx.fillRect(-1, -2, 2, 8);
                    ctx.fillStyle = '#bbb';
                    ctx.beginPath(); ctx.moveTo(1, -5); ctx.lineTo(4, -3); ctx.lineTo(4, 0); ctx.lineTo(1, -2); ctx.closePath(); ctx.fill();
                    ctx.restore();
                    break;
                }
                default: {
                    // LaMa — short sword quick thrusts
                    const thrustAngle = swingCycle * 0.8 - 0.3;
                    ctx.translate(5, -4 + totalBob);
                    ctx.rotate(thrustAngle);
                    ctx.fillStyle = '#ccc'; ctx.fillRect(-1, -12, 2, 10);
                    ctx.fillStyle = '#ddd';
                    ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(-1.5, -12); ctx.lineTo(1.5, -12); ctx.closePath(); ctx.fill();
                    ctx.fillStyle = '#c9a84c'; ctx.fillRect(-2, -3, 4, 2);
                    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-1, -1, 2, 3);
                    break;
                }
            }
            break;
        }
        case UnitType.Knight: {
            const civ = unit.civilization;
            switch (civ) {
                case CivilizationType.BaTu: {
                    const age = unit.age;
                    // Scimitar wide slash
                    const slashAngle = swingCycle * 1.4 - 0.2;
                    ctx.translate(6, -6 + totalBob);
                    ctx.rotate(slashAngle);

                    // Gauntlet / Arm
                    ctx.fillStyle = '#6a5a2a'; // bronze bracer
                    ctx.fillRect(-5, -2, 5, 4);

                    // Handle
                    ctx.fillStyle = '#8a6a30';
                    ctx.fillRect(-1, -1, 2, 4);

                    // Curved blade (matches idle scimitar)
                    ctx.fillStyle = age >= 4 ? '#eee' : '#ccc';
                    ctx.beginPath();
                    // Tip of sword
                    ctx.moveTo(-1, -11);
                    // Right curve (outer edge)
                    ctx.quadraticCurveTo(3, -5, 0, -1);
                    // Bottom near hilt
                    ctx.lineTo(2, -1);
                    // Left curve (inner edge)
                    ctx.quadraticCurveTo(5, -5, 1, -11);
                    ctx.closePath();
                    ctx.fill();

                    // Gold accent on blade
                    if (age >= 4) {
                        ctx.fillStyle = '#ffd700';
                        ctx.fillRect(-2, -2, 4, 2);
                    } else {
                        // Guard
                        ctx.fillStyle = '#ffd700';
                        ctx.fillRect(-3, -2, 6, 2);
                    }
                    // Slash trail
                    if (Math.abs(swingCycle) > 0.5) {
                        ctx.globalAlpha = 0.35;
                        ctx.strokeStyle = '#ffd700';
                        ctx.lineWidth = 2.5;
                        ctx.beginPath();
                        ctx.arc(0, -6, 16, slashAngle - 0.8, slashAngle + 0.3);
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                    break;
                }
                case CivilizationType.DaiMinh: {
                    const age = unit.age;
                    // Halberd forward thrust
                    const thrust = Math.sin(swingPhase) * 10;
                    const wobble = Math.cos(swingPhase * 2) * 0.08;
                    ctx.translate(4 + thrust * 0.6, -6 + totalBob);
                    ctx.rotate(Math.PI / 2 - 0.3 + wobble);

                    // Arm / Hand
                    ctx.fillStyle = '#8a0a0a'; // red Ming sleeve
                    ctx.fillRect(-5, -1, 6, 4);

                    // Shaft
                    ctx.fillStyle = age >= 4 ? '#6a2222' : '#5a3a20';
                    ctx.fillRect(-1, -24, 2, 28);

                    // Halberd head (broad blade + hook)
                    ctx.fillStyle = age >= 4 ? '#eee' : '#ccc';
                    ctx.fillRect(-3, -28, 6, 3);
                    ctx.beginPath();
                    ctx.moveTo(0, -31);
                    ctx.lineTo(-2, -25);
                    ctx.lineTo(2, -25);
                    ctx.closePath();
                    ctx.fill();

                    // Hook
                    ctx.fillRect(2, -26, 3, 2);

                    if (age >= 4) {
                        ctx.fillStyle = '#ffd700';
                        ctx.fillRect(-2, -26, 4, 3);
                    }

                    // Red tassel
                    ctx.fillStyle = '#dd3333';
                    ctx.fillRect(-2, -22, 2, 4);

                    // Thrust trail
                    if (thrust > 4) {
                        ctx.globalAlpha = 0.3;
                        ctx.strokeStyle = '#ffbb44'; // slightly golden/fiery trail
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(0, -26);
                        ctx.lineTo(0, -26 - thrust * 0.5);
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                    break;
                }
                case CivilizationType.Yamato: {
                    // Katana quick downward cut
                    const cutAngle = swingCycle * 1.3 - 0.1;
                    ctx.translate(6, -5 + totalBob);
                    ctx.rotate(cutAngle);

                    // Arm / Sode
                    ctx.fillStyle = '#2a2a35'; // dark Yamato armor
                    ctx.fillRect(-6, -2, 7, 4);

                    // Handle with red wrapping
                    ctx.fillStyle = '#333';
                    ctx.fillRect(-1, -1, 2, 6);
                    ctx.fillStyle = '#cc3333';
                    ctx.fillRect(-1, 0, 2, 3);
                    // Tsuba (guard)
                    ctx.fillStyle = '#ffd700';
                    ctx.fillRect(-3, -2, 6, 2);
                    // Curved blade
                    ctx.fillStyle = '#f0f0f0';
                    ctx.beginPath();
                    ctx.moveTo(-1, -16);
                    ctx.quadraticCurveTo(2, -8, 0, -2);
                    ctx.lineTo(1, -2);
                    ctx.quadraticCurveTo(3, -8, 0, -16);
                    ctx.closePath();
                    ctx.fill();
                    // Edge shine
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(0, -14, 0.5, 12);
                    // Slash arc
                    if (Math.abs(swingCycle) > 0.6) {
                        ctx.globalAlpha = 0.3;
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(0, -8, 18, cutAngle - 0.7, cutAngle + 0.2);
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                    break;
                }
                case CivilizationType.Viking: {
                    // ⚔ Ragnar — Brutal Dual-Axe X-Slash
                    ctx.save(); // Protect outer state from translation and rotation below

                    const chopR = swingCycle * 1.6 - 0.2;
                    const chopL = -swingCycle * 1.2 + 0.4;

                    // Right Arm + Leviathan Axe (Main overhead chop)
                    ctx.save();
                    ctx.translate(8, -6 + totalBob);
                    ctx.rotate(chopR);
                    // Right Arm
                    ctx.fillStyle = '#e8c8a0'; // skin
                    ctx.fillRect(-2, 2, 4, 8); // upper arm
                    ctx.fillStyle = '#3a2a1a';
                    ctx.fillRect(-2, 6, 4, 4); // leather bracer
                    ctx.fillStyle = '#e8c8a0';
                    ctx.fillRect(-2, 10, 4, 3); // hand
                    // Leviathan Axe Handle
                    ctx.fillStyle = '#4a2a10';
                    ctx.fillRect(-1, -12, 3, 26);
                    ctx.fillStyle = '#daa520';
                    ctx.fillRect(-2, -8, 5, 2); // gold bands
                    ctx.fillRect(-2, 2, 5, 2);
                    ctx.fillRect(-2, 12, 5, 2);
                    // Leviathan Axe Head
                    ctx.fillStyle = '#88ccff'; // icy blue glow base
                    ctx.fillRect(1, -12, 8, 8);
                    ctx.fillStyle = '#d0e0f0'; // steel
                    ctx.beginPath();
                    ctx.moveTo(2, -14);
                    ctx.lineTo(10, -10);
                    ctx.lineTo(10, 0);
                    ctx.lineTo(2, -6);
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(9, -9, 1, 8); // edge
                    // Runes
                    ctx.fillStyle = '#44ffff';
                    ctx.fillRect(4, -10, 2, 2);
                    ctx.fillRect(6, -8, 2, 2);
                    ctx.fillRect(4, -6, 2, 2);
                    // Icy Trail Effect
                    if (swingCycle > 0.3) {
                        ctx.globalAlpha = 0.5;
                        ctx.strokeStyle = '#88eeff';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(0, 0, 18, -Math.PI * 0.5, chopR - 0.2);
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                    ctx.restore();

                    // Left Arm + Handaxe (Underhand sweeping chop)
                    ctx.save();
                    ctx.translate(-6, -4 + totalBob);
                    ctx.rotate(chopL);
                    // Left Arm
                    ctx.fillStyle = '#e8c8a0';
                    ctx.fillRect(-2, 1, 4, 6);
                    ctx.fillStyle = '#3a2a1a';
                    ctx.fillRect(-2, 4, 4, 3);
                    ctx.fillStyle = '#e8c8a0';
                    ctx.fillRect(-2, 7, 4, 3);
                    // Handaxe
                    ctx.fillStyle = '#5a3a18';
                    ctx.fillRect(-1, -8, 2, 18);
                    ctx.fillStyle = '#aaa';
                    ctx.beginPath();
                    ctx.moveTo(1, -8);
                    ctx.lineTo(6, -5);
                    ctx.lineTo(6, 1);
                    ctx.lineTo(1, -2);
                    ctx.closePath();
                    ctx.fill();
                    // Blood on left axe
                    ctx.fillStyle = '#8b0000';
                    ctx.fillRect(4, -4, 2, 4);
                    // Bloody Trail Effect
                    if (swingCycle > 0.4) {
                        ctx.globalAlpha = 0.4;
                        ctx.strokeStyle = '#cc2222';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(0, 0, 14, chopL - 0.2, Math.PI * 0.4);
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                    ctx.restore();

                    // Heavy impact shockwave on intersection
                    if (swingCycle > 0.7) {
                        ctx.globalAlpha = 0.5;
                        ctx.fillStyle = '#aaddff';
                        ctx.beginPath();
                        ctx.arc(4, -3, 10, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = '#fff';
                        ctx.beginPath();
                        ctx.arc(4, -3, 5, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.globalAlpha = 1;
                    }

                    ctx.restore(); // Restore outer state
                    break;
                }
                default: {
                    // LaMa / Generic — lance thrust forward
                    const thrust = Math.sin(swingPhase) * 10;
                    const wobble = Math.cos(swingPhase * 2) * 0.08;
                    ctx.translate(4 + thrust * 0.6, -6 + totalBob);
                    ctx.rotate(Math.PI / 2 - 0.3 + wobble);

                    // Roman/Generic Arm
                    ctx.fillStyle = '#8b0000'; // roman red tunic
                    ctx.fillRect(-5, -1, 6, 4);

                    // Shaft
                    ctx.fillStyle = '#8B5E3C';
                    ctx.fillRect(-1, -24, 2, 28);
                    // Spear head
                    ctx.fillStyle = '#ccc';
                    ctx.beginPath();
                    ctx.moveTo(0, -28);
                    ctx.lineTo(-2.5, -22);
                    ctx.lineTo(2.5, -22);
                    ctx.closePath();
                    ctx.fill();
                    // Shaft detail
                    ctx.fillStyle = '#ddd';
                    ctx.fillRect(-0.5, -26, 1, 4);
                    // Pennant
                    ctx.fillStyle = '#8b0000';
                    ctx.fillRect(1, -20, 4, 2.5);
                    // Thrust trail
                    if (thrust > 4) {
                        ctx.globalAlpha = 0.3;
                        ctx.strokeStyle = '#ffffee';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(0, -26);
                        ctx.lineTo(0, -26 - thrust * 0.5);
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                    break;
                }
            }
            break;
        }
        case UnitType.HeroSpartacus:
        case UnitType.HeroMusashi:
        case UnitType.HeroRagnar:
        case UnitType.HeroQiJiguang: {
            const civ = unit.civilization;
            if (civ === CivilizationType.BaTu) {
                // 🦁 Rostam — Overhead mace smash with arm (گرز رستم)
                const smashAngle = swingCycle * 2.0 - 0.5;
                ctx.translate(8, -6 + totalBob); ctx.rotate(smashAngle);

                // Right arm swinging
                ctx.fillStyle = '#e8c8a0'; // skin
                ctx.fillRect(-2, 4, 4, 6); // upper arm
                ctx.fillRect(-2, 8, 4, 5); // forearm
                // Armored gauntlet
                ctx.fillStyle = '#6a5a2a';
                ctx.fillRect(-3, 11, 6, 4);
                ctx.fillStyle = '#daa520';
                ctx.fillRect(-3, 11, 6, 1);

                // Mace gold guard
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(-2, 0, 5, 3);
                ctx.fillStyle = '#daa520';
                ctx.fillRect(-2, 2, 5, 1);
                // Handle with gold wrapping
                ctx.fillStyle = '#4a2a10';
                ctx.fillRect(0, -1, 2, 4);
                // Mace head — spiked with turquoise
                ctx.fillStyle = '#aaa';
                ctx.fillRect(-4, -12, 10, 8);
                ctx.fillStyle = '#ccc';
                ctx.fillRect(-3, -11, 8, 6);
                // Spikes
                ctx.fillStyle = '#ddd';
                ctx.fillRect(-5, -10, 1, 3);
                ctx.fillRect(6, -10, 1, 3);
                ctx.fillRect(-2, -13, 2, 1);
                ctx.fillRect(2, -13, 2, 1);
                // Gold bands
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(-3, -12, 8, 1.5);
                ctx.fillRect(-3, -5, 8, 1);
                // Turquoise inlay
                ctx.fillStyle = '#44bbaa';
                ctx.fillRect(-1, -9, 2, 2);
                ctx.fillRect(1, -9, 2, 2);

                // Ground shockwave on downswing
                if (swingCycle > 0.5) {
                    ctx.globalAlpha = (swingCycle - 0.5) * 0.8;
                    ctx.fillStyle = '#ffaa00';
                    ctx.fillRect(-6, -14, 2, 2); // spark
                    ctx.fillRect(6, -14, 2, 2);
                    ctx.fillRect(-4, -15, 1, 1);
                    ctx.fillRect(5, -15, 1, 1);
                    ctx.globalAlpha = 1;
                }
            } else if (civ === CivilizationType.DaiMinh) {
                // Qi Jiguang — weapon handled entirely in draw-qijiguang.ts, skip overlay
                break;
            } else if (civ === CivilizationType.Yamato) {
                // Musashi — weapon handled entirely in draw-musashi.ts, skip overlay
                break;
            } else if (civ === CivilizationType.LaMa) {
                // Spartacus — weapon handled entirely in draw-spartacus.ts, skip overlay
                break;
            } else if (civ === CivilizationType.Viking) {
                // ⚔ Ragnar — Brutal Dual-Axe X-Slash
                ctx.save(); // Protect outer state

                const chopR = swingCycle * 1.6 - 0.2;
                const chopL = -swingCycle * 1.2 + 0.4;

                // Right Arm + Leviathan Axe (Main overhead chop)
                ctx.save();
                ctx.translate(8, -6 + totalBob);
                ctx.rotate(chopR);
                // Right Arm
                ctx.fillStyle = '#e8c8a0'; // skin
                ctx.fillRect(-2, 2, 4, 8); // upper arm
                ctx.fillStyle = '#3a2a1a';
                ctx.fillRect(-2, 6, 4, 4); // leather bracer
                ctx.fillStyle = '#e8c8a0';
                ctx.fillRect(-2, 10, 4, 3); // hand
                // Leviathan Axe Handle
                ctx.fillStyle = '#4a2a10';
                ctx.fillRect(-1, -12, 3, 26);
                ctx.fillStyle = '#daa520';
                ctx.fillRect(-2, -8, 5, 2); // gold bands
                ctx.fillRect(-2, 2, 5, 2);
                ctx.fillRect(-2, 12, 5, 2);
                // Leviathan Axe Head
                ctx.fillStyle = '#88ccff'; // icy blue glow base
                ctx.fillRect(1, -12, 8, 8);
                ctx.fillStyle = '#d0e0f0'; // steel
                ctx.beginPath();
                ctx.moveTo(2, -14);
                ctx.lineTo(10, -10);
                ctx.lineTo(10, 0);
                ctx.lineTo(2, -6);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.fillRect(9, -9, 1, 8); // edge
                // Runes
                ctx.fillStyle = '#44ffff';
                ctx.fillRect(4, -10, 2, 2);
                ctx.fillRect(6, -8, 2, 2);
                ctx.fillRect(4, -6, 2, 2);
                // Icy Trail Effect
                if (swingCycle > 0.3) {
                    ctx.globalAlpha = 0.5;
                    ctx.strokeStyle = '#88eeff';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(0, 0, 18, -Math.PI * 0.5, chopR - 0.2);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
                ctx.restore();

                // Left Arm + Handaxe (Underhand sweeping chop)
                ctx.save();
                ctx.translate(-6, -4 + totalBob);
                ctx.rotate(chopL);
                // Left Arm
                ctx.fillStyle = '#e8c8a0';
                ctx.fillRect(-2, 1, 4, 6);
                ctx.fillStyle = '#3a2a1a';
                ctx.fillRect(-2, 4, 4, 3);
                ctx.fillStyle = '#e8c8a0';
                ctx.fillRect(-2, 7, 4, 3);
                // Handaxe
                ctx.fillStyle = '#5a3a18';
                ctx.fillRect(-1, -8, 2, 18);
                ctx.fillStyle = '#aaa';
                ctx.beginPath();
                ctx.moveTo(1, -8);
                ctx.lineTo(6, -5);
                ctx.lineTo(6, 1);
                ctx.lineTo(1, -2);
                ctx.closePath();
                ctx.fill();
                // Blood on left axe
                ctx.fillStyle = '#8b0000';
                ctx.fillRect(4, -4, 2, 4);
                // Bloody Trail Effect
                if (swingCycle > 0.4) {
                    ctx.globalAlpha = 0.4;
                    ctx.strokeStyle = '#cc2222';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, 14, chopL - 0.2, Math.PI * 0.4);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
                ctx.restore();

                // Heavy impact shockwave on intersection
                if (swingCycle > 0.7) {
                    ctx.globalAlpha = 0.5;
                    ctx.fillStyle = '#aaddff';
                    ctx.beginPath();
                    ctx.arc(4, -3, 10, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(4, -3, 5, 0, Math.PI * 2);
                    ctx.globalAlpha = 1;
                }

                ctx.restore(); // Restore outer state
            } else {
                // Fallback generic slash
                const megaSlash = swingCycle * 1.5 - 0.3;
                ctx.translate(8, -6 + totalBob); ctx.rotate(megaSlash);
                ctx.fillStyle = '#ddd'; ctx.fillRect(-2, -22, 4, 20);
                ctx.fillStyle = '#ffd700'; ctx.fillRect(-5, -3, 10, 3);
                ctx.fillStyle = '#5a2a0a'; ctx.fillRect(-1, 0, 3, 5);
                ctx.globalAlpha = 0.3; ctx.strokeStyle = '#ff6644'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(0, -10, 20, megaSlash - 1.0, megaSlash + 0.3); ctx.stroke();
                ctx.globalAlpha = 1;
            }
            break;
        }
    }
}

export function renderAttackEffects(unit: Unit, ctx: CanvasRenderingContext2D, totalBob: number, impactPhase: number, _impactMoment: boolean): void {
    switch (unit.type) {
        case UnitType.Swordsman: {
            const slashProgress = (Math.sin(impactPhase) + 1) * 0.5;
            if (slashProgress > 0.3 && slashProgress < 0.9) {
                const arcAlpha = Math.sin((slashProgress - 0.3) / 0.6 * Math.PI) * 0.7;
                ctx.save(); ctx.globalAlpha = arcAlpha;
                const arcStart = -Math.PI * 0.6 + slashProgress * Math.PI * 0.8;
                ctx.strokeStyle = '#ffffcc'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(0, -4 + totalBob, 16, arcStart - 0.6, arcStart + 0.3); ctx.stroke();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(0, -4 + totalBob, 14, arcStart - 0.4, arcStart + 0.2); ctx.stroke();
                ctx.fillStyle = '#ffd700';
                for (let s = 0; s < 3; s++) {
                    const sa = arcStart - 0.3 + s * 0.2;
                    ctx.fillRect(Math.cos(sa) * 15 - 1, -4 + totalBob + Math.sin(sa) * 15 - 1, 2, 2);
                }
                ctx.restore();
            }
            break;
        }
        case UnitType.Knight: {
            const civ = unit.civilization;
            if (_impactMoment) {
                ctx.save();
                ctx.globalAlpha = 0.6;
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(5, -4 + totalBob, 5, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
            const slashProgress = (Math.sin(impactPhase) + 1) * 0.5;
            if (slashProgress > 0.3 && slashProgress < 0.9) {
                ctx.save();
                const arcAlpha = Math.sin((slashProgress - 0.3) / 0.6 * Math.PI) * 0.5;
                ctx.globalAlpha = arcAlpha;
                const arcStart = -Math.PI * 0.5 + slashProgress * Math.PI * 0.8;
                if (civ === CivilizationType.BaTu) {
                    // Heavy mace ground-slam shockwave
                    ctx.fillStyle = '#ffd700';
                    ctx.globalAlpha = arcAlpha * 0.6;
                    // Impact ring expanding outward
                    ctx.strokeStyle = '#ffaa44'; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.arc(4, 2 + totalBob, 12 * slashProgress, 0, Math.PI); ctx.stroke();
                    // Ground cracks radiating from impact
                    ctx.strokeStyle = '#daa520'; ctx.lineWidth = 1.5;
                    for (let cr = 0; cr < 4; cr++) {
                        const cra = -Math.PI * 0.8 + cr * 0.5;
                        ctx.beginPath();
                        ctx.moveTo(4, 2 + totalBob);
                        ctx.lineTo(4 + Math.cos(cra) * 14 * slashProgress, 2 + totalBob + Math.sin(cra) * 6 * slashProgress);
                        ctx.stroke();
                    }
                    // Golden sparks flying
                    ctx.fillStyle = '#ffd700';
                    for (let s = 0; s < 4; s++) {
                        const sa = -Math.PI * 0.5 + s * 0.4 - 0.3;
                        const sr = 8 + slashProgress * 10;
                        ctx.fillRect(4 + Math.cos(sa) * sr - 1, 2 + totalBob + Math.sin(sa) * sr * 0.5 - 1, 2, 2);
                    }
                    ctx.globalAlpha = arcAlpha;
                } else if (civ === CivilizationType.Yamato) {
                    // Clean white katana arc
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(0, -4 + totalBob, 18, arcStart - 0.5, arcStart + 0.2); ctx.stroke();
                    ctx.strokeStyle = '#ccddff'; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.arc(0, -4 + totalBob, 16, arcStart - 0.4, arcStart + 0.15); ctx.stroke();
                } else if (civ === CivilizationType.Viking) {
                    // Heavy axe ground impact
                    ctx.fillStyle = '#ff8844';
                    ctx.beginPath(); ctx.arc(3, 6 + totalBob, 8 * slashProgress, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = '#aa6622'; ctx.lineWidth = 1.5;
                    for (let d = 0; d < 3; d++) {
                        const da = -Math.PI * 0.3 + d * 0.3;
                        ctx.beginPath(); ctx.moveTo(3, 6 + totalBob);
                        ctx.lineTo(3 + Math.cos(da) * 12, 6 + totalBob + Math.sin(da) * 6);
                        ctx.stroke();
                    }
                } else if (civ === CivilizationType.DaiMinh) {
                    // Qi Jiguang — slash FX handled in draw-qijiguang.ts
                    // do nothing
                } else {
                    // Spartacus gladius stab impact + shield bash
                    // Stab thrust line
                    ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 2;
                    const thrustAmt = slashProgress * 16;
                    ctx.beginPath(); ctx.moveTo(6, -6 + totalBob);
                    ctx.lineTo(6 + thrustAmt, -6 + totalBob);
                    ctx.stroke();
                    // Impact point flash
                    ctx.fillStyle = '#fff';
                    ctx.beginPath(); ctx.arc(6 + thrustAmt, -6 + totalBob, 3 * slashProgress, 0, Math.PI * 2); ctx.fill();
                    // Blood sparks
                    ctx.fillStyle = '#cc2222';
                    for (let s = 0; s < 3; s++) {
                        const sa = -Math.PI * 0.5 + s * 0.5;
                        const sr = 4 + slashProgress * 8;
                        ctx.fillRect(6 + thrustAmt + Math.cos(sa) * sr - 0.5, -6 + totalBob + Math.sin(sa) * sr - 0.5, 1.5, 1.5);
                    }
                    // Shield bash shockwave (left side)
                    ctx.strokeStyle = '#daa520'; ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(-6, -2 + totalBob, 8 * slashProgress, -Math.PI * 0.4, Math.PI * 0.4);
                    ctx.stroke();
                }
                ctx.restore();
            }
            break;
        }
        case UnitType.Spearman: {
            const thrustAmt = Math.sin(impactPhase);
            if (thrustAmt > 0.5) {
                ctx.save(); ctx.globalAlpha = (thrustAmt - 0.5) * 1.5;
                ctx.strokeStyle = '#ffffee'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(0, -6 + totalBob); ctx.lineTo(thrustAmt * 18, -6 + totalBob); ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(thrustAmt * 18, -6 + totalBob, 3 * (thrustAmt - 0.5), 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
            break;
        }
        case UnitType.Scout: {
            const slashA = (Math.sin(impactPhase) + 1) * 0.5;
            if (slashA > 0.4) {
                ctx.save(); ctx.globalAlpha = (slashA - 0.4) * 1.2;
                ctx.strokeStyle = '#ccddff'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(-6, -12 + totalBob); ctx.lineTo(10, 2 + totalBob); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(10, -12 + totalBob); ctx.lineTo(-6, 2 + totalBob); ctx.stroke();
                ctx.restore();
            }
            break;
        }
        case UnitType.HeroSpartacus:
        case UnitType.HeroMusashi:
        case UnitType.HeroRagnar:
        case UnitType.HeroQiJiguang: {
            const civ4 = unit.civilization;
            const slashP = (Math.sin(impactPhase) + 1) * 0.5;
            if (slashP > 0.2) {
                ctx.save();
                const arcA = Math.sin((slashP - 0.2) / 0.8 * Math.PI) * 0.8;
                ctx.globalAlpha = arcA;

                if (civ4 === CivilizationType.DaiMinh) {
                    // Qi Jiguang — slash FX handled in draw-qijiguang.ts
                    ctx.restore(); break;
                } else {
                    const fArcStart = -Math.PI * 0.7 + slashP * Math.PI;
                    ctx.strokeStyle = '#ff6622'; ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.arc(0, -6 + totalBob, 22, fArcStart - 0.8, fArcStart + 0.3); ctx.stroke();
                    ctx.strokeStyle = '#ffdd44'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(0, -6 + totalBob, 20, fArcStart - 0.6, fArcStart + 0.2); ctx.stroke();
                    ctx.fillStyle = '#ff4400';
                    for (let f = 0; f < 5; f++) {
                        const fa = fArcStart - 0.5 + f * 0.2;
                        const fr = 20 + Math.random() * 4;
                        ctx.fillRect(Math.cos(fa) * fr - 1, -6 + totalBob + Math.sin(fa) * fr - 1, 3, 3);
                    }
                }
                ctx.restore();
            }
            break;
        }
    }
}
