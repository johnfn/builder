/// <reference path="references.ts" />

class FloatingText extends Phaser.Text {
  constructor(x:number, y:number) {
    super(G.game, x, y, "+5", {
      wordWrapWidth: 150,
      font: "12px Arial",
      wordWrap: true,
      fill: "white"
    });
  }

  public update() {
    super.update();

    this.y -= 1;

    this.alpha -= 0.01;

    if (this.alpha <= 0) {
      this.destroy();
    }
  }
}