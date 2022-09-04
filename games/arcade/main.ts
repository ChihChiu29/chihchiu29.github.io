
window.addEventListener('load', function () {

  var game = new Phaser.Game({
    width: CONST.GAME_WIDTH,
    height: CONST.GAME_HEIGHT,
    type: Phaser.AUTO,
    fps: {
      target: 60,
      forceSetTimeOut: true,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 300 },
        debug: TESTING,
      }
    },
    transparent: true,
    scale: {
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  });

  game.scene.add("Boot", Boot, true);
  game.scene.add("StartScene", StartScene);

  game.scene.add("JumpDown", SceneJumpDown);
});

class Boot extends Phaser.Scene {

  preload() {
  }

  create() {
    this.scene.start('StartScene');
  }
}