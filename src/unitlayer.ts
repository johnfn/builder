/// <reference path="references.ts" />

class UnitLayer extends Phaser.Group {
  units:Unit[];

  public constructor() {
    super(G.game);

    G.game.add.existing(this);

    this.units = [];
  }

  public addUnitFromBuilding(from:Tile, type:number = 0) {
    var x:number = from.sprite.x / G.TILE_SIZE;
    var y:number = from.sprite.y / G.TILE_SIZE;

    var starter:Tile = G.map.getTileOfTypeAt(x, y, TerrainTile);

    // Find a place to place the unit...

    var fill:Point[] = floodFill(x, y, G.map, (t:Tile[]) => {
      return _.chain(t).pluck("tileName").contains(starter.tileName).value();
    });

    // That isn't covered by anything.
    var destination:Point = undefined;

    for (var i = 0; i < fill.length; i++) {
      if (G.map.isEmpty(fill[i].x, fill[i].y)) {
        destination = fill[i];

        break;
      }
    }

    this.addUnit(destination.x * G.TILE_SIZE, destination.y * G.TILE_SIZE, Builder);
  }

  // Directly add a unit
  addUnit(x:number, y:number, unitClass:typeof Unit) {
    var unit:Unit = new unitClass();
    unit.setLocation(x, y);

    this.add(unit.sprite);
    this.units.push(unit);
  }
}
