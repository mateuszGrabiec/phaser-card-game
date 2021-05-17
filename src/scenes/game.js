import io from 'socket.io-client';
import Board from '../helpers/board';
import propBox from '../helpers/propBox';
import CardManager from '../helpers/cardManager';

var _ = require('lodash');

export default class Game extends Phaser.Scene {
	constructor() {
		super({
			key: 'Game'
		});
	}

	preload() {
		//LOADER

        
		//ASSETS
		this.load.json('card', ENDPOINT + '/decks/current', null, { withCredentials: true });
		this.socket = io(ENDPOINT, {
			withCredentials: true
		});
		this.load.json('allcards', ENDPOINT + '/card', null, { withCredentials: true });


		let self = this;
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
							successCallback(self);
						}
					});
				}
			}).catch(err => {
				console.log('err', err);
				failureCallback();
			});
		};

		function successCallback(self) {
			
			//WAITING FOR SECOND PLAYER
			self.socket.on('sendPlayer', (data)=> {
				const {deckLength} = data;
				let oponentText = self.children.getByName('opponent');
				oponentText.visible = false;
				self.deckLength = deckLength;
			});
            
		}

		var failureCallback = function () {

			window.location = ENDPOINT+'/';
		};


		this.load.rexAwait('Game', {
			callback: callback(successCallback,failureCallback),
			// scope: scope
		});

		if(self.deckLength > 0){
			this.createLoadingAnimation(self);
		}
		
	}

	createLoadingAnimation(self)
	{
		// store the bars in a list for later
		const bars = [];

		const radius = 64;
		const height = radius * 0.5;
		const width = 10;

		// the center of the loading animation
		const cx = 600;
		const cy = 350;

		// start at top
		let angle = -90;

		// create 12 bars each rotated and offset from the center
		for (let i = 0; i < 12; ++i)
		{
			const { x, y } = Phaser.Math.RotateAround({ x: cx, y: cy - (radius - (height * 0.5)) }, cx, cy, Phaser.Math.DEG_TO_RAD * angle);

			// create each bar with position, rotation, and alpha
			const bar = self.add.rectangle(x, y, width, height, 0xffffff, 1)
				.setAngle(angle)
				.setAlpha(0.2);

			bars.push(bar);

			// increment by 30 degrees for next bar
			angle += 30;
		}

		let index = 0;

		// save created tweens for reuse
		const tweens = [];
	
		// create a looping TimerEvent
		self.time.addEvent({
			delay: 70,
			loop: true,
			callback: () => {
				// if we already have a tween then reuse it
				if (index < tweens.length)
				{
					const tween = tweens[index];
					tween.restart();
				}
				else
				{
					// make a new tween for the current bar
					const bar = bars[index];
					const tween = this.tweens.add({
						targets: bar,
						alpha: 0.2,
						duration: 400,
						onStart: () => {
							bar.alpha = 1;
						}
					});
	
					tweens.push(tween);
				}
	
				// increment and wrap around
				++index;
	
				if (index >= bars.length)
				{
					index = 0;
				}
			}
		});
	}

	create() {
		let self = this;
		
		//Render button
		this.dealText = this.add.text(75, 350, ['End Round'])
			.setFontSize(18).setFontFamily('Roboto').setColor('white').setInteractive();

		//Render board
		this.zone = new Board(this);

		//timer
		self.clock = this.plugins.get('rexClock').add(this, {
			timeScale: 1
		});
		self.clock.start();
		this.add.text(1100, 200, '').setName('timer');

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
		let loader = new Phaser.Loader.LoaderPlugin(self);
		const cardsFromDeck = this.cache.json.get('card').body.deck.cards;
		self.deckId = this.cache.json.get('card').body.deck._id;
		const allCards = this.cache.json.get('allcards').body;
		self.cardManager = new CardManager(loader, self, cardsFromDeck,self.deckId,outlineEnemy1,outlineEnemy2,allCards, [], this.dropZone1, this.dropZone2);
		self.cardManager.renderIfTableIsEmpty();
		

		this.socket.on('disconnect',function () {
			let confirm = confirm('You were disconnected from server');
			if(confirm == true){
				window.location.reload();
			}   
		});

		this.socket.on('secondPlayerDisconnected',function () {
			let startTime = new Date().getTime();
			let interval = setInterval(function() {
				if(new Date().getTime() - startTime > 30000){
					clearInterval(interval);
					return;
				}
				fetch(ENDPOINT + '/disconnect', {
					credentials: 'include'
				}).then(res => {
					res.json().then(res => {
						let allObj = self.children.getAll();
						if(res.body.returned === false){
							allObj.map((e) => {
								e.visible = false;
							});
							self.createLoadingAnimation(self);
						}
						else{
							allObj.map((e) => {
								e.visible = true;
							});
						}
					});
				});
			}, 1000);
		});

		//sockets

		this.socket.on('sendTable', function(table) {
			if(table?.table){
				table = table.table;
			}
			self.table = table;
			loader.once(Phaser.Loader.Events.COMPLETE, () => {
				if(table[0].length !== 0 || table[1].length !== 0  || table[2].length !== 0  || table[3].length !== 0){
					table.map((line, index) => {
						line.map((card) => {
							let allDeckArr = self.children.getAll('deck_id', self.deckId);
							let cardObject = allDeckArr.filter(elem => elem.name === card.name);
							self.cardManager.moveCard(card, cardObject[0], index);
							if(index == 2 || index == 3){
								const checkLenOfTable = table[2].length + table[3].length;
								if(checkLenOfTable !== self.alreadyMapped.length){
									const random = _.sample(self.enemyCards);
									let backName = 'cardback'+random;
									let backObject = self.children.getByName(backName);
									if(backObject){
										backObject.visible = false;
									}
									_.remove(self.enemyCards, function (e) {
										return e === random;
									});
									self.alreadyMapped.push(random);
								}
							}
						});
					});
				}
			});
			loader.start();
		});
        
		this.socket.emit('getTable');
        
		//TODO: Enable putting card for me, i need boolean to check if its my turn on drag&drop
		this.socket.on('myRound', function (data) {
			self.clock.start();
			console.log(data);
		});
        

		//End round button
		this.dealCards = () => {
			self.socket.emit('endRound');
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
		if (this.deckLength>0) {
			this.enemyCards = _.range(this.deckLength);
			this.alreadyMapped = [];
			let loader = new Phaser.Loader.LoaderPlugin(this);
			if(this.table){
				const len = this.table[2].length + this.table[3].length;
				const lenToRender = this.deckLength - len;
				for(let i = 0; i < lenToRender; i++){
					let src = 'src/assets/cardback.png';
					let name = 'cardback'+i;
					loader.image(name, src);
					loader.once(Phaser.Loader.Events.COMPLETE, () => {
						this.add.image(275 + (i * 100), 40, name).setScale(0.1, 0.1).setName(name);
					});
					loader.start();
				}
				this.deckLength = 0;
			}
		}

		if(this.clock.isRunning){
			let timer = this.children.getByName('timer');
			const timeLeft = 30 - Math.floor(this.clock.now * 0.001);
			timer.text = 'Time: ' + timeLeft + 's';
			if(timeLeft === 0){
				this.clock.stop();
				this.socket.emit('endRound');
			}
		}	

	}
}
