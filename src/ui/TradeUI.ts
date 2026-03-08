import { C, ResourceType, CIVILIZATION_DATA } from "../config/GameConfig";
import { PlayerState } from "../systems/PlayerState";
import { EntityManager } from "../systems/EntityManager";

export class TradeUI {
    private container: HTMLDivElement;
    private isOpen = false;

    // References to game systems for data access
    private playerState: PlayerState;
    private entityManager: EntityManager;
    private getAiState: (teamIndex: number) => PlayerState | undefined;

    constructor(playerState: PlayerState, entityManager: EntityManager, getAiState: (teamIndex: number) => PlayerState | undefined) {
        this.playerState = playerState;
        this.entityManager = entityManager;
        this.getAiState = getAiState;

        // Create the main container div
        this.container = document.createElement('div');
        this.container.id = 'trade-ui-container';
        this.container.style.display = 'none';

        // Inject styles
        this.injectStyles();

        document.body.appendChild(this.container);
    }

    private injectStyles() {
        if (document.getElementById('trade-ui-styles')) return;

        const style = document.createElement('style');
        style.id = 'trade-ui-styles';
        style.textContent = `
            #trade-ui-container {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 480px;
                background-color: #0d0b08;
                border: 2px solid #8a6f3e;
                border-radius: 4px;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.8), inset 0 0 10px rgba(0, 0, 0, 0.5);
                font-family: 'Inter', sans-serif;
                color: #e8d4a0;
                z-index: 1000;
                padding: 16px;
                // Outer black border effect
                outline: 4px solid #050403;
            }

            .trade-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #3a2a10;
                padding-bottom: 12px;
                margin-bottom: 16px;
            }

            .trade-title {
                font-size: 18px;
                font-weight: bold;
                color: #dfb238; /* UI Highlight */
                text-shadow: 1px 1px 2px #000;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .trade-close-btn {
                background-color: #aa3333;
                color: white;
                border: 1px solid #ff5555;
                border-radius: 3px;
                width: 24px;
                height: 24px;
                font-weight: bold;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.1s;
            }

            .trade-close-btn:hover {
                background-color: #ff5555;
            }
            
            .trade-inventory {
                font-size: 13px;
                color: #ddd;
                background-color: #1a1510;
                padding: 8px 12px;
                border-radius: 4px;
                border: 1px solid #3a2a10;
                margin-bottom: 16px;
                display: flex;
                justify-content: space-between;
            }

            .trade-ally-row {
                background-color: #141110;
                border: 1px solid #3a2a10;
                border-radius: 4px;
                padding: 12px;
                margin-bottom: 12px;
            }

            .trade-ally-name {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 12px;
                display: block;
            }

            .trade-resources-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
            }

            .trade-resource-col {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .trade-resource-label {
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 4px;
                color: #aaa;
            }

            .trade-input {
                width: 100%;
                background-color: #0a0908;
                border: 1px solid #3a2a10;
                color: #fff;
                font-family: 'Inter', sans-serif;
                font-size: 12px;
                padding: 4px 6px;
                border-radius: 3px;
                outline: none;
            }

            .trade-input:focus {
                border-color: #c9a84c;
            }
            
            /* Remove arrows from number input */
            .trade-input::-webkit-outer-spin-button,
            .trade-input::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            .trade-input[type=number] {
                -moz-appearance: textfield;
            }

            .trade-send-btn {
                background-color: #111;
                color: #555;
                font-family: 'Inter', sans-serif;
                font-size: 11px;
                font-weight: bold;
                border: 1px solid #333;
                border-radius: 3px;
                padding: 6px 0;
                cursor: not-allowed;
                margin-top: 4px;
                transition: all 0.1s;
            }

            .trade-send-btn.can-afford {
                background-color: #2a2a2a;
                color: inherit;
                cursor: pointer;
            }

            .trade-send-btn.can-afford:hover {
                background-color: #444;
            }
            
            .trade-send-btn:active {
                transform: translateY(1px);
            }
        `;
        document.head.appendChild(style);
    }

    public toggle(force?: boolean) {
        if (force !== undefined) {
            this.isOpen = force;
        } else {
            this.isOpen = !this.isOpen;
        }

        if (this.isOpen) {
            this.render();
            this.container.style.display = 'block';
        } else {
            this.container.style.display = 'none';
        }
    }

    public get isVisible(): boolean {
        return this.isOpen;
    }

    private render() {
        this.container.innerHTML = '';

        // Header
        const header = document.createElement('div');
        header.className = 'trade-header';

        const title = document.createElement('div');
        title.className = 'trade-title';
        title.innerHTML = `<span>🤝</span> SOẠN THẢO GIAO THƯƠNG ĐỒNG MINH`;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'trade-close-btn';
        closeBtn.innerText = 'X';
        closeBtn.onclick = () => this.toggle(false);

        header.appendChild(title);
        header.appendChild(closeBtn);
        this.container.appendChild(header);

        // Inventory
        const res = this.playerState.resources;
        const inventory = document.createElement('div');
        inventory.className = 'trade-inventory';
        inventory.innerHTML = `
            <span><strong>Kho:</strong></span>
            <span style="color: ${C.food}">🌾 ${Math.floor(res.food)}</span>
            <span style="color: ${C.wood}">🪵 ${Math.floor(res.wood)}</span>
            <span style="color: ${C.gold}">🪙 ${Math.floor(res.gold)}</span>
            <span style="color: ${C.stone}">🪨 ${Math.floor(res.stone)}</span>
        `;
        this.container.appendChild(inventory);

        // Allies
        const allyTeams = Array.from(this.entityManager.getAllyTeams(0));
        if (allyTeams.length === 0) {
            const noAlly = document.createElement('div');
            noAlly.style.textAlign = 'center';
            noAlly.style.color = '#aaa';
            noAlly.style.padding = '20px';
            noAlly.innerText = 'Không có đồng minh nào để giao thương.';
            this.container.appendChild(noAlly);
            return;
        }

        for (const team of allyTeams) {
            const index = team - 1;
            const aiState = this.getAiState(index);
            if (!aiState) continue;

            const civData = CIVILIZATION_DATA[this.entityManager.getCivForTeam(team)];

            const allyRow = document.createElement('div');
            allyRow.className = 'trade-ally-row';

            const allyName = document.createElement('span');
            allyName.className = 'trade-ally-name';
            allyName.style.color = civData.accentColor;
            allyName.innerText = `Đồng minh ${team}: ${civData.name}`;
            allyRow.appendChild(allyName);

            const grid = document.createElement('div');
            grid.className = 'trade-resources-grid';

            const resources: { type: ResourceType, label: string, color: string }[] = [
                { type: ResourceType.Food, label: '🌾 Thực', color: C.food },
                { type: ResourceType.Wood, label: '🪵 Gỗ', color: C.wood },
                { type: ResourceType.Gold, label: '🪙 Vàng', color: C.gold },
                { type: ResourceType.Stone, label: '🪨 Đá', color: C.stone }
            ];

            for (const r of resources) {
                const col = document.createElement('div');
                col.className = 'trade-resource-col';

                const label = document.createElement('div');
                label.className = 'trade-resource-label';
                label.innerHTML = r.label;

                const input = document.createElement('input');
                input.className = 'trade-input';
                input.type = 'number';
                input.min = '1';
                input.placeholder = 'Số lượng...';

                const btn = document.createElement('button');
                btn.className = 'trade-send-btn';
                btn.innerText = 'Gửi';

                // Real-time validation
                input.addEventListener('input', () => {
                    const val = parseInt(input.value);
                    if (!isNaN(val) && val > 0 && res[r.type] >= val) {
                        btn.classList.add('can-afford');
                        btn.style.color = r.color;
                        btn.style.borderColor = r.color;
                    } else {
                        btn.classList.remove('can-afford');
                        btn.style.color = '';
                        btn.style.borderColor = '';
                    }
                });

                btn.onclick = () => {
                    const amount = parseInt(input.value);
                    if (!isNaN(amount) && amount > 0 && res[r.type] >= amount) {
                        // Process transaction
                        this.playerState.resources[r.type] -= amount;
                        aiState.addResource(r.type, amount);

                        // Clear input and re-render to update inventory
                        input.value = '';
                        this.render();
                    }
                };

                col.appendChild(label);
                col.appendChild(input);
                col.appendChild(btn);
                grid.appendChild(col);
            }

            allyRow.appendChild(grid);
            this.container.appendChild(allyRow);
        }
    }

    public destroy(): void {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
