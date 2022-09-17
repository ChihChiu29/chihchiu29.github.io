window.addEventListener('load', function () {

  var game = new Phaser.Game({
    width: CONST.GAME_WIDTH,
    height: CONST.GAME_HEIGHT,
    type: Phaser.AUTO,
    parent: 'container',
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
    backgroundColor: '#dee4fa',
    dom: {
      createContainer: true
    },
    // transparent: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
    },
  });

  game.scene.add('Boot', Boot, true);
  game.scene.add('StartScene', StartScene);

  game.scene.add('JumpDownStart', SceneJumpDownStart);
  game.scene.add('JumpDownMain', SceneJumpDownMain);
  game.scene.add('JumpDownEnd', SceneJumpDownEnd);
});

class Boot extends Phaser.Scene {

  preload() {
  }

  create() {
    this.scene.start('StartScene');
  }
}