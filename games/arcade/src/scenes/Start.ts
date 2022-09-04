class StartScene extends Phaser.Scene {

  preload() {
    this.load.pack('avatars-special', 'assets/asset-pack.json');
  }

  create() {
    this.scene.start(GAME_CHOICE);
    // this.scene.start("TestScene");
  }
}
