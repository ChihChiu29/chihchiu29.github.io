class ChatPopup extends Phaser.GameObjects.Container {

  text?: Phaser.GameObjects.Text;
  border?: Phaser.GameObjects.Polygon;

  // Note that `setPosition` will then set top-left position.
  constructor(scene: Phaser.Scene, left?: number, top?: number, width?: number, height?: number, content?: string[], faceRight?: boolean) {
    super(scene, left ?? 0, top ?? 0);

    width = width ?? 100;
    height = height ?? 100;
    faceRight = faceRight ?? false;

    // Used to draw the "conversation tip". Note that the actual height of the text box is shorter by `deltaY`.
    const deltaX = width / 6;
    const deltaY = height / 5;
    const realY = height - deltaY;

    if (faceRight) {
      this.border = scene.add.polygon(
        width / 2, height / 2, [
        { x: 0, y: realY },
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: realY },
        { x: width - deltaX, y: realY },
        { x: width - deltaX, y: height },
        { x: width - (deltaX + deltaX), y: realY },
      ]);
    } else {
      this.border = scene.add.polygon(
        width / 2, height / 2, [
        { x: 0, y: realY },
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: realY },
        { x: deltaX + deltaX, y: realY },
        { x: deltaX, y: height },
        { x: deltaX, y: realY },
      ]);
    }
    this.border.setStrokeStyle(2, 0x325ca8);
    this.border.isFilled = true;
    this.add(this.border);

    this.text = scene.add.text(5, 5, content ?? ['hello world']);  // 5 is gap to top-left.
    this.add(this.text);
    this.text.setColor('#037bfc');
  }
}
