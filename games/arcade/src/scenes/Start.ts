class StartScene extends Phaser.Scene {

  preload() {
    this.load.pack('root', 'assets/asset-pack.json');
    this.load.html('nameInput', 'assets/html/name_input.html');
  }

  create() {
    this.scene.start(GAME_CHOICE);
  }
}
