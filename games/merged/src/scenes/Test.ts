// You can write more code here

/* START OF COMPILED CODE */

class TestScene extends QPhaser.Scene {

  editorCreate(): void {

    // chatPopup
    const chatPopup = new ChatPopup(this, 100, 100, 200, 100);
    this.add.existing(chatPopup);

    const chatPopup1 = new ChatPopup(this, 100, 300, 200, 100, ["yaya"], true);
    this.add.existing(chatPopup1);

    SceneFactory.createBoundary(this);

    this.events.emit("scene-awake");
  }

  /* START-USER-CODE */

  // Write your code here

  create() {
    for (let x = 100; x < 2000; x += 100) {
      for (let y = 100; y < 2000; y += 100) {
        this.add.line(x, y, 0, 0, 1000, 0, 0xa8325e);
        this.add.line(x, y, 0, 0, 0, 1000, 0xa8325e);
      }
    }

    this.editorCreate();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
