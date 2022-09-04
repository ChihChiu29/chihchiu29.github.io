class SceneBasketball extends BaseShowScene {

  // Shooting target related.
  private SCORE_VELOCITY: number = 0.1; // going down

  // Shooting target related.
  // Location should match camera location.
  private TARGET_X: number = this.CAMERA_AREA_WIDTH;
  private TARGET_Y: number = 440;
  private targetHitDetection?: Phaser.Types.Physics.Matter.MatterBody;
  private ball?: Phaser.GameObjects.Image;
  private lastHitViewer: string = '';
  // +1 text.
  private plusOneText?: Phaser.GameObjects.Text;
  private plusOneTextTween = new QPhaser.SingletonTween();
  // Score bulletin.
  private scoreBulletin?: RotatingText;
  private scores: Map<string, number> = new Map();

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
    const hoopImage = this.add.image(this.TARGET_X + 72, this.TARGET_Y, 'hoop');
    hoopImage.displayWidth = 180;
    hoopImage.displayHeight = 180;
    hoopImage.setDepth(CONST.LAYERS.FRONT);
    // Left blocker for the hoop.
    this.matter.add.rectangle(this.TARGET_X + 30, this.TARGET_Y - 2, 40, 10, { ignoreGravity: true, isStatic: true });
    // Right blocker for the hoop.
    // this.matter.add.rectangle(this.TARGET_X + 140, this.TARGET_Y, 10, 10, { ignoreGravity: true, isStatic: true });
    this.matter.add.circle(this.TARGET_X + 150, this.TARGET_Y - 2, 8, { ignoreGravity: true, isStatic: true });
    // Slant area below the hoop to prevent shooting up.
    this.matter.add.trapezoid(this.TARGET_X, 600, 200, 360, 1, { ignoreGravity: true, isStatic: true });
    // Camera area.
    this.matter.add.rectangle(this.CAMERA_AREA_WIDTH / 2, CONST.GAME_HEIGHT - this.CAMERA_AREA_HEIGHT / 2, this.CAMERA_AREA_WIDTH, this.CAMERA_AREA_HEIGHT, { ignoreGravity: true, isStatic: true });

    // "+1" text.
    const plusOneText = this.add.text(this.TARGET_X + 60, this.TARGET_Y - 80, '+1', {
      fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
      fontSize: '6em',
      color: '#2f2ffa',
      strokeThickness: 8,
      stroke: '#d5d5f0',
    });
    plusOneText.setDepth(CONST.LAYERS.FRONT);
    plusOneText.setAlpha(0);
    this.plusOneText = plusOneText;

    const hitDetection = this.matter.add.rectangle(
      this.TARGET_X + 100, this.TARGET_Y + 20, 60, 10,
      { ignoreGravity: true, isStatic: true, isSensor: true });
    this.targetHitDetection = hitDetection;

    const bulletin = new RotatingText(this, 0, 200, this.CAMERA_AREA_WIDTH, 100);
    this.addPrefab(bulletin);
    bulletin.setDepth(CONST.LAYERS.FRONT);
    bulletin.textArea?.setDepth(CONST.LAYERS.FRONT);
    bulletin.rotationSpeedY = 30;
    bulletin.textArea?.setText('Play Basketball with Cato');
    this.scoreBulletin = bulletin;
  }

  // @Implement
  createNewAvatar(viewerName: string, viewerAvatarConfig: AvatarConfig): Avatar {
    const avatar = new AvatarRound(
      this,
      viewerAvatarConfig.imageKey,
      this.AVATAR_SIZE * viewerAvatarConfig.sizeFactor,
      viewerName);

    const saveThis = this;
    avatar.maybeActOnMainImage((img) => {
      img.x = Phaser.Math.Between(img.displayWidth, CONST.GAME_WIDTH - img.displayWidth);
      // img.x = Phaser.Math.Between(this.CAMERA_AREA_WIDTH + img.displayWidth, CONST.GAME_WIDTH - img.displayWidth);
      img.y = img.displayHeight;
      img.setMass(this.AVATAR_MASS * viewerAvatarConfig.sizeFactor);
      img.setBounce(Phaser.Math.FloatBetween(this.AVATOR_BOUNCE_MIN, this.AVATOR_BOUNCE_MAX));
      const friction = Phaser.Math.FloatBetween(this.AVATOR_FRICTION_MIX, this.AVATOR_FRICTION_MAX);
      img.setFriction(friction);
      img.setFrictionStatic(friction);
      img.setOnCollideWith(saveThis.targetHitDetection!, () => {
        if (img.body.velocity.y > this.SCORE_VELOCITY) {
          const value = this.scores.get(viewerName);
          if (value) {
            this.scores.set(viewerName, value + 1);
          } else {
            this.scores.set(viewerName, 1);
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
        }
      });
    });
    avatar.rotate(Phaser.Math.Between(-1, 1) * this.AVATAR_ROTATE_STRENTH);

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
