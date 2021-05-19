export default class Card {
    constructor(scene) {
        this.render = (x, y, sprite, name, power, shield, description, id, deckId,alreadyPlaced = null) => {
            let card;
            if(alreadyPlaced === null){
                card = scene.add.image(x, y, sprite).setScale(0.2, 0.2).setName(name).setInteractive();
                card.name = name;
                card.power = power;
                card.shield = shield
                card.description = description
                card.id = id
                card.deck_id = deckId
                scene.input.setDraggable(card);
            }
            else {
                card = scene.add.image(x, y, sprite).setScale(0.2, 0.2).setName(name).setInteractive();
                card.name = name;
                card.power = power;
                card.shield = shield
                card.description = description
                card.id = id
            }
            return card;
        }
    }
}
