class RendererStyleConfig {
  // Both groups and items.
  // Height of each row.
  public rowHeight = 100;
  public rowGap = 10;
  // Whether to report capacity and capacity sum.
  public reportCapacity = true;

  // Items only.
  // Width of a column for items.
  public itemColWidth = 300;
  public itemColGap = 10;
  public defaultItemBgColor = '#ba3262';
  public defaultItemStyles: CustomStyle = {
    rectStyle: {},
    textStyle: {
      fill: 'white',
    },
  };

  // Groups only.
  // Default width of group when not set in custom.
  public defaultGroupWidth = 200;
  public groupColGap = 10;
  // A map from group depth to width.
  public customGroupWidths = [];
  public defaultGroupBgColor = '#327ba8';
  public defaultGroupStyles: CustomStyle = {
    rectStyle: {},
    textStyle: {},
  };
}

interface RenderReport {
  dimension: geometry.BoundingRect;
}

class Renderer {
  // Extra space around the whole group (to show border etc.).
  EXTRA_MARGIN = 5;

  // Set after `render`.
  public graphWidth = 0;
  public graphHeight = 0;

  private drawArea: HTMLElement;
  private groups: Map<string, Group>;
  private style: RendererStyleConfig;
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
    this.style = parser.rendererStyleConfig;
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
      }
    }
  }

  private precomputePositions(): void {
    // Compute group widths.
    this.groupWidths = [...this.style.customGroupWidths];
    const maxGroupDepth = Math.max(...[...this.groups.values()].map(g => g.depth));
    for (let i = 0; i <= maxGroupDepth; i++) {
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
    const rect = new svg.Rect();
    rect.centeredText = group.name;
    rect.x = this.groupLeftValues[group.depth];
    rect.y = this.getRowTop(group.rowIndex);
    rect.width = this.groupWidths[group.depth];
    rect.height = this.getHeight(group.rowSpan);
    rect.bgColor = this.getGroupBgColor(group);

    this.applyCustomStyles(rect, group.name, this.style.defaultGroupStyles);

    renderer.addShape(rect);
  }

  private drawItem(item: Item, ownerGroup: Group, renderer: svg.SVGRenderer): void {
    let content: string = item.name;
    if (this.style.reportCapacity) {
      content += ` (${item.capacityPercentage}%)`;
    }
    if (item.description) {
      content += ` ${item.description}`;
    }

    const rect = new svg.Rect();
    rect.texts = [content];
    rect.x = this.getItemLeft(item.spanFromCol);
    rect.y = this.getRowTop(ownerGroup.rowIndex + item.rowIndex);
    rect.width = this.getItemWidth(item.spanFromCol, item.spanToCol);
    rect.height = this.style.rowHeight;
    rect.bgColor = this.getItemBgColor(item);

    this.applyCustomStyles(rect, item.name, this.style.defaultItemStyles);

    renderer.addShape(rect);
  }

  private applyCustomStyles(rect: svg.Rect, entityName: string, defaultCustomStyle: CustomStyle) {
    let finalCustomStyles: CustomStyle;
    const customStyles = this.customStyles.get(entityName);
    if (customStyles) {
      finalCustomStyles = {
        rectStyle: { ...defaultCustomStyle.rectStyle, ...customStyles.rectStyle },
        textStyle: { ...defaultCustomStyle.textStyle, ...customStyles.textStyle },
      }
    } else {
      finalCustomStyles = defaultCustomStyle;
    }
    rect.customRectCssStyle = finalCustomStyles.rectStyle;
    rect.customTextCssStyle = finalCustomStyles.textStyle;
  }

  // The the "top" value for an item with the given row index.
  private getRowTop(rowIndex: number): number {
    return rowIndex * (this.style.rowHeight + this.style.rowGap);
  }

  // The height of an item for the given row span.
  private getHeight(rowSpan: number): number {
    return rowSpan * this.style.rowHeight + (rowSpan - 1) * this.style.rowGap;
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

  private getGroupBgColor(group: Group): string {
    if (group.customBgColor) {
      return group.customBgColor;
    } else {
      return this.style.defaultGroupBgColor;
    }
  }

  private getItemBgColor(item: Item): string {
    if (item.customBgColor) {
      return item.customBgColor;
    } else {
      return this.style.defaultItemBgColor;
    }
  }
}
