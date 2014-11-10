/// <reference path="references.ts" />

class Grid extends Phaser.Group implements Gettable<Tile> {
  public data:Tile[][];

  public constructor() {
    super(G.game);

    this.data = make2dArray(G.MAP_SIZE, undefined);
  }

  public get = (x:number, y:number):Tile => {
    return this.data[x][y];
  }
}