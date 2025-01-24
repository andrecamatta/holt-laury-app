import GameLogic from './GameLogic.js';
import DOMManager from './DOMManager.js';
import ResultCalculator from './ResultCalculator.js';

class HoltLauryTest {
    constructor() {
        this.game = new GameLogic();
        this.ui = new DOMManager(this);
        this.calculator = new ResultCalculator();
    }

    async init() {
        await this.ui.loadTemplates();
        this.ui.bindEvents();
        this.ui.updateRound(this.game.currentRound);
    }
}

// Inicialização do app
document.addEventListener('DOMContentLoaded', () => {
    const app = new HoltLauryTest();
    app.init();
});
