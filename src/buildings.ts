/// <reference path="references.ts" />

class TownCenter extends Tile {
  constructor() {
    super("Town Center");

    this.pressZSignal.add(() => this.addUnit());
  }

  addUnit() {
    G.map.units.addUnitFromBuilding(this);
  }
}

class Buildings extends Grid {
  space: Phaser.Key;

  public constructor() {
    super();
  }

  public build = (xy:number[]) => {
    var x:number = xy[0];
    var y:number = xy[1];

    this.data[x][y] = new TownCenter();
    this.data[x][y].sprite = G.game.add.sprite(x * G.TILE_SIZE, y * G.TILE_SIZE, "buildings", 0);
  }
}
