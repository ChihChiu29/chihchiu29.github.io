
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
      default: 'matter',
      matter: {
        gravity: {
          x: 0,
          y: 0.2,
        },
        debug: TESTING,
      },
    },
    transparent: true,
    scale: {
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  });

  game.scene.add("Boot", Boot, true);
  game.scene.add("StartScene", StartScene);

  game.scene.add("Basketball", SceneBasketball);
  game.scene.add("Football", SceneFootball);
  game.scene.add("Soccer", SceneSoccer);

  game.scene.add("TestScene", TestScene);
});

class Boot extends Phaser.Scene {

  preload() {
  }

  create() {
    this.scene.start('StartScene');
  }
}