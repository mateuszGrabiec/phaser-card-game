import Card from '../helpers/card';

export default class CardManager {
    constructor(loader,self,cardsFromDeck,deckId,outlineEnemy1,outlineEnemy2, allCards, alreadyEnemyRendered,dropZone1, dropZone2){
        this.loader = loader
        this.self = self
        this.cardsFromDeck = cardsFromDeck
        this.deckId = deckId
        this.outlineEnemy1 = outlineEnemy1
        this.outlineEnemy2 = outlineEnemy2
        this.allCards = allCards
        this.alreadyEnemyRendered = alreadyEnemyRendered
        this.dropZone1 = dropZone1
        this.dropZone2 = dropZone2
        this.deckLength = 4
    }
    renderIfTableIsEmpty(){
        let handLength = 0
        for (let card of this.cardsFromDeck) {
            this.renderCard(card,handLength);
            handLength++
        }
        
    }
    renderCard(card, element = 0, alreadyPlaced = null){
            const imgName = card.image.split('.')[0]
            let name = imgName;
            let src = "src/assets/" + card.image
            let power = card.power
            let shield = card.shield
            let nameDb = card.name
            let describe = card.describe
            let id = card._id
            let x = card.x || 275 + (element * 100)
            let y = card.y || 710
            console.log("HAND X:", x);
            console.log("HAND Y:", y);
            this.loader.image(imgName, src)
            let playerCard = new Card(this.self);
            this.loader.once(Phaser.Loader.Events.COMPLETE, () => {
                playerCard.render(x, y, name, nameDb, power, shield, describe,id,this.deckId, alreadyPlaced)
            });
            this.loader.start()
    }
    renderBackCards(){
        for(let i = 0; i <= this.deckLength; i++){
            let src = "src/assets/cardback.png"
            let name = "cardback"+i
            this.loader.image(name, src);
            this.loader.once(Phaser.Loader.Events.COMPLETE, () => {
                this.self.add.image(275 + (i * 100), 40, name).setScale(0.1, 0.1).setName(name)
            });
            this.loader.start();

        }
    }
    moveCard(card, cardObject, index){
        console.log(index);
        if(card.deckId === this.deckId){
            this.checkAndApplyPosition(cardObject, card, index)
            cardObject.disableInteractive();
        }
        else{
            let filtered = this.allCards.filter(elem => elem._id === card._id)
            this.checkAndApplyPosition(filtered[0], card, index)
            if(this.alreadyEnemyRendered.length === 0){
                this.renderCard(filtered[0],0,true)
                this.alreadyEnemyRendered.push({
                    id: filtered[0]._id
                })
            }
            else{
                let findIfRendered = this.alreadyEnemyRendered.filter(elem => elem.id === filtered[0]._id)
                if (findIfRendered.length === 0){
                    this.renderCard(filtered[0],0,true)
                    this.alreadyEnemyRendered.push({
                        id: filtered[0]._id
                    })
                }
            }
            if(index == 2 || index == 3){
                const max = this.deckLength
                const min = 0
                let random = Math.floor(Math.random() * (+max + 1 - +min)) + +min;
                let backName = "cardback"+random
                let backObject = this.self.children.getByName(backName)
                backObject.visible = false
            }
        }
        //this.loader.start();
    }
    checkAndApplyPosition(objectToMove, card, index){
        objectToMove.x = card.x

        if(index === 2){
            objectToMove.y  = this.outlineEnemy1
        }
        else if(index === 3){
            objectToMove.y  = this.outlineEnemy2
        }
        else {
            objectToMove.y = card.y
        }
    }
}