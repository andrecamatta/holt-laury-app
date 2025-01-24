export default class DOMManager {
    constructor(app) {
        this.app = app;
        this.templates = {};
    }

    async loadTemplates() {
        this.templates.resultModal = await fetch('templates/result-modal.html').then(r => r.text());
        this.templates.controlQuestion = await fetch('templates/control-question.html').then(r => r.text());
    }

    bindEvents() {
        document.getElementById('start-test').addEventListener('click', () => this.startTest());
        document.querySelectorAll('.choice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleChoice(e.target.dataset.choice));
        });
        document.getElementById('next-round').addEventListener('click', () => this.nextRound());
    }

    updateRound(round) {
        document.getElementById('round-number').textContent = this.app.game.currentRound + 1;
        document.getElementById('probability').textContent = this.app.game.rounds[round].probability;
        document.getElementById('payoff-a').textContent = `R$ ${this.app.game.rounds[round].payoffA.certain.toFixed(2)}`;
        document.getElementById('payoff-b').textContent = `${(this.app.game.rounds[round].payoffA.uncertain[0]*100).toFixed(0)}% de R$ ${this.app.game.rounds[round].payoffA.uncertain[0].toFixed(2)} ou nada`;
    }

    showResult(result) {
        const resultHtml = this.templates.resultModal
            .replace('{{rho}}', result.interval)
            .replace('{{interpretation}}', result.interpretation);
        document.body.insertAdjacentHTML('beforeend', resultHtml);
        document.getElementById('result-modal').showModal();
    }

    handleChoice(choice) {
        const outcome = this.app.game.processChoice(choice);
        this.app.game.balance += outcome;
        document.getElementById('balance').textContent = this.app.game.balance.toFixed(2);
        
        if (!this.app.game.nextRound()) {
            const result = this.app.calculator.calculateRho(this.app.game.choices);
            this.showResult(result);
        }
    }

    startTest() {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('test-screen').classList.remove('hidden');
        this.updateRound(0);
    }

    nextRound() {
        document.getElementById('result-modal').close();
        this.updateRound(this.app.game.currentRound);
    }
}
