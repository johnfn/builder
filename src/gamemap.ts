/// <reference path="references.ts" />

class GameMap extends Phaser.Group implements Gettable<Tile[]> {
  layers:Grid[] = [];

  terrain:Terrain;
  resources:Resources;
  buildings:Buildings;

  units:UnitLayer;

  zbutton:Phaser.Key;

  mousedOverTile:Tile;
  selectedTile:Tile;

  public constructor() {
    super(G.game);

    this.terrain = new Terrain();
    this.resources = new Resources(this.terrain);
    this.buildings = new Buildings();

    this.layers.push(this.terrain);
    this.layers.push(this.resources);
    this.layers.push(this.buildings);

    this.units = new UnitLayer();

    G.game.input.onDown.add(this.mouseDown, this);

    this.zbutton = G.game.input.keyboard.addKey(Phaser.Keyboard.Z);
    this.zbutton.onUp.add(() => this.pressZ());
  }

  public getMousedOverTile() {
    return this.mousedOverTile;
  }

  public getAllTilesOfType<T extends Tile>(tileType: {new(): T;} ):T[] {
    var result:T[] = []

    for (var i = 0; i < G.MAP_SIZE; i++) {
      for (var j = 0; j < G.MAP_SIZE; j++) {
        var tile = this.getTileOfTypeAt(i, j, tileType);

        if (tile !== undefined) {
          result.push(tile);
        }
      }
    }

    return result;
  }

  // TODO I'm sure there's a better way to type this...
  // (esp bc tileType has to be a Tile subclass. fun)
  // TODO THIS MAKES NO SENSE WHY CANT IT BE typeof Tile ALKDJFHLKJHL
  public getTileOfTypeAt<T extends Tile>(x:number, y:number, tileType: {new(): T;}):T {
    var tiles:Tile[] = this.get(x, y);

    for (var i = 0; i < tiles.length; i++) {
      if (tiles[i] instanceof tileType) {
        return <T> tiles[i];
      }
    }

    return undefined;
  }

  public hasTileOfTypeAt(x:number, y:number, tileType:any):boolean {
    return this.getTileOfTypeAt(x, y, tileType) !== undefined;
  }

  public isEmpty(x:number, y:number):boolean {
    return this.get(x, y).length == 1;
  }

  public getTopmostTileAt(x:number, y:number):Tile {
    var results:Tile[] = this.get(x, y);

    return results[0];
  }

  // get all the tiles at a specific coordinate.
  public get(x:number, y:number):Tile[] {
    var result:Tile[] = [];

    // TODO pass through, use some sort of generic collision
    // TODO needs to be quite a bit more decoupled...
    for (var i = 0; i < this.units.units.length; i++) {
      var unit:Unit = this.units.units[i];

      if (unit.sprite.x == x * 32 && unit.sprite.y == y * 32) {
        result.push(unit);
      }
    }

    for (var i = 0; i < this.layers.length; i++) {
      var layer:Grid = this.layers[this.layers.length - i - 1];

      if (layer.data[x][y] && layer.data[x][y].sprite) {
        result.push(layer.data[x][y]);
      }
    }

    // Will likely never happen. //TODO what am i talking about... lol
    return result;

  }

  getXY():number[] {
    var mx_abs = G.game.input.x;
    var my_abs = G.game.input.y;

    if (mx_abs > G.SCREEN_WIDTH || my_abs > G.SCREEN_WIDTH) {
      return;
    }

    var mx = G.game.input.worldX;
    var my = G.game.input.worldY;

    var x = Math.floor(mx / G.TILE_SIZE);
    var y = Math.floor(my / G.TILE_SIZE);

    return [x, y];
  }

  pressZ() {
    this.selectedTile.pressZSignal.dispatch();

    var x = this.selectedTile.sprite.x / G.TILE_SIZE;
    var y = this.selectedTile.sprite.y / G.TILE_SIZE;

    if (this.selectedTile.getTileName() == "grass") {
      this.buildings.build(x, y, TownCenter);
    }
  }

  public mouseDown() {
    var mx = Math.floor(G.game.input.worldX / G.TILE_SIZE);
    var my = Math.floor(G.game.input.worldY / G.TILE_SIZE);
    var tile = this.getTopmostTileAt(mx, my);

    if (G.game.input.mouse.button === Phaser.Mouse.LEFT_BUTTON) {
      if (tile != this.selectedTile) {
        if (this.selectedTile) this.selectedTile.unclickSignal.dispatch();
        tile.clickSignal.dispatch();

        this.selectedTile = tile;
      }
    }

    if (G.game.input.mouse.button === Phaser.Mouse.RIGHT_BUTTON) {
      if (this.selectedTile) this.selectedTile.rightClickSignal.dispatch(mx, my);
    }
  }

  public update() {
    var mx = Math.floor(G.game.input.worldX / G.TILE_SIZE);
    var my = Math.floor(G.game.input.worldY / G.TILE_SIZE);
    var tile = this.getTopmostTileAt(mx, my);

    if (tile != this.mousedOverTile) {
      tile.mouseEnterSignal.dispatch();
      if (this.mousedOverTile) this.mousedOverTile.mouseLeaveSignal.dispatch();

      this.mousedOverTile = tile;
    }

  }
}