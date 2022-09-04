// An area showing rotating texts.
class RotatingText extends QPhaser.Prefab {

  rotationSpeedX: number = 0;  // per sec, leftwards
  rotationSpeedY: number = 10;  // per sec, upwards

  textArea?: Phaser.GameObjects.Text;

  private textMaskLeft: number = 0;
  private textMaskTop: number = 0;
  private textMaskWidth: number = 320;
  private textMaskHeight: number = 200;

  // Center and width/height of the shooting target spirte, the actual size is bigger because of other elements.
  constructor(
    scene: Phaser.Scene,
    left: number, top: number,
    width?: number, height?: number,
    textAreaGap: number = 10,
  ) {
    // Use world coordinates.
    super(scene, 0, 0);

    this.textMaskLeft = left ?? this.textMaskLeft;
    this.textMaskTop = top ?? this.textMaskTop;
    this.textMaskWidth = width ?? this.textMaskWidth;
    this.textMaskHeight = height ?? this.textMaskHeight;

    const textContent = scene.add.text(
      this.textMaskLeft + textAreaGap, this.textMaskTop, '',
      {
        fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
        fontSize: '2em',
        color: '#2f2ffa',
        strokeThickness: 8,
        stroke: '#d5d5f0',
      });
    this.add(textContent);
    textContent.setDepth(CONST.LAYERS.TEXT);
    this.textArea = textContent;

    const shape = scene.make.graphics({});
    shape.fillStyle(0xffffff);
    shape.beginPath();
    shape.fillRect(this.textMaskLeft, this.textMaskTop, this.textMaskWidth, this.textMaskHeight);
    const mask = shape.createGeometryMask();
    this.setMask(mask);

    if (TESTING) {
      const maskIllustration = this.scene.add.rectangle(
        this.textMaskLeft + this.textMaskWidth / 2, this.textMaskTop + this.textMaskHeight / 2,
        this.textMaskWidth, this.textMaskHeight);
      this.add(maskIllustration);
      maskIllustration.setStrokeStyle(4, 0x3236a8);
      maskIllustration.setFillStyle(0xa83281, 0.1);
    }
  }

  // @Override
  update(time: number, delta: number): void {
    this.textArea!.x -= this.rotationSpeedX * delta / 1000;
    this.textArea!.y -= this.rotationSpeedY * delta / 1000;
    if (this.textArea!.getBottomRight().y < this.textMaskTop) {
      this.textArea!.y = this.textMaskTop + this.textMaskHeight;
    }
    if (this.textArea!.getBottomRight().x < this.textMaskLeft) {
      this.textArea!.x = this.textMaskLeft + this.textMaskWidth;
    }
  }
}
