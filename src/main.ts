/// <reference path="references.ts" />

class G {
  static SCREEN_WIDTH:number = 800;
  static SCREEN_HEIGHT:number = 800;

  static game:Phaser.Game;
}

class GameMap {
  tiles:Phaser.Sprite[][];

  public constructor() {
    for (var i = 0; i < 20; i++) {
      for (var j = 0; j < 20; j++) {
        var x:number = i * 32;
        var y:number = j * 32;

        G.game.add.sprite(x, y, "tiles", Math.floor(Math.random() * 4));
      }
    }
  }
}

class MainState extends Phaser.State {
  groups: {[key: string]: Phaser.Group} = {};

  public preload():void {
    //fw, fh, num frames,
    this.load.spritesheet("tiles", "assets/tiles.png", 32, 32);
  }

  public init():void {

  }

  public create():void {
    new GameMap();
  }

  public update():void {

  }
}


class Game {
  state: Phaser.State;

  constructor() {
    this.state = new MainState();
    G.game = new Phaser.Game(G.SCREEN_WIDTH, G.SCREEN_HEIGHT, Phaser.WEBGL, "main", this.state);
  }
}

new Game();