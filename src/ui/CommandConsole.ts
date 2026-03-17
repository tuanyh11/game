// ============================================================
//  CommandConsole — In-game cheat/debug console
//  Press ENTER to toggle, type commands, press ENTER to execute
// ============================================================

import { C } from "../config/GameConfig";

export interface ConsoleHost {
    setGameSpeed(speed: number): void;
    addResource(type: string, amount: number): void;
    revealMap(): void;
    toggleFog(): void;
    spawnUnits(type: string, count: number): void;
    spawnCivShowcase(): void;
    spawnElite(count: number): void;
    killSelected(): void;
    getGameSpeed(): number;
    getPlayerCiv(): string;
    pause(): void;
    resume(): void;
    addHeroXp(amount: number): void;
}

interface ConsoleLine {
    text: string;
    color: string;
    time: number;
}

export class CommandConsole {
    isOpen = false;
    private inputText = '';
    private history: ConsoleLine[] = [];
    private commandHistory: string[] = [];
    private historyIndex = -1;
    private cursorBlink = 0;
    private maxLines = 14;
    private host: ConsoleHost | null = null;

    constructor() {
        // Use capture phase so we intercept BEFORE camera/selection
        window.addEventListener('keydown', (e) => this.handleKey(e), true);
    }

    setHost(host: ConsoleHost): void {
        this.host = host;
        this.log('Nhập /help để xem danh sách lệnh', '#88aacc');
    }

    private handleKey(e: KeyboardEvent): void {
        // Toggle console with Enter (when not typing in other inputs)
        if (e.key === 'Enter') {
            if (!this.isOpen) {
                // Open console
                this.isOpen = true;
                this.inputText = '';
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            // Console is open — execute command but keep console open
            e.preventDefault();
            e.stopPropagation();
            if (this.inputText.trim()) {
                this.executeCommand(this.inputText.trim());
                this.commandHistory.unshift(this.inputText.trim());
                if (this.commandHistory.length > 50) this.commandHistory.pop();
                this.historyIndex = -1;
            }
            this.inputText = '';
            return;
        }

        if (!this.isOpen) return;
        e.preventDefault();
        e.stopPropagation();

        switch (e.key) {
            case 'Escape':
                this.isOpen = false;
                this.inputText = '';
                break;

            case 'Backspace':
                this.inputText = this.inputText.slice(0, -1);
                break;

            case 'ArrowUp':
                if (this.commandHistory.length > 0) {
                    this.historyIndex = Math.min(this.historyIndex + 1, this.commandHistory.length - 1);
                    this.inputText = this.commandHistory[this.historyIndex];
                }
                break;

            case 'ArrowDown':
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.inputText = this.commandHistory[this.historyIndex];
                } else {
                    this.historyIndex = -1;
                    this.inputText = '';
                }
                break;

            default:
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                    this.inputText += e.key;
                }
                break;
        }
    }

    log(text: string, color = '#ccc'): void {
        this.history.push({ text, color, time: Date.now() });
        if (this.history.length > this.maxLines) this.history.shift();
    }

    private executeCommand(raw: string): void {
        this.log(`> ${raw}`, '#aaa');

        if (!raw.startsWith('/')) {
            this.log('⚠ Lệnh phải bắt đầu bằng /  (nhập /help để xem)', '#ffaa44');
            return;
        }

        const parts = raw.slice(1).split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (!this.host) {
            this.log('❌ Console chưa được kết nối', '#ff4444');
            return;
        }

        switch (cmd) {
            case 'help':
                this.showHelp();
                break;

            case 'speed': {
                const val = parseFloat(args[0]);
                if (isNaN(val) || val <= 0 || val > 10) {
                    this.log('Cách dùng: /speed <0.1 - 10>', '#ffaa44');
                    this.log(`Tốc độ hiện tại: ${this.host.getGameSpeed()}x`, '#88cc88');
                } else {
                    this.host.setGameSpeed(val);
                    this.log(`✅ Tốc độ game: ${val}x`, '#44ff44');
                }
                break;
            }

            case 'gold': {
                const amt = parseInt(args[0]) || 1000;
                this.host.addResource('gold', amt);
                this.log(`✅ +${amt} Gold`, '#ffd700');
                break;
            }

            case 'food': {
                const amt = parseInt(args[0]) || 1000;
                this.host.addResource('food', amt);
                this.log(`✅ +${amt} Food`, '#88cc44');
                break;
            }

            case 'wood': {
                const amt = parseInt(args[0]) || 1000;
                this.host.addResource('wood', amt);
                this.log(`✅ +${amt} Wood`, '#cc8844');
                break;
            }

            case 'stone': {
                const amt = parseInt(args[0]) || 1000;
                this.host.addResource('stone', amt);
                this.log(`✅ +${amt} Stone`, '#aaaacc');
                break;
            }

            case 'money':
            case 'rich': {
                this.host.addResource('food', 5000);
                this.host.addResource('wood', 5000);
                this.host.addResource('gold', 5000);
                this.host.addResource('stone', 5000);
                this.log('💰 +5000 tất cả tài nguyên!', '#ffd700');
                break;
            }

            case 'reveal': {
                this.host.revealMap();
                this.log('🗺 Đã mở toàn bộ bản đồ!', '#44ccff');
                break;
            }

            case 'fog': {
                this.host.toggleFog();
                this.log('🌫 Toggle Fog of War', '#aaccff');
                break;
            }

            case 'spawn': {
                const type = args[0] || 'spearman';
                const count = parseInt(args[1]) || 5;
                this.host.spawnUnits(type, count);
                this.log(`✅ Spawn ${count}x ${type}`, '#44ff88');
                break;
            }

            case 'kill': {
                this.host.killSelected();
                this.log('💀 Đã tiêu diệt đơn vị đang chọn', '#ff4444');
                break;
            }

            case 'pause': {
                this.host.pause();
                this.log('⏸ Game đã tạm dừng', '#ffcc00');
                break;
            }

            case 'resume':
            case 'play': {
                this.host.resume();
                this.log('▶ Game tiếp tục', '#44ff44');
                break;
            }

            case 'fast': {
                this.host.setGameSpeed(3);
                this.log('⚡ Tốc độ nhanh: 3x', '#44ff44');
                break;
            }

            case 'normal': {
                this.host.setGameSpeed(1);
                this.log('🔄 Tốc độ bình thường: 1x', '#44ff44');
                break;
            }

            case 'slow': {
                this.host.setGameSpeed(0.5);
                this.log('🐌 Tốc độ chậm: 0.5x', '#44ff44');
                break;
            }

            case 'heroxp': {
                const amt = parseInt(args[0]) || 100;
                this.host.addHeroXp(amt);
                this.log(`⭐ +${amt} XP cho tướng đang chọn`, '#aa88ff');
                break;
            }

            case 'elite': {
                const count = parseInt(args[0]) || 5;
                this.host.spawnElite(count);
                const civName = this.host.getPlayerCiv();
                const eliteNames: Record<string, string> = {
                    'baTu': '🐘 Bất Tử',
                    'daiTong': '🐲 Cẩm Y Vệ',
                    'yamato': '⛩ Ninja',
                    'laMa': '🏛 Centurion',
                    'viking': '⚓ Chiến Binh Sói',
                };
                const eName = eliteNames[civName] || 'Elite';
                this.log(`✅ Spawn ${count}x ${eName}`, '#ff88ff');
                break;
            }

            case 'showcivs': {
                this.host.spawnCivShowcase();
                this.log('🎭 Đã spawn mẫu 5 nền văn minh! (5 hàng x 5 loại lính)', '#ff88ff');
                this.log('Hàng: Ba Tư | Đại Minh | Yamato | La Mã | Viking', '#aaa');
                this.log('Cột: Giáo | Cung | Trinh Sát | Kiếm | Kỵ Sĩ', '#aaa');
                break;
            }

            case 'gg': {
                // Combo: reveal map + full resources + fast speed
                this.host.revealMap();
                this.host.addResource('food', 99999);
                this.host.addResource('wood', 99999);
                this.host.addResource('gold', 99999);
                this.host.addResource('stone', 99999);
                this.host.setGameSpeed(3);
                this.log('🏆 GG Mode kích hoạt!', '#ffd700');
                this.log('   🗺 Bản đồ sáng', '#44ccff');
                this.log('   💰 Full tài nguyên (99999)', '#ffd700');
                this.log('   ⚡ Tốc độ 3x', '#44ff44');
                break;
            }

            default:
                this.log(`❌ Lệnh không hợp lệ: /${cmd}`, '#ff4444');
                this.log('Nhập /help để xem danh sách lệnh', '#888');
                break;
        }
    }

    private showHelp(): void {
        const commands = [
            ['═══════ TỐC ĐỘ ═══════', '#ffd700'],
            ['/speed <n>    Đặt tốc độ (0.1-10)', '#ccc'],
            ['/fast         Tốc độ nhanh (3x)', '#ccc'],
            ['/normal       Tốc độ bình thường', '#ccc'],
            ['/slow         Tốc độ chậm (0.5x)', '#ccc'],
            ['/pause        Tạm dừng', '#ccc'],
            ['/resume       Tiếp tục', '#ccc'],
            ['═══════ TÀI NGUYÊN ═══════', '#ffd700'],
            ['/gold [n]     Thêm vàng (mặc định 1000)', '#ccc'],
            ['/food [n]     Thêm thức ăn', '#ccc'],
            ['/wood [n]     Thêm gỗ', '#ccc'],
            ['/stone [n]    Thêm đá', '#ccc'],
            ['/money        +5000 tất cả', '#ccc'],
            ['═══════ BẢN ĐỒ ═══════', '#ffd700'],
            ['/reveal       Mở toàn bản đồ', '#ccc'],
            ['/fog          Bật/tắt sương mù', '#ccc'],
            ['═══════ ĐƠN VỊ ═══════', '#ffd700'],
            ['/spawn <type> [n]  Tạo đơn vị (villager/spearman/archer/scout/swordsman/knight)', '#ccc'],
            ['/elite [n]   Spawn lính đặc trưng nền văn minh', '#ccc'],
            ['/showcivs     So sánh giao diện 5 nền văn minh', '#ccc'],
            ['/kill         Tiêu diệt đơn vị đang chọn', '#ccc'],
            ['/heroxp [n]   Thêm XP cho tướng đang chọn', '#ccc'],
            ['═══════ COMBO ═══════', '#ffd700'],
            ['/gg           Map sáng + Full tài nguyên + Nhanh 3x', '#ccc'],
        ];
        for (const [text, color] of commands) {
            this.log(text, color);
        }
    }

    update(dt: number): void {
        this.cursorBlink += dt;
        if (this.cursorBlink > 1) this.cursorBlink -= 1;
    }

    render(ctx: CanvasRenderingContext2D, vpW: number, vpH: number): void {
        // Always show recent messages (fade out)
        const now = Date.now();
        const visibleTime = 6000; // 6 seconds
        const fadeTime = 1500;

        if (!this.isOpen) {
            // User requested to hide all in-game notification messages.
            // Messages will no longer be drawn on-screen automatically.
            return;
        }

        // === FULL CONSOLE OVERLAY ===
        const consoleH = 320;
        const consoleW = Math.min(vpW * 0.55, 700);
        const cx = (vpW - consoleW) / 2;
        const cy = (vpH - consoleH) / 2 - 40;

        // Dark overlay behind
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, vpW, vpH);

        // Console background (dark panel with gold border)
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(cx - 2, cy - 2, consoleW + 4, consoleH + 4);
        ctx.fillStyle = C.uiBorderDark;
        ctx.fillRect(cx - 1, cy - 1, consoleW + 2, consoleH + 2);
        ctx.fillStyle = '#0d0d14';
        ctx.fillRect(cx, cy, consoleW, consoleH);

        // Header
        ctx.fillStyle = '#1a1a24';
        ctx.fillRect(cx, cy, consoleW, 28);
        ctx.fillStyle = C.uiBorder;
        ctx.fillRect(cx, cy + 27, consoleW, 1);
        ctx.fillStyle = '#daa520';
        ctx.font = "bold 13px 'Inter', sans-serif";
        ctx.fillText('⚙ BẢNG ĐIỀU KHIỂN', cx + 10, cy + 19);
        ctx.fillStyle = '#666';
        ctx.font = "11px 'Inter', sans-serif";
        ctx.fillText('Enter: Thực thi  |  Esc: Đóng  |  ↑↓: Lịch sử', cx + consoleW - 290, cy + 19);

        // Message history
        const msgAreaY = cy + 32;
        const msgAreaH = consoleH - 70;
        ctx.save();
        ctx.beginPath();
        ctx.rect(cx + 4, msgAreaY, consoleW - 8, msgAreaH);
        ctx.clip();

        const visibleLines = this.history.slice(-this.maxLines);
        let ly = msgAreaY + msgAreaH - visibleLines.length * 18;
        for (const line of visibleLines) {
            ctx.fillStyle = line.color;
            ctx.font = "12px 'JetBrains Mono', 'Courier New', monospace";
            ctx.fillText(line.text, cx + 10, ly + 14);
            ly += 18;
        }
        ctx.restore();

        // Input field
        const inputY = cy + consoleH - 34;
        ctx.fillStyle = '#14141e';
        ctx.fillRect(cx + 4, inputY, consoleW - 8, 28);
        ctx.strokeStyle = '#333340';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx + 4, inputY, consoleW - 8, 28);

        // Prompt
        ctx.fillStyle = '#daa520';
        ctx.font = "bold 14px 'JetBrains Mono', 'Courier New', monospace";
        ctx.fillText('>', cx + 10, inputY + 19);

        // Input text
        ctx.fillStyle = '#e0e0e0';
        ctx.font = "13px 'JetBrains Mono', 'Courier New', monospace";
        const displayText = this.inputText;
        ctx.fillText(displayText, cx + 26, inputY + 19);

        // Cursor
        if (this.cursorBlink < 0.5) {
            const textW = ctx.measureText(displayText).width;
            ctx.fillStyle = '#daa520';
            ctx.fillRect(cx + 26 + textW + 1, inputY + 6, 8, 16);
        }

        // Speed indicator (bottom right of console)
        ctx.fillStyle = '#555';
        ctx.font = "10px 'Inter', sans-serif";
        const speedInfo = this.host ? `Tốc độ: ${this.host.getGameSpeed()}x` : '';
        ctx.fillText(speedInfo, cx + consoleW - 80, cy + consoleH - 6);
    }
}
