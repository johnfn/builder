/// <reference path="references.ts" />

class Building extends Tile {
  constructor() {
    super("");
  }

  public build() {

  }
}

class TownCenter extends Building {
  constructor() {
    super();

    this.tileName = "Town Center";

    this.pressZSignal.add(() => this.addUnit());
  }

  addUnit() {
    G.map.units.addUnitFromBuilding(this);
  }
}

class MiningDeposit extends Building {
  constructor() {
    super();

    this.tileName = "Mining Deposit";
  }
}

class Buildings extends Grid {
  space: Phaser.Key;

  public constructor() {
    super();
  }

  public build = (xy:number[], tileType:typeof Building) => {
    var x:number = xy[0];
    var y:number = xy[1];

    this.data[x][y] = new tileType();
    this.data[x][y].sprite = G.game.add.sprite(x * G.TILE_SIZE, y * G.TILE_SIZE, "buildings", 0);
  }
}
