/// <reference path="references.ts" />

interface Interactable {
  clickSignal:Phaser.Signal;
  unclickSignal:Phaser.Signal;

  rightClickSignal:Phaser.Signal;

  mouseEnterSignal:Phaser.Signal;
  mouseLeaveSignal:Phaser.Signal;
}