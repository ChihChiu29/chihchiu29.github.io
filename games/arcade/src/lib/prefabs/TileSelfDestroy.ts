// A tile that disappears after player touches it.
class TileSelfDestroy extends PlatformTile {
  // After touching these prefabs, this tile will disappear.
  public setDisappearAfterOverlappingWith(
    prefabs: QPhaser.ArcadePrefab[],
    delayMs: number = 2000): void {
    this.setOverlapWith(prefabs, (self, other) => {
      this.scene.add.tween({
        targets: self,
        alpha: 0,
        duration: delayMs,
        loop: false,
        onComplete: () => {
          this.destroy();
        }
      });
    });
  }
}
