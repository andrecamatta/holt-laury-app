export default class DOMManager {
    constructor(app) {
        this.app = app;
    }

    async loadTemplates() {
        // Templates are now directly in HTML
        return Promise.resolve();
    }

    bindEvents() {
        document.getElementById('start-test').addEventListener('click', () => this.startTest());
        document.querySelectorAll('.choice-button').forEach((btn, index) => {
            btn.dataset.choice = index % 2 === 0 ? 'A' : 'B';
            btn.addEventListener('click', (e) => this.handleChoice(e.target.dataset.choice));
        });
        document.getElementById('continue-button').addEventListener('click', () => this.nextRound());
    }

    updateRound(round) {
        document.getElementById('current-round').textContent = this.app.game.currentRound + 1;
        
        // Update probabilities and payoffs for both options
        const currentRound = this.app.game.rounds[round];
        document.getElementById('probability').textContent = currentRound.probability;
        document.getElementById('probability-b').textContent = currentRound.probability;
        
        // Option A payoff (certain)
        document.getElementById('payoff-a').textContent = 
            `R$ ${currentRound.payoffA.certain.toFixed(2)}`;
        
        // Option B payoff (uncertain)
        document.getElementById('payoff-b').textContent = 
            `R$ ${currentRound.payoffA.uncertain[0].toFixed(2)} ou R$ ${currentRound.payoffA.uncertain[1].toFixed(2)}`;
    }

    showResult(result) {
        document.getElementById('result-description').textContent = 
            `Seu intervalo ρ está entre ${result.interval}`;
        document.getElementById('rho-explanation').textContent = 
            result.interpretation;
        document.getElementById('result-modal').showModal();
    }

    handleChoice(choice) {
        const outcome = this.app.game.processChoice(choice);
        this.app.game.balance += outcome;
        document.getElementById('current-balance').textContent = 
            this.app.game.balance.toFixed(2);
        
        if (!this.app.game.nextRound()) {
            const result = this.app.calculator.calculateRho(this.app.game.choices);
            this.showResult(result);
        } else {
            this.updateRound(this.app.game.currentRound);
        }
    }

    startTest() {
        document.getElementById('welcome-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        this.updateRound(0);
    }

    nextRound() {
        document.getElementById('result-modal').close();
        this.updateRound(this.app.game.currentRound);
    }
}
