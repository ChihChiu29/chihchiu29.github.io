namespace SceneFactory {

  // Creates physical boundary around the game area.
  export function createBoundary(scene: Phaser.Scene): void {
    const halfWidth = CONST.GAME_WIDTH / 2;
    const halfHeight = CONST.GAME_HEIGHT / 2;

    // top
    scene.matter.add.rectangle(halfWidth, -halfHeight, CONST.GAME_WIDTH, CONST.GAME_HEIGHT, { ignoreGravity: true, isStatic: true });
    // bottom
    scene.matter.add.rectangle(halfWidth, CONST.GAME_HEIGHT + halfHeight, CONST.GAME_WIDTH, CONST.GAME_HEIGHT, { ignoreGravity: true, isStatic: true });
    // left
    scene.matter.add.rectangle(-halfWidth, halfHeight, CONST.GAME_WIDTH, CONST.GAME_HEIGHT, { ignoreGravity: true, isStatic: true });
    // right
    scene.matter.add.rectangle(CONST.GAME_WIDTH + halfWidth, halfHeight, CONST.GAME_WIDTH, CONST.GAME_HEIGHT, { ignoreGravity: true, isStatic: true });
    // Extra bump at bottom left for camera location.
    // scene.matter.add.fromVertices(160, 720 - 420 / 2, '0 0 320 30 320 420 0 420', { ignoreGravity: true, isStatic: true });
  }
}
