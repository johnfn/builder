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

  currentPathQueue:Point[] = [];
  speed:number = 4;

  public constructor() {
    super();

    var unitSprite:UnitSprite = new UnitSprite(0, 0);
    this.sprite = unitSprite;

    unitSprite.updateSignal.add(() => this.update());
  }

  public setLocation(x:number, y:number) {
    this.sprite.x = x;
    this.sprite.y = y;
  }

  // Walk to tile and stand on it.
  walkOn(x:number, y:number) {
    this.currentPathQueue = this.pathTo(x, y);
  }

  walkOnTile(t:Tile) {
    this.walkOn(Math.floor(t.sprite.x / G.TILE_SIZE), Math.floor(t.sprite.y / G.TILE_SIZE));
  }

  // Walk to tile, but don't stand on it.
  walkToTile(t:Tile) {
    this.walkOnTile(t);

    this.currentPathQueue.shift();
  }

  walkTo(x:number, y:number) {
    this.walkOn(x, y);

    this.currentPathQueue.shift();
  }

  pathToTile(t:Tile) {
    return this.pathTo(Math.floor(t.sprite.x / G.TILE_SIZE), Math.floor(t.sprite.y / G.TILE_SIZE));
  }

  pathTo(x:number, y:number):Point[] {
    var here:Point = {x: Math.floor(this.sprite.x / G.TILE_SIZE), y: Math.floor(this.sprite.y / G.TILE_SIZE)};
    var dest:Point = {x: x, y: y};

    return pathfind(here, dest, G.map, function(t:Tile[]):boolean {
      if (!_.chain(t).pluck("tileName").contains("grass").value()) {
        return false;
      }

      for (var i = 0; i < t.length; i++) {
        if (t[i] instanceof Building) return false;
      }

      return true;
    });
  }

  public update() {

  }
}
