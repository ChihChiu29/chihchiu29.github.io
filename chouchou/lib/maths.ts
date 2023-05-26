namespace Maths {
  export function sum(array: number[]) {
    return array.reduce((partialSum, a) => partialSum + a, 0);
  }

  export function product(array: number[]) {
    return array.reduce((partialSum, a) => partialSum * a, 1);
  }
}