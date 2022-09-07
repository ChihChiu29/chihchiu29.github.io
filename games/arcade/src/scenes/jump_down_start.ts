interface PlayerProperties {
  spriteKey: string,
  spriteFrame: number,
  size: number,
  leftRightSpeed: number,
  jumpSpeed: number,
  numAllowedJumps: number,
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

    const instruction = this.add.text(
      CONST.GAME_WIDTH / 2, title.y + 180,
      [
        'Choose your favorite',
        'character, then use',
        'left, mid, and right',
        'part of screen for',
        'control. Good luck!'
      ],
    )
      .setOrigin(0.5)
      .setFontSize(24);

    const gap = 120;

    const iconSize = CONST.GAME_WIDTH / 4;
    QUI.createIconButton(
      this, 'scared', 0,
      CONST.GAME_WIDTH / 4, instruction.y + gap,  // position
      iconSize, iconSize,  // size
      () => {
        this.startNewGame({
          spriteKey: 'scared',
          spriteFrame: 0,
          size: 32,
          leftRightSpeed: 200,
          jumpSpeed: 300,
          numAllowedJumps: 1,
        });
      }
    );

    QUI.createIconButton(
      this, 'pineapplecat', 0,
      CONST.GAME_WIDTH * 3 / 4, instruction.y + gap,  // position
      iconSize, iconSize,  // size
      () => {
        this.startNewGame({
          spriteKey: 'pineapplecat',
          spriteFrame: 0,
          size: 48,
          leftRightSpeed: 120,
          jumpSpeed: 200,
          numAllowedJumps: 2,
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
