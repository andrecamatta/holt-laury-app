export default class GameLogic {
    constructor() {
        this.currentRound = 0;
        this.balance = 1000;
        this.choices = [];
        this.controlAnswers = new Map();
        
        this.rounds = [
            {probability: '10%', payoffA: {certain: 2, uncertain: [3.85, 0]}},
            {probability: '20%', payoffA: {certain: 1.6, uncertain: [3.85, 0]}},
            {probability: '30%', payoffA: {certain: 1.3, uncertain: [3.85, 0]}},
            {probability: '40%', payoffA: {certain: 1, uncertain: [3.85, 0]}},
            {probability: '50%', payoffA: {certain: 0.8, uncertain: [3.85, 0]}},
            {probability: '60%', payoffA: {certain: 0.6, uncertain: [3.85, 0]}},
            {probability: '70%', payoffA: {certain: 0.5, uncertain: [3.85, 0]}},
            {probability: '80%', payoffA: {certain: 0.4, uncertain: [3.85, 0]}},
            {probability: '90%', payoffA: {certain: 0.3, uncertain: [3.85, 0]}},
            {probability: '100%', payoffA: {certain: 0.1, uncertain: [3.85, 0]}}
        ];

        this.controlQuestions = [
            {
                question: "Em qual probabilidade você trocaria para a opção B?",
                answer: "50%",
                explanation: "A teoria da utilidade esperada sugere que a maioria dos indivíduos troca em 50%"
            }
        ];
    }

    nextRound() {
        if (this.currentRound < this.rounds.length - 1) {
            this.currentRound++;
            return true;
        }
        return false;
    }

    processChoice(choice) {
        this.choices.push(choice);
        return this.calculateOutcome(choice);
    }

    calculateOutcome(choice) {
        const round = this.rounds[this.currentRound];
        return choice === 'A' ? round.payoffA.certain : 
            Math.random() < (this.currentRound + 1) * 0.1 ? 
                round.payoffA.uncertain[0] : 
                round.payoffA.uncertain[1];
    }
}
