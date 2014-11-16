/// <reference path="references.ts" />

class MiningInfo {
  miningResource:ResourceTile;
  miningDeposit:TerrainTile;

  resourcesCarried:number;
  timeLeftToMine:number;

  MAX_MINING_TIME:number = 100;
}

class Builder extends Unit {
  miningInfo:MiningInfo = new MiningInfo();

  buildingBeingBuilt:typeof Building = undefined;
  buildingDestination:Tile = undefined;

  constructor(x:number, y:number) {
    super(x, y);

    this.rightClickSignal.add((x:number, y:number) => this.move(x, y));

    this.pressZSignal.add(() => this.pressZ());
  }

  pressZ() {
    if (this.buildingBeingBuilt == undefined) {
      this.buildingBeingBuilt = MiningDeposit;
    } else {
      this.buildingDestination = G.map.getMousedOverTile();

      this.state = UnitState.Building_Walking;
      this.walkToTile(this.buildingDestination);

      // Pop off the final step, which is where the building will be built.
      this.currentPath.pop();
    }
  }

  move(x:number, y:number) {
    this.walkTo(x, y);

    if (G.map.hasTileOfTypeAt(x, y, ResourceTile)) {
      this.state = UnitState.Mining_Walking;

      this.miningInfo.miningResource = G.map.getTileOfTypeAt(x, y, ResourceTile);

      //TODO: broken
      this.miningInfo.miningDeposit = G.map.getTileOfTypeAt(Math.floor(this.sprite.x / G.TILE_SIZE), Math.floor(this.sprite.x / G.TILE_SIZE), TerrainTile);

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
        this.miningInfo.timeLeftToMine = this.miningInfo.MAX_MINING_TIME;
        break;
      case UnitState.Building_Walking:
        this.state = UnitState.Idle;

        G.map.buildings.build(this.buildingDestination.sprite.x / G.TILE_SIZE, this.buildingDestination.sprite.y / G.TILE_SIZE, this.buildingBeingBuilt);
        break;
      case UnitState.Mining_Returning:
        this.state = UnitState.Mining_Depositing;
        break;
      default:
        this.state = UnitState.Idle;
        break;
    }
  }

  walkStep() {
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
    this.miningInfo.timeLeftToMine--;

    if (this.miningInfo.timeLeftToMine <= 0) {
      this.walkToTile(this.miningInfo.miningDeposit);

      this.state = UnitState.Mining_Returning;
    }
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
      case UnitState.Building_Walking:
        this.walkStep();
        break;
    }
  }
}