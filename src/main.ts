/// <reference path="references.ts" />

class G {
  static SCREEN_WIDTH:number = 800;
  static SCREEN_HEIGHT:number = 800;
  static MAP_SIZE:number = 100;
  static TILE_SIZE:number = 32;
  static CAMERA_PAN_SPEED:number = 10;

  static delta4:Point[] = [{x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 0}, {x: -1, y: 0}];

  static game:Phaser.Game;
  static bottomBar:BottomBar;
}

interface Point {
  x: number
  y: number
}

function floodFill(x:number, y:number, type:string, grid:Grid):Point[] {
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

      if (grid.get(next.x, next.y).tileName == type) {
        neighbors.push(next);
      }
    }
  }

  return flood;
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

class Tile {
  public /*protected*/ tileName:string;
  public /*protected*/ actions:string[];

  constructor(tileName:string, actions:string[]) {
    this.tileName = tileName;
    this.actions = actions;
  }

  getTileName():string {
    return this.tileName;
  }

  getActions():string[] {
    return this.actions;
  }
}

interface TerrainTileInfo {
  name:string
  actions:string[]
}

class TerrainTile extends Tile {
  static types:TerrainTileInfo[] = [
    {name: "dirt",  actions: ["build thing"]},
    {name: "grass", actions: []},
    {name: "sand",  actions: []},
    {name: "water", actions: []}];

  constructor(value:number) {
    super(TerrainTile.types[value].name, TerrainTile.types[value].actions);
  }
}

class ResourceTile extends Tile {
  static types:string[] = ["ore", "trees", "marsh", "fish"];

  public constructor(value:number) {
    super(ResourceTile.types[value], []);
  }
}

class Grid extends Phaser.Group {
  grid:Tile[][];
  tiles: Phaser.Sprite[][];

  public constructor() {
    this.grid = make2dArray(G.MAP_SIZE, undefined);
    this.tiles = make2dArray(G.MAP_SIZE, undefined);

    super(G.game);
  }

  public get(x:number, y:number):Tile {
    return this.grid[x][y];
  }
}

interface BuildingTileData {
  name:string
  actions:string[]
}

class BuildingTile extends Tile {
  static types:BuildingTileData[] = [
    {name: "Town Center", actions: []}
  ]

  constructor(value:number) {
    super(BuildingTile.types[value].name, BuildingTile.types[value].actions);
  }
}

class Buildings extends Grid {
  public constructor() {
    super();
  }
}

class Terrain extends Grid {
  mousedOverTile:Phaser.Sprite;
  selectedTile:Phaser.Sprite;

  public constructor() {
    super();

    var data:number[][] = this.placeTerrain();

    while (!this.hasAllFourTiles(data)) {
      data = this.placeTerrain();
    }

    // convert grid data values into TerrainTiles
    for (var i = 0; i < G.MAP_SIZE; i++) {
      for (var j = 0; j < G.MAP_SIZE; j++) {
        this.grid[i][j] = new TerrainTile(data[i][j]);
      }
    }
  }

  // TODO:: This crap should not be inside Terrain.
  public update() {
    // mouse position, not relative to camera.
    var mx = G.game.input.worldX;
    var my = G.game.input.worldY;

    var tilex:number = Math.floor(mx / 32);
    var tiley:number = Math.floor(my / 32);

    var tile:Phaser.Sprite = this.tiles[tilex][tiley];

    if (tile != this.mousedOverTile) {
      if (this.mousedOverTile && this.mousedOverTile != this.selectedTile) this.mousedOverTile.alpha = 1.0;

      this.mousedOverTile = tile;
      this.mousedOverTile.alpha = 0.5;
    }

    if (G.game.input.mouse.button !== Phaser.Mouse.NO_BUTTON) {
      if (tile != this.selectedTile) {
        if (this.selectedTile && this.selectedTile != this.mousedOverTile) this.selectedTile.alpha = 1.0;

        this.selectedTile = tile;
        this.selectedTile.alpha = 0.5;
      }
    }
  }

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

    for (var i = 0; i < G.MAP_SIZE; i++) {
      for (var j = 0; j < G.MAP_SIZE; j++) {
        var x:number = i * 32;
        var y:number = j * 32;

        this.tiles[i][j] = G.game.add.sprite(x, y, "tiles", data[i][j]);
      }
    }

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
        var fill:Point[] = floodFill(i, j, tileName, this.terrain);

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
      var type:string = TerrainTile.types[i].name;

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
        this.tiles[i][j] = G.game.add.sprite(p.x * 32, p.y * 32, "special", i);
      }
    }
  }
}

class GameMap extends Phaser.Group {
  layers:Grid[];

  public constructor() {
    var terrain:Terrain = new Terrain();
    var resources:Resources = new Resources(terrain);
    var buildings:Buildings = new Buildings();

    this.layers = [];

    this.layers.push(terrain);
    this.layers.push(resources);
    this.layers.push(buildings);

    super(G.game);

    G.game.input.onUp.add(this.mouseUp, this);
  }

  public mouseUp() {
    var mx = G.game.input.worldX;
    var my = G.game.input.worldY;

    var x = Math.floor(mx / G.TILE_SIZE);
    var y = Math.floor(my / G.TILE_SIZE);

    var tile:Tile = this.layers[0].get(Math.floor(mx / G.TILE_SIZE), Math.floor(my / G.TILE_SIZE));

    G.bottomBar.model.setHeading('Terrain: ' + tile.getTileName());
    G.bottomBar.model.setActions(tile.getActions());
  }

  public update() {

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
    this.load.spritesheet("special", "assets/special.png", 32, 32);
    this.load.spritesheet("buildings", "assets/buildings.png", 32, 32);
  }

  public init():void {
    this.cursors = this.game.input.keyboard.createCursorKeys();
    this.game.world.setBounds(0, 0, G.MAP_SIZE * 32, G.MAP_SIZE * 32);
  }

  public create():void {
    this.map = new GameMap();

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
    this.events = <any>{
      "click button": "click"
    };

    super(options);

    this.template = _.template($("#action-button").html());
  }

  initialize() {
  }

  click(e) {
    console.log(this.model.toJSON())
  }

  render() {
    this.$el.html(this.template(this.model.toJSON()));

    return this;
  }
}

$(function() {
  new Game();
})
