function assert(value: any, expectedValue: any) {
  if (value !== expectedValue) {
    throw `${value} does not equal to expected value ${expectedValue}`;
  }
}