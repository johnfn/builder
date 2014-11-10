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

interface Gettable<T> {
  get:(x:number, y:number) => T;
}

//
// floodfill
//

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

//
// pathfind
//

interface PathfindNode {
  p:Point
  score:number
}

function dist(p1:Point, p2:Point):number {
  return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
}

function pathfind<T>(start:Point, dest:Point, grid:Gettable<T>, criteria:(t:T) => boolean):Point[] {
  function p2s(point:Point):string { return point.x + "," + point.y; };

  var closestPoint:Point;
  var closest:PathfindNode[] = [{p:start, score:dist(start, dest)}];
  var backtrack:{[key: string]: Point} = {};
  backtrack[p2s(start)] = undefined;

  while (closest.length != 0) {
    var current:PathfindNode = closest.shift();

    if (!closestPoint || dist(current.p, dest) < dist(closestPoint, dest)) closestPoint = current.p;
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

  var result:Point[] = [closestPoint];
  var currentBacktrack:Point = backtrack[p2s(closestPoint)];

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
