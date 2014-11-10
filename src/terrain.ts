/// <reference path="references.ts" />

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