import Game from './GameLogic.js';
import DOMManager from './DOMManager.js';
import RiskCalculator from './RiskCalculator.js';

document.addEventListener('DOMContentLoaded', () => {
    const app = {
        game: new Game(),
        calculator: new RiskCalculator(),
        domManager: new DOMManager(app)
    };
    
    app.domManager.loadTemplates().then(() => {
        app.domManager.bindEvents();
    }).catch(error => {
        console.error('Failed to load templates:', error);
    });
});
