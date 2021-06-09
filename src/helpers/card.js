export default class Card {
    constructor(scene) {
        this.render = (x, y, sprite, name, power, shield, description, id, deckId,alreadyPlaced = null, skill,buffed = false) => {
            let card;
            if(alreadyPlaced === null){
                card = scene.add.image(x, y, sprite).setScale(0.1, 0.1).setName(name).setInteractive();
                card.name = name;
                card.power = power;
                card.shield = shield;
                card.description = description;
                card.id = id;
                card.deck_id = deckId;
				card.skill = skill;
				card.buffed = buffed;
                scene.input.setDraggable(card);
            }
            else {
                card = scene.add.image(x, y, sprite).setScale(0.1, 0.1).setName(name).setInteractive();
                card.name = name;
                card.power = power;
                card.shield = shield;
                card.description = description;
                card.id = id;
				card.skill = skill;
				card.deck_id = deckId;
            }
            return card;
        };
    }
}
