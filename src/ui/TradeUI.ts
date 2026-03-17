import { C, ResourceType, CIVILIZATION_DATA } from "../config/GameConfig";
import { PlayerState } from "../systems/PlayerState";
import { EntityManager } from "../systems/EntityManager";
import { t } from '../i18n/i18n';
import './TradeUI.css';

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

        document.body.appendChild(this.container);
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
        title.innerHTML = `<span>🤝</span> ${t('trade.title')}`;

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
            <span><strong>${t('trade.inventory')}</strong></span>
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
            noAlly.innerText = t('trade.noAlly');
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
            allyName.innerText = `${t('trade.allyLabel')} ${team}: ${civData.name}`;
            allyRow.appendChild(allyName);

            const grid = document.createElement('div');
            grid.className = 'trade-resources-grid';

            const resources: { type: ResourceType, label: string, color: string }[] = [
                { type: ResourceType.Food, label: t('trade.food'), color: C.food },
                { type: ResourceType.Wood, label: t('trade.wood'), color: C.wood },
                { type: ResourceType.Gold, label: t('trade.gold'), color: C.gold },
                { type: ResourceType.Stone, label: t('trade.stone'), color: C.stone }
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
                input.placeholder = t('trade.amountPlaceholder');

                const btn = document.createElement('button');
                btn.className = 'trade-send-btn';
                btn.innerText = t('trade.send');

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
