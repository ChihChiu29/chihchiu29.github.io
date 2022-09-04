class AvatarCar extends Avatar {
  BUBBLING_EFFECT_FACTOR: number = 1.05;
  BUBBLING_EFFECT_SPEED_MS: number = 200;
  CHAT_FLASHING_SPEED_MS: number = 400;
  CHAT_FLASHING_REPEAT: number = 10;

  CAR_HEIGHT_WIDTH_RATIO = 0.9;
  CAR_BASE_SIZE_SLOPE_RATIO: number = 0.2;
  CAR_TOP_SHRINK_RATIO: number = 0.3;
  CAR_TOP_HEIGHT_RATIO: number = 0.2;  // compared to base

  imageKey: string = '';
  owner: string = '';

  // Who this avatar represents.
  private nameTag?: Phaser.GameObjects.Text;
  // Shown when the user typed a message.
  private chatIndicator?: Phaser.GameObjects.Image;
  private chatIndicatorTween = new QPhaser.SingletonTween();
  // private chatIndicatorTween?: Phaser.Tweens.Tween;

  private avatarSize: number = 0;

  // Center and width/height of the shooting target spirte, 
  // the actual size is bigger because of other elements.
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
    // const avatar = this.scene.matter.add.image(400, 100, this.imageKey, undefined, {
    //   // @ts-ignore
    //   shape: {
    //     type: 'fromVerts', verts: [
    //       [{ "x": 99, "y": 79 }, { "x": 77, "y": 118 }, { "x": 124, "y": 118 }]
    //     ],
    //   },
    //   render: { sprite: { xOffset: 0.30, yOffset: 0.15 } }
    // });
    const avatar = this.scene.matter.add.image(
      CONST.GAME_WIDTH / 2, CONST.GAME_HEIGHT / 2, this.imageKey);
    this.add(avatar);

    avatar.displayWidth = this.avatarSize;
    avatar.displayHeight = this.avatarSize * this.CAR_HEIGHT_WIDTH_RATIO;

    // https://github.com/photonstorm/phaser3-docs/issues/31
    // @ts-ignore: Property 'Matter' does not exist on type 'typeof Matter'.
    var Bodies = Phaser.Physics.Matter.Matter.Bodies;

    const carBaseHeight = this.avatarSize * this.CAR_HEIGHT_WIDTH_RATIO;
    const carBaseSlope = this.avatarSize * this.CAR_BASE_SIZE_SLOPE_RATIO;
    const carBaseTopSizeShrinkValue = this.avatarSize * this.CAR_TOP_SHRINK_RATIO;
    const carTopPartHeight = this.avatarSize / 2 * this.CAR_TOP_HEIGHT_RATIO;
    avatar.setExistingBody(
      Bodies.fromVertices(
        0, 0,
        [
          // Center of mass will be matched to reference of the image.
          // Base
          [
            { "x": 0, "y": carBaseHeight },  // bottom-left corner of the car
            { "x": carBaseSlope, "y": 0 },
            // { "x": carBaseTopSizeShrinkValue, "y": 0 },
            // { "x": carBaseTopSizeShrinkValue, "y": -carTopPartHeight },
            // { "x": this.avatarSize - carBaseTopSizeShrinkValue, "y": -carTopPartHeight },
            // { "x": this.avatarSize - carBaseTopSizeShrinkValue, "y": 0 },
            { "x": this.avatarSize - carBaseSlope, "y": 0 },  // bottom-left corner of the car
            { "x": this.avatarSize, "y": carBaseHeight },
          ],
        ]));

    // avatar.setExistingBody(Bodies.fromVertices(0, 0, '0 0 100 100 0 100'), true);
    avatar.setBounce(Phaser.Math.FloatBetween(0.5, 0.99));
    avatar.setFriction(0.01);
    avatar.setFrictionAir(0);
    avatar.setFrictionStatic(0.01);

    // this.addInfiniteTween({
    //   targets: avatar,
    //   displayWidth: this.avatarSize * this.BUBBLING_EFFECT_FACTOR,
    //   displayHeight: this.avatarSize * this.BUBBLING_EFFECT_FACTOR,
    //   duration: this.BUBBLING_EFFECT_SPEED_MS,
    //   yoyo: true,
    //   loop: -1,
    // });

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
    chatIndicator.setDisplaySize(this.avatarSize, this.avatarSize);
    chatIndicator.setAlpha(0);
    this.chatIndicator = chatIndicator;
  }

  private updateOtherUiElements(): void {
    this.maybeActOnMainImage((img) => {
      this.nameTag!.setPosition(img.x - this.avatarSize / 2, img.y - this.avatarSize * 0.8);
      if (this.chatIndicator) {
        this.chatIndicator!.setPosition(
          img.x + this.avatarSize / 3, img.y - this.avatarSize);
      }
    });
  }
}
