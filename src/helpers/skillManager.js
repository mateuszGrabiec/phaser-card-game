var _ = require('lodash');

export default class SkillManager {
    constructor(scene) {
		this.scene = scene;
    }

	getYourCards(deckId){
		return this.scene.children.getAll('deck_id', deckId);
	}

	getEnemyCards(enemyDeckId){
		return this.scene.children.getAll('deck_id', enemyDeckId);
	}

	buffYourHand(deckId){
		let cards = this.getYourCards(deckId);
		let filtered = _.filter(cards, function(card){
			return card.buffed !== true;
		});
		let randomCardToBuff = _.sample(filtered);
		randomCardToBuff.buffed = true;
		randomCardToBuff.power += 10; 
	}

	attackEnemyCard(enemyDeckId){
		let enemyCards = this.getEnemyCards(enemyDeckId);
		if(!_.isEmpty(enemyCards)){
			let filtered = _.filter(enemyCards, function(card){
				return card.debuffed !== true;
			});
			let shuffled = filtered.sort(function(){return .5 - Math.random();}) || [];
			const selected=shuffled.pop() || false;
			console.log(selected);
			let randomCardToDeBuff = selected;
			randomCardToDeBuff.debuffed = true;
			if(randomCardToDeBuff.shield < 10){
				randomCardToDeBuff.power -= 10; 
			}
			else{
				randomCardToDeBuff.shield -= 10; 
			}
			
		}
	}
}
