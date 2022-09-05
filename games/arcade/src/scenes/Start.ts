class StartScene extends Phaser.Scene {

  preload() {
    this.load.pack('root', 'assets/asset-pack.json');
    this.load.pack('tiles', 'assets/tiles/asset-pack.json');
  }

  create() {
    this.scene.start(GAME_CHOICE);
  }
}
