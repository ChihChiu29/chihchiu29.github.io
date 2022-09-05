class SceneJumpDownStart extends QPhaser.Scene {
  create(): void {
    const title = QUI.createTextTitle(
      this,
      [
        'Welcome to',
        'Cato Survival',
        'Minigame!',
      ],
      CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT / 2 - 150, 50);

    const congrats = this.add.image(CONST.GAME_WIDTH / 2, title.y + 200, 'fight');
    congrats.setDisplaySize(200, 200);
    congrats.setAngle(-20);
    this.add.tween({
      targets: congrats,
      angle: 20,
      duration: 400,
      yoyo: true,
      loop: -1,
    });

    QUI.createButton(this, 'START', CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT - 50, () => {
      this.startNewGame();
    });

    this.input.keyboard.once('keyup-ENTER', () => {
      this.startNewGame();
    }, this);
  }

  private startNewGame() {
    this.scene.start(SCENE_KEYS.JumpDownMain);
  }
}
