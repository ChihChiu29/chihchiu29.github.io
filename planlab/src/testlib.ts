function assert(value: boolean | undefined) {
  if (!value) {
    throw `${value} is not true`;
  }
}