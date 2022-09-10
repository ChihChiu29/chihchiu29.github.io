class EffectPopupText extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    content: string[],
    popupDeltaY: number, durationMs: number,
    fontSize: number = 36,
  ) {
    super(scene, x, y);

    const text = scene.add.text(x, y, content, {
      fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
      color: '#ebbd34',
      strokeThickness: 1,
      stroke: '#ebbd34',
      align: 'center',
    })
      .setOrigin(0.5).setFontSize(fontSize);

    scene.add.tween({
      targets: text,
      y: y - popupDeltaY,
      duration: durationMs,
      repeat: false,
      onComplete: () => {
        text.destroy();
      },
    });
  }
}
