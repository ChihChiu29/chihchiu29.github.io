namespace LayoutComputation {
  /**
   * Compute row indices of the items in the given group.
   */
  export function computeItemRowIndices(leafGroup: Group): void {
    const items = leafGroup.items;
    if (!items) {
      return;
    }

    let maxNumberOfColumns: number = Math.max(...items.map(item => item.spanUntilColumn));
    let maxNumberOfRows: number = items.length;

    // { `row,column`: occupied }
    const spaces = new Map<string, boolean>();

    // Initializes row indices and spaces.
    for (const [rowIdx, item] of items.entries()) {
      item.rowIndex = rowIdx;
      for (let colIdx = item.spanFromColumn; colIdx <= item.spanUntilColumn; colIdx++) {
        spaces.set(getRowColKey(rowIdx, colIdx), true);
      }
    }

    // Condenses row indices.
    let modificationHappened = false;
    while (true) {
      for (const item of items) {
        const rowIdx = item.rowIndex!;
        for (let tryRowIdx = 0; tryRowIdx < rowIdx; tryRowIdx++) {
          if (!isSpaceFull(spaces, tryRowIdx, item.spanFromColumn, item.spanUntilColumn)) {
            for (let colIdx = item.spanFromColumn; colIdx <= item.spanUntilColumn; colIdx++) {
              spaces.set(getRowColKey(tryRowIdx, colIdx), true);
              spaces.set(getRowColKey(rowIdx, colIdx), false);
            }
            item.rowIndex = tryRowIdx;
            modificationHappened = true;
            break;
          }
        }
      }

      // Whether should stop.
      if (modificationHappened) {
        modificationHappened = false;
      } else {
        break;
      }
    }
  }

  function isSpaceFull(spaces: Map<string, boolean>, row: number, colFrom: number, colUntil: number): boolean {
    for (let colIdx = colFrom; colIdx <= colUntil; colIdx++) {
      if (spaces.get(getRowColKey(row, colIdx))) {
        return true;
      }
    }
    return false;
  }

  function getRowColKey(row: number, col: number): string {
    return `${row},${col}`;
  }
}