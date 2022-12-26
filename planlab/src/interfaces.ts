interface Item {
  name: string;  // key
  // Spanning which columns (inclusive).
  spanFromColumn: number;
  spanUntilColumn: number;
  // Capacity of the item.
  capacityPercentage: number;
  // Only for display
  description: string;

  // Used for UI/layout.
  // Row index starting from 0 within a leaf group.
  rowIndex: number;
}

// Creates a default item.
function createItem(): Item {
  return {
    name: '',
    spanFromColumn: -1,
    spanUntilColumn: -1,
    capacityPercentage: -1,
    description: '',
    rowIndex: -1,
  };
}

interface Group {
  name: string;  // globally unique
  depth: number;  // 0 means root
  // Child groups; empty means it's a leaf.
  children: string[];
  // Items it contains, leaf groups have empty items.
  items: Item[];

  // Used for UI/layout.
  fromRowIndex: number;  // start with which row.
  rowSpan: number;  // how many rows to span.
}

// Creates a default group.
function createGroup(): Group {
  return {
    name: '',
    depth: -1,
    children: [],
    items: [],
    fromRowIndex: -1,
    rowSpan: -1,
  };
}
