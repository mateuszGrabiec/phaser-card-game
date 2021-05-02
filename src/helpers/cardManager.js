import Card from '../helpers/card';

export default class CardManager {
    constructor(loader,self,cardsFromDeck){
        this.loader = loader
        this.self = self
        this.cardsFromDeck = cardsFromDeck
    }
    renderIfTableIsEmpty(){
        console.log(this.cardsFromDeck)
        //use function renderCard
        for (let i = 0; i < this.cardsFromDeck.length; i++) {
            this.renderCard();
            // const imgName = this.cardsFromDeck[i].image.split('.')[0]
            // let name = imgName;// "card" + this.cardsFromDeck[i]._id
            // let src = "src/assets/" + this.cardsFromDeck[i].image
            // let power = this.cardsFromDeck[i].power
            // let shield = this.cardsFromDeck[i].shield
            // let nameDb = this.cardsFromDeck[i].name
            // let describe = this.cardsFromDeck[i].describe
            // let id = this.cardsFromDeck[i]._id
            // this.loader.image(imgName, src)
            // let playerCard = new Card(this.self);
            // this.loader.once(Phaser.Loader.Events.COMPLETE, () => {
            //     playerCard.render(275 + (i * 100), 710, name, nameDb, power, shield, describe,id)
            // });
        }
        
    }
    renderIfTableIsNotEmpty(table){
        console.log('TABLE: ',table);
        let placedCards = [];
        table.map((line) => {
            line.map((card)=>{
                // console.log('cardFromDb',card);
                this.moveCard();
                placedCards.push(card);
            })
        });
        let hand = [];
        if(placedCards?.length > 0){
            // this.cardsFromDeck.map(card=>{
            //     console.log(card._id);
            //    const isIn = placedCards.filter(x=>x._id==card._id).pop();
            //    console.log('isIN',isIn);
            //    if(isIn===undefined){
            //        hand.push(card);
            //    }
            // })
            hand = this.cardsFromDeck.filter(card=>{
                const isOnHand = placedCards.filter(x=>x._id==card._id).length > 0 ? false : true;
                return isOnHand
            });
        }

        // for (let i = 0; i < hand?.length; i++) {
        //     const imgName = this.cardsFromDeck[i].image.split('.')[0]
        //     let name = imgName
        //     let src = "src/assets/" + hand[i].image
        //     let power = hand[i].power
        //     let shield = hand[i].shield
        //     let nameDb = hand[i].name
        //     let describe = hand[i].describe
        //     let id = hand[i]._id
        //     this.loader.image(imgName, src)
        //     let playerCard = new Card(this.self);
        //     this.loader.once(Phaser.Loader.Events.COMPLETE, () => {
        //         playerCard.render(275 + (i * 100), 710, name, nameDb, power, shield, describe,id)
        //     });
        // }
    }
    renderCard(card){
        
    }
    moveCard(card){
        // if (card === y.id){
        //     console.log('imageOfCard',y);
        //     const imgName = y.image.split('.')[0]
        //     let name = imgName //"card" + y.id
        //     let src = "src/assets/" + y.id + ".png"
        //     let power = y.power
        //     let shield = y.shield
        //     let nameDb = y.name
        //     let describe = y.description
        //     let id = y.id
        //     placedCards.push(id)
        //     this.loader.image(imgName, src)
        //     let playerCard = new Card(this.self);
        //     this.loader.once(Phaser.Loader.Events.COMPLETE, () => {
        //         playerCard.render(y.x, y.y, name, nameDb, power, shield, describe,id, true)
        //     });      
        // }
    }
}