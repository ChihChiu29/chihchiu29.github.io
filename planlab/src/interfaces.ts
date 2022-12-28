

// An item occupies a single row and can span multiple columns.
interface Item {
  name: string;  // key
  // Spanning which columns (inclusive).
  spanFromCol: number;
  spanToCol: number;
  // Only for display
  description: string;

  // Layout.
  // Row index starting from 0 within a leaf group.
  rowIndex: number;

  // Style.
  hideName: boolean;  // only show description.
  textCentered: boolean;  // otherwise text is aligned to the left.
}

// Creates a default item.
function createItem(): Item {
  return {
    name: '',
    spanFromCol: -1,
    spanToCol: -1,
    description: '',
    rowIndex: -1,
    hideName: false,
    textCentered: false,
  };
}

// A group can contain subgroups or items, and usually span multiple rows.
interface Group {
  name: string;  // globally unique
  depth: number;  // 0 means root
  // Child groups; empty means it's a leaf.
  children: string[];
  // Items it contains, leaf groups have empty items.
  items: Item[];

  // Layout.
  rowIndex: number;  // start with which row.
  rowSpan: number;  // how many rows to span.

  // Style.
  hide: boolean,
}

// Creates a default group.
function createGroup(): Group {
  return {
    name: '',
    depth: -1,
    children: [],
    items: [],
    rowIndex: -1,
    rowSpan: -1,
    hide: false,
  };
}
