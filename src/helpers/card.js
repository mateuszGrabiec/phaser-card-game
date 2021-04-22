export default class Card {
    constructor(scene) {
        this.render = (x, y, sprite, name, power, shield, description) => {
            let card = scene.add.image(x, y, sprite).setScale(0.2, 0.2).setInteractive();
            card.name = name;
            card.power = power;
            card.shield = shield
            card.description = description
            scene.input.setDraggable(card);
            return card;
        }
    }
}
