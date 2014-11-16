/// <reference path="references.ts" />

class Building extends Tile {

  // the x and y coordinates here are really just to satisfy the type-checker.
  // the base class has no need for them, but all the subclasses need them
  // since they instantiate the sprite.
  constructor(x:number, y:number) {
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
  constructor(x:number, y:number) {
    super(x, y);

    this.tileName = "Town Center";

    this.pressZSignal.add(() => this.addUnit());
    this.sprite = G.game.add.sprite(x * G.TILE_SIZE, y * G.TILE_SIZE, "buildings", 0);
  }

  addUnit() {
    G.map.units.addUnitFromBuilding(this);
  }
}

class MiningDeposit extends Building {
  constructor(x:number, y:number) {
    super(x, y);

    this.tileName = "Mining Deposit";
    this.sprite = G.game.add.sprite(x * G.TILE_SIZE, y * G.TILE_SIZE, "buildings", 1);
  }
}

class Buildings extends Grid {
  space: Phaser.Key;

  public constructor() {
    super();
  }

  public build = (x:number, y:number, tileType:typeof Building) => {
    this.data[x][y] = new tileType(x, y);
  }
}
