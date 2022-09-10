// Item that reduces platform speed when collected.
class ItemReduceSpeed extends ItemBase {
  public setEffect(
    playerPrefabs: QPhaser.ArcadePrefab[],
    speedMultiplier: QLib.PrimitiveRef<number>,
    // The speed multiplier will be reduced by a factor between these values.
    speedReductionFactorMin: number = 0.5,
    speedReductionFactorMax: number = 0.9,
  ): void {
    this.setOverlapWith(playerPrefabs, (self, other) => {
      const factor = Phaser.Math.FloatBetween(
        speedReductionFactorMin, speedReductionFactorMax);
      speedMultiplier.set(speedMultiplier.get() * factor);

      this.destroy();
    });
  }
}
