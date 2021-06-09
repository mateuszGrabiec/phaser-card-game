import Card from '../helpers/card';
var _ = require('lodash');

export default class CardManager {
    constructor(loader,self,cardsFromDeck,deckId,outlineEnemy1,outlineEnemy2, allCards, alreadyEnemyRendered,dropZone1, dropZone2){
        this.loader = loader;
        this.self = self;
        this.cardsFromDeck = cardsFromDeck;
        this.deckId = deckId;
        this.outlineEnemy1 = outlineEnemy1;
        this.outlineEnemy2 = outlineEnemy2;
        this.allCards = allCards;
        this.alreadyEnemyRendered = alreadyEnemyRendered;
        this.dropZone1 = dropZone1;
        this.dropZone2 = dropZone2;
    }
    renderIfTableIsEmpty(myHand){
        let handLength = 0;
        for (let card of myHand) {
            this.renderCard(card,handLength);
            handLength++;
        }
        
    }
    renderCard(card, element = 0, alreadyPlaced = null, enemyDeckId = null){
            const imgName = card.image.split('.')[0];
            let name = imgName;
            let src = 'src/assets/' + card.image;
            let power = card.power;
            let shield = card.shield;
            let nameDb = card.name;
            let describe = card.describe;
			let skill = card.skill;
            let id = card._id;
            let x = card.x || 275 + (element * 100);
            let y = card.y || 710;
			let deckId = null;
			if(enemyDeckId !== null){
				deckId = enemyDeckId;
			}
			else{
				deckId = this.deckId;
			}
            this.loader.image(imgName, src);
            let playerCard = new Card(this.self);
            this.loader.once(Phaser.Loader.Events.COMPLETE, () => {
                playerCard.render(x, y, name, nameDb, power, shield, describe,id,deckId, alreadyPlaced, skill, false);
            });
            this.loader.start();
    }
    
    moveCard(card, cardObject, index, power, shield, enemyDeckId){
        if(card.deckId === this.deckId){
			if(cardObject && card._id === cardObject.id){
				this.checkAndApplyPosition(cardObject, card, index);
				this.self.input.setDraggable(cardObject, false);	
			}
			else{
				
				let filtered = this.allCards.filter(elem => elem._id === card._id);
				this.checkAndApplyPosition(filtered[0], card, index);
				this.renderCard(filtered[0],0,true);
				let checkAll = this.self.children.getAll('id', card._id);
				if(checkAll.length>1){
					checkAll[0].destroy();
				}
			}

        }
        else{
            let filtered = this.allCards.filter(elem => elem._id === card._id);
			
			filtered[0].power = power;
			filtered[0].shield = shield;
            this.checkAndApplyPosition(filtered[0], card, index);
            if(this.alreadyEnemyRendered.length === 0){
                this.renderCard(filtered[0],0,true,enemyDeckId);
                this.alreadyEnemyRendered.push({
                    id: filtered[0]._id
                });
            }
            else{
                let findIfRendered = this.alreadyEnemyRendered.filter(elem => elem.id === filtered[0]._id);
                if (findIfRendered.length === 0){
                    this.renderCard(filtered[0],0,true,enemyDeckId);
                    this.alreadyEnemyRendered.push({
                        id: filtered[0]._id
                    });
                }
            }
        }
    }
    checkAndApplyPosition(objectToMove, card, index){
		objectToMove.x = card.x;
		
        if(index === 0 ){
            objectToMove.y  = this.dropZone1.y;
        }
        else if(index === 1){
			objectToMove.y  = this.dropZone2.y;
		}
		else if(index === 2){
			objectToMove.y  = this.outlineEnemy1;
		}
		else if(index === 3){
			objectToMove.y  = this.outlineEnemy2;
		}
    }
}