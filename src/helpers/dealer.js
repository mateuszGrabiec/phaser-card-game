import axios from "axios";
import 'regenerator-runtime/runtime';

export default class dealCards {
    constructor(scene) {
        this.scene = scene
    }
    async deal() {
        await axios({
            url: 'http://localhost:3000/card',
            method: 'get',
            headers: {
                "Access-Control-Allow-Origin": '*'
            }
        }).then(r => {
            this.scene.load.json('card', r);
        }).catch(err=>{
            console.log(err);
        });
    }
}
