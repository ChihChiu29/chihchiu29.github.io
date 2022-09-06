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

    GLOBAL.bestScores.push(this.lastScore);
    // Sort without a sorting function somehow gives wired sort-by-string result.
    GLOBAL.bestScores.sort((a, b) => b - a);
    const scoreTexts: string[] = ['Best scores:'];
    let idx = 0;
    for (const score of GLOBAL.bestScores) {
      scoreTexts.push(`${idx + 1} -- ${score.toFixed(1)} sec`);
      idx++;
    }

    const rotatingText = new RotatingText(this, congrats.x - 100, congrats.y + 100, 200, 150);
    rotatingText.textArea?.setText(scoreTexts);
    rotatingText.textArea?.setFontSize(32);
    this.addPrefab(rotatingText);

    QUI.createButton(this, 'TRY AGAIN', CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT - 50, () => {
      this.scene.start(SCENE_KEYS.JumpDownMain);
    });

    this.input.keyboard.once('keyup-ENTER', () => {
      this.scene.start(SCENE_KEYS.JumpDownMain);
    }, this);
  }
}
