class LayoutRenderer {
  private drawArea: SVGSVGElement;

  // Whether to report capacity and capacity sum.
  public reportCapacity = true;

  constructor(svgElement: SVGSVGElement) {
    this.drawArea = svgElement;
  }

  render(groups: Map<string, Group>): void {

  }
}