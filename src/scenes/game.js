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
				.setAlpha(0.2)
				.setName('bar' + i);

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
		this.add.text(1080, 170, '').setName('').setName('textround');
		
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
			const {oppnentHandLength, enemyDeckId, round} = data;
			let oponentText = self.children.getByName('opponent');
			oponentText.visible = false;
			self.oppnentHandLength = oppnentHandLength;
			self.enemyDeckId = enemyDeckId;
			console.log('round \n\n\n',round);
			self.roundNumber = round;
			if(!self.clock.isRunning){
				self.socket.emit('getTable');
			}else{
				self.clock.stop();
				self.socket.emit('getTable');
			}
		});

		this.socket.on('roundStatus',(data)=>{
			let {roundStatus} = data;
			let confirm = window.confirm('Round '+roundStatus);
			if(confirm){
				window.location.reload();
			}else{
				window.location.reload();
			}
		});

		this.socket.on('gameStatus',(data)=>{
			let {gameStatus} = data;
			let allObj = self.children.getAll();
			allObj.map((e) => {
				e.visible = false;
			});
			if(gameStatus === 'WIN') {
				self.add.text(550,490,'You win!',{ fontFamily: 'Arial', fontSize: 64, color: 'white' });
			}
			else if(gameStatus === 'LOSE'){
				self.add.text(550,490,'You lose!',{ fontFamily: 'Arial', fontSize: 64, color: 'white' });
			}
			else{
				self.add.text(550,490,'It is a draw!',{ fontFamily: 'Arial', fontSize: 64, color: 'white' });
			}
			//TODO CHANGE PATH HERE
			const rankingButton = self.add.text(350, 290, 'Check the ranking - click', { fontFamily: 'Arial', fontSize: 54, color: 'white' }).setInteractive();
			rankingButton.on('pointerdown', () => { window.location.href = 'https://google.com'; });
			self.socket.emit('getTable');
		});

		this.socket.on('error',(error)=>{
			alert(error?.message);
			let allMyCards = self.children.getAll('deck_id', self.deckId);
			allMyCards.map((elem) => {
				if(elem.y !== 575 || elem.y !== 450 || elem.y !== 275 || elem.y !== 150){
					elem.y = 710;
				}
			});

		});

		this.socket.on('disconnect',()=> {
			let confirm = window.confirm('You were disconnected from server');
			if(confirm == true){
				window.location.reload();
			}   
		});
		
		this.socket.on('roundSkipped',()=>{
				let handObj = self.children.getAll('y', 710);
				if(_.isEmpty(handObj)){
					this.dealCards();
				}else{
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
			}
				alert('You skipped the turn');
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
			let {table,myHand, isMyRound, time, opponentHandLength} = data;

			let textToPut = 'Round '+ (self.roundNumber || 1) + '/3';
			let textRound = self.children.getByName('textround');
			textRound.text = textToPut;	
			opponentHandLength = opponentHandLength || self.opponentHandLength ;
			if(table?.table){
				table = table.table;
			}

			if(!self.myHand){
				self.cardManager.renderIfTableIsEmpty(myHand);
			}
			self.isMyRound = isMyRound;
			if(isMyRound && !self.clock.isRunning){
				self.dropZone1.visible = true;
				self.dropZone2.visible = true;
				self.timeFromServer = time || 30; 
				self.clock.start();
			}else if(isMyRound){
				self.clock.stop();
				self.dropZone1.visible = true;
				self.dropZone2.visible = true;
				self.timeFromServer = time || 30;
				self.clock.start();
			}else{
				self.clock.stop();
				self.dropZone1.visible = false;
				self.dropZone2.visible = false;
			}
			// console.log('table',table);
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
							//console.log("moj deck id", self.deckId);
							// console.log('znalezione obiekty', cardObject);
							let objToMove = null;
							if(cardObject.length > 1){
								objToMove = cardObject[cardObject.length - 1];
								// console.log(objToMove);
							}
							else{
								objToMove = cardObject[0];
							}
							self.cardManager.moveCard(card, objToMove, index, card.power, card.shield, self.enemyDeckId);
						});
						if(index === 0){
							self.dropZone1.data.set('shield', sumShield);
							self.dropZone1.data.set('power', sumPower);
						}
						if(index === 1){
							self.dropZone2.data.set('shield', sumShield);
							self.dropZone2.data.set('power', sumPower);
						}
					});
				}
			});
			let backObj = self.children.getAll('back', true);
			if(!_.isEmpty(backObj)){
				backObj.map((e) => {
					e.destroy();
				});
			}
			self.enemyCards = _.range(self.checkBeforeDeck);
			let loader2 = new Phaser.Loader.LoaderPlugin(self);
			if(self.table){
				for(let i = 0; i < opponentHandLength; i++){
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
			loader.start();
		});

		//End round button
		this.dealCards = () => {
			if(self.isMyRound){
				self.socket.emit('endRound');
				self.clock.stop();
			}else{
				alert('You can end round only when is your round');
			}
		};

		//Render a text in prop-box
		this.nameText = this.add.text(1040, 250, ['Name:']);
		this.nameValue = this.add.text(1100, 250, []);
		this.describtionText = this.add.text(1040, 280, ['Describtion:']);
		this.descriptionValue = this.add.text(1040, 310, []).setFontSize(12);
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
			let arrSplitted = gameObject.name.split(' ');
			self.nameValue.text = arrSplitted[0];
			self.descriptionValue.text = gameObject.description;
			self.powerValue.text = gameObject.power;
			self.shieldValue.text = gameObject.shield;
			gameObject.x = dragX;
			gameObject.y = dragY;
		});

		this.input.on('gameobjectdown', function (pointer, gameObject){
			if(gameObject.name !== ''){
				let arrSplitted = gameObject.name.split(' ');
				self.nameValue.text = arrSplitted[0];
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
			// console.log(returnCard.buffed);
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
					// this.socket.emit('endRound');
				}
			}
			else{
				timer.text = 'Wait';
			}
		}
		else {
			let timer = this.children.getByName('timer');
			if(timer){
				timer.text = 'Wait';
			}
		}	

		if(!_.isEmpty(this.enemyCards)){
			let oponentText = this.children.getByName('opponent');
			if(oponentText){
				oponentText.visible = false;
			}
			
		}

		if(this.dropZone1 && this.dropZone2){
			this.showScore.checkIfScoreIsActive(this.dropZone1, 'power1');
			this.showScore.checkIfScoreIsActive(this.dropZone2, 'power2');
		}
		this.showScore.checkScoreOnEnemy(this.scoreLine1, 'power3');
		this.showScore.checkScoreOnEnemy(this.scoreLine2, 'power4');

		let enemy = this.children.getAll('deck_id', this.enemyDeckId);
		let bar = this.children.getByName('bar1');
		let cardback = this.children.getByName('cardback1');
		if(!_.isEmpty(enemy)){
			this.enemyCardsOnTable = enemy;
		}
		if(bar && cardback){
			for(let i = 0; i<12; ++i){
				let barFind = this.children.getByName('bar' + i);
				barFind.destroy();
			}
		}
	}
}
