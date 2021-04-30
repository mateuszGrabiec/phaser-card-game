import io from 'socket.io-client';

import Board from '../helpers/board';
import propBox from "../helpers/propBox";
import CardManager from '../helpers/cardManager';

export default class Game extends Phaser.Scene {
    constructor() {
        super({
            key: 'Game'
        });
    }

    preload() {
        //tutaj można włączyć loader
        this.load.json('card', ENDPOINT + '/decks/current', null, { withCredentials: true })
            this.socket = io(ENDPOINT, {
                withCredentials: true
            });
        var callback = function(successCallback, failureCallback) {
            fetch(ENDPOINT + '/decks/current', {
                credentials: 'include'
            }).then(res => {
                if (res.redirected) {
                    failureCallback();
                } else {
                    //tu trzeba jescze obsłużyć pusty deck
                    successCallback();
                }
            }).catch(err => {
                console.log('err', err);
                failureCallback();
            })
        };

        var successCallback = () => {
            //tutaj można wyłączyć loader
            console.log('success with getting deck!!!');
        }

        var failureCallback = function () {
            window.location = ENDPOINT+"/login?err='Brak decku'"
        }

        this.load.rexAwait('Game', {
            callback: callback(successCallback,failureCallback),
            // scope: scope
        });

    }

    create() {
        let self = this;
        //Render button
        this.dealText = this.add.text(75, 350, ['End Round'])
            .setFontSize(18).setFontFamily('Roboto').setColor('white').setInteractive();

        //Render board
        this.zone = new Board(this);

        //PlayerA
        this.dropZone1 = this.zone.renderZone(600, 575);
        this.outline = this.zone.renderOutline(this.dropZone1, 0x69ff8a);
        this.dropZone1.data.set('id', '1')
        this.dropZone1.data.set('placed', [])
        this.dropZone2 = this.zone.renderZone(600, 450);
        this.outline = this.zone.renderOutline(this.dropZone2, 0x69ff8a);
        this.dropZone2.data.set('id', '2')
        this.dropZone2.data.set('placed', [])

        //PlayerB prawdopodobnie nie będzie potrzebny bo będziesz dostawał eventy z serwera
        this.outline = this.zone.renderOutlineWithoutDropZone(600, 275, 0xfc3549);
        this.outline = this.zone.renderOutlineWithoutDropZone(600, 150, 0xfc3549);



        //render prop Box

        this.box = new propBox(this);
        this.box.render();


        let loader = new Phaser.Loader.LoaderPlugin(self)
        const cardsFromDeck = this.cache.json.get('card').body.deck.cards;

        //sockets
        this.socket.on('sendTable', function(data) {
            let array;
            console.log(data)
            if(data.length === undefined){
                array = data.table;
            }
            else{
                array = data
            }
            if(array[0].length === 0 && array[1].length === 0  && array[2].length === 0  && array[3].length === 0){
                new CardManager(loader, self, cardsFromDeck).renderIfTableIsEmpty();
            }
            else{
                new CardManager(loader, self, cardsFromDeck).renderIfTableIsNotEmpty(array);
            }
            loader.start();
            console.log(self.children.getByName("Example_card_2"))
        });
        
        this.socket.emit("getTable");
        
        

        //End round button
        // this.dealCards = () => {

        // }

        //Render a text in prop-box
        this.nameText = this.add.text(1040, 250, ['Name:'])
        this.nameValue = this.add.text(1100, 250, [])
        this.describtionText = this.add.text(1040, 280, ['Describtion:'])
        this.descriptionValue = this.add.text(1040, 310, [])
        this.powerText = this.add.text(1040, 340, ['Power:'])
        this.powerValue = this.add.text(1130, 340, [])
        this.powerText = this.add.text(1040, 380, ['Shield:'])
        this.shieldValue = this.add.text(1140, 380, [])

        //events
        this.dealText.on('pointerdown', function() {
            self.dealCards();
        })

        this.dealText.on('pointerover', function() {
            self.dealText.setColor('#ff69b4');
        })

        this.dealText.on('pointerout', function() {
            self.dealText.setColor('white');
        })

        this.input.on('drag', function(pointer, gameObject, dragX, dragY) {
            //TODO Split a name on dot when server will give unique id of name
            self.nameValue.text = gameObject.name
            self.descriptionValue.text = gameObject.description
            self.powerValue.text = gameObject.power
            self.shieldValue.text = gameObject.shield
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.input.on('dragstart', function(pointer, gameObject) {
            gameObject.setTint(0xff69b4);
            self.children.bringToTop(gameObject);
        })

        this.input.on('dragend', function(pointer, gameObject, dropped) {
            gameObject.setTint();
            self.nameValue.text = ""
            self.descriptionValue.text = ""
            self.powerValue.text = ""
            self.shieldValue.text = ""
            if (!dropped) {
                gameObject.x = gameObject.input.dragStartX;
                gameObject.y = gameObject.input.dragStartY;
            }
        })

        this.input.on('drop', function(pointer, gameObject, dropZone) {
            dropZone.data.values.cards++;
            gameObject.x = (dropZone.x - 350) + (dropZone.data.values.cards * 50);
            gameObject.y = dropZone.y;
            gameObject.disableInteractive();
            let placed = dropZone.data.get('placed')
            placed.push(gameObject.id)
            dropZone.data.set('placed', placed)
            console.log(gameObject);
            let returnCard = {
                x: gameObject.x,
                y: gameObject.y,
                name: gameObject.name,
                width: gameObject.width,
                description: gameObject.description,
                texture: gameObject.id,
                power: gameObject.power,
                shield: gameObject.shield,
                id: gameObject.id,
                placedCards: dropZone.data.get('placed')
            }
            let returnData = {
                fieldId: dropZone.data.get("id"),
                card: returnCard,
                cardId: gameObject.id,
                field: {
                    x: dropZone.x,
                    y: dropZone.y,
                    width: dropZone.width
                }
            }
            self.socket.emit('put',returnData);
        })


    }

    update() {

    }
}
