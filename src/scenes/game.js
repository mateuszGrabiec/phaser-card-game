import io from 'socket.io-client';

import Board from '../helpers/board';
import propBox from '../helpers/propBox';
import CardManager from '../helpers/cardManager';

export default class Game extends Phaser.Scene {
	constructor() {
		super({
			key: 'Game'
		});
	}

	preload() {
		//LOADER
		this.graphics = this.add.graphics();
		this.newGraphics = this.add.graphics();
		var progressBar = new Phaser.Geom.Rectangle(300*1.5, 200*1.5, 400, 50);
		var progressBarFill = new Phaser.Geom.Rectangle(305*1.5, 205*1.5, 290, 40);
		this.graphics.fillStyle(0xffffff, 1);
		this.graphics.fillRectShape(progressBar);
		this.newGraphics.fillStyle(0x3587e2, 1);
		this.newGraphics.fillRectShape(progressBarFill);
		this.loadingText = this.add.text(350*1.5,260*1.5,'Loading: ', { fontSize: '32px', fill: '#FFF' });
        
		//ASSETS
		this.load.json('card', ENDPOINT + '/decks/current', null, { withCredentials: true });
		this.socket = io(ENDPOINT, {
			withCredentials: true
		});
		this.load.json('allcards', ENDPOINT + '/card', null, { withCredentials: true });


		let self = this;
		let loader = new Phaser.Loader.LoaderPlugin(self);
		this.add.text(500, 40, 'Waiting for opponent ....').setName('opponent');

		var callback = function(successCallback, failureCallback) {
			fetch(ENDPOINT + '/decks/current', {
				credentials: 'include'
			}).then(res => {
				if (res.redirected) {
					failureCallback();
				} else {
					res.json().then(res => {
						if (res.body.deck === false){
							window.location = ENDPOINT+'/decks?error=no_current_deck';
						}
						else{
							successCallback(self, loader);
						}
					});
				}
			}).catch(err => {
				console.log('err', err);
				failureCallback();
			});
		};

		function successCallback(self, loader) {
			//WAITING FOR SECOND PLAYER
			self.socket.on('sendPlayer', (data)=> {
				const {deckLength} = data;
				let oponentText = self.children.getByName('opponent');
				oponentText.visible = false;
				if (deckLength) {
					for(let i = 0; i < deckLength; i++){
						let src = 'src/assets/cardback.png';
						let name = 'cardback'+i;
						loader.image(name, src);
						loader.once(Phaser.Loader.Events.COMPLETE, () => {
							self.add.image(275 + (i * 100), 40, name).setScale(0.1, 0.1).setName(name);
						});
						loader.start();
					}
				}
			});
            
		}

		var failureCallback = function () {

			window.location = ENDPOINT+'/';
		};


		this.load.rexAwait('Game', {
			callback: callback(successCallback,failureCallback),
			// scope: scope
		});

		this.load.on('progress', this.updateBar, {newGraphics:this.newGraphics,loadingText:this.loadingText});
		this.load.on('complete', this.complete, {scene:this.scene, newGraphics:this.newGraphics,loadingText:this.loadingText, graphics: this.graphics});
	}

	updateBar(percentage) {
		this.newGraphics.clear();
		this.newGraphics.fillStyle(0x3587e2, 1);
		this.newGraphics.fillRectShape(new Phaser.Geom.Rectangle(305*1.5, 205*1.5, percentage*390, 40));
		percentage = percentage * 100;
		this.loadingText.setText('Loading: ' + percentage.toFixed(2) + '%');
		const date = Date.now();
		let currentDate = null;
		do {
			currentDate = Date.now();
		} while (currentDate - date < 1800);
	}



	complete() {
		this.newGraphics.setVisible(false);
		this.loadingText.visible = false;
		this.graphics.visible = false;
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
		this.dropZone1.data.set('id', '1');
		this.dropZone1.data.set('placed', []);
		this.dropZone2 = this.zone.renderZone(600, 450);
		this.outline = this.zone.renderOutline(this.dropZone2, 0x69ff8a);
		this.dropZone2.data.set('id', '2');
		this.dropZone2.data.set('placed', []);

		//PlayerB
		this.outline1 = this.zone.renderOutlineWithoutDropZone(600, 275, 0xfc3549, 'outline1');
		this.outline2 = this.zone.renderOutlineWithoutDropZone(600, 150, 0xfc3549, 'outline2');

		//render prop Box

		this.box = new propBox(this);
		this.box.render();

		//MAPPING
		let outlineEnemy1 = this.outline1;
		let outlineEnemy2 = this.outline2;
		console.log('1:', outlineEnemy1);
		console.log('2:', outlineEnemy2);
		let loader = new Phaser.Loader.LoaderPlugin(self);
		const cardsFromDeck = this.cache.json.get('card').body.deck.cards;
		self.deckId = this.cache.json.get('card').body.deck._id;
		const allCards = this.cache.json.get('allcards').body;
		self.cardManager = new CardManager(loader, self, cardsFromDeck,self.deckId,outlineEnemy1,outlineEnemy2,allCards, [], this.dropZone1, this.dropZone2);
		self.cardManager.renderIfTableIsEmpty();

		this.socket.on('disconnect',function () {
			alert('You were disconnected from server please refresh page');   
		});

		this.socket.on('secondPlayerDisconnected',function () {
			alert('secondPlayerDisconnected');   
		});

		//sockets
		this.socket.on('sendTable', function(table) {
			console.log(table);
			if(table?.table){
				table = table.table;
			}
             
			loader.once(Phaser.Loader.Events.COMPLETE, () => {
				if(table[0].length !== 0 || table[1].length !== 0  || table[2].length !== 0  || table[3].length !== 0){
					table.map((line, index) => {
						line.map((card) => {
							let allDeckArr = self.children.getAll('deck_id', self.deckId);
							let cardObject = allDeckArr.filter(elem => elem.name === card.name);
							console.log(cardObject);
							self.cardManager.moveCard(card, cardObject[0], index);
						});
					});
				}
			});
			loader.start();
		});
        
		this.socket.emit('getTable');
        
        

		//End round button
		this.dealCards = () => {
			console.log('Round ended');
		};

		//Render a text in prop-box
		this.nameText = this.add.text(1040, 250, ['Name:']);
		this.nameValue = this.add.text(1100, 250, []);
		this.describtionText = this.add.text(1040, 280, ['Describtion:']);
		this.descriptionValue = this.add.text(1040, 310, []);
		this.powerText = this.add.text(1040, 340, ['Power:']);
		this.powerValue = this.add.text(1130, 340, []);
		this.powerText = this.add.text(1040, 380, ['Shield:']);
		this.shieldValue = this.add.text(1140, 380, []);

		//events
		this.dealText.on('pointerdown', function() {
			self.dealCards();
		});

		this.dealText.on('pointerover', function() {
			self.dealText.setColor('#ff69b4');
		});

		this.dealText.on('pointerout', function() {
			self.dealText.setColor('white');
		});

		this.input.on('drag', function(pointer, gameObject, dragX, dragY) {
			self.nameValue.text = gameObject.name;
			self.descriptionValue.text = gameObject.description;
			self.powerValue.text = gameObject.power;
			self.shieldValue.text = gameObject.shield;
			gameObject.x = dragX;
			gameObject.y = dragY;
		});

		this.input.on('gameobjectdown', function (pointer, gameObject){
			if(gameObject.name !== ''){
				self.nameValue.text = gameObject.name;
				self.descriptionValue.text = gameObject.description;
				self.powerValue.text = gameObject.power;
				self.shieldValue.text = gameObject.shield;
			}
		});

		this.input.on('dragstart', function(pointer, gameObject) {
			gameObject.setTint(0xff69b4);
			self.children.bringToTop(gameObject);
		});

		this.input.on('dragend', function(pointer, gameObject, dropped) {
			gameObject.setTint();
			self.nameValue.text = '';
			self.descriptionValue.text = '';
			self.powerValue.text = '';
			self.shieldValue.text = '';
			if (!dropped) {
				gameObject.x = gameObject.input.dragStartX;
				gameObject.y = gameObject.input.dragStartY;
			}
		});
		this.input.on('drop', function(pointer, gameObject, dropZone) {
			dropZone.data.values.cards++;
			let placed = dropZone.data.get('placed');
			placed.push(gameObject.id);
			dropZone.data.set('placed', placed);
			let returnCard = {
				x: gameObject.x,
				y: gameObject.y,
				width: gameObject.width,
				id: gameObject.id,
				deckId: gameObject.deck_id
			};
			let returnData = {
				fieldId: dropZone.data.get('id'),
				cardName: gameObject.name,
				card: returnCard,
				cardId: gameObject.id,
				field: {
					x: dropZone.x / 2,
					y: dropZone.y,
					width: dropZone.width
				}
			};
			self.socket.emit('put',returnData);
			self.input.setDraggable(gameObject, false);
		});


	}

	update() {

	}
}
