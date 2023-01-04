interface RenderReport {
  dimension: geometry.BoundingRect;
  message: string;
}

class Renderer {
  // Extra space around the whole group (to show border etc.).
  EXTRA_MARGIN = 5;

  // Set after `render`.
  public graphWidth = 0;
  public graphHeight = 0;

  private drawArea: HTMLElement;
  private groups: Map<string, Group>;
  private maxGroupDepth: number = -1;
  private style: RenderStyleConfig;  // Will be set by LangParser.
  private customStyles: Map<string, CustomStyle>;

  // Postions.
  // "left" values for groups of each depth.
  private groupLeftValues: number[] = [];
  // Widths for groups of each depth.
  private groupWidths: number[] = [];
  // Items will be draw using this "left" value as the starting point.
  private itemBaseLeftValue: number = 0;

  constructor(svgElement: HTMLElement, parser: LangParser) {
    this.groups = parser.groups;
    this.drawArea = svgElement;
    this.style = parser.defaultRenderStyleConfig;
    this.customStyles = parser.customStyles;
  }

  // Renders groups.
  public render(showGrid = true): RenderReport {
    // First compute layout.
    LayoutComputation.computeAllItemRowIndices(this.groups);
    LayoutComputation.computeGroupRowIndices(this.groups);

    // Next prepare style related compuation.
    this.precomputePositions();

    // Start drawing!
    let maxItemCol = -1;  // 1-based
    let maxRow = -1;  // this is really the "next" row
    const svgRenderer = new svg.SVGRenderer(this.drawArea);
    svgRenderer.useGrid = showGrid;
    for (const group of this.groups.values()) {
      for (const item of group.items) {
        this.drawItem(item, group, svgRenderer);
        if (item.spanToCol > maxItemCol) {
          maxItemCol = item.spanToCol;
        }
      }
      this.drawGroup(group, svgRenderer);
      if (group.rowIndex + group.rowSpan > maxRow) {
        maxRow = group.rowIndex + group.rowSpan;
      }
    }

    this.graphWidth = this.getItemLeft(maxItemCol) + this.style.itemColWidth;
    this.graphHeight = this.getRowTop(maxRow) - this.style.rowGap;
    svgRenderer.left = -this.EXTRA_MARGIN;
    svgRenderer.top = -this.EXTRA_MARGIN;
    svgRenderer.width = this.graphWidth + this.EXTRA_MARGIN * 2;
    svgRenderer.height = this.graphHeight + this.EXTRA_MARGIN * 2;

    // Actual rendering.
    svgRenderer.draw();

    return {
      dimension: {
        x: svgRenderer.left,
        y: svgRenderer.top,
        width: svgRenderer.width,
        height: svgRenderer.height,
      },
      message: '',
    }
  }

  private precomputePositions(): void {
    // Compute group widths.
    this.maxGroupDepth = Math.max(...[...this.groups.values()].map(g => g.depth));
    this.groupWidths = this.style.customGroupWidths.slice(0, this.maxGroupDepth);
    for (let i = 0; i <= this.maxGroupDepth; i++) {
      if (!this.groupWidths[i]) {
        this.groupWidths[i] = this.style.defaultGroupWidth;
      }
    }
    let nextLeftValue = 0;
    for (const [i, width] of this.groupWidths.entries()) {
      this.groupLeftValues[i] = nextLeftValue;
      nextLeftValue += width + this.style.groupColGap;
    }
    this.itemBaseLeftValue = nextLeftValue;
  }

  private drawGroup(group: Group, renderer: svg.SVGRenderer): void {
    if (group.hide) {
      return;
    }

    const rect = new svg.Rect();
    rect.text = group.displayName ? group.displayName : group.name;
    rect.x = this.groupLeftValues[group.depth];
    rect.y = this.getRowTop(group.rowIndex);
    if (LayoutComputation.hasChildren(group)) {
      rect.width = this.groupWidths[group.depth];
    } else {
      rect.width = this.getGroupWidth(group.depth);
    }
    rect.height = this.getRowSpanHeight(group.rowSpan);

    this.applyCustomStyles(rect, group.name, this.style.defaultGroupStyles);

    renderer.addShape(rect);
  }

  private drawItem(item: Item, ownerGroup: Group, renderer: svg.SVGRenderer): void {
    let content: string = '';
    if (!(this.style.hideItemNames || item.hideName)) {
      content += item.name;
    }
    if (item.description) {
      content += ` ${item.description}`;
    }

    const rect = new svg.Rect();
    rect.textAlignToCenter = item.textCentered;
    rect.text = content;
    rect.x = this.getItemLeft(item.spanFromCol);
    rect.y = this.getRowTop(ownerGroup.rowIndex + item.rowIndex);
    rect.width = this.getItemWidth(item.spanFromCol, item.spanToCol);
    rect.height = this.style.rowHeight;
    // rect.bgColor = this.style.defaultItemBgColor;

    this.applyCustomStyles(rect, item.name, this.style.defaultItemStyles);

    renderer.addShape(rect);
  }

  private applyCustomStyles(rect: svg.Rect, entityName: string, defaultStyle: CustomStyle) {
    // First default and custom styles.
    let finalCustomStyles: CustomStyle = resolveAndMergeCustomStyles(
      defaultStyle, this.customStyles.get(entityName));

    // Finally, set on the UI elements.
    rect.customRectCssStyle = finalCustomStyles.rect;
    rect.customTextCssStyle = finalCustomStyles.text;
  }

  // The the "top" value for an item with the given row index.
  private getRowTop(rowIndex: number): number {
    return rowIndex * (this.style.rowHeight + this.style.rowGap);
  }

  // The height of an item for the given row span.
  private getRowSpanHeight(rowSpan: number): number {
    return rowSpan * this.style.rowHeight + (rowSpan - 1) * this.style.rowGap;
  }

  // Compute the width of a group for the given depth.
  private getGroupWidth(depth: number) {
    const remainingDepths = this.groupWidths.slice(depth, this.maxGroupDepth + 1);
    return remainingDepths.reduce(
      (sum, next) => sum + next, 0) + (remainingDepths.length - 1) * this.style.groupColGap;
  }

  // The "left" value for an item.
  private getItemLeft(colIdx: number): number {
    return this.itemBaseLeftValue + colIdx * (this.style.itemColWidth + this.style.itemColGap);
  }

  // The width of an item.
  private getItemWidth(fromCol: number, toCol: number): number {
    const colSpan = toCol - fromCol;
    return (colSpan + 1) * this.style.itemColWidth + colSpan * this.style.itemColGap;
  }
}
