/// <reference path="references.ts" />

class Building extends Tile {

  // the x and y coordinates here are really just to satisfy the type-checker.
  // the base class has no need for them, but all the subclasses need them
  // since they instantiate the sprite.
  constructor() {
    super();

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
    this.sprite = G.game.add.sprite(0, 0, "buildings", 0);
  }

  addUnit() {
    G.map.units.addUnitFromBuilding(this);
  }
}

class MiningDeposit extends Building {
  constructor() {
    super();

    this.tileName = "Mining Deposit";
    this.sprite = G.game.add.sprite(0, 0, "buildings", 1);
  }
}

class Buildings extends Grid {
  space: Phaser.Key;

  public constructor() {
    super();
  }

  public build = (x:number, y:number, tileType:typeof Building) => {
    var building:Building = new tileType();
    building.setLocation(x, y);

    this.data[x][y] = building;
  }
}
