

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
  name: string;  // unique among groups and distinct from item names
  displayName: string;  // if set, this is displayed instead of "name"
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
    displayName: '',
    depth: -1,
    children: [],
    items: [],
    rowIndex: -1,
    rowSpan: -1,
    hide: false,
  };
}

// Custom style on an element + text.
interface CustomStyle {
  // Style for rect.
  rect: svg.CssStyle;
  // Style for text.
  text: svg.CssStyle;
}

// Custom style with shortcut fields.
interface CustomStyleWithShortcuts extends CustomStyle {
  // If set, overrides color setting in `rect`.
  bgcolor?: string;
  // If set, overrides color setting in `textcolor`.
  textcolor?: string;
}

/**
 * Resolves a CustomStyleWithShortcuts to a new CustomStyle object.
 * If style if not defined, create an empty CustomStyle object.
 */
function resolveCustomStyle(style: CustomStyleWithShortcuts | undefined): CustomStyle {
  if (style) {
    const resolvedStyle = { rect: { ...style.rect }, text: { ...style.text } };
    // Next resolve custom color settings.
    if (style.bgcolor) {
      resolvedStyle.rect['fill'] = style.bgcolor;
    }
    if (style.textcolor) {
      resolvedStyle.text['fill'] = style.textcolor;
    }
    return resolvedStyle;
  } else {
    return { rect: {}, text: {} };
  }
}

/**
 * Creates a new CustomStyle from merging two CustomStyleWithShortcuts objects.
 * The two CustomStyleWithShortcuts objects are resolved individually first.
 */
function resolveAndMergeCustomStyles(
  source: CustomStyleWithShortcuts | undefined,
  target: CustomStyleWithShortcuts | undefined): CustomStyle {
  const resolvedSource = resolveCustomStyle(source);
  const resolvedTarget = resolveCustomStyle(target);
  return {
    ...resolvedSource, ...resolvedTarget,
    rect: { ...resolvedSource.rect, ...resolvedTarget.rect },
    text: { ...resolvedSource.text, ...resolvedTarget.text },
  };
}

class RenderStyleConfig {
  // Both groups and items.
  // Height of each row.
  public rowHeight = 25;
  public rowGap = 5;
  // Whether to report capacity and capacity sum.
  public reportCapacity = true;

  // Items only.
  // Width of a column for items.
  public itemColWidth = 300;
  public itemColGap = 10;
  // If true, hide all item names in rendering.
  public hideItemNames = false;
  // Can override defaultItemBgColor.
  public defaultItemStyles: CustomStyleWithShortcuts = {
    rect: {
      stroke: 'none',
    },
    bgcolor: '#6EB2FF',
    text: {},
    textcolor: 'white',
  };

  // Groups only.
  // Default width of group when not set in custom.
  public defaultGroupWidth = 60;
  public groupColGap = 5;
  // A map from group depth to width.
  public customGroupWidths = [];
  // Can override defaultGroupBgColor.
  public defaultGroupStyles: CustomStyleWithShortcuts = {
    rect: {
      stroke: 'none',
    },
    bgcolor: '#FCFCCC',
    text: {},
    textcolor: undefined,
  };
}
