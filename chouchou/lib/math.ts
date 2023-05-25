namespace math {
  export function sum(array: number[]) {
    return array.reduce((partialSum, a) => partialSum + a, 0);
  }
}