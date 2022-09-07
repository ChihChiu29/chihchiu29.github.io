// Base class for arcade platform player.
// It is not directly useable.
// When subclassing this class, create elements in `init`.
// And performs necessary actions in `update`.
class ArcadePlayerBase extends QPhaser.ArcadePrefab {
  TOUCH_LEFT_BOUNDARY = CONST.GAME_WIDTH / 4;
  TOUCH_RIGHT_BOUNDARY = CONST.GAME_WIDTH * 3 / 4;

  public playerLeftRightSpeed = 160;
  public playerJumpSpeed = 250;

  public playerCanDoubleJump = false;

  private keys: { [key: string]: Phaser.Input.Keyboard.Key } = {};

  INPUT_TYPE = {
    NEUTRAL: 'NEUTRAL',
    UP: 'UP',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT',
  }
  // Last few non-neutral input actions that finished (key up).
  protected recentInputs: string[] = [];
  // Last input action that can be ongoing (key down), can be neutral.
  private lastInput: string = '';

  // Used to control when can double jump.
  private landedBefore = true;

  override init(): void {
    // Input.
    this.keys = QUI.createKeyMap(this.scene);
    this.scene.input.addPointer(3);  // needs at most 3 touch points (most 2 are valid).
  }

  override update(time: number, delta: number) {
    super.update(time, delta);
    this.maybeActOnMainImg((img) => {
      this.handleInput(img);
    });
  }

  private handleInput(img: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {
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

    // Update last and recent input actions.
    let currentInput = this.INPUT_TYPE.NEUTRAL;
    if (moveLeft) {
      currentInput = this.INPUT_TYPE.LEFT;
    } else if (moveRight) {
      currentInput = this.INPUT_TYPE.RIGHT;
    } else if (moveUp) {
      currentInput = this.INPUT_TYPE.UP;
    }
    if (currentInput !== this.lastInput) {
      if (this.lastInput !== this.INPUT_TYPE.NEUTRAL) {
        this.recentInputs.unshift(this.lastInput);
        this.recentInputs.splice(5);
      }
      this.lastInput = currentInput;
    }

    // Handle move intentions.
    if (moveLeft) {
      img.setVelocityX(-this.playerLeftRightSpeed);
      img.setFlipX(false);
    } else if (moveRight) {
      img.setVelocityX(this.playerLeftRightSpeed);
      img.setFlipX(true);
    } else {
      img.setVelocityX(0);
    }
    // Up and left/right could co-happen.
    if (moveUp) {
      if (img.body.touching.down) {
        this.applyVelocity(
          0, -this.playerJumpSpeed,
          'input', CONST.INPUT.SMALL_TIME_INTERVAL_MS);
      } else if (this.playerCanDoubleJump && this.landedBefore) {
        const result = this.applyVelocity(
          0, -this.playerJumpSpeed,
          'input', CONST.INPUT.SMALL_TIME_INTERVAL_MS);
        if (result) {
          // Only clears this bit if jump action happened.
          this.landedBefore = false;  // can only jump once in air.
        }
      }
    }

    // For multi-jump.
    if (img.body.touching.down) {
      this.landedBefore = true;
    }
  }
}
