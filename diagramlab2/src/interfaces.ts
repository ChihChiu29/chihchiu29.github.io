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

const USE_PALETTE = color.PALETTE_LUCID;

/**
 * Resolves a CustomStyleWithShortcuts to a new CustomStyle object.
 * If style if not defined, create an empty CustomStyle object.
 */
function resolveCustomStyle(style: CustomStyleWithShortcuts | undefined): CustomStyle {
  if (style) {
    const resolvedStyle = { rect: { ...style.rect }, text: { ...style.text } };
    // Next resolve custom color settings.
    if (style.bgcolor) {
      resolvedStyle.rect['fill'] = color.getColor(style.bgcolor, USE_PALETTE);
    }
    if (style.textcolor) {
      resolvedStyle.text['fill'] = color.getColor(style.textcolor, USE_PALETTE);
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
