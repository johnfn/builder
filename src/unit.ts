/// <reference path="references.ts" />

enum UnitState {
  Idle,
  Mining_Walking,
  Mining_Gathering,
  Mining_Returning,
  Mining_Depositing,
  Walking,
  Building_Walking
}

// Really the only reason this exists is so I can override update, but eh.
// I'm sure I'll think of another reason for it someday.
class UnitSprite extends Phaser.Sprite {
  public updateSignal:Phaser.Signal = new Phaser.Signal();

  constructor(x:number, y:number) {
    super(G.game, x, y, "units", 0);

    G.game.add.existing(this);
  }

  update() {
    this.updateSignal.dispatch();
  }
}

// Base unit class.
class Unit extends Tile {
  state:UnitState = UnitState.Idle;

  currentPath:Point[] = [];
  speed:number = 4;

  public constructor(x:number, y:number) {
    super("Unit");

    var unitSprite:UnitSprite = new UnitSprite(x, y);
    this.sprite = unitSprite;

    unitSprite.updateSignal.add(() => this.update());
  }

  walkToTile(t:Tile) {
    this.walkTo(Math.floor(t.sprite.x / G.TILE_SIZE), Math.floor(t.sprite.y / G.TILE_SIZE));
  }

  walkTo(x:number, y:number) {
    var here:Point = {x: Math.floor(this.sprite.x / G.TILE_SIZE), y: Math.floor(this.sprite.y / G.TILE_SIZE)};
    var dest:Point = {x: x, y: y};

    this.currentPath = pathfind(here, dest, G.map, function(t:Tile[]) {
      return _.chain(t).pluck("tileName").contains("grass").value();
    });
  }

  public update() {

  }
}
