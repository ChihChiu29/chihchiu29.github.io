class SceneJumpDownStart extends QPhaser.Scene {
  create(): void {
    QUI.createTextTitle(this, ['Welcome to Cato Survival Minigame!'],
      CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT / 2 - 250, 60);

    const congrats = this.add.image(CONST.GAME_WIDTH / 2, 350, 'fight');
    congrats.setDisplaySize(250, 250);
    congrats.setAngle(-20);
    this.add.tween({
      targets: congrats,
      angle: 20,
      duration: 400,
      yoyo: true,
      loop: -1,
    });

    QUI.createButton(this, 'START', CONST.GAME_WIDTH / 2, congrats.y + 200, () => {
      this.scene.start(SCENE_KEYS.JumpDownMain);
    });

    this.input.keyboard.once('keyup-ENTER', () => {
      this.scene.start(SCENE_KEYS.JumpDownMain);
    }, this);
  }
}
