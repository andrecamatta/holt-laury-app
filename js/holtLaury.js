class HoltLauryTest {
    constructor() {
        // Parâmetros do teste
        // Valores padrão do teste Holt-Laury (convertidos para reais)
        this.lotteryA = { high: 5.00, low: 3.20 };    // Opção segura
        this.lotteryB = { high: 9.50, low: 0.50 };    // Opção arriscada
        this.probabilities = Array.from({length: 9}, (_, i) => 0.9 - (i * 0.1)); // Probabilidades decrescentes 0.9 a 0.1
        this.currentRound = 0;
        this.rhoRange = [-3, 3];
        this.choices = [];
        this.roundResults = new Array(10).fill(null);
        this.finalPrize = 0;
        this.restartHandlerRegistered = false;

        // Remove chamada para método não existente
        this.showScreen('intro-screen');
        this.initEventListeners();
    }

    initEventListeners() {
        // Configuração direta dos botões
        // Configuração via event delegation para garantir captura do evento
        document.body.addEventListener('click', (e) => {
            const startBtn = e.target.closest('#start-btn');
            if (startBtn) {
                e.preventDefault();
                console.log('Start button clicked - Initiating test...');
                this.startTest();
            }
        });

        document.getElementById('restart-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Restart button clicked - Resetting test...');
            holtLauryInstance = new HoltLauryTest();
        });
        
        // Configuração robusta de event delegation
        document.querySelector('.options-container').addEventListener('click', (e) => {
            console.log('Click event on options container:', e.target);
            const button = e.target.closest('.btn-option');
            if (button) {
                console.log('Button found:', button);
                const optionDiv = button.closest('.option');
                if (optionDiv) {
                    console.log('Option div found:', optionDiv);
                    const choice = optionDiv.id.split('-')[1];
                    console.log('Choice selected:', choice);
                    this.handleChoice(choice);
                } else {
                    console.log('No option div found');
                }
            } else {
                console.log('No button found');
            }
        });

        document.getElementById('continue-btn').addEventListener('click', () => this.nextRound());
    }

    startTest() {
        console.log('Iniciando teste Holt-Laury...');
        try {
            this.showScreen('game-screen');
            console.log('Tela do jogo:', document.getElementById('game-screen'));
            
            // Reinicia estado do teste
            this.currentRound = 0;
            this.choices = [];
            this.roundResults.fill(null);
            this.rhoRange = [-3, 3];
            
            // Forçar reflow para garantir renderização
            document.querySelector('.options-container').offsetHeight;
            
            this.updateDisplay();
            console.log('Display atualizado:', document.getElementById('current-round').textContent);
        } catch (error) {
            console.error('Falha na inicialização:', error);
            this.showInvalidTest(`Erro de inicialização: ${error.message}`);
        }
    }

    handleChoice(choice) {
        try {
            this.choices.push(choice);
            
            // Calcular prêmio sorteado
            const p = this.probabilities[this.currentRound];
            const selectedLottery = choice === 'A' ? this.lotteryA : this.lotteryB;
            const outcome = Math.random() < p ? selectedLottery.high : selectedLottery.low;
            this.roundResults[this.currentRound] = outcome; // Armazena resultado na posição da rodada
            
            this.updateRhoRange(choice);
            
            if (this.hasInvalidReversals()) {
                throw new Error('Múltiplas reversões detectadas - teste inválido');
            }

            // Armazenar dados do sorteio para feedback
            this.lastChoice = choice;
            this.lastOutcome = outcome;
            this.lastProbability = p;
            this.lastHighPrize = selectedLottery.high;
            this.lastLowPrize = selectedLottery.low;

            // Mostrar feedback com os dados atuais
            this.showFeedback();
            
            // Preparar próximo round após feedback
            this.currentRound++;
            this.updateDisplay();
        } catch (error) {
            console.error('Erro na escolha:', error);
            this.showInvalidTest(`${error.message} (Rodada ${this.currentRound + 1})`);
        }
    }

    crraUtility(x, rho) {
        // Validação rigorosa de parâmetros
        if (typeof x !== 'number' || x <= 0) throw new Error("Valor monetário inválido");
        if (typeof rho !== 'number') throw new Error("Parâmetro ρ deve ser numérico");
        
        const exponent = 1 - rho;
        
        // Tratamento especial para ρ ≈ 1 usando série de Taylor
        if (Math.abs(exponent) < 1e-8) {
            const lnx = Math.log(x);
            return lnx + (exponent * lnx ** 2) / 2 + (exponent ** 2 * lnx ** 3) / 6;
        }
        
        // Cálculo numérico robusto
        try {
            const termo = x ** exponent;
            if (termo === Infinity) return Number.MAX_VALUE * Math.sign(exponent);
            if (termo === 0) return -Number.MAX_VALUE;
            return termo / exponent;
        } catch (error) {
            console.error(`Erro no cálculo CRRA: x=${x}, rho=${rho}`, error);
            throw new Error("Erro na avaliação da função utilidade");
        }
    }

    updateRhoRange(choice) {
        const p = this.probabilities[this.currentRound];
        const A = this.lotteryA;
        const B = this.lotteryB;

        // Função que calcula a utilidade esperada para uma loteria
        const expectedUtility = (rho, lottery) => {
            const expRho = 1 - rho;
            if (Math.abs(expRho) < 1e-6) {
                return p * Math.log(lottery.high) + (1 - p) * Math.log(lottery.low);
            }
            return (p * (lottery.high ** expRho) + (1 - p) * (lottery.low ** expRho)) / expRho;
        };

        // Função que calcula a diferença de utilidade esperada
        const utilityDiff = (rho) => {
            try {
                const uA = expectedUtility(rho, A);
                const uB = expectedUtility(rho, B);
                return uA - uB;
            } catch (error) {
                console.error(`Error calculating utility diff for rho=${rho}:`, error);
                return 0;
            }
        };

        // Encontra o ponto crítico onde a diferença de utilidade é zero
        let left = -3;
        let right = 3;
        const epsilon = 1e-6;
        let iterations = 0;
        const maxIterations = 50;

        // Verifica se há uma mudança de sinal nos extremos
        const diffLeft = utilityDiff(left);
        const diffRight = utilityDiff(right);
        
        console.log(`Initial values: p=${p}, diffLeft=${diffLeft}, diffRight=${diffRight}`);

        // Se não houver mudança de sinal, usa um valor padrão baseado na probabilidade
        if (diffLeft * diffRight > 0) {
            const criticalPoint = (this.rhoRange[0] + this.rhoRange[1]) / 2; // Usa o ponto médio atual do intervalo
            console.log(`Using default critical point: ${criticalPoint}`);
            
            if (choice === 'A') {
                this.rhoRange[0] = Math.max(this.rhoRange[0], criticalPoint);
            } else {
                this.rhoRange[1] = Math.min(this.rhoRange[1], criticalPoint);
            }
            return;
        }

        // Busca binária para encontrar o ponto crítico
        let criticalPoint;
        while (right - left > epsilon && iterations < maxIterations) {
            const mid = (left + right) / 2;
            const diff = utilityDiff(mid);
            
            if (Math.abs(diff) < epsilon) {
                criticalPoint = mid;
                break;
            }
            
            if (diff * diffLeft > 0) {
                left = mid;
            } else {
                right = mid;
            }
            
            iterations++;
            console.log(`Iteration ${iterations}: mid=${mid.toFixed(4)}, diff=${diff.toFixed(4)}`);
        }

        criticalPoint = (left + right) / 2;
        
        // Validação do ponto crítico
        if (isNaN(criticalPoint) || !isFinite(criticalPoint)) {
            console.error('Invalid critical point found, using interpolated value');
            criticalPoint = -1.71 + (p - 0.1) * 3.42;
        }
        
        console.log(`Critical point found: ${criticalPoint.toFixed(4)}`);

        // Atualiza o intervalo baseado na escolha
        const oldRange = [...this.rhoRange];
        if (choice === 'A') {
            // Se escolheu A, então ρ deve ser maior que o ponto crítico
            // (mais avesso ao risco -> ρ maior)
            this.rhoRange[0] = Math.max(this.rhoRange[0], criticalPoint);
        } else {
            // Se escolheu B, então ρ deve ser menor que o ponto crítico
            // (menos avesso ao risco -> ρ menor)
            this.rhoRange[1] = Math.min(this.rhoRange[1], criticalPoint);
        }

        console.log(`Round ${this.currentRound + 1}, p=${p}`);
        console.log(`Range update: [${oldRange[0].toFixed(4)}, ${oldRange[1].toFixed(4)}] -> [${this.rhoRange[0].toFixed(4)}, ${this.rhoRange[1].toFixed(4)}]`);
    }

    hasInvalidReversals() {
        let reversals = 0;
        for (let i = 1; i < this.choices.length; i++) {
            if (this.choices[i] !== this.choices[i-1]) reversals++;
            if (reversals > 2) return true;
        }
        return false;
    }

    updateDisplay() {
        // Atualizar UI com os valores corretos da rodada atual
        const p = this.probabilities[this.currentRound];
        
        document.getElementById('current-round').textContent = this.currentRound + 1;
        document.querySelector('.rho-fill').style.width = 
            `${((this.rhoRange[0] + this.rhoRange[1])/2 + 3)/6 * 100}%`;
        
        // Atualizar opções com a probabilidade correta
        this.updateOption('A', p, this.lotteryA);
        this.updateOption('B', p, this.lotteryB);
    }

    updateOption(option, p, lottery) {
        const element = document.getElementById(`outcome-${option}`);
        element.innerHTML = `
            <div>
                <span class="probability">${(p * 100).toFixed(0)}%</span>
                <span class="value">R$ ${lottery.high.toFixed(2)}</span>
            </div>
            <div>
                <span class="probability">${((1 - p) * 100).toFixed(0)}%</span>
                <span class="value">R$ ${lottery.low.toFixed(2)}</span>
            </div>
        `;
    }

    showFeedback() {
        this.showScreen('feedback-screen');
        const chance = this.lastOutcome === this.lastHighPrize ? 
            this.lastProbability * 100 : 
            (1 - this.lastProbability) * 100;
        
        document.getElementById('rho-change').innerHTML = `
            <div class="actual-prize">
                🏆 Prêmio Sorteado: <span class="prize-amount">R$ ${this.lastOutcome.toFixed(2)}</span>
                <div class="prize-details">
                    <span class="choice-info">Opção ${this.lastChoice} selecionada</span>
                    <span class="probability-info">${chance.toFixed(1)}% de ganhar R$ ${this.lastHighPrize.toFixed(2)}</span>
                </div>
            </div>
            <div class="rho-update">
                📊 Novo Intervalo: ρ ∈ [${Math.min(this.rhoRange[0], this.rhoRange[1]).toFixed(2)}, ${Math.max(this.rhoRange[0], this.rhoRange[1]).toFixed(2)}]
            </div>
        `;
        
    }

    nextRound() {
        if (this.currentRound >= this.probabilities.length) {
            this.showFinalResults();
        } else {
            this.showScreen('game-screen');
            this.updateDisplay();
        }
    }

    drawAndShowResult() {
        // Sorteio aleatório da rodada válida
        const selectedRound = Math.floor(Math.random() * this.probabilities.length);
        this.finalPrize = this.roundResults[selectedRound];
        
        // Monta tabela detalhada
        let resultsTable = '<table class="results-table">';
        resultsTable += `
            <thead>
                <tr>
                    <th>Rodada</th>
                    <th>Opção</th>
                    <th>Probabilidade</th>
                    <th>Prêmio</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>`;
        
        this.roundResults.forEach((result, index) => {
            const choice = this.choices[index];
            const p = this.probabilities[index];
            const lottery = choice === 'A' ? this.lotteryA : this.lotteryB;
            
            resultsTable += `
                <tr class="${index === selectedRound ? 'selected-row' : ''}">
                    <td>${index + 1}</td>
                    <td>${choice}</td>
                    <td>${(p * 100).toFixed(0)}% Alto</td>
                    <td>R$ ${result?.toFixed(2) || '0.00'}</td>
                    <td>${index === selectedRound ? '🏆 Sorteada' : ''}</td>
                </tr>`;
        });
        
        resultsTable += '</tbody></table>';
        
        // Exibe tela final com detalhes
        this.showScreen('final-screen');
        document.getElementById('final-rho').innerHTML = `
            <div class="final-details">
                <h3>Rodada Sorteada: ${selectedRound + 1}</h3>
                <div class="prize-breakdown">
                    <div class="detail-item">
                        <span class="detail-label">Opção Escolhida:</span>
                        <span class="detail-value">${this.choices[selectedRound]}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Probabilidade Alta:</span>
                        <span class="detail-value">${(this.probabilities[selectedRound] * 100).toFixed(0)}%</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Prêmio Obtido:</span>
                        <span class="detail-value">R$ ${this.finalPrize.toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Coeficiente Rho (ρ):</span>
                        <span class="detail-value">[${Math.min(this.rhoRange[0], this.rhoRange[1]).toFixed(2)}, ${Math.max(this.rhoRange[0], this.rhoRange[1]).toFixed(2)}]</span>
                    </div>
                </div>
                ${resultsTable}
            </div>
        `;
    }

    showFinalResults() {
        this.drawAndShowResult();
        
        // Explicação simplificada do processo
        document.getElementById('final-rho').innerHTML += `
            <div class="game-explanation">
                <h4>Processo de Pagamento:</h4>
                <ol class="payment-steps">
                    <li><strong>10 Rodadas Completas:</strong> Todas as escolhas foram registradas</li>
                    <li><strong>Sorteio Aleatório:</strong> Um número entre 1 e 10 foi gerado computacionalmente</li>
                </ol>
            </div>
        `;

        // Configurar botão de reinício
        this.cleanupRestartButton();
        this.setupRestartButton();
    }

    showInvalidTest(reason) {
        this.showScreen('invalid-screen');
        const reasonElement = document.getElementById('invalid-reason');
        reasonElement.innerHTML = `
            <h3>Teste interrompido!</h3>
            <p>Motivo: ${reason}</p>
            <pre class="error-details" style="white-space: pre-wrap; word-break: break-all;"></pre>
        `;
        
        // Exibir detalhes técnicos apenas em desenvolvimento
        if (window.location.hostname === 'localhost') {
            reasonElement.querySelector('.error-details').textContent = `Intervalo atual: [${this.rhoRange[0].toFixed(4)}, ${this.rhoRange[1].toFixed(4)}]\n`
                + `Escolhas: ${JSON.stringify(this.choices)}`;
        }
    }

    showScreen(screenId) {
        console.log(`Mostrando tela: ${screenId}`);
        const screens = document.querySelectorAll('.screen');
        console.log(`Telas encontradas: ${screens.length}`);
        
        // Verificação rigorosa dos elementos
        screens.forEach(s => {
            s.style.display = 'none';
            s.classList.remove('active');
            console.log(`Ocultando tela: ${s.id}`);
        });
        
        const targetScreen = document.getElementById(screenId);
        if (!targetScreen) {
            throw new Error(`Elemento da tela não encontrado: ${screenId}`);
        }
        
        console.log(`Elemento alvo:`, targetScreen);
        targetScreen.style.display = 'flex';
        
        // Forçar reflow antes de adicionar classe active
        const offset = targetScreen.offsetHeight;
        
        setTimeout(() => {
            targetScreen.classList.add('active');
            console.log(`Transição iniciada para: ${screenId}`);
            
            // Ativar container de opções após transição principal
            if (screenId === 'game-screen') {
                setTimeout(() => {
                    const optionsContainer = document.querySelector('.options-container');
                    if (optionsContainer) {
                        optionsContainer.classList.add('active');
                        console.log('Container de opções ativado');
                    }
                }, 300);
            }
        }, 50);
        
        // Verificar elementos críticos
        if (screenId === 'game-screen') {
            this.validateGameScreenElements();
        }
    }

    validateGameScreenElements() {
        const criticalElements = [
            '#current-round',
            '.options-container',
            '.rho-fill',
            '#outcome-A',
            '#outcome-B'
        ];
        
        criticalElements.forEach(selector => {
            const el = document.querySelector(selector);
            if (!el) {
                throw new Error(`Elemento crítico não encontrado: ${selector}`);
            }
            console.log(`Elemento verificado: ${selector}`, el);
        });
    }
}

// Implementação singleton para controle centralizado
let holtLauryInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!holtLauryInstance) {
        holtLauryInstance = new HoltLauryTest();
    }
});
