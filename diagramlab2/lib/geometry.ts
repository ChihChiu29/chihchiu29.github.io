namespace geometry {
  export interface Point {
    x: number;
    y: number;
  }
  export interface Vec {
    x: number;
    y: number;
  }

  export interface BoundingRect {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  export namespace vector {

    export function add(vec1: Vec, vec2: Vec): Vec {
      return { x: vec1.x + vec2.x, y: vec1.y + vec2.y };
    }

    export function sub(fromVec: Vec, byVec: Vec): Vec {
      return { x: fromVec.x - byVec.x, y: fromVec.y - byVec.y };
    }

    export function mul(vec: Vec, scalar: number) {
      return { x: vec.x * scalar, y: vec.y * scalar };
    }

    /**
     * Returns a new vector that's the old vector rotated 90 deg
     * clockwisely in canvas coordinates (postive y points down).
     */
    export function rotateClockwiseBy90Deg(vec: Vec): Vec {
      return { x: -vec.y, y: vec.x };
    }
  }

  /**
   * Gets a middle point between two points.
   */
  export function getMiddlePoint(pt1: Point, pt2: Point): Point {
    return { x: (pt1.x + pt2.x) / 2, y: (pt1.y + pt2.y) / 2 };
  }

  /**
   * Gets a vector from fromPt to toPt.
   */
  export function getVectorBetween(fromPt: Point, toPt: Point): Point {
    return { x: toPt.x - fromPt.x, y: toPt.y - fromPt.y };
  }

  /**
   * Returns the point from linear interpolation between pt1 and pt2.
   * When param == 0, it returns pt1, when param == 1, it returns pt2.
   */
  export function linearInterpolate(pt1: Point, pt2: Point, param: number): Point {
    return vector.add(vector.mul(pt1, (1 - param)), vector.mul(pt2, param));
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
