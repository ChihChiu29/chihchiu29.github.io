// Helps to draw a pose from an array of 33 points.
// See: https://google.github.io/mediapipe/solutions/pose.html
class Pose extends QPhaser.Prefab {

  // For shifting.
  sourceLeft: number = 0;
  sourceTop: number = 0;
  // For scaling.
  // These are used to multiple the 0-1 values mediapipe reports, so if you use the image width
  // and height, you get the the positions on the image.
  sourceWidth: number = CONST.GAME_WIDTH;
  sourceHeight: number = CONST.GAME_HEIGHT;

  lineWidth: number = 4;
  strokeColor: number = 0x48f542;

  canvas?: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    sourceLeft?: number, sourceTop?: number,  // position of the source image in the world
    sourceWidth?: number, sourceHeight?: number,  // dimention of the source image in the world
    lineWidth?: number, strokeColor?: number,
  ) {
    // Use world coordinates.
    super(scene, 0, 0);

    this.sourceLeft = sourceLeft ?? this.sourceLeft;
    this.sourceTop = sourceTop ?? this.sourceTop;
    this.sourceWidth = sourceWidth ?? this.sourceWidth;
    this.sourceHeight = sourceHeight ?? this.sourceHeight;

    this.lineWidth = lineWidth ?? this.lineWidth;
    this.strokeColor = strokeColor ?? this.strokeColor;

    // Note that it cannot be added to the container for some reason, otherwise it won't be displayed.
    const canvas = this.scene.add.graphics();
    this.canvas = canvas;
  }

  // Values for points in locations are between 0-1.
  updateWithNewData(locations: QPoint[]) {
    const pts: QPoint[] = [];
    for (const l of locations) {
      pts.push({ x: this.sourceLeft + l.x * this.sourceWidth, y: this.sourceTop + l.y * this.sourceHeight });
    }

    const c = this.canvas!;
    c.clear();
    c.lineStyle(this.lineWidth, this.strokeColor);
    c.beginPath();

    // Head
    c.moveTo(pts[6].x, pts[6].y);
    c.lineTo(pts[4].x, pts[4].y);
    c.lineTo(pts[0].x, pts[0].y);
    c.lineTo(pts[1].x, pts[1].y);
    c.lineTo(pts[3].x, pts[3].y);
    c.moveTo(pts[10].x, pts[10].y);
    c.lineTo(pts[9].x, pts[9].y);
    // const headRadius = new Phaser.Math.Vector2(pts[8].x - pts[0].x, pts[8].y - pts[0].y).length();
    // c.fillCircle(pts[0].x, pts[0].y, headRadius);

    // Left arm
    // const centerOfLeftHand = new Phaser.Math.Vector2(pts[16].x, pts[16].y);
    // centerOfLeftHand.add(pts[22]);
    // centerOfLeftHand.add(pts[20]);
    // centerOfLeftHand.add(pts[18]);
    // centerOfLeftHand.scale(0.25);
    c.moveTo(pts[12].x, pts[12].y);
    c.lineTo(pts[14].x, pts[14].y);
    c.lineTo(pts[16].x, pts[16].y);
    c.lineTo(pts[18].x, pts[18].y);
    c.lineTo(pts[20].x, pts[20].y);
    c.lineTo(pts[16].x, pts[16].y);
    // c.lineTo(centerOfLeftHand.x, centerOfLeftHand.y);
    // c.fillCircle(centerOfLeftHand.x, centerOfLeftHand.y, centerOfLeftHand.subtract(pts[16]).length());
    // Right arm
    // const centerOfRightHand = new Phaser.Math.Vector2(pts[15].x, pts[15].y);
    // centerOfRightHand.add(pts[21]);
    // centerOfRightHand.add(pts[17]);
    // centerOfRightHand.add(pts[19]);
    // centerOfRightHand.scale(0.25);
    c.moveTo(pts[11].x, pts[11].y);
    c.lineTo(pts[13].x, pts[13].y);
    c.lineTo(pts[15].x, pts[15].y);
    c.lineTo(pts[17].x, pts[17].y);
    c.lineTo(pts[19].x, pts[19].y);
    c.lineTo(pts[15].x, pts[15].y);
    // c.lineTo(centerOfRightHand.x, centerOfRightHand.y);
    // c.fillCircle(centerOfRightHand.x, centerOfRightHand.y, centerOfRightHand.subtract(pts[15]).length());
    // Torso
    c.moveTo(pts[12].x, pts[12].y);
    c.lineTo(pts[11].x, pts[11].y);
    c.lineTo(pts[23].x, pts[23].y);
    c.lineTo(pts[24].x, pts[24].y);
    c.lineTo(pts[12].x, pts[12].y);

    c.strokePath();

    this.maybeActOnMainImage((img) => {
      img.setX(pts[8].x);
      img.setY(pts[8].y);
    });
  }
}
