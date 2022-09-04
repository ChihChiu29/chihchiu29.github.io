class SceneJumpDownEnd extends QPhaser.Scene {
  private lastScore = 0;

  init(data: { score: number }): void {
    this.lastScore = data.score;
  }

  create(): void {
    const statusText = this.add.text(
      CONST.GAME_WIDTH / 2 - 400,
      CONST.GAME_HEIGHT / 2 - 250,
      `You survived for ${this.lastScore} seconds !!!`,
      {
        fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
        fontSize: '1.5em',
        color: '#8c085a',
        strokeThickness: 4,
        stroke: '#a8f7bd',
        align: 'center',
      });
    statusText.setFontSize(60);

    const congrats = this.add.image(CONST.GAME_WIDTH / 2 - 200, 350, 'goodjob');
    congrats.scale = 2;
    this.add.tween({
      targets: congrats,
      scale: 2.5,
      duration: 300,
      yoyo: true,
      loop: -1,
    });

    GLOBAL.bestScores.push(this.lastScore);
    GLOBAL.bestScores.sort().reverse();
    const scoreTexts: string[] = ['Best scores:'];
    let idx = 0;
    for (const score of GLOBAL.bestScores) {
      scoreTexts.push(`${idx + 1} -- ${score} sec`);
      idx++;
    }

    const rotatingText = new RotatingText(this, congrats.x + 300, congrats.y - 150, 400, 400);
    rotatingText.textArea?.setText(scoreTexts);
    rotatingText.textArea?.setFontSize(40);
    this.addPrefab(rotatingText);

    this.input.keyboard.once('keyup-ONE', function () {
    }, this);

    // const saveThis = this;
    // setTimeout(() => {
    //   saveThis.scene.stop('CongratsScene');
    // }, 10000);
  }
}
