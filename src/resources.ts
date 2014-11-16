/// <reference path="references.ts" />

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
        var resourceTile:ResourceTile = new ResourceTile();
        resourceTile.tileName = ResourceTile.types[i];
        resourceTile.sprite = G.game.add.sprite(p.x * 32, p.y * 32, "special", i);

        this.data[p.x][p.y] = resourceTile;
      }
    }
  }
}