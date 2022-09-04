class SceneJumpDownStart extends QPhaser.Scene {
  create(): void {
    const statusText = this.add.text(
      CONST.GAME_WIDTH / 2 - 400,
      CONST.GAME_HEIGHT / 2 - 250,
      `You survived for seconds !!!`,
      {
        fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
        fontSize: '1.5em',
        color: '#8c085a',
        strokeThickness: 4,
        stroke: '#a8f7bd',
        align: 'center',
      });
    statusText.setFontSize(60);

    const congrats = this.add.image(CONST.GAME_WIDTH / 2, 350, 'goodjob');
    congrats.scale = 2;
    this.add.tween({
      targets: congrats,
      scale: 2.5,
      duration: 300,
      yoyo: true,
      loop: -1,
    });
  }
}
