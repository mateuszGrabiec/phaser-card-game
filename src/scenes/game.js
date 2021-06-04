import io from 'socket.io-client';
import Board from '../helpers/board';
import propBox from '../helpers/propBox';
import CardManager from '../helpers/cardManager';
import ShowScore from '../helpers/showScore';
import SkillManager from '../helpers/skillManager';

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
		this.add.text(100, 580, 'power1').setName('power1');
		this.add.text(100, 450, 'power2').setName('power2');
		this.add.text(100, 280, 'power3').setName('power3');
		this.add.text(100, 130, 'power4').setName('power4');

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
				//oppnentHandLength
				const {oppnentHandLength} = data;
				let oponentText = self.children.getByName('opponent');
				oponentText.visible = false;
				self.oppnentHandLength = oppnentHandLength;
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
		
		this.showScore = new ShowScore(this);
		this.skillManager = new SkillManager(this);

		self.isFirstTime = true;
		//Render button

		this.dealText = this.add.text(75, 350, ['End Round'])
			.setFontSize(18).setFontFamily('Roboto').setColor('white').setInteractive();

		//Render board
		this.zone = new Board(this);

		//timer
		self.clock = this.plugins.get('rexClock').add(this, {
			timeScale: 1
		});

		//Array to hold card backs
		this.alreadyMapped = [];

		this.add.text(1100, 200, '').setName('timer');	
		
		//PlayerA
		this.dropZone1 = this.zone.renderZone(600, 575);
		this.dropZone1.visible = false;
		this.outline = this.zone.renderOutline(this.dropZone1, 0x69ff8a);
		this.dropZone1.data.set('id', '1');
		this.dropZone1.data.set('placed', []);
		this.dropZone2 = this.zone.renderZone(600, 450);
		this.dropZone2.visible = false;
		this.outline = this.zone.renderOutline(this.dropZone2, 0x69ff8a);
		this.dropZone2.data.set('id', '2');
		this.dropZone2.data.set('placed', []);
		//PlayerB
		this.outline1 = this.zone.renderOutlineWithoutDropZone(600, 275, 0xfc3549, 'outline1');
		this.outline2 = this.zone.renderOutlineWithoutDropZone(600, 150, 0xfc3549, 'outline2');

		//Take ram cache to this variables (important at update scene)
		this.scoreLine1 = [];
		this.scoreLine2 = [];

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
		


		this.socket.on('sendPlayer', (data)=> {
			console.log('\n\n\n\n SECOND PLAYER CONNECTED');
			//oppnentHandLength
			const {oppnentHandLength, enemyDeckId} = data;
			let oponentText = self.children.getByName('opponent');
			oponentText.visible = false;
			self.oppnentHandLength = oppnentHandLength;
			self.enemyDeckId = enemyDeckId;
			// this.socket.emit('getTable');
		});

		this.socket.on('error',(error)=>{
			alert(error?.message);
		});

		this.socket.on('disconnect',()=> {
			let confirm = window.confirm('You were disconnected from server');
			if(confirm == true){
				window.location.reload();
			}   
		});

		this.socket.on('endOfGame', function(data) {
			let {winner} = data;

			let allObj = self.children.getAll();
			allObj.map((e) => {
				e.visible = false;
			});
			if(winner === true) {
				self.add.text(640,390,'You win!',{ fontFamily: 'Arial', fontSize: 64, color: 'white' });
			}
			else{
				self.add.text(640,390,'You lose!',{ fontFamily: 'Arial', fontSize: 64, color: 'white' });
			}
		});
		
		this.socket.on('roundSkipped',()=>{
			let confirm = window.confirm('You skipped the turn');
			if(confirm){
				let handObj = self.children.getAll('y', 710);
				let randomObj = _.sample(handObj);
				self.dropZone1.data.values.cards++;
				let placed = self.dropZone1.data.get('placed');
				placed.push(randomObj.id);
				self.dropZone1.data.set('placed', placed);
				let returnCard = {
					x: randomObj.x,
					y: randomObj.y,
					width: randomObj.width,
					id: randomObj.id,
					deckId: randomObj.deck_id,
					power: randomObj.power
				};
				let returnData = {
					fieldId: self.dropZone1.data.get('id'),
					cardName: randomObj.name,
					card: returnCard,
					cardId: randomObj.id,
					field: {
						x: self.dropZone1.x / 2,
						y: self.dropZone1.y,
						width: self.dropZone1.width
					}
				};
				self.socket.emit('put',returnData);
				self.input.setDraggable(randomObj, false);
				this.socket.emit('getTable');
			}
			
			
		});

		this.socket.on('secondPlayerDisconnected',function () {
			self.clock.stop();
			let timer = self.children.getByName('timer');
			timer.text = 'Wait';
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
								if(e.name === 'opponent'){
									e.visible = false;
								}
								else{
									e.visible = true;
								}
							});
						}
					});
				});
			}, 1000);
		});

		//sockets

		this.socket.on('sendTable', function(data) {
			console.log('\n\n\nI GET TABLE');
			let {table,myHand, isMyRound, time} = data;
			if(table?.table){
				table = table.table;
			}

			if(!self.myHand){
				self.cardManager.renderIfTableIsEmpty(myHand);
			}
			console.log('isMyRound',isMyRound);
			console.log('opponentLength',self.oppnentHandLength);
			self.isMyRound = isMyRound;
			if(isMyRound && !self.clock.isRunning){
				console.log('IN THIS IF');
				self.dropZone1.visible = true;
				self.dropZone2.visible = true;
				self.timeFromServer = time || 30; 
				self.clock.start();
			}
			else{
				self.clock.stop();
				self.dropZone1.visible = false;
				self.dropZone2.visible = false;
			}
			console.log('table',table);
			self.myHand = myHand;
			self.table = table;
			self.scoreLine1 = [];
			self.scoreLine2 = [];
			loader.once(Phaser.Loader.Events.COMPLETE, () => {
				if(table[0].length !== 0 || table[1].length !== 0  || table[2].length !== 0  || table[3].length !== 0){
					table.map((line, index) => {
						
						let sumPower = 0;
						let sumShield = 0;
						line.map((card) => {
							//Count a score
							switch(index){
								case 0:
									sumPower+=card.power;
									sumShield+=card.shield;
									break;
								case 1:
									sumPower+=card.power;
									sumShield+=card.shield;
									break;
								case 2:
									self.scoreLine1.push(card.shield, card.power);
									break;
								case 3:
									self.scoreLine2.push(card.shield, card.power);
									break;
							}
							let allDeckArr = self.children.getAll('deck_id', self.deckId);
							let cardObject = allDeckArr.filter(elem => elem.name === card.name);
							self.cardManager.moveCard(card, cardObject[0], index, card.power, card.shield);
						});
						if(index === 0){
							self.dropZone1.data.set('shield', sumShield);
							self.dropZone1.data.set('power', sumPower);
						}
						if(index === 1){
							self.dropZone2.data.set('shield', sumShield);
							self.dropZone2.data.set('power', sumPower);
						}
						if(index === 2 || index === 3){
							if(!_.isEmpty(line) && self.isMyRound){
								let backObj = self.children.getAll('back', true);
								if(!_.isEmpty(backObj)){
									backObj.map((e) => {
										e.destroy();
									});
								}
								self.enemyCards = _.range(self.checkBeforeDeck);
								let loader2 = new Phaser.Loader.LoaderPlugin(self);
								if(self.table){
									let minus = 0;
									if(table[index].length>0){
										if(!self.isFirstTime){
											minus = 1;
										}
										
									}
									self.isFirstTime = false;
									const lenToRender = self.checkBeforeDeck - minus;
									for(let i = 0; i < lenToRender; i++){
										let src = 'src/assets/cardback.png';
										let name = 'cardback'+i;
										loader2.image(name, src);
										loader2.once(Phaser.Loader.Events.COMPLETE, () => {
											let back = self.add.image(275 + (i * 100), 35, name).setScale(0.08, 0.08).setName(name);
											back.back = true;
										});
										loader2.start();
										
									}
								}
							}
						}
					});
				}
			});
			loader.start();
		});
        
		this.socket.emit('getTable');
        

		//End round button
		this.dealCards = () => {
			self.socket.emit('endRound');
			self.clock.stop();
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
				console.log(gameObject);
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
			switch(gameObject.skill){
				case 'buffYourHand':
					self.skillManager.buffYourHand(gameObject.deck_id);
					break;
				case 'attackEnemy':
					self.skillManager.attackEnemyCard(self.enemyDeckId);
			}

			let buff = gameObject.buffed || false;
			let deBuff = gameObject.deBuffed || false;

			dropZone.data.set('placed', placed);
			dropZone.data.set('shield', gameObject.shield);
			dropZone.data.set('power', gameObject.power);

			let returnCard = {
				x: gameObject.x,
				y: gameObject.y,
				width: gameObject.width,
				id: gameObject.id,
				deckId: gameObject.deck_id,
				power: gameObject.power,
				buffed: buff,
				deBuffed: deBuff
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
			
		});
	}

	update() {
		if (this.oppnentHandLength>=1) {
			this.enemyCards = _.range(this.oppnentHandLength);
			let loader = new Phaser.Loader.LoaderPlugin(this);
			if(this.table){
				const lenToRender = this.oppnentHandLength;
				this.checkBeforeDeck = this.oppnentHandLength;
				for(let i = 0; i < lenToRender; i++){
					let src = 'src/assets/cardback.png';
					let name = 'cardback'+i;
					loader.image(name, src);
					loader.once(Phaser.Loader.Events.COMPLETE, () => {
						let back = this.add.image(275 + (i * 100), 35, name).setScale(0.08, 0.08).setName(name);
						back.back = true;
					});
					loader.start();
				}
				this.oppnentHandLength = 0;
			}
		}

		if(this.clock.isRunning){
			let timer = this.children.getByName('timer');
			const timeLeft = this.timeFromServer - Math.floor(this.clock.now * 0.001);
			if(!isNaN(timeLeft)){
				timer.text = 'Time: ' + timeLeft + 's';
				if(timeLeft === 0){
					this.clock.stop();
					this.socket.emit('endRound');
				}
			}
			else{
				timer.text = 'Wait';
			}
		}
		else {
			let timer = this.children.getByName('timer');
			timer.text = 'Wait';
		}	

		if(!_.isEmpty(this.enemyCards)){
			let oponentText = this.children.getByName('opponent');
			oponentText.visible = false;
		}

		if(this.dropZone1 && this.dropZone2){
			this.showScore.checkIfScoreIsActive(this.dropZone1, 'power1');
			this.showScore.checkIfScoreIsActive(this.dropZone2, 'power2');
		}
		this.showScore.checkScoreOnEnemy(this.scoreLine1, 'power3');
		this.showScore.checkScoreOnEnemy(this.scoreLine2, 'power4');

		let enemy = this.children.getAll('deck_id', this.enemyDeckId);
		if(!_.isEmpty(enemy)){
			this.enemyCardsOnTable = enemy;
		}
	}
}
