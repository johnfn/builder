/// <reference path="references.ts" />

class Tile implements Interactable {
  public /*protected*/ tileName:string;
  public /*protected*/ actions:string[];
  public sprite:Phaser.Sprite;

  public clickSignal:Phaser.Signal = new Phaser.Signal();
  public unclickSignal:Phaser.Signal = new Phaser.Signal();

  public rightClickSignal:Phaser.Signal = new Phaser.Signal();

  public mouseEnterSignal:Phaser.Signal = new Phaser.Signal();
  public mouseLeaveSignal:Phaser.Signal = new Phaser.Signal();

  public pressZSignal:Phaser.Signal = new Phaser.Signal();

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
