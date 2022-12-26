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
  public defaultItemBgColor = '#545961';
  public itemGap = 10;

  // Groups only.
  // Default width of group when not set in custom.
  public defaultGroupWidth = 200;
  public groupGap = 10;
  // A map from group depth to width.
  public customGroupWidths = [];
  public defaultGroupBgColor = '#327ba8';
}

class Renderer {
  private drawArea: HTMLElement;
  private groups: Map<string, Group>;
  private rendererStyleConfig: RendererStyleConfig;

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
    this.rendererStyleConfig = parser.rendererStyleConfig;
  }

  // Renders groups.
  public render(): void {
    // First compute layout.
    LayoutComputation.computeAllItemRowIndices(this.groups);
    LayoutComputation.computeGroupRowIndices(this.groups);

    // Next prepare style related compuation.
    this.prepareStyle();

    // Start drawing!
    const svgRenderer = new svg.SVGRenderer(this.drawArea);
    for (const group of this.groups.values()) {
      for (const item of group.items) {
        this.drawItem(item, svgRenderer);
      }
      this.drawGroup(group, svgRenderer);
    }
  }

  private prepareStyle(): void {
    // Compute group widths.
    this.groupWidths = [...this.rendererStyleConfig.customGroupWidths];
    const maxGroupDepth = Math.max(...[...this.groups.values()].map(g => g.depth));
    for (let i = 0; i <= maxGroupDepth; i++) {
      if (!this.groupWidths[i]) {
        this.groupWidths[i] = this.rendererStyleConfig.defaultGroupWidth;
      }
    }
    let nextLeftValue = 0;
    for (const [i, width] of this.groupWidths.entries()) {
      this.groupLeftValues[i] = nextLeftValue;
      nextLeftValue += width + this.rendererStyleConfig.groupGap;
    }
    this.itemBaseLeftValue = nextLeftValue;
  }

  private drawGroup(group: Group, renderer: svg.SVGRenderer): void {
    const rect = new svg.Rect();
    rect.centeredText = group.name;
    rect.x = this.groupLeftValues[group.depth];
    rect.y = this.getTop(group.rowIndex);
    rect.width = this.groupWidths[group.depth];
    rect.height = this.getHeight(group.rowSpan);
  }

  private drawItem(item: Item, renderer: svg.SVGRenderer): void {

  }

  // The the "top" value for an item with the given row index.
  private getTop(rowIndex: number): number {
    return rowIndex * (this.rendererStyleConfig.rowHeight + this.rendererStyleConfig.rowGap);
  }

  // The height of an item for the given row span.
  private getHeight(rowSpan: number): number {
    return rowSpan * this.rendererStyleConfig.rowHeight + (rowSpan - 1) * this.rendererStyleConfig.rowGap;
  }
}