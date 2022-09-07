// Base class for arcade platform player.
// It handles user input and setting velocity etc., but it does not handle
// rendering and it's not directly useable.
// When subclassing this class, create elements in `init`.
// And performs necessary actions in `update`.
class ArcadePlayerBase extends QPhaser.ArcadePrefab {
  TOUCH_LEFT_BOUNDARY = CONST.GAME_WIDTH / 4;
  TOUCH_RIGHT_BOUNDARY = CONST.GAME_WIDTH * 3 / 4;

  public playerLeftRightSpeed = 160;
  // Undefined means dash is diabled.
  public playerLeftRightDashSpeed: number | undefined;

  public playerJumpSpeed = 250;
  // How many jumps are allowed when not on the groud.
  public playerNumAllowedJumps = 1;

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
  private numJumpsSinceLastLanding = 0;

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

  // @abstract
  // Called by this class.
  // For subclass to implement actions when player is moving left/right/neutral.
  protected whenMovingLeftRight(
    direction: string,  // INPUT_TYPE (only left/right/neutral)
    isDashing: boolean,  // whether the player is dashing (double-same-input)
  ) { }

  // @abstract
  // Called by this class
  // For subclass to implement actions when player is jumping.
  protected whenJumping(
    numOfRemainingJumps: number,  // for char that can multi-jump.
  ) { }

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
    // It could be both up and left/right, in which case we record up since
    // left/right can be continously holding down but not jump.
    if (moveUp) {
      currentInput = this.INPUT_TYPE.UP;
    } else if (moveLeft) {
      currentInput = this.INPUT_TYPE.LEFT;
    } else if (moveRight) {
      currentInput = this.INPUT_TYPE.RIGHT;
    }
    if (currentInput !== this.lastInput) {
      if (this.lastInput !== this.INPUT_TYPE.NEUTRAL) {
        this.recentInputs.unshift(this.lastInput);
        this.recentInputs.splice(5);
        console.log(this.lastInput);
      }
      this.lastInput = currentInput;
    }

    // Handle move intentions.
    // The input actions in `this.recentInputs` are guaranteed to be
    // separated by another input action.
    const previousInputAction = this.recentInputs[this.recentInputs.length - 1];
    if (moveLeft) {
      if (this.playerLeftRightDashSpeed) {
        if (previousInputAction === this.INPUT_TYPE.LEFT) {
          // dash left
          img.setVelocity(-this.playerLeftRightDashSpeed);
          this.whenMovingLeftRight(this.INPUT_TYPE.LEFT, true);
        }
      } else {
        img.setVelocityX(-this.playerLeftRightSpeed);
        this.whenMovingLeftRight(this.INPUT_TYPE.LEFT, false);
      }
    } else if (moveRight) {
      if (this.playerLeftRightDashSpeed) {
        if (previousInputAction === this.INPUT_TYPE.RIGHT) {
          // dash right
          img.setVelocity(this.playerLeftRightDashSpeed);
          this.whenMovingLeftRight(this.INPUT_TYPE.RIGHT, true);
        }
      } else {
        img.setVelocityX(this.playerLeftRightSpeed);
        this.whenMovingLeftRight(this.INPUT_TYPE.RIGHT, false);
      }
    } else {
      img.setVelocityX(0);
      this.whenMovingLeftRight(this.INPUT_TYPE.NEUTRAL, false);
    }
    // Up and left/right could co-happen.
    if (moveUp) {
      if (this.numJumpsSinceLastLanding < this.playerNumAllowedJumps) {
        if (this.applyVelocity(
          0, -this.playerJumpSpeed,
          'input', CONST.INPUT.SMALL_TIME_INTERVAL_MS)) {
          this.numJumpsSinceLastLanding++;
          this.whenJumping(
            this.playerNumAllowedJumps - this.numJumpsSinceLastLanding);
        }
      }
    }

    // For multi-jump.
    if (img.body.touching.down) {
      this.numJumpsSinceLastLanding = 0;
    }
  }
}
