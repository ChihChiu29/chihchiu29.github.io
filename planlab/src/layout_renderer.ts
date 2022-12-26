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
  private drawArea: SVGSVGElement;

  constructor(svgElement: SVGSVGElement) {
    this.drawArea = svgElement;
  }

  // Renders groups.
  render(parser: LangParser): void {
    const groups = parser.groups;
    const rendererStyleConfig = parser.rendererStyleConfig;

    // First compute layout.
    LayoutComputation.computeAllItemRowIndices(groups);
    LayoutComputation.computeGroupRowIndices(groups);

    // Next draw groups recursively.
  }


}