// Base class for a platform tile that moves up.
class TileBasicMovingUp extends ArcadeSprite {
  private initialSpeed: number = 0;
  private multiplier = new QLib.PrimitiveRef<number>(0);

  constructor(
    scene: Phaser.Scene,
    imgInitialX: number, imgInitialY: number,
    initialSpeed: number, speedMultiplier: QLib.PrimitiveRef<number>,
    spriteKey: string, frameIndex: number = 0,
    tileInitialSize: number = 20,
  ) {
    super(scene, imgInitialX, imgInitialY, spriteKey,
      frameIndex, tileInitialSize, /*isPlatform*/ true);
    this.initialSpeed = initialSpeed;
    this.multiplier = speedMultiplier;
  }

  override update(time: number, delta: number) {
    super.update(time, delta);
    this.setVelocityY(-this.initialSpeed * this.multiplier.get());
  }
}