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
  var backtrack:{[key: string]: PathfindNode} = {};
  backtrack[p2s(start)] = {p: undefined, score: 0};

  while (closest.length != 0) {
    var current:PathfindNode = closest.shift();

    if (!closestPoint || dist(current.p, dest) < dist(closestPoint, dest)) closestPoint = current.p;
    if (current.p.x == dest.x && current.p.y == dest.y) break;

    for (var i = 0; i < G.delta4.length; i++) {
      var next:Point = {x: current.p.x + G.delta4[i].x, y: current.p.y + G.delta4[i].y};
      var nexthash = p2s(next);
      var curhash = p2s(current.p);

      if (nexthash in backtrack && backtrack[nexthash].score <= backtrack[curhash].score + 1) continue;
      if (next.x < 0 || next.y < 0 || next.x >= G.MAP_SIZE || next.y >= G.MAP_SIZE) continue;
      if (!criteria(grid.get(next.x, next.y))) continue;

      backtrack[nexthash] = {p: current.p, score: backtrack[p2s(current.p)].score + 1 };
      closest.push({p: next, score: dist(next, dest)});
    }

    closest = _.sortBy(closest, function(node:PathfindNode) { return node.score; });
  }

  var result:Point[] = [closestPoint];
  var currentBacktrack:Point = backtrack[p2s(closestPoint)].p;

  while (currentBacktrack.x != start.x || currentBacktrack.y != start.y) {
    result.push(currentBacktrack);
    currentBacktrack = backtrack[p2s(currentBacktrack)].p;
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
