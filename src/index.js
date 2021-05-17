import Phaser from 'phaser';
import Game from './scenes/game';
import AwaitLoaderPlugin from 'phaser3-rex-plugins/plugins/awaitloader-plugin.js';
import WaitEventsPlugin from 'phaser3-rex-plugins/plugins/waitevents-plugin.js';
import ClockPlugin from 'phaser3-rex-plugins/plugins/clock-plugin.js';



const config = {
    plugins: {
        global: [{
            key: 'rexAwaitLoader',
            plugin: AwaitLoaderPlugin,
            start: true
        },
		{
            key: 'rexWaitEvents',
            plugin: WaitEventsPlugin,
            start: true
        },
		{
            key: 'rexClock',
            plugin: ClockPlugin,
            start: true
        },
	]
    },
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'game-card',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 780
    },
    scene: [
        Game
    ]
};

const game = new Phaser.Game(config);
