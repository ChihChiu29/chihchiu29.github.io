// Basic item class.
class ItemBase extends ArcadeSprite {
  constructor(
    scene: Phaser.Scene,
    imgInitialX: number, imgInitialY: number,
    spriteKey: string, frameIndex: number = 0,
    tileInitialSize: number = 20,
  ) {
    super(scene, imgInitialX, imgInitialY, spriteKey,
      frameIndex, tileInitialSize, /*isPlatform*/ false);
  }
}
