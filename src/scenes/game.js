import io from 'socket.io-client';
import Card from '../helpers/card';
import Board from '../helpers/board';
import propBox from "../helpers/propBox";
import dealCards from "../helpers/dealer";

export default class Game extends Phaser.Scene {
    constructor() {
        super({
            key: 'Game'
        });
    }

    preload() {
        // this.dealer = new dealCards(this).deal();
        this.load.image('front', 'src/assets/front.png');
        this.load.image('back', 'src/assets/back.png');
        this.socket = io('http://localhost:3000', {
            withCredentials: true
        });
    }

    create() {
        console.log('CREATED!!!!!!');
        let self = this;
        

        //Render button
        this.dealText = this.add.text(75, 350, ['End Round'])
            .setFontSize(18).setFontFamily('Roboto').setColor('white').setInteractive();



        //Render board
        this.zone = new Board(this);
        this.dropZone = this.zone.renderZone();
        this.outline = this.zone.renderOutline(this.dropZone);

        //render prop Box

        this.box = new propBox(this);
        this.box.render();


        //render cards
        for (let i = 0; i < 5; i++) {
            let playerCard = new Card(this);
            playerCard.render(475 + (i * 100), 650, 'front');
        }

        //End round button
        // this.dealCards = () => {

        // }


        //events
        this.dealText.on('pointerdown', function () {
            self.dealCards();
        })

        this.dealText.on('pointerover', function () {
            self.dealText.setColor('#ff69b4');
        })

        this.dealText.on('pointerout', function () {
            self.dealText.setColor('white');
        })

        this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.input.on('dragstart', function (pointer, gameObject) {
            gameObject.setTint(0xff69b4);
            self.children.bringToTop(gameObject);
        })

        this.input.on('dragend', function (pointer, gameObject, dropped) {
            gameObject.setTint();
            if (!dropped) {
                gameObject.x = gameObject.input.dragStartX;
                gameObject.y = gameObject.input.dragStartY;
            }
        })

        this.input.on('drop', function (pointer, gameObject, dropZone) {
            dropZone.data.values.cards++;
            gameObject.x = (dropZone.x - 350) + (dropZone.data.values.cards * 50);
            gameObject.y = dropZone.y;
            gameObject.disableInteractive();
        })

        

        this.socket.on('connect', function () {
            console.log('Connected!');
        });

        this.socket.on('connect', function () {
            console.log('Connected!');
        });

        this.socket.on('isPlayerA', function () {
            self.isPlayerA = true;
        })

        this.socket.on('dealCards', function () {
            self.dealer.dealCards();
            self.dealText.disableInteractive();
        })

        this.socket.on('cardPlayed', function (gameObject, isPlayerA) {
            if (isPlayerA !== self.isPlayerA) {
                let sprite = gameObject.textureKey;
                self.opponentCards.shift().destroy();
                self.dropZone.data.values.cards++;
                let card = new Card(self);
                card.render(((self.dropZone.x - 350) + (self.dropZone.data.values.cards * 50)), (self.dropZone.y), sprite).disableInteractive();
            }
        })


    }

    update() {

    }
}
