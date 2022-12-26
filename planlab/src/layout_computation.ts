namespace LayoutComputation {

  // Compute item row indices for all groups.
  export function computeAllItemRowIndices(groups: Map<string, Group>) {
    for (const group of groups.values()) {
      computeItemRowIndices(group);
    }
  }

  /**
   * Compute row indices of the items in the given group.
   * 
   * No-op for group with no items.
   */
  export function computeItemRowIndices(leafGroup: Group): void {
    if (!isLeafGroup(leafGroup)) {
      return;
    }
    if (!hasItems(leafGroup)) {
      leafGroup.rowSpan = 1;
      return;
    }

    const items = leafGroup.items;
    // let maxNumberOfColumns: number = Math.max(...items.map(item => item.spanUntilColumn));
    // let maxNumberOfRows: number = items.length;

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

    leafGroup.rowSpan = Math.max(...(items.map(i => i.rowIndex))) + 1;
  }

  /**
   * Compute layout row indices for all groups.
   * 
   * Needs to be called after `computeItemRowIndices` for all leaf groups.
   */
  export function computeGroupRowIndices(groups: Map<string, Group>): void {
    let currentRowIndex = 0;
    for (const group of groups.values()) {
      if (group.depth !== 0) {
        continue;
      }
      currentRowIndex += computeGroupIndicesRecursive(group, currentRowIndex, groups);
    }
  }

  // Recursively compute row related indices for a single group and its children, returns the top-level / total row span.
  function computeGroupIndicesRecursive(group: Group, currentRowIndex: number, groups: Map<string, Group>): number {
    group.rowIndex = currentRowIndex;
    if (hasChildren(group) && hasItems(group)) {
      console.log('Error for group:');
      console.log(group);
      throw new Error('a group cannot have both children and items');
    }

    // Not leaf.
    if (hasChildren(group)) {
      let rowSpan = 0;
      for (const childGroupName of group.children) {
        const childGroup = groups.get(childGroupName)!;
        rowSpan += computeGroupIndicesRecursive(childGroup, currentRowIndex + rowSpan, groups);
      }
      group.rowSpan = rowSpan;
    }

    // For leaf group this is already set.
    return group.rowSpan;
  }

  function isLeafGroup(group: Group): boolean {
    return !hasChildren(group);
  }

  function hasChildren(group: Group): boolean {
    return group.children.length > 0;
  }

  function hasItems(group: Group): boolean {
    return group.items.length > 0;
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