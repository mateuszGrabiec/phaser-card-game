var _ = require('lodash');

export default class ShowScore {
    constructor(scene) {
		this.scene = scene;
    }

	checkIfScoreIsActive(dataHolder, nameOfTextObject){
		if(!dataHolder.data.get('shield') && !dataHolder.data.get('power')){
			this.scene.children.getByName(nameOfTextObject).text = 0;
		}
		else{
			let scoreOfLine = dataHolder.data.get('shield') + dataHolder.data.get('power');
			this.scene.children.getByName(nameOfTextObject).text = scoreOfLine;
		}
	}
	checkScoreOnEnemy(dataArray, nameOfTextObject){
		if(_.isEmpty(dataArray)){
			this.scene.children.getByName(nameOfTextObject).text = 0;
		}
		else{
			let scoreOfLine = _.sum(dataArray);
			this.scene.children.getByName(nameOfTextObject).text = scoreOfLine;
		}

	}
}
