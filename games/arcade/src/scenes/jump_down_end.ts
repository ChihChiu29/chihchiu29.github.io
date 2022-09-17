class SceneJumpDownEnd extends QPhaser.Scene {
  private lastScore = 0;

  init(data: { score: number }): void {
    this.lastScore = data.score;
  }

  create(): void {
    const title = QUI.createTextTitle(this,
      [
        'You survived',
        `${this.lastScore.toFixed(1)} seconds!`,
      ],
      CONST.GAME_WIDTH / 2, 100);

    const congrats = this.add.image(CONST.GAME_WIDTH / 2, title.y + 150, 'goodjob');
    congrats.scale = 1.2;
    this.add.tween({
      targets: congrats,
      scale: 1.4,
      duration: 300,
      yoyo: true,
      loop: -1,
    });

    this.updateHighScores(congrats);

    QUI.createButton(this, 'TRY AGAIN', CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT - 50, () => {
      this.scene.start(SCENE_KEYS.JumpDownStart);
    });

    this.input.keyboard.once('keyup-ENTER', () => {
      this.scene.start(SCENE_KEYS.JumpDownMain);
    }, this);
  }

  private updateHighScores(congrats: Phaser.GameObjects.Image): void {
    FIREBASE.readHighScores().then((highScores: GLOBAL.HighScore[]) => {
      GLOBAL.bestScores = highScores;
      GLOBAL.bestScores.push({
        fromUser: GLOBAL.playerNickname,
        score: this.lastScore,
      });
      // Sort without a sorting function somehow gives wired sort-by-string result.
      GLOBAL.bestScores.sort((a, b) => b.score - a.score);
      GLOBAL.bestScores.splice(GLOBAL.NUM_HIGHSCORES);
      FIREBASE.writeHighScores(GLOBAL.bestScores);

      const scoreTexts: string[] = ['Best scores:'];
      let idx = 0;
      for (const record of GLOBAL.bestScores) {
        scoreTexts.push(
          `${idx + 1}. ${record.fromUser} ${record.score.toFixed(1)}`);
        idx++;
      }

      const rotatingText = new RotatingText(
        this, congrats.x - 150, congrats.y + 100, 300, 150);
      rotatingText.textArea?.setText(scoreTexts);
      rotatingText.textArea?.setFontSize(28);
      this.addPrefab(rotatingText);
    });
  }
}
