/// <reference path="references.ts" />

class G {
  static SCREEN_WIDTH:number = 800;
  static SCREEN_HEIGHT:number = 800;
  static MAP_SIZE:number = 100;
  static TILE_SIZE:number = 32;
  static CAMERA_PAN_SPEED:number = 10;

  static delta4:Point[] = [{x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 0}, {x: -1, y: 0}];

  static map:GameMap;
  static game:Phaser.Game;
  static bottomBar:BottomBar;
}

interface Point {
  x: number
  y: number
}

interface Gettable<T> {
  get:(x:number, y:number) => T;
}

function floodFill<T>(x:number, y:number, grid:Gettable<T>, criteria:(t:T) => boolean):Point[] {
  var flood:Point[] = [];
  var neighbors:Point[] = [{x: x, y: y}];
  var checked:boolean[][] = make2dArray(G.MAP_SIZE, false);

  checked[x][y] = true;

  while (neighbors.length > 0) {
    var current:Point = neighbors.shift();

    flood.push(current);

    for (var i = 0; i < G.delta4.length; i++) {
      var next:Point = {x: current.x + G.delta4[i].x, y: current.y + G.delta4[i].y};

      if (next.x < 0 || next.y < 0 || next.x >= G.MAP_SIZE || next.y >= G.MAP_SIZE) {
        continue;
      }

      if (checked[next.x][next.y]) {
        continue;
      }

      checked[next.x][next.y] = true;

      if (criteria(grid.get(next.x, next.y))) {
        neighbors.push(next);
      }
    }
  }

  return flood;
}

interface PathfindNode {
  p:Point
  score:number
}

function dist(p1:Point, p2:Point):number {
  return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
}

function pathfind<T>(start:Point, dest:Point, grid:Gettable<T>, criteria:(t:T) => boolean):Point[] {
  function p2s(point:Point):string { return point.x + "," + point.y; };

  var closest:PathfindNode[] = [{p:start, score:dist(start, dest)}];
  var backtrack:{[key: string]: Point} = {};
  backtrack[p2s(start)] = undefined;

  while (closest.length != 0) {
    var current:PathfindNode = closest.shift();

    if (current.p.x == dest.x && current.p.y == dest.y) break;

    for (var i = 0; i < G.delta4.length; i++) {
      var next:Point = {x: current.p.x + G.delta4[i].x, y: current.p.y + G.delta4[i].y};
      var hash = p2s(next);

      // TODO - may one way want to accomodate for different paths being faster.
      // the next line assumes that a newer path will never be faster than one we already found.
      if (hash in backtrack) continue;
      if (next.x < 0 || next.y < 0 || next.x >= G.MAP_SIZE || next.y >= G.MAP_SIZE) continue;
      if (!criteria(grid.get(next.x, next.y))) continue;

      backtrack[hash] = current.p;
      closest.push({p: next, score: dist(next, dest)});
    }

    closest = _.sortBy(closest, function(node:PathfindNode) { return node.score; });
  }

  var result:Point[] = [];
  var currentBacktrack:Point = backtrack[p2s(dest)];

  while (currentBacktrack.x != start.x || currentBacktrack.y != start.y) {
    result.push(currentBacktrack);
    currentBacktrack = backtrack[p2s(currentBacktrack)];
  }

  return result;
}

function make2dArray<T>(size:number, val:T):T[][] {
  var result = [];

  for (var i = 0; i < size; i++) {
    result[i] = [];

    for (var j = 0; j < size; j++) {
      result[i][j] = val;
    }
  }

  return result;
}

/*
class Minimap {
  // too slow
  graphics:Phaser.BitmapData;
  map:GameMap;

  public constructor(map:GameMap) {
    this.map = map;

    this.graphics = G.game.add.bitmapData(200, 200);

    this.fillInMinimap();

    this.graphics.setPixel(0, 0, 255, 0, 0, true);

    G.game.add.sprite(300, 300, this.graphics);
  }

  fillInMinimap() {
    for (var i = 0; i < this.map.mapwidth; i++) {
      for (var j = 0; j < this.map.mapheight; j++) {
        var val:number = this.map.get(i, j);
        var color:number = val * 60;

        this.graphics.setPixel(i, j, color, color, color);
      }
    }
  }
}
*/

interface Interactable {
  clickSignal:Phaser.Signal;
  unclickSignal:Phaser.Signal;

  rightClickSignal:Phaser.Signal;

  mouseEnterSignal:Phaser.Signal;
  mouseLeaveSignal:Phaser.Signal;
}

class Tile implements Interactable {
  public /*protected*/ tileName:string;
  public /*protected*/ actions:string[];
  public sprite:Phaser.Sprite;

  public clickSignal:Phaser.Signal = new Phaser.Signal();
  public unclickSignal:Phaser.Signal = new Phaser.Signal();

  public rightClickSignal:Phaser.Signal = new Phaser.Signal();

  public mouseEnterSignal:Phaser.Signal = new Phaser.Signal();
  public mouseLeaveSignal:Phaser.Signal = new Phaser.Signal();

  clicked:boolean = false;
  hoveredOver:boolean = false;

  constructor(tileName:string) {
    this.tileName = tileName;

    this.sprite = undefined;

    this.clickSignal.add(this.click);
    this.unclickSignal.add(this.unclick);

    this.mouseEnterSignal.add(this.hover);
    this.mouseLeaveSignal.add(this.unhover);
  }

  getTileName = ():string => {
    return this.tileName;
  }


  getActions = ():string[] => {
    return this.actions;
  }

  updateAlpha = () => {
    if (this.clicked || this.hoveredOver) {
      this.sprite.alpha = 0.5;
    } else {
      this.sprite.alpha = 1.0;
    }
  }

  click = () => {
    this.clicked = true;

    this.updateAlpha();
  }

  unclick = () => {
    this.clicked = false;

    this.updateAlpha();
  }

  hover = () => {
    this.hoveredOver = true;

    this.updateAlpha();
  }

  unhover = () => {
    this.hoveredOver = false;

    this.updateAlpha();
  }
}

class TerrainTile extends Tile {
  static types:string[] = [ "dirt", "grass", "sand", "water"];

  constructor(value:number) {
    super(TerrainTile.types[value]);
  }
}

class ResourceTile extends Tile {
  static types:string[] = ["ore", "trees", "marsh", "fish"];

  public constructor(value:number) {
    super(ResourceTile.types[value]);
  }
}

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

interface BuildingTileData {
  name:string
  actions:string[]
}

class TownCenter extends Tile {
  constructor() {
    super("Town Center");
  }
}

class Buildings extends Grid {
  space: Phaser.Key;

  public constructor() {
    super();
  }

  public build = (xy:number[]) => {
    var x:number = xy[0];
    var y:number = xy[1];

    this.data[x][y] = new TownCenter();
    this.data[x][y].sprite = G.game.add.sprite(x * G.TILE_SIZE, y * G.TILE_SIZE, "buildings", 0);
  }
}

class Terrain extends Grid {
  public constructor() {
    super();

    var data:number[][] = this.placeTerrain();

    while (!this.hasAllFourTiles(data)) {
      data = this.placeTerrain();
    }

    // convert grid data values into TerrainTiles
    for (var i = 0; i < G.MAP_SIZE; i++) {
      for (var j = 0; j < G.MAP_SIZE; j++) {
        var x:number = i * G.TILE_SIZE;
        var y:number = j * G.TILE_SIZE;

        this.data[i][j] = new TerrainTile(data[i][j]);
        this.data[i][j].sprite = G.game.add.sprite(x, y, "tiles", data[i][j]);
      }
    }
  }

  /*
  bleh = (x:string) => {
    var q = x.charAt(0);
  }

  TODO... https://typescript.codeplex.com/workitem/2215

  */

  hasAllFourTiles(data:number[][]):boolean {
    var hasTileType:boolean[] = [false, false, false, false];

    for (var i = 0; i < G.MAP_SIZE; i++) {
      for (var j = 0; j < G.MAP_SIZE; j++) {
        hasTileType[data[i][j]] = true;
      }
    }

    for (var i = 0; i < 4; i++) {
      if (!hasTileType[i]) {
        return false;
      }
    }

    return true;
  }

  placeTerrain():number[][] {
    var data:number[][] = this.generateTerrain(10);
    data = this.normalizeGrid(data);
    data = this.quantizeGrid(data, 4);

    return data;
  }

  quantizeGrid(data:number[][], options:number):number[][] {
    var result:number[][] = make2dArray(data.length, 0);

    for (var i = 0; i < G.MAP_SIZE; i++) {
      for (var j = 0; j < G.MAP_SIZE; j++) {
        result[i][j] = Math.floor(data[i][j] * options);
      }
    }

    return result;
  }

  normalizeGrid(data:number[][]):number[][] {
    var result:number[][] = make2dArray(data.length, 0);

    var min:number = Number.POSITIVE_INFINITY;
    var max:number = Number.NEGATIVE_INFINITY;

    for (var i = 0; i < G.MAP_SIZE; i++) {
      for (var j = 0; j < G.MAP_SIZE; j++) {
        var val:number = data[i][j];

        // We want the values of grid to start at 0 and go all the way up to, but not include, 1.
        // So we add an infinitesmal amount to the max, so that when we normalize the result comes
        // just under 1.
        if (val > max) max = val + 0.0001;
        if (val < min) min = val;
      }
    }

    for (var i = 0; i < G.MAP_SIZE; i++) {
      for (var j = 0; j < G.MAP_SIZE; j++) {
        result[i][j] = (data[i][j] - min) / (max - min);
      }
    }

    return result;
  }

  generateTerrain(smoothness:number):number[][] {
    var grid:number[][] = make2dArray(G.MAP_SIZE, 1);

    for (var iteration = 0; iteration < smoothness; iteration++) {
      for (var i = 0; i < G.MAP_SIZE; i++) {
        for (var j = 0; j < G.MAP_SIZE; j++) {
          var neighborScores:number = 0;
          var neighbors:number = 0;

          for (var k = 0; k < G.delta4.length; k++) {
            var new_i:number = i + G.delta4[k].x;
            var new_j:number = j + G.delta4[k].y;
            if (new_i < 0 || new_i >= grid.length || new_j < 0 || new_j >= grid[0].length) continue;
            neighborScores += grid[new_i][new_j];
            neighbors++;
          }

          grid[i][j] = (neighborScores / neighbors) + (6 * Math.random() - 3) / (iteration + 1)
        }
      }
    }

    return grid;
  }
}

class Resources extends Grid {
  terrain:Terrain;

  public constructor(terrain:Terrain) {
    super();

    this.terrain = terrain;

    this.placeResources();
  }

  placeResources() {
    var hasBeenReached:boolean[][] = make2dArray(G.MAP_SIZE, false);
    var groups:{[key: string]: Point[][]} = {};
    var self:Resources = this;

    for (var i = 0; i < G.MAP_SIZE; i++) {
      for (var j = 0; j < G.MAP_SIZE; j++) {
        if (hasBeenReached[i][j]) {
          continue;
        }

        var tileName = this.terrain.get(i, j).tileName;
        var fill:Point[] = floodFill(i, j, this.terrain, (t:Tile) => {
          return t.tileName == tileName;
        });

        for (var k = 0; k < fill.length; k++) {
          hasBeenReached[fill[k].x][fill[k].y] = true;
        }

        if (!(tileName in groups)) {
          groups[tileName] = [];
        }

        groups[tileName].push(fill);
      }
    }

    var largestGroups:{[key:string]: Point[]} = {};

    for (var i:number = 0; i < TerrainTile.types.length; i++) {
      var maxIndex:number = 0;
      var type:string = TerrainTile.types[i];

      for (var j = 0; j < groups[type].length; j++) {
        if (groups[type][j].length > groups[type][maxIndex].length) {
          maxIndex = j;
        }
      }

      largestGroups[i] = groups[type][maxIndex];
    }

    for (var i = 0; i < TerrainTile.types.length; i++) {
      for (var j = 0; j < Math.min(largestGroups[i].length, 20); j++) {
        var p:Point = largestGroups[i][j];

        this.data[p.x][p.y] = new ResourceTile(i);
        this.data[p.x][p.y].sprite = G.game.add.sprite(p.x * 32, p.y * 32, "special", i);
      }
    }
  }
}

class UnitLayer extends Phaser.Group {
  units:Unit[];

  public constructor() {
    super(G.game);

    G.game.add.existing(this);

    this.units = [];
  }

  public addUnit(from:Tile, type:number = 0) {
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

    var unit:Unit = new Unit(destination.x * G.TILE_SIZE, destination.y * G.TILE_SIZE);

    this.add(unit.sprite);

    this.units.push(unit);
  }
}

enum UnitState {
  Idle,
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

  public constructor(x:number, y:number) {
    super("Unit");

    var unitSprite:UnitSprite = new UnitSprite(x, y);
    this.sprite = unitSprite;

    this.rightClickSignal.add((x:number, y:number) => this.move(x, y));

    unitSprite.updateSignal.add(() => this.update());
  }

  move(x:number, y:number) {
    var here:Point = {x: this.sprite.x / G.TILE_SIZE, y: this.sprite.y / G.TILE_SIZE};
    var dest:Point = {x: x, y: y};

    var path:Point[] = pathfind(here, dest, G.map, function(t:Tile[]) {
      return _.chain(t).pluck("tileName").contains("grass").value();
    });

    for (var i = 0; i < path.length; i++) {
      G.game.add.sprite(path[i].x * 32, path[i].y * 32, "units", 0);
    }

    this.currentPath = path;
  }

  walk() {
    console.log("walkin");
  }

  update() {
    switch (this.state) {
      case UnitState.Idle:
        if (this.currentPath.length !== 0) {
          this.state = UnitState.Walking;
        }

        break;
      case UnitState.Walking:
        this.walk();
    }
  }
}

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

    G.game.input.onUp.add(this.mouseUp, this);

    this.zbutton = G.game.input.keyboard.addKey(Phaser.Keyboard.Z);
    this.zbutton.onUp.add(() => this.pressZ());
  }

  // TODO I'm sure there's a better way to type this...
  // (esp bc tileType has to be a Tile subclass. fun)
  public getTileOfTypeAt(x:number, y:number, tileType:any) {
    var tiles:Tile[] = this.get(x, y);

    for (var i = 0; i < tiles.length; i++) {
      if (tiles[i] instanceof tileType) {
        return tiles[i];
      }
    }

    return undefined;
  }

  public isEmpty(x:number, y:number):boolean {
    return this.get(x, y).length == 1;
  }

  public getTopmostTileAt(x:number, y:number):Tile {
    var results:Tile[] = this.get(x, y);

    return results[0];
  }

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

    // Will likely never happen.
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
    var x = this.selectedTile.sprite.x / G.TILE_SIZE;
    var y = this.selectedTile.sprite.y / G.TILE_SIZE;

    if (this.selectedTile.getTileName() == "grass") {
      this.buildings.build([x, y]);
    } else if (this.selectedTile.getTileName() == "Town Center") {
      this.units.addUnit(this.selectedTile);
    }
  }

  public mouseUp() {
    var mx = G.game.input.worldX;
    var my = G.game.input.worldY;

    var tile:Tile = this.layers[0].get(Math.floor(mx / G.TILE_SIZE), Math.floor(my / G.TILE_SIZE));

    //G.bottomBar.model.setHeading('Terrain: ' + tile.getTileName());
    //G.bottomBar.model.setActions(tile.getActions());
  }

  public update() {
    var mxy = this.getXY();
    var tile = this.getTopmostTileAt(mxy[0], mxy[1]);

    if (tile != this.mousedOverTile) {
      tile.mouseEnterSignal.dispatch();
      if (this.mousedOverTile) this.mousedOverTile.mouseLeaveSignal.dispatch();

      this.mousedOverTile = tile;
    }

    if (G.game.input.mouse.button === Phaser.Mouse.LEFT_BUTTON) {
      if (tile != this.selectedTile) {
        if (this.selectedTile) this.selectedTile.unclickSignal.dispatch();
        tile.clickSignal.dispatch();

        this.selectedTile = tile;
      }
    }

    if (G.game.input.mouse.button === Phaser.Mouse.RIGHT_BUTTON) {
      if (this.selectedTile) this.selectedTile.rightClickSignal.dispatch(mxy[0], mxy[1]);
    }
  }
}

class MainState extends Phaser.State {
  groups: {[key: string]: Phaser.Group} = {};
  cursors: Phaser.CursorKeys;
  map:GameMap;
  shift:Phaser.Key;

  public preload():void {
    //fw, fh, num frames,
    this.load.spritesheet("tiles", "assets/tiles.png", 32, 32);
    this.load.spritesheet("units", "assets/units.png", 32, 32);
    this.load.spritesheet("special", "assets/special.png", 32, 32);
    this.load.spritesheet("buildings", "assets/buildings.png", 32, 32);
  }

  public init():void {
    this.cursors = this.game.input.keyboard.createCursorKeys();
    this.game.world.setBounds(0, 0, G.MAP_SIZE * 32, G.MAP_SIZE * 32);

    G.game.canvas.oncontextmenu = (e) => { e.preventDefault(); };
  }

  public create():void {
    this.map = new GameMap();

    G.map = this.map;

    this.shift = G.game.input.keyboard.addKey(Phaser.Keyboard.SHIFT);

    // this.minimap = new Minimap(this.map);
  }

  public update():void {
    var speedMod:number = 1;

    if (this.shift.isDown) {
      speedMod = 4;
    }

    // G.game.input.keyboard.isDown("keycode: number")

    if (this.cursors.up.isDown) {
      this.game.camera.y -= G.CAMERA_PAN_SPEED * speedMod;
    } else if (this.cursors.down.isDown) {
      this.game.camera.y += G.CAMERA_PAN_SPEED * speedMod;
    }

    if (this.cursors.left.isDown) {
      this.game.camera.x -= G.CAMERA_PAN_SPEED * speedMod;
    } else if (this.cursors.right.isDown) {
      this.game.camera.x += G.CAMERA_PAN_SPEED * speedMod;
    }
  }
}

class Game {
  state: Phaser.State;

  constructor() {
    this.state = new MainState();
    G.game = new Phaser.Game(G.SCREEN_WIDTH, G.SCREEN_HEIGHT, Phaser.WEBGL, "main", this.state);

    G.bottomBar = new BottomBar();
  }
}

class BottomBar {
  public model:BottomBarModel;
  view:BottomBarView;

  constructor() {
    this.model = new BottomBarModel({
      heading: "yolo",
      actions: []
    });

    this.view = new BottomBarView({
      el: $("#bottom-bar"),
      model: this.model
    });

    this.view.listenTo(this.model, 'change', this.view.render);
  }
}

class BottomBarModel extends Backbone.Model {
  setHeading(heading:string):void {
    this.set('heading', heading);
  }

  getHeading():string {
    return this.get('heading');
  }

  setActions(actions:string[]):void {
    var actionModels:ActionModel[] = [];

    for (var i = 0; i < actions.length; i++) {
      var model:ActionModel = new ActionModel();

      model.setAction(actions[i]);
      actionModels.push(model);
    }

    this.set('actions', actionModels);
  }

  getActions():ActionModel[] {
    return this.get('actions');
  }
}

class ActionModel extends Backbone.Model {
  setAction(action:string) {
    this.set("action", action);
  }

  getAction():string {
    return this.get('action');
  }
}

class BottomBarView extends Backbone.View<BottomBarModel> {
  template:(...data:any[]) => string; // can't set value here, because initialize is called BEFORE constructor (!)

  initialize() {
    this.template = _.template($("#bottom-bar-template").html());

    this.render();
  }

  render() {
    this.$el.html(this.template(this.model.toJSON()));

    var actions:ActionModel[] = this.model.getActions();

    for (var i = 0; i < actions.length; i++) {
      var button:ActionButton = new ActionButton({
        el: $("<div>").appendTo(this.$(".actions")),
        model: actions[i]
      });

      button.render();
    }

    return this;
  }
}

class ActionButton extends Backbone.View<ActionModel> {
  template:(...data:any[]) => string;

  constructor (options? ) {
    super(options);

    this.template = _.template($("#action-button").html());
  }

  events() {
    return {
      "click button": "click"
    };
  }

  click(e) {
    console.log(this.model.toJSON())

    Backbone.trigger("ff");

    return false;
  }

  render() {
    var self = this;

    this.$el.html(this.template(this.model.toJSON()));

    this.$("button").on("click", function() {
      console.log(self.model.toJSON());
    });

    return this;
  }
}

$(function() {
  new Game();
})
