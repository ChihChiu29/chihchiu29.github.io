// It is also Phaser.Math.Vector2Like.
interface QPoint {
  x: number,
  y: number,
}

interface PlayerProperties {
  // Arcade player properties:
  leftRightSpeed: number,
  jumpSpeed: number,
  numAllowedJumps: number,
  leftRightDashSpeed?: number,  // undefined means disabled.

  // Common:
  playerType: string,  // CONST.PLAYER_TYPE
  size: number,

  // Required by PlayerSingleSprite:
  spriteKey?: string,
  spriteFrame?: number,
  facingLeft?: boolean,
  hasSpongeEffect?: boolean,  // whether the sprite would vary a bit in size periodically.

  // Required by PlayerAnimatedSingleSheet:
  spritesheetKey?: string,
  spritesheetFacingLeft?: boolean,  // whether sprites in the spritesheet face left
  frameRate?: number,
  frameStill?: number,
  frameRunStart?: number,
  frameRunEnd?: number,
  frameJumpStart?: number,
  frameJumpEnd?: number,

}