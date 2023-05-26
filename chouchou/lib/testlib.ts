namespace Tests {
  export function assertEq(value: any, expectedValue: any) {
    if (value !== expectedValue) {
      throw `${value} does not equal to expected value ${expectedValue}`;
    }
  }

  export function assertAlmostEq(
    value: number,
    expectedValue: number,
    tolerance: number = 1e-7,
  ) {
    if (Math.abs(value - expectedValue) > tolerance) {
      throw `${value} does not almost equal to expected value ${expectedValue}`;
    }
  }
}