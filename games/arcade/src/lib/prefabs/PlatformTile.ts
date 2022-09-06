// Base class for platform square tiles.
// It can be used to create a basic tile.
class PlatformTile extends QPhaser.ArcadePrefab {
  private tileInitialSize: number = 0;

  private spriteKey: string = '';
  private frameIndex: number = 0;

  constructor(
    scene: Phaser.Scene,
    imgInitialX: number, imgInitialY: number,
    spriteKey: string, frameIndex: number = 0,
    tileInitialSize: number = 20) {
    super(scene, imgInitialX, imgInitialY);
    this.tileInitialSize = tileInitialSize;
    this.spriteKey = spriteKey;
    this.frameIndex = frameIndex;

    const img = this.scene.physics.add.sprite(
      this.mainImgInitialX, this.mainImgInitialY, spriteKey, frameIndex);
    img.setImmovable(true);
    img.body.allowGravity = false;
    img.setDisplaySize(tileInitialSize, tileInitialSize);
    this.setMainImage(img);
  }

  // Sets that this tile collides with the given prefabs.
  public setCollideWith(prefabs: QPhaser.ArcadePrefab[]) {
    this.setCollideWithGameObjects(QPhaser.collectImgs(prefabs));
  }

  // Sets that this tile collides with the given gameobjects.
  public setCollideWithGameObjects(gameObjs: Phaser.GameObjects.GameObject[]) {
    this.maybeActOnMainImg((img) => {
      this.scene.physics.add.collider(img, gameObjs);
    });
  }

  // Sets that when this tile touch the given prefabs, what happens.
  public setOverlapWith(
    prefabs: QPhaser.ArcadePrefab[],
    callback: ArcadePhysicsCallback) {
    this.setOverlapWithGameObjects(QPhaser.collectImgs(prefabs), callback);
  }

  // Sets that when this tile touch the given gameobjects, what happens.
  // Callback is given (tile, other) as arguments.
  public setOverlapWithGameObjects(
    gameObjs: Phaser.GameObjects.GameObject[],
    callback: ArcadePhysicsCallback) {
    this.maybeActOnMainImg((img) => {
      this.scene.physics.add.overlap(img, gameObjs, callback);
    });
  }
}
