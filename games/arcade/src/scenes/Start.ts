class StartScene extends Phaser.Scene {

  RES_AVATARS_KEY: string = 'avatars';

  preload() {
    this.load.pack(this.RES_AVATARS_KEY, 'assets/avatars.json');
    this.load.pack('avatars-special', 'assets/avatarsspecial.json');
    this.load.pack('other-images', 'assets/others.json');
  }

  create() {
    this.matter.world.setBounds(0, 0, CONST.GAME_WIDTH, CONST.GAME_HEIGHT);

    // Fill in global states.
    // Gather all avatars (except special ones).
    for (const f of this.cache.json.entries.entries[this.RES_AVATARS_KEY]['section1'].files) {
      GLOBAL.CATO_DRAWN_AVATARS.push(f.key);
    }

    this.scene.start(GAME_CHOICE);
    // this.scene.start("TestScene");
  }
}
