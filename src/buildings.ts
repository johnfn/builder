/// <reference path="references.ts" />

class Building extends Tile {
  constructor() {
    super("");

    this.clickSignal.add(() => this.updateBottomBar());
  }

  public updateBottomBar() {
    G.bottomBar.model.setHeading(this.tileName);
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

  public build = (x:number, y:number, tileType:typeof Building) => {
    this.data[x][y] = new tileType();
    this.data[x][y].sprite = G.game.add.sprite(x * G.TILE_SIZE, y * G.TILE_SIZE, "buildings", 0);
  }
}
