/// <reference path="references.ts" />

class MiningInfo {
  miningResource:ResourceTile;

  resourcesCarried:number;
  timeLeftToMine:number;

  MAX_MINING_TIME:number = 10;
}

class Builder extends Unit {
  miningInfo:MiningInfo = new MiningInfo();

  buildingBeingBuilt:typeof Building = undefined;
  buildingDestination:Tile = undefined;

  constructor() {
    super();

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
      this.currentPathQueue.shift();
    }
  }

  findNearestMiningDeposit():MiningDeposit {
    var self:Builder = this;

    var allDeposits:MiningDeposit[] = G.map.getAllTilesOfType(MiningDeposit);
    var deposits = _.sortBy(allDeposits, (deposit:MiningDeposit) => {
      return self.pathToTile(deposit).length;
    });

    return deposits[0];
  }

  move(x:number, y:number) {
    this.walkTo(x, y);

    if (G.map.hasTileOfTypeAt(x, y, ResourceTile)) {
      this.state = UnitState.Mining_Walking;

      this.miningInfo.miningResource = G.map.getTileOfTypeAt(x, y, ResourceTile);

      // Pop off the final step, which would have been on top of the resource.
      this.currentPathQueue.shift();
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
        G.map.buildings.build(this.buildingDestination.sprite.x / G.TILE_SIZE, this.buildingDestination.sprite.y / G.TILE_SIZE, this.buildingBeingBuilt);

        this.state = UnitState.Idle;
        this.buildingBeingBuilt = undefined;
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
    var p:Point = _.last(this.currentPathQueue);
    var nextDest:Point = _.clone(p);

    nextDest.x *= G.TILE_SIZE;
    nextDest.y *= G.TILE_SIZE;

    if (this.sprite.x == nextDest.x && this.sprite.y == nextDest.y) {
      this.currentPathQueue.pop();
    }

    if (this.currentPathQueue.length == 0) {
      this.finishedWalkingStateTransition();

      return;
    }

    this.sprite.x += this.speed * Phaser.Math.sign(nextDest.x - this.sprite.x);
    this.sprite.y += this.speed * Phaser.Math.sign(nextDest.y - this.sprite.y);
  }

  deposit() {
    // do something cool

    this.walkToTile(this.miningInfo.miningResource);
    // Pop off the final step, which would have been on top of the resource.
    this.currentPathQueue.shift();

    this.state = UnitState.Mining_Walking;
  }

  gather() {
    this.miningInfo.timeLeftToMine--;

    if (this.miningInfo.timeLeftToMine <= 0) {
      var miningDepositDestination:MiningDeposit = this.findNearestMiningDeposit();

      if (miningDepositDestination == undefined) {
        this.state = UnitState.Idle;

        console.error("No mining deposit");

        return;
      }

      this.walkToTile(miningDepositDestination);
      this.currentPathQueue.shift();

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
      case UnitState.Mining_Depositing:
        this.deposit();
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