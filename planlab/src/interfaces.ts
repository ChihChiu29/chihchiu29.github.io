interface Item {
  name: string;  // key
  // Spanning which columns (inclusive).
  spanFromColumn: number;
  spanUntilColumn: number;
  // Capacity of the item.
  capacityPercentage: number;
  // Only for display
  description?: string;

  // Used for UI.
  // Row index starting from 0 within a leaf group.
  rowIndex?: number;
}

interface Group {
  name: string;  // globally unique
  depth: number;  // 0 means root
  // Child groups; empty means it's a leaf.
  children: string[];
  // Items it contains, only for leaf groups.
  items?: Item[];
}
