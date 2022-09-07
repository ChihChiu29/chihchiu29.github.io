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
          leftRightSpeed: 200,
          jumpSpeed: 300,
          numAllowedJumps: 1,
          playerType: CONST.PLAYER_TYPE.DEFAULT,
          size: 32,
          spriteKey: 'scared',
          spriteFrame: 0,
          facingLeft: true,
        });
      }
    );

    QUI.createIconButton(
      this, 'pineapplecat', 0,
      CONST.GAME_WIDTH * 3 / 4, instruction.y + gap,  // position
      iconSize, iconSize,  // size
      () => {
        this.startNewGame({
          leftRightSpeed: 120,
          jumpSpeed: 200,
          numAllowedJumps: 2,
          playerType: CONST.PLAYER_TYPE.DEFAULT,
          size: 48,
          spriteKey: 'pineapplecat',
          spriteFrame: 0,
          facingLeft: true,
        });
      },
    );

    QUI.createIconButton(
      this, 'tiles', 82,
      CONST.GAME_WIDTH * 1 / 4, instruction.y + gap * 2,  // position
      iconSize, iconSize,  // size
      () => {
        this.startNewGame({
          leftRightSpeed: 100,
          jumpSpeed: 100,
          numAllowedJumps: 400,
          playerType: CONST.PLAYER_TYPE.ANIMATED,
          size: 21,
          spritesheetKey: 'tiles',
          spritesheetFacingLeft: false,
          frameRate: 10,
          frameStill: 79,
          frameRunStart: 80,
          frameRunEnd: 81,
          frameJumpStart: 86,
          frameJumpEnd: 87,
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
