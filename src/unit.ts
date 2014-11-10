/// <reference path="references.ts" />

enum UnitState {
  Idle,
  Mining_Walking,
  Mining_Gathering,
  Mining_Returning,
  Mining_Depositing,
  Walking
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

class Unit extends Tile {
  state:UnitState = UnitState.Idle;

  currentPath:Point[] = [];
  speed:number = 4;

  // Mining
  miningResource:ResourceTile;
  miningDeposit:TerrainTile;

  public constructor(x:number, y:number) {
    super("Unit");

    var unitSprite:UnitSprite = new UnitSprite(x, y);
    this.sprite = unitSprite;

    this.rightClickSignal.add((x:number, y:number) => this.move(x, y));

    unitSprite.updateSignal.add(() => this.update());
  }

  move(x:number, y:number) {
    var here:Point = {x: (this.sprite.x / G.TILE_SIZE), y: (this.sprite.y / G.TILE_SIZE)};
    var dest:Point = {x: x, y: y};

    var path:Point[] = pathfind(here, dest, G.map, function(t:Tile[]) {
      return _.chain(t).pluck("tileName").contains("grass").value();
    });

    this.currentPath = path;

    if (G.map.hasTileOfTypeAt(x, y, ResourceTile)) {
      this.state = UnitState.Mining_Walking;

      this.miningResource = G.map.getTileOfTypeAt(dest.x, dest.y, ResourceTile);
      this.miningDeposit = G.map.getTileOfTypeAt(here.x, here.y, TerrainTile);

      // Pop off the final step, which would have been on top of the resource.
      this.currentPath.pop();
    } else {
      this.state = UnitState.Walking;
    }
  }

  finishedWalkingStateTransition() {
    switch (this.state) {
      case UnitState.Mining_Walking:
        this.state = UnitState.Mining_Gathering;
        break;
      case UnitState.Mining_Returning:
        this.state = UnitState.Mining_Depositing;
        break;
      default:
        this.state = UnitState.Idle;
        break;
    }
  }

  walk() {
    var p:Point = this.currentPath[this.currentPath.length - 1];
    var nextDest:Point = {x: p.x, y: p.y}; // clone
    nextDest.x *= G.TILE_SIZE;
    nextDest.y *= G.TILE_SIZE;

    if (this.sprite.x == nextDest.x && this.sprite.y == nextDest.y) {
      this.currentPath.pop();
    }

    if (this.currentPath.length == 0) {
      this.finishedWalkingStateTransition();

      return;
    }

    this.sprite.x += this.speed * Phaser.Math.sign(nextDest.x - this.sprite.x);
    this.sprite.y += this.speed * Phaser.Math.sign(nextDest.y - this.sprite.y);
  }

  gather() {
    console.log("gathering");
  }

  update() {
    switch (this.state) {
      case UnitState.Idle:
        break;
      case UnitState.Mining_Gathering:
        this.gather();
        break;
      case UnitState.Walking:
      case UnitState.Mining_Returning:
      case UnitState.Mining_Walking:
        this.walk();
        break;
    }
  }
}
