// Helps to draw a hand from an array of 21 points.
// See: https://www.section.io/engineering-education/creating-a-hand-tracking-module/
class Hand extends QPhaser.Prefab {

  // Used to scale a hand.
  // Used to shift the hand.
  left: number = -CONST.GAME_WIDTH / 2;
  top: number = -CONST.GAME_HEIGHT / 2;
  // These are used to multiple the 0-1 values mediapipe reports, so if you use the image width
  // and height, you get the the positions on the image.
  handScaleX: number = CONST.GAME_WIDTH * 2;
  handScaleY: number = CONST.GAME_HEIGHT * 2;

  lineWidth: number = 4;
  strokeColor: number = 0x48f542;

  canvas?: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    left?: number, top?: number,
    handScaleX?: number, handScaleY?: number,
    lineWidth?: number, strokeColor?: number,
  ) {
    // Use world coordinates.
    super(scene, 0, 0);

    this.left = left ?? this.left;
    this.top = top ?? this.top;
    this.handScaleX = handScaleX ?? this.handScaleX;
    this.handScaleY = handScaleY ?? this.handScaleY;

    this.lineWidth = lineWidth ?? this.lineWidth;
    this.strokeColor = strokeColor ?? this.strokeColor;

    // Note that it cannot be added to the container for some reason, otherwise it won't be displayed.
    const canvas = this.scene.add.graphics();
    this.canvas = canvas;

    // const tip = this.scene.matter.add.image(0, 0, 'Artboard');
    // this.add(tip);
    // tip.displayWidth = 50;
    // tip.displayHeight = 50;
    // tip.setCircle(30);
    // tip.setIgnoreGravity(true);
    // tip.setStatic(true);

    // this.setMainImage(tip);
  }

  // Values for points in locations are between 0-1.
  updateWithNewData(locations: QPoint[]) {
    const pts: QPoint[] = [];
    for (const l of locations) {
      pts.push({ x: this.left + l.x * this.handScaleX, y: this.top + l.y * this.handScaleY });
    }

    const c = this.canvas!;
    c.clear();
    c.lineStyle(this.lineWidth, this.strokeColor);
    c.beginPath();

    // Thumb
    c.moveTo(pts[0].x, pts[0].y);
    c.lineTo(pts[1].x, pts[1].y);
    c.lineTo(pts[2].x, pts[2].y);
    c.lineTo(pts[3].x, pts[3].y);
    c.lineTo(pts[4].x, pts[4].y);
    // Index
    c.moveTo(pts[5].x, pts[5].y);
    c.lineTo(pts[6].x, pts[6].y);
    c.lineTo(pts[7].x, pts[7].y);
    c.lineTo(pts[8].x, pts[8].y);
    // Middle
    c.moveTo(pts[9].x, pts[9].y);
    c.lineTo(pts[10].x, pts[10].y);
    c.lineTo(pts[11].x, pts[11].y);
    c.lineTo(pts[12].x, pts[12].y);
    // Ring
    c.moveTo(pts[13].x, pts[13].y);
    c.lineTo(pts[14].x, pts[14].y);
    c.lineTo(pts[15].x, pts[15].y);
    c.lineTo(pts[16].x, pts[16].y);
    // Pinky
    c.moveTo(pts[17].x, pts[17].y);
    c.lineTo(pts[18].x, pts[18].y);
    c.lineTo(pts[19].x, pts[19].y);
    c.lineTo(pts[20].x, pts[20].y);
    // Palm
    c.moveTo(pts[0].x, pts[0].y);
    c.lineTo(pts[5].x, pts[5].y);
    c.lineTo(pts[9].x, pts[9].y);
    c.lineTo(pts[13].x, pts[13].y);
    c.lineTo(pts[17].x, pts[17].y);
    c.lineTo(pts[0].x, pts[0].y);

    c.strokePath();

    this.maybeActOnMainImage((img) => {
      img.setX(pts[8].x);
      img.setY(pts[8].y);
    });
  }
}
