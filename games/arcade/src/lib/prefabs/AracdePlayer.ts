// Base class for arcade platform player.
// When subclassing this class, create elements in `init`.
// And performs necessary actions in `update`.
class ArcadePlayer extends QPhaser.ArcadePrefab {
  TOUCH_LEFT_BOUNDARY = CONST.GAME_WIDTH / 4;
  TOUCH_RIGHT_BOUNDARY = CONST.GAME_WIDTH * 3 / 4;

  public playerLeftRightSpeed = 160;
  public playerJumpSpeed = 350;
  public playerFallSpeed = 100;

  private keys: { [key: string]: Phaser.Input.Keyboard.Key } = {};

  override init(): void {
    // Input.
    this.keys = QUI.createKeyMap(this.scene);
    this.scene.input.addPointer(3);  // needs at most 3 touch points (most 2 are valid).
  }

  override update(time: number, delta: number) {
    this.maybeActOnMainImg((img) => {
      this.handleInput(img);
    });
  }

  private handleInput(img: Phaser.Physics.Arcade.Sprite) {
    // First get user intention.
    // Keyboard based control.
    let moveLeft = this.keys.A.isDown;
    let moveRight = this.keys.D.isDown;
    let moveUp = this.keys.W.isDown;
    // Touch screen based control.
    for (const ptr of [
      this.scene.input.pointer1,
      this.scene.input.pointer2,
      this.scene.input.pointer3,
      this.scene.input.pointer4]) {
      if (ptr.isDown) {
        if (ptr.downX < this.TOUCH_LEFT_BOUNDARY) {
          moveLeft = true;
        }
        if (ptr.downX > this.TOUCH_RIGHT_BOUNDARY) {
          moveRight = true;
        }
        if (this.TOUCH_LEFT_BOUNDARY <= ptr.downX && this.TOUCH_RIGHT_BOUNDARY >= ptr.downX) {
          moveUp = true;
        }
      }
    }

    if (moveLeft) {
      img.setVelocityX(-this.playerLeftRightSpeed);
      img.setFlipX(false);
    } else if (moveRight) {
      img.setVelocityX(this.playerLeftRightSpeed);
      img.setFlipX(true);
    } else {
      img.setVelocityX(0);
    }

    if (moveUp && img.body.touching.down) {
      img.setVelocityY(-this.playerJumpSpeed);
    }
  }
}
