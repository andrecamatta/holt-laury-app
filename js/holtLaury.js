class HoltLauryTest {
    constructor() {
        // Estado do jogo
        this.currentRound = 0;
        this.balance = 1000;
        this.rhoEstimate = null;
        this.choices = [];
        this.rounds = [
            { optionA: { p: 0.1, high: 200, low: 160 }, optionB: { p: 0.1, high: 385, low: 10 } },
            { optionA: { p: 0.2, high: 200, low: 160 }, optionB: { p: 0.2, high: 385, low: 10 } },
            { optionA: { p: 0.3, high: 200, low: 160 }, optionB: { p: 0.3, high: 385, low: 10 } },
            { optionA: { p: 0.4, high: 200, low: 160 }, optionB: { p: 0.4, high: 385, low: 10 } },
            { optionA: { p: 0.5, high: 200, low: 160 }, optionB: { p: 0.5, high: 385, low: 10 } },
            { optionA: { p: 0.6, high: 200, low: 160 }, optionB: { p: 0.6, high: 385, low: 10 } },
            { optionA: { p: 0.7, high: 200, low: 160 }, optionB: { p: 0.7, high: 385, low: 10 } },
            { optionA: { p: 0.8, high: 200, low: 160 }, optionB: { p: 0.8, high: 385, low: 10 } },
            { optionA: { p: 0.9, high: 200, low: 160 }, optionB: { p: 0.9, high: 385, low: 10 } },
            { optionA: { p: 1.0, high: 200, low: 160 }, optionB: { p: 1.0, high: 385, low: 10 } }
        ];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Botão de início
        document.getElementById('start-test').addEventListener('click', () => this.startTest());

        // Choice buttons
        document.querySelectorAll('.choice-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const choice = e.target.parentElement.id === 'choice-a' ? 'A' : 'B';
                this.makeChoice(choice);
            });
        });

        // Continue button in modal
        document.getElementById('continue-button').addEventListener('click', () => this.nextRound());

        // Restart button
        document.getElementById('restart-test').addEventListener('click', () => this.resetTest());
    }

    startTest() {
        this.switchScreen('welcome-screen', 'game-screen');
        this.updateRound();
    }

    switchScreen(fromId, toId) {
        document.getElementById(fromId).classList.remove('active');
        document.getElementById(toId).classList.add('active');
    }

    updateRound() {
        const round = this.rounds[this.currentRound];
        document.getElementById('current-round').textContent = this.currentRound + 1;
        
        // Update Option A
        const optionAProb = document.querySelector('#choice-a .probabilities');
        optionAProb.innerHTML = `
            <p>${round.optionA.p * 100}% chance of $${round.optionA.high}</p>
            <p>${(1 - round.optionA.p) * 100}% chance of $${round.optionA.low}</p>
        `;

        // Update Option B
        const optionBProb = document.querySelector('#choice-b .probabilities');
        optionBProb.innerHTML = `
            <p>${round.optionB.p * 100}% chance of $${round.optionB.high}</p>
            <p>${(1 - round.optionB.p) * 100}% chance of $${round.optionB.low}</p>
        `;
    }

    calculateRho() {
        // Simple ρ calculation based on switching point
        const switchPoint = this.choices.indexOf('B');
        if (switchPoint === -1) return 1.5; // Very risk averse
        if (switchPoint === 0) return 0.5; // Risk seeking
        return 1 - (switchPoint * 0.1); // Approximate ρ based on switch point
    }

    interpretRho(rho) {
        if (rho > 1.2) return "Você demonstra forte aversão ao risco, preferindo opções mais seguras mesmo com menor valor esperado.";
        if (rho > 0.8) return "Você demonstra aversão moderada ao risco, equilibrando entre risco e recompensa.";
        if (rho > 0.5) return "Você é quase neutro ao risco, focando principalmente no valor esperado.";
        return "Você demonstra comportamento de busca por risco, preferindo chances de maiores recompensas.";
    }

    simulateOutcome(option) {
        const round = this.rounds[this.currentRound];
        const rand = Math.random();
        const opt = option === 'A' ? round.optionA : round.optionB;
        return rand <= opt.p ? opt.high : opt.low;
    }

    makeChoice(choice) {
        this.choices.push(choice);
        const outcome = this.simulateOutcome(choice);
        this.balance += outcome;
        this.rhoEstimate = this.calculateRho();

        // Update displays
        document.getElementById('current-balance').textContent = this.balance;
        document.getElementById('rho-value').textContent = this.rhoEstimate.toFixed(2);

        // Show result modal
        const modal = document.getElementById('result-modal');
        const description = document.getElementById('result-description');
        const rhoExplanation = document.getElementById('rho-explanation');

        description.innerHTML = `
            <p>Você ganhou $${outcome}!</p>
            <p>Novo saldo: $${this.balance}</p>
        `;

        rhoExplanation.innerHTML = `
            <p>Current ρ estimate: ${this.rhoEstimate.toFixed(2)}</p>
            <p>${this.interpretRho(this.rhoEstimate)}</p>
        `;

        modal.classList.add('active');
    }

    nextRound() {
        document.getElementById('result-modal').classList.remove('active');
        
        if (this.currentRound < this.rounds.length - 1) {
            this.currentRound++;
            this.updateRound();
        } else {
            this.finishTest();
        }
    }

    finishTest() {
        this.switchScreen('game-screen', 'final-screen');
        document.getElementById('final-rho').textContent = this.rhoEstimate.toFixed(2);
        document.getElementById('final-balance').textContent = `$${this.balance}`;
        document.getElementById('risk-interpretation').textContent = this.interpretRho(this.rhoEstimate);
    }

    resetTest() {
        this.currentRound = 0;
        this.balance = 1000;
        this.rhoEstimate = null;
        this.choices = [];
        document.getElementById('current-balance').textContent = this.balance;
        document.getElementById('rho-value').textContent = '-';
        this.switchScreen('final-screen', 'welcome-screen');
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HoltLauryTest();
});
