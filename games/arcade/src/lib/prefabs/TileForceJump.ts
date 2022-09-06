// A tile that bumps player up.
class TileForceJump extends PlatformTile {
  // After touching these prefabs, this tile will disappear.
  public setPushPrefabsUp(
    prefabs: QPhaser.ArcadePrefab[],
    speed: number = 300,
    // Optionally use another sprite to show the "push up" effect.
    pushUpSpriteKey: string = '',
    pushUpSpriteFrame: number = 0,
  ): void {
    this.setOverlapWith(prefabs, (self, other) => {
      for (const prefab of prefabs) {
        prefab.applyVelocity(0, -speed);
      }
      if (pushUpSpriteKey) {
        this.maybeActOnMainImg((img) => {
          const pushupImg = this.scene.add.sprite(img.x, img.y, pushUpSpriteKey, pushUpSpriteFrame);
          pushupImg.setDisplaySize(img.width, img.height);
          this.scene.add.tween({
            targets: pushupImg,
            y: img.y - img.height,
            duration: 100,
            loop: false,
          });
        });
      }
    });
  }
}
