// Base class for platform tiles.
class PlatformTile extends QPhaser.ArcadePrefab {
  private tileWidth: number = 0;
  private tileHeight: number = 0;

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    spriteKey: string, frameIndex: number = 0,
    tileWidth: number = 20, tileHeight: number = 20) {
    super(scene, x, y);
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
  }

  public setCollideWith(gameObjs: Phaser.GameObjects.GameObject[]) {
    this.maybeActOnMainImg((img) => {
      this.scene.physics.collide(img, gameObjs);
    });
  }

  public setOverlapWith(
    gameObjs: Phaser.GameObjects.GameObject[],
    callback: ArcadePhysicsCallback) {
    this.maybeActOnMainImg((img) => {
      this.scene.physics.overlap(img, gameObjs, callback);
    });
  }
}
