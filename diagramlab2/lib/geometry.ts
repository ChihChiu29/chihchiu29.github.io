namespace geometry {
  export interface Point {
    x: number;
    y: number;
  }

  export interface BoundingRect {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  /**
   * Finds the minimal bounding rect of two rects; r1 can use NaN values in which case r2 values are used.
   */
  export function getMinimalCommonBoundingRect(r1: BoundingRect, r2: BoundingRect) {
    const left = r1.x < r2.x ? r1.x : r2.x;
    const top = r1.y < r2.y ? r1.y : r2.y;
    const r1Right = r1.x + r1.width;
    const r2Right = r2.x + r2.width;
    const right = r1Right > r2Right ? r1Right : r2Right;
    const r1Down = r1.y + r1.height;
    const r2Down = r2.y + r2.height;
    const down = r1Down > r2Down ? r1Down : r2Down;
    return {
      x: left,
      y: top,
      width: right - left,
      height: down - top,
    };
  }
}
