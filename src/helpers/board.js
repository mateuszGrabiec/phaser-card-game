export default class Board {
    constructor(scene) {
        this.renderZone = (x, y) => {
            let dropZone = scene.add.zone(x, y, 800, 120).setRectangleDropZone(800, 120);
            dropZone.setData({ cards: 0 });
            return dropZone;
        };
        this.renderOutline = (dropZone, color) => {
            let dropZoneOutline = scene.add.graphics();
            dropZoneOutline.lineStyle(4, color);
            dropZoneOutline.strokeRect(dropZone.x - dropZone.input.hitArea.width / 2, dropZone.y - dropZone.input.hitArea.height / 2, dropZone.input.hitArea.width, dropZone.input.hitArea.height)
        }
        this.renderOutlineWithoutDropZone = (x,y,color, name) => {
            let dropZoneOutline = scene.add.graphics();
            dropZoneOutline.name = name
            let yCalc =  y - 120 / 2
            dropZoneOutline.lineStyle(4, color);
            dropZoneOutline.strokeRect(x - 800 / 2, yCalc, 800, 120)
            return yCalc + 60
        }
    }
}
