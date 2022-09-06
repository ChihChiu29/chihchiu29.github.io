class PlayerSingleSprite extends ArcadePlayer {
  HEAD_IMAGE_SIZE = 32;

  private imageKey = 'dragon';

  constructor(
    scene: Phaser.Scene, initialX: number, initialY: number,
    imageKey: string = 'scared') {
    super(scene, initialX, initialY);
    this.imageKey = imageKey;
  }

  override init(): void {
    super.init();

    // Head.
    const headSprite = this.scene.physics.add.sprite(0, 0, this.imageKey);
    headSprite.setCollideWorldBounds(true);
    headSprite.setBounce(0);
    headSprite.setFrictionX(1);
    headSprite.setDisplaySize(this.HEAD_IMAGE_SIZE, this.HEAD_IMAGE_SIZE);
    this.setMainImage(headSprite);

    this.addInfiniteTween({
      targets: headSprite,
      displayWidth: this.HEAD_IMAGE_SIZE * 1.05,
      displayHeight: this.HEAD_IMAGE_SIZE * 1.05,
      duration: 200,
      yoyo: true,
      loop: -1,
    });
  }
}
