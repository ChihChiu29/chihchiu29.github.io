interface PlayerProperties {
  spriteKey: string,
  spriteFrame: number,
  size: number,
  leftRightSpeed: number,
  jumpSpeed: number,
  canDoubleJump: boolean,
}

class SceneJumpDownStart extends QPhaser.Scene {
  create(): void {
    const title = QUI.createTextTitle(
      this,
      [
        'Welcome to',
        'Falling Cato',
        'Survival Game!',
      ],
      CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT / 2 - 150, 50);

    const iconSize = CONST.GAME_WIDTH / 4;
    QUI.createIconButton(
      this, 'scared', 0,
      CONST.GAME_WIDTH / 4, title.y + 200,  // position
      iconSize, iconSize,  // size
      () => {
        this.startNewGame({
          spriteKey: 'scared',
          spriteFrame: 0,
          size: 32,
          leftRightSpeed: 200,
          jumpSpeed: 300,
          canDoubleJump: false,
        });
      }
    );

    QUI.createIconButton(
      this, 'pineapplecat', 0,
      CONST.GAME_WIDTH * 3 / 4, title.y + 200,  // position
      iconSize, iconSize,  // size
      () => {
        this.startNewGame({
          spriteKey: 'pineapplecat',
          spriteFrame: 0,
          size: 48,
          leftRightSpeed: 120,
          jumpSpeed: 200,
          canDoubleJump: true,
        });
      },
    );

    // const congrats = this.add.image(CONST.GAME_WIDTH / 2, title.y + 200, 'fight');
    // congrats.setDisplaySize(200, 200);
    // congrats.setAngle(-20);
    // this.add.tween({
    //   targets: congrats,
    //   angle: 20,
    //   duration: 400,
    //   yoyo: true,
    //   loop: -1,
    // });

    // QUI.createButton(this, 'START', CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT - 50, () => {
    //   this.startNewGame();
    // });

    // this.input.keyboard.once('keyup-ENTER', () => {
    //   this.startNewGame();
    // }, this);
  }

  private startNewGame(playerData: PlayerProperties) {
    this.scene.start(SCENE_KEYS.JumpDownMain, playerData);
  }
}
