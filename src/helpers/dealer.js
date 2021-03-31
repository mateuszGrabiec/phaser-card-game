import axios from "axios";

export default class dealCards {
    constructor(scene) {
        this.deal =  () => {
            axios({
                url: 'http://ec2-54-93-53-2.eu-central-1.compute.amazonaws.com/api/card',
                method: 'get',
                headers: {
                    "Access-Control-Allow-Origin": '*'
                }
            }).then(r => {
                scene.load.json('cardJson', r);
            });
        }
    }
}
