import Card from '../helpers/card';

export default class CardManager {
    constructor(loader,self,cardsFromDeck){
        this.loader = loader
        this.self = self
        this.cardsFromDeck = cardsFromDeck
    }
    renderIfTableIsEmpty(){
        console.log(this.cardsFromDeck)
        for (let i = 0; i < this.cardsFromDeck.length; i++) {
            let name = "card" + this.cardsFromDeck[i]._id
            let src = "src/assets/" + this.cardsFromDeck[i].image
            let power = this.cardsFromDeck[i].power
            let shield = this.cardsFromDeck[i].shield
            let nameDb = this.cardsFromDeck[i].name
            let describe = this.cardsFromDeck[i].describe
            let id = this.cardsFromDeck[i]._id
            this.loader.image(name, src)
            let playerCard = new Card(this.self);
            this.loader.once(Phaser.Loader.Events.COMPLETE, () => {
                playerCard.render(275 + (i * 100), 710, name, nameDb, power, shield, describe,id)
            });
        }
        
    }
    renderIfTableIsNotEmpty(data){
        let placedCards = []
        data.map((x) => {
            if(x.length !== 0){
                x.map((y) => {
                    y.placedCards.map((card) => {
                        if (card === y.id){
                            let name = "card" + y.id
                            let src = "src/assets/" + y.id + ".png"
                            let power = y.power
                            let shield = y.shield
                            let nameDb = y.name
                            let describe = y.description
                            let id = y.id
                            placedCards.push(id)
                            this.loader.image(name, src)
                            let playerCard = new Card(this.self);
                            this.loader.once(Phaser.Loader.Events.COMPLETE, () => {
                                playerCard.render(y.x, y.y, name, nameDb, power, shield, describe,id, true)
                            });
                            
                        }
                    })

                })
                if(placedCards.length !== 0){
                    this.cardsFromDeck.map((deckCard, index) => {
                        placedCards.map((elem) => {
                            if(deckCard._id === elem){
                                delete this.cardsFromDeck[index]
                            }
                        })
                    })
                }

                let filtered = this.cardsFromDeck.filter(function (el) {
                    return el != null;
                  });

                for (let i = 0; i < filtered.length; i++) {
                    let name = "card" + i
                    let src = "src/assets/" + filtered[i].image
                    let power = filtered[i].power
                    let shield = filtered[i].shield
                    let nameDb = filtered[i].name
                    let describe = filtered[i].describe
                    let id = filtered[i]._id
                    this.loader.image(name, src)
                    let playerCard = new Card(this.self);
                    this.loader.once(Phaser.Loader.Events.COMPLETE, () => {
                        playerCard.render(275 + (i * 100), 710, name, nameDb, power, shield, describe,id)
                    });
                }
            }
        })
    }
}