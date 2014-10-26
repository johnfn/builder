/// <reference path="references.ts" />

class G {
  static SCREEN_WIDTH:number = 800;
  static SCREEN_HEIGHT:number = 800;

  static MAP_SIZE:number = 100;

  static CAMERA_PAN_SPEED:number = 10;

  static game:Phaser.Game;
  static delta4:Point[] = [{x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 0}, {x: -1, y: 0}];
}

interface Point {
  x: number
  y: number
}

var floodFill = function(x:number, y:number, type:number, grid:Grid):Point[] {
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

      if (grid.get(next.x, next.y) == type) {
        neighbors.push(next);
      }
    }
  }

  return flood;
};

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

enum TileType {
  Dirt,
  Grass,
  Water,
  DeepWater,
  Ore,
  Trees,
  Marsh,
  Fish
}

class Building {
  sprite: Phaser.Sprite;

  public constructor(type:number) {
    this.sprite = G.game.add.sprite(0, 0, "buildings", type);
  }
}

class Grid extends Phaser.Group {
  grid:number[][];
  tiles: Phaser.Sprite[][];

  public constructor() {
    this.grid = make2dArray(G.MAP_SIZE, 0);
    this.tiles = make2dArray(G.MAP_SIZE, undefined);

    super(G.game);
  }

  public get(x:number, y:number):number {
    return this.grid[x][y];
  }
}

class Terrain extends Grid {
  mousedOverTile:Phaser.Sprite;
  selectedTile:Phaser.Sprite;

  public constructor() {
    super();

    this.placeTerrain();

    while (!this.hasAllFourTiles()) {
      this.placeTerrain();
    }
  }

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

  hasAllFourTiles():boolean {
    var hasTileType:boolean[] = [false, false, false, false];

    for (var i = 0; i < G.MAP_SIZE; i++) {
      for (var j = 0; j < G.MAP_SIZE; j++) {
        hasTileType[this.grid[i][j]] = true;
      }
    }

    for (var i = 0; i < 4; i++) {
      if (!hasTileType[i]) {
        return false;
      }
    }

    return true;
  }

  placeTerrain() {
    this.generateTerrain(10);
    this.normalizeGrid()
    this.quantizeGrid(4);

    for (var i = 0; i < G.MAP_SIZE; i++) {
      for (var j = 0; j < G.MAP_SIZE; j++) {
        var x:number = i * 32;
        var y:number = j * 32;

        this.tiles[i][j] = G.game.add.sprite(x, y, "tiles", this.grid[i][j]);
      }
    }
  }

  quantizeGrid(options:number) {
    for (var i = 0; i < G.MAP_SIZE; i++) {
      for (var j = 0; j < G.MAP_SIZE; j++) {
        this.grid[i][j] = Math.floor(this.grid[i][j] * options);
      }
    }
  }

  normalizeGrid() {
    var min:number = Number.POSITIVE_INFINITY;
    var max:number = Number.NEGATIVE_INFINITY;

    for (var i = 0; i < G.MAP_SIZE; i++) {
      for (var j = 0; j < G.MAP_SIZE; j++) {
        var val:number = this.grid[i][j];

        // We want the values of grid to start at 0 and go all the way up to, but not include, 1.
        // So we add an infinitesmal amount to the max, so that when we normalize the result comes
        // just under 1.
        if (val > max) max = val + 0.0001;
        if (val < min) min = val;
      }
    }

    for (var i = 0; i < G.MAP_SIZE; i++) {
      for (var j = 0; j < G.MAP_SIZE; j++) {
        this.grid[i][j] = (this.grid[i][j] - min) / (max - min);
      }
    }
  }

  generateTerrain(smoothness:number) {
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

    this.grid = grid;
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
    var groups:Point[][][] = [[], [], [], []];
    var self:Resources = this;

    for (var i = 0; i < G.MAP_SIZE; i++) {
      for (var j = 0; j < G.MAP_SIZE; j++) {
        if (hasBeenReached[i][j]) {
          continue;
        }

        var fill:Point[] = floodFill(i, j, this.terrain.get(i, j), this.terrain);

        for (var k = 0; k < fill.length; k++) {
          hasBeenReached[fill[k].x][fill[k].y] = true;
        }

        groups[this.terrain.get(i, j)].push(fill);
      }
    }

    var largestGroups:Point[][] = [];

    for (var i = 0; i < 4; i++) {
      var maxIndex:number = 0;

      for (var j = 0; j < groups[i].length; j++) {
        if (groups[i][j].length > groups[i][maxIndex].length) {
          maxIndex = j;
        }
      }

      largestGroups[i] = groups[i][maxIndex];
    }

    for (var i = 0; i < largestGroups.length; i++) {
      for (var j = 0; j < Math.min(largestGroups[i].length, 20); j++) {
        var p:Point = largestGroups[i][j];
        this.tiles[i][j] = G.game.add.sprite(p.x * 32, p.y * 32, "special", i);
      }
    }
  }
}

class GameMap extends Phaser.Group {
  layers:Grid[];

  buildings: Building[];

  public constructor() {
    var terrain:Terrain = new Terrain();
    var resources:Resources = new Resources(terrain);

    this.layers = [];

    this.layers.push(terrain);
    this.layers.push(resources);

    super(G.game);
  }

  public update() {
    console.log(G.game.input.keyboard.isDown(49)); // 1
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
    var mod:number = 1;

    if (this.shift.isDown) {
      mod = 4;
    }

    // G.game.input.keyboard.isDown("keycode: number")

    if (this.cursors.up.isDown) {
      this.game.camera.y -= G.CAMERA_PAN_SPEED * mod;
    } else if (this.cursors.down.isDown) {
      this.game.camera.y += G.CAMERA_PAN_SPEED * mod;
    }

    if (this.cursors.left.isDown) {
      this.game.camera.x -= G.CAMERA_PAN_SPEED * mod;
    } else if (this.cursors.right.isDown) {
      this.game.camera.x += G.CAMERA_PAN_SPEED * mod;
    }
  }
}

class Game {
  state: Phaser.State;

  constructor() {
    this.state = new MainState();
    G.game = new Phaser.Game(G.SCREEN_WIDTH, G.SCREEN_HEIGHT, Phaser.WEBGL, "main", this.state);

    var m:BottomBarModel = new BottomBarModel({
      heading: "yolo"
    });

    var v:BottomBarView = new BottomBarView({
      el: $("#bottom-bar"),
      model: m
    });
  }
}

class BottomBarModel extends Backbone.Model {

}

class BottomBarView extends Backbone.View<BottomBarModel> {
  template:(...data:any[]) => string; // can't set value here, because initialize is called BEFORE constructor (!)

  initialize() {
    this.template = _.template($("#bottom-bar-template").html());

    this.render();
  }

  render() {
    this.$el.html(this.template(this.model.toJSON()));

    return this;
  }
}

$(function() {
  new Game();
})
