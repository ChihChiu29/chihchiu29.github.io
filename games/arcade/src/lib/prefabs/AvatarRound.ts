class AvatarRound extends Avatar {
  BUBBLING_EFFECT_FACTOR: number = 1.05;
  BUBBLING_EFFECT_SPEED_MS: number = 200;
  CHAT_FLASHING_SPEED_MS: number = 400;
  CHAT_FLASHING_REPEAT: number = 10;

  imageKey: string = '';
  owner: string = '';

  // Who this avatar represents.
  private nameTag?: Phaser.GameObjects.Text;
  // Shown when the user typed a message.
  private chatIndicator?: Phaser.GameObjects.Image;
  private chatIndicatorTween = new QPhaser.SingletonTween();
  // private chatIndicatorTween?: Phaser.Tweens.Tween;

  private avatarSize: number = 0;

  // Center and width/height of the shooting target spirte, the actual size is bigger because of other elements.
  constructor(
    scene: Phaser.Scene,
    imageKey: string,
    avatarSize: number,
    owner: string,
  ) {
    // Use world coordinates.
    super(scene, 0, 0);

    this.imageKey = imageKey;
    this.avatarSize = avatarSize;
    this.owner = owner;

    this.createAvatar();
    this.createOtherUiElements();
  }

  // @Override
  update(time: number, delta: number): void {
    super.update(time, delta);
    this.updateOtherUiElements();
  }

  // Push right/left with positive/negative magnitude.
  push(magnitude: number) {
    this.maybeActOnMainImage((img) => {
      img.applyForce(new Phaser.Math.Vector2(magnitude, 0));
    });
  }

  // Rotate (counter-)clockwisely with (negative-)magnitude.
  rotate(magnitude: number) {
    this.maybeActOnMainImage((img) => {
      img.applyForceFrom(
        new Phaser.Math.Vector2(img.x, img.y - this.avatarSize / 2),
        new Phaser.Math.Vector2(magnitude, 0));
    });
  }

  highlightSpeaking(content: string) {
    this.chatIndicator!.alpha = 0;
    this.chatIndicatorTween.update(this.scene.add.tween({
      targets: this.chatIndicator!,
      alpha: 1,
      duration: this.BUBBLING_EFFECT_SPEED_MS,
      yoyo: true,
      loop: 5,
    }));
  }

  jump(magnitude: number) {
    this.maybeActOnMainImage((img) => {
      img.applyForce(new Phaser.Math.Vector2(0, -magnitude));
    });
  }

  private createAvatar(): void {
    const avatar = this.scene.matter.add.image(CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT / 2, this.imageKey);
    this.add(avatar);
    avatar.setDepth(-1);

    avatar.displayWidth = this.avatarSize;
    avatar.displayHeight = this.avatarSize;
    avatar.setCircle(this.avatarSize * 0.5);
    avatar.setFrictionAir(0);

    this.addInfiniteTween({
      targets: avatar,
      displayWidth: this.avatarSize * this.BUBBLING_EFFECT_FACTOR,
      displayHeight: this.avatarSize * this.BUBBLING_EFFECT_FACTOR,
      duration: this.BUBBLING_EFFECT_SPEED_MS,
      yoyo: true,
      loop: -1,
    });

    this.setMainImage(avatar);
  }

  private createOtherUiElements(): void {
    const nameTag = this.scene.add.text(
      0, 0, this.owner,
      {
        fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
        fontSize: '1em',
        color: '#8c085a',
        strokeThickness: 4,
        stroke: '#a8f7bd',
        align: 'center',
      });
    this.add(nameTag);
    this.nameTag = nameTag;

    const chatIndicator = this.scene.add.image(0, 0, 'chat');
    this.add(chatIndicator);
    // chatIndicator.setDisplaySize(this.avatarSize / 2, this.avatarSize / 2);
    chatIndicator.setDisplaySize(this.avatarSize, this.avatarSize);
    chatIndicator.setAlpha(0);
    this.chatIndicator = chatIndicator;
  }

  private updateOtherUiElements(): void {
    this.maybeActOnMainImage((img) => {
      this.nameTag!.setPosition(img.x - this.avatarSize / 2, img.y - this.avatarSize * 0.8);
      if (this.chatIndicator) {
        // this.chatIndicator!.setPosition(img.x + this.avatarSize * 2 / 3, img.y - this.avatarSize / 2);
        this.chatIndicator!.setPosition(img.x + this.avatarSize / 3, img.y - this.avatarSize);
      }
    });
  }
}
