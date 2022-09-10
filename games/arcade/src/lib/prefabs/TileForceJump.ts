// A tile that bumps player up.
class TileForceJump extends TileMovingUp {
  // After touching these prefabs, this tile will disappear.
  public setPushPrefabsUp(
    prefabs: QPhaser.ArcadePrefab[],
    speed: number = 100,
    // Optionally use another sprite to show the "push up" effect.
    pushUpSpriteKey: string = '',
    pushUpSpriteFrame: number = 0,
  ): void {
    this.setOverlapWith(prefabs, (self, other) => {
      let activated = false;

      const selfPos = this.getPosition();
      for (const prefab of prefabs) {
        const targetPos = prefab.getPosition();
        const relativeAngle = new Phaser.Math.Vector2(
          targetPos.x - selfPos.x,
          selfPos.y - targetPos.y,  // -y so the angle looks normal
        ).angle();
        if (relativeAngle > QMath.constants.PI_ONE_QUARTER &&
          relativeAngle < QMath.constants.PI_THREE_QUARTER) {
          prefab.applyVelocity(
            0, -speed, 'TileForceJump', CONST.INPUT.SMALL_TIME_INTERVAL_MS);
          activated = true;
        }
      }

      if (pushUpSpriteKey && activated) {
        this.maybeActOnMainImg((img) => {
          const pushupImg = this.scene.add.sprite(
            img.x, img.y, pushUpSpriteKey, pushUpSpriteFrame);
          this.scene.add.tween({
            targets: pushupImg,
            y: img.y - img.height,
            duration: 100,
            loop: false,
            yoyo: true,
            onComplete: () => {
              pushupImg.destroy();
            },
          });
        });
      }
    });
  }
}
