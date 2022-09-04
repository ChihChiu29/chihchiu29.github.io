class SceneEndGame extends Phaser.Scene {
  private score = 0;

  init(data: { score: number }): void {
    this.score = data.score;
  }

  create(): void {
    const statusText = this.add.text(
      150,
      100,
      `You survived for ${this.score} seconds !!!`,
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

    // let viewerWithMostDamage = Object.keys(GLOBAL.mostDamage).reduce((a, b) => GLOBAL.mostDamage[a] > GLOBAL.mostDamage[b] ? a : b);
    // let viewerWithMostShots = Object.keys(GLOBAL.mostShots).reduce((a, b) => GLOBAL.mostShots[a] > GLOBAL.mostShots[b] ? a : b);
    // const statistics = this.add.text(
    //   300,
    //   500,
    //   [
    //     `${viewerWithMostDamage} did most (${GLOBAL.mostDamage[viewerWithMostDamage]}) damage!`,
    //     `${viewerWithMostShots} had most (${GLOBAL.mostShots[viewerWithMostShots]}) shots!`,
    //     `${GLOBAL.lastHitViewer} did the last shot!`,
    //   ],
    //   {
    //     fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
    //     fontSize: '1.5em',
    //     color: '#a83248',
    //     strokeThickness: 4,
    //     stroke: '#a8f7bd',
    //     align: 'center',
    //   });
    // statistics.setFontSize(40);

    // const saveThis = this;
    // setTimeout(() => {
    //   saveThis.scene.stop('CongratsScene');
    // }, 10000);
  }
}
