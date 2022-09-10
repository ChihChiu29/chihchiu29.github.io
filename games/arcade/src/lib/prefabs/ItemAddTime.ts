// Item that adds time/score when collected.
class ItemAddTime extends ItemBase {
  public setEffect(
    // Plural: maybe coop in the future?
    playerPrefabs: QPhaser.ArcadePrefab[],
    // The function to call to add time/score.
    addScoreFn: (amountToAdd: number) => void,
    // The score to add is a random number between these two.
    addScoreMinMs: number = 1000,
    addScoreMaxMs: number = 5000,
  ): void {
    this.setOverlapWith(playerPrefabs, (self, other) => {
      const amount = Phaser.Math.Between(addScoreMinMs, addScoreMaxMs);
      addScoreFn(amount);
      const { x, y } = this.getPosition();
      const popupEffect = new EffectPopupText(this.scene, x, y,
        [`+${(amount / 1000).toFixed(1)}`], 100, 400);
      this.scene.add.existing(popupEffect);

      this.destroy();
    });
  }
}
