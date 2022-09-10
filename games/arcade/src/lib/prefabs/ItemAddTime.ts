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
      addScoreFn(Phaser.Math.Between(
        addScoreMinMs, addScoreMaxMs));
      this.destroy();
    });
  }
}
