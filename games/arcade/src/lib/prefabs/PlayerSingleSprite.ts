// A basic player that uses a single sprite.
class PlayerSingleSprite extends ArcadePlayerBase {
  private imageKey = '';
  private imageInitialSize = 32;

  constructor(
    scene: Phaser.Scene, imgInitialX: number, imgInitialY: number,
    imageKey: string = 'scared', imageInitialSize: number = 32) {
    super(scene, imgInitialX, imgInitialY);
    this.imageKey = imageKey;
    this.imageInitialSize = imageInitialSize;
  }

  override init(): void {
    super.init();

    // Head.
    const headSprite = this.scene.physics.add.sprite(0, 0, this.imageKey);
    headSprite.setCollideWorldBounds(true);
    headSprite.setBounce(0);
    headSprite.setFrictionX(1);
    headSprite.setDisplaySize(this.imageInitialSize * 0.95, this.imageInitialSize * 0.95);
    this.setMainImage(headSprite);

    this.addInfiniteTween({
      targets: headSprite,
      displayWidth: this.imageInitialSize,
      displayHeight: this.imageInitialSize,
      duration: 200,
      yoyo: true,
      loop: -1,
    });
  }
}
