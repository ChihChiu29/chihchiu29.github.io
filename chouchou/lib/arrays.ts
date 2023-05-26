namespace Arrays {
  export function splitArrayIntoChunk<T>(array: T[], chunkSize: number): T[][] {
    const resultArray = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      resultArray.push(array.slice(i, i + chunkSize));
    }
    return resultArray;
  }
}