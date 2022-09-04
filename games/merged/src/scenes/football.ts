class SceneFootball extends BaseShowScene {
  // Avatar speed needs to be greater than this value for a touch event be considered
  // as a control.
  AVATAR_MINIMAL_CONTROL_VELOCITY: number = 2;

  // Shooting target related.
  // Location should match camera location.
  private TARGET_X: number = this.CAMERA_AREA_WIDTH;
  private TARGET_Y: number = CONST.GAME_HEIGHT - this.CAMERA_AREA_HEIGHT;
  private targetHitDetection?: Phaser.Types.Physics.Matter.MatterBody;
  private ball?: Phaser.GameObjects.Image;
  private lastHitViewer: string = '';
  // +1 text.
  private plusOneText?: Phaser.GameObjects.Text;
  private plusOneTextTween = new QPhaser.SingletonTween();
  // Score bulletin.
  private scoreBulletin?: RotatingText;
  private scores: Map<string, number> = new Map();
  // Who has the ball text.
  private whoHasBallText?: Phaser.GameObjects.Text;
  // Ball reset related.
  private resetBallTimeout = new QTime.AutoClearedTimeout();

  create(): void {
    super.create();

    this.createTargetRelatedUiElements();

    const saveThis = this;
    // TEST
    if (TESTING) {
      this.time.addEvent({
        delay: 10,
        callback: () => { saveThis.activateViewer(Phaser.Math.Between(1, 2000).toString()); },
        // loop: true,
        repeat: 10,
      });
    }
  }

  private createTargetRelatedUiElements() {
    // Shooting target.
    const goalPoleImage = this.add.image(
      this.TARGET_X - 40, this.TARGET_Y - 60, 'footballpole');
    goalPoleImage.setFlipX(true);
    goalPoleImage.displayWidth = 60;
    goalPoleImage.displayHeight = 160;
    goalPoleImage.setDepth(CONST.LAYERS.FRONT);
    // Slant area to make sure ball can come out.
    this.matter.add.trapezoid(
      this.TARGET_X - 80, this.TARGET_Y + 15,
      160, 10, 1,
      { ignoreGravity: true, isStatic: true });

    const hitDetection = this.matter.add.rectangle(
      this.TARGET_X - 40, this.TARGET_Y - 80, 40, 80,
      { ignoreGravity: true, isStatic: true, isSensor: true });
    this.targetHitDetection = hitDetection;

    // Ball.
    const ballImage = this.matter.add.image(
      CONST.GAME_WIDTH / 2, this.TARGET_Y, 'football');
    ballImage.displayWidth = this.AVATAR_SIZE;
    ballImage.displayHeight = this.AVATAR_SIZE;
    ballImage.setCircle(this.AVATAR_SIZE * 0.5);
    // Set height second time after setting body to squeeze body shape as well.
    ballImage.displayHeight = this.AVATAR_SIZE / 2;
    ballImage.setMass(0.1);
    ballImage.setFriction(0.9);
    ballImage.setFrictionAir(0);
    ballImage.setFrictionStatic(0.9);
    ballImage.setBounce(0.8);
    this.ball = ballImage;

    // "+1" text.
    const plusOneText = this.add.text(
      this.TARGET_X + 60, this.TARGET_Y - 80, '+1',
      CONST.FONT_STYLES.GREENISH());
    plusOneText.setDepth(CONST.LAYERS.TEXT);
    plusOneText.setAlpha(0);
    this.plusOneText = plusOneText;

    // Update score when ball hits the target.
    const saveThis = this;
    ballImage.setOnCollideWith(hitDetection, () => {
      // Only going into the goal counts.
      if (ballImage.body.velocity.x > 0) {
        return;
      }

      const name = saveThis.lastHitViewer;
      const value = this.scores.get(name);
      if (value) {
        this.scores.set(name, value + 1);
      } else {
        this.scores.set(name, 1);
      }
      saveThis.updateScoreBoard();
      this.plusOneText!.alpha = 0;
      this.plusOneTextTween.update(saveThis.add.tween({
        targets: saveThis.plusOneText!,
        alpha: 1,
        duration: 500,
        yoyo: true,
        loop: 0,
      }));
    });

    // Reset ball when it goes into the reset area.
    const resetAreaRightX = 240;
    const ballResetDetection = this.matter.add.rectangle(
      resetAreaRightX / 2, 240,
      resetAreaRightX, 180,
      { ignoreGravity: true, isStatic: true, isSensor: true });
    ballImage.setOnCollideWith(ballResetDetection, () => {
      saveThis.resetBallTimeout.update(() => {
        if (ballImage.x < resetAreaRightX) {
          ballImage.setPosition(CONST.GAME_WIDTH / 2, 100);
        }
      }, 3000);
    });

    // Score bulletin.
    const bulletin = new RotatingText(this, 0, 200, this.CAMERA_AREA_WIDTH, 100);
    this.addPrefab(bulletin);
    bulletin.setDepth(CONST.LAYERS.FRONT);
    bulletin.textArea?.setDepth(CONST.LAYERS.FRONT);
    bulletin.rotationSpeedY = 30;
    bulletin.textArea?.setText('Play with Cato');
    this.scoreBulletin = bulletin;

    // "Who has the ball" text.
    const whoHasBallText = this.add.text(
      10, 170,
      'No one controls the ball',
      CONST.FONT_STYLES.GREENISH('2em'));
    whoHasBallText.setDepth(CONST.LAYERS.TEXT);
    this.whoHasBallText = whoHasBallText;

    // Camera area blocker.
    this.matter.add.rectangle(
      this.CAMERA_AREA_WIDTH / 2,
      CONST.GAME_HEIGHT - this.CAMERA_AREA_HEIGHT / 2,
      this.CAMERA_AREA_WIDTH,
      this.CAMERA_AREA_HEIGHT,
      { ignoreGravity: true, isStatic: true });
  }

  createNewAvatar(viewerName: string, viewerAvatarConfig: AvatarConfig): Avatar {
    const avatar = new AvatarCar(
      this,
      viewerAvatarConfig.imageKey,
      this.AVATAR_SIZE * viewerAvatarConfig.sizeFactor,
      viewerName);

    const saveThis = this;
    avatar.maybeActOnMainImage((img) => {
      img.x = Phaser.Math.Between(CONST.GAME_WIDTH / 2, CONST.GAME_WIDTH - img.displayWidth);
      img.y = img.displayHeight;
      img.setMass(this.AVATAR_MASS * viewerAvatarConfig.sizeFactor);
      img.setBounce(Phaser.Math.FloatBetween(this.AVATOR_BOUNCE_MIN, this.AVATOR_BOUNCE_MAX));
      const friction = Phaser.Math.FloatBetween(this.AVATOR_FRICTION_MIX, this.AVATOR_FRICTION_MAX);
      img.setFriction(friction);
      img.setFrictionStatic(friction);
      img.setOnCollideWith(saveThis.ball!, () => {
        const speed = new Phaser.Math.Vector2(img.body.velocity.x, img.body.velocity.y).length();
        if (speed > this.AVATAR_MINIMAL_CONTROL_VELOCITY) {
          saveThis.lastHitViewer = viewerName;
          saveThis.whoHasBallText!.text = `${viewerName} now controls the ball!`;
        }
      });
    });

    return avatar;
  }

  private updateScoreBoard() {
    const topScorers = [...this.scores.keys()];
    topScorers.sort((v1, v2) => { return this.scores.get(v2)! - this.scores.get(v1)!; });

    const messages: string[] = ['Cato Game Leaderboard'];
    let idx = 0;
    for (const scorer of topScorers) {
      messages.push(`${idx + 1}. ${scorer}: ${this.scores.get(scorer)}`);
      idx++;
    }
    this.scoreBulletin?.textArea?.setText(messages);
  }
}
