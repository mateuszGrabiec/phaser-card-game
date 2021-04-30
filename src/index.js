import Phaser from "phaser";
import Game from "./scenes/game";
import AwaitLoaderPlugin from 'phaser3-rex-plugins/plugins/awaitloader-plugin.js';


const config = {
    plugins: {
        global: [{
            key: 'rexAwaitLoader',
            plugin: AwaitLoaderPlugin,
            start: true
        }]
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
