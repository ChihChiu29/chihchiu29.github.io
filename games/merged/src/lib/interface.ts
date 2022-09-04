// It is also Phaser.Math.Vector2Like.
interface QPoint {
  x: number,
  y: number,
}

interface QExtraInfo {
  // For channel points rewards.
  rewardId: string,

  // For hand tracking.
  isMovement: boolean,
  movementMode: string,
  locations: QPoint[],  // 21 points
}

interface QEvent {
  who: string,
  rawMsg: string,
  msg: string,
  extraInfo: QExtraInfo,
};
