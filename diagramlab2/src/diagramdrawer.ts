namespace diagramlang {
  const DEFAULT_RECT_WIDTH = 200;
  const DEFAULT_RECT_HEIGHT = 100;

  const DEFAULT_COLOR_PALETTE = colors.PALETTE_LUCID;

  const DEFAULT_LINK_TYPE = 'curved_single_ctrl';

  abstract class GraphElementWrapper {
    public abstract getGraphElement(): svg.GraphElement;
  }

  abstract class ShapeWrapper {
    getGraphElement() {
      return this.getShape();
    }
    public abstract getShape(): svg.Shape;

    public moveCorner(left: number, top: number, width?: number, height?: number): this {
      const shape = this.getShape();
      this.maybeSetSize(width, height);
      shape.x = left;
      shape.y = top;
      return this;
    }
    move = this.moveCorner;

    public moveCenter(x: number, y: number, width?: number, height?: number): this {
      const shape = this.getShape();
      this.maybeSetSize(width, height);
      shape.x = x - shape.width / 2;
      shape.y = y - shape.height / 2;
      return this;
    }
    cmove = this.moveCenter;

    public left(): number { return this.getShape().x; }
    public right(): number { return this.getShape().x + this.getShape().width; }
    public top(): number { return this.getShape().y; }
    up = this.top;
    public bottom(): number { return this.getShape().y + this.getShape().height; }
    down = this.bottom;
    public cx(): number { return this.getShape().x + this.getShape().width / 2; }
    public cy(): number { return this.getShape().y + this.getShape().height / 2; }

    public width(): number { return this.getShape().width; }
    public height(): number { return this.getShape().height; }

    private maybeSetSize(width?: number, height?: number) {
      const shape = this.getShape();
      if (width) {
        shape.width = width;
      }
      if (height) {
        shape.height = height;
      }
    }

    public setZ(z: number): this {
      this.getShape().zValue = z;
      return this;
    }
  }

  // Wrapper of Rect focusing on UX.
  class Rect extends ShapeWrapper {
    private rectElement: svg.Rect;
    constructor() {
      super();
      this.rectElement = new svg.Rect();
    }

    getShape(): svg.Shape {
      return this.rectElement;
    }

    public text(text: string): Rect {
      this.rectElement.text = text;
      return this;
    }

    // Sets location of the text, left/center, top/center.
    public textPos(left: boolean = false, top: boolean = false): Rect {
      this.rectElement.textAlignToCenter = !left;
      this.rectElement.textVerticalAlignToCenter = !top;
      return this;
    }

    public padding(padding: number | string): Rect {
      this.rectElement.padding = padding;
      return this;
    }

    public textShift(shiftX: number, shiftY: number): Rect {
      this.rectElement.textShift = { x: shiftX, y: shiftY };
      return this;
    }

    // Set style override on rect or on text.
    public style(style: svg.CssStyle, onRect: boolean = true): Rect {
      if (onRect) {
        this.rectElement.customRectCssStyle = svg.mergeCssStyles(this.rectElement.customRectCssStyle, style);
      } else {
        this.rectElement.customTextCssStyle = svg.mergeCssStyles(this.rectElement.customTextCssStyle, style);
      }
      return this;
    }
    public textStyle(style: svg.CssStyle): Rect {
      return this.style(style, false);
    }

    // Quick style setters.
    public fontSize(fontSize: string): Rect {
      return this.textStyle({ 'font-size': fontSize });
    }

    // Set color on rect and on text.
    public color(color: string, palette_name?: string, onRect: boolean = true): Rect {
      return this.style({ fill: this.getColor(color, palette_name) }, onRect);
    }
    public textColor(color: string, palette_name?: string): Rect {
      return this.color(color, palette_name, false);
    }

    private getColor(color: string, palette_name?: string): string {
      if (palette_name === 'lucid') {
        return colors.getColor(color, colors.PALETTE_LUCID);
      } else {
        return colors.getColor(color, DEFAULT_COLOR_PALETTE);
      }
    }
  }

  // Wrapper of Link focusing on UX.
  class Link implements GraphElementWrapper {
    private link: svg.SmartLinkStraight | svg.SmartLinkSingleCurved;
    constructor(type: string) {
      if (type === 'curved_single_ctrl') {
        this.link = new svg.SmartLinkSingleCurved();
      } else {
        this.link = new svg.SmartLinkStraight();
      }
    }

    getGraphElement(): svg.GraphElement {
      return this.link;
    }

    public text(text: string): Link {
      this.link.text = text;
      return this;
    }

    // Connect to shapes.
    public from(shapeWrapper: ShapeWrapper, connectionDirection: string): Link {
      this.link.fromShape = shapeWrapper.getShape();
      this.link.fromDirection = connectionDirection;
      return this;
    }
    public to(shapeWrapper: ShapeWrapper, connectionDirection: string): Link {
      this.link.toShape = shapeWrapper.getShape();
      this.link.toDirection = connectionDirection;
      return this;
    }

    // If these are used, override connection points from `from` and `to` functions.
    public fromPoint(x: number, y: number, connectionDirection: string): Link {
      this.link.fromConnectionPointOverride = { x, y };
      this.link.fromDirection = connectionDirection;
      return this;
    }
    public toPoint(x: number, y: number, connectionDirection: string): Link {
      this.link.toConnectionPointOverride = { x, y };
      this.link.toDirection = connectionDirection;
      return this;
    }

    public sharpness(sharpness: number) {
      this.link.sharpness = sharpness;
    }

    // Link style.
    public dashed(isDashed: boolean = true): Link {
      this.link.dashed = isDashed;
      return this;
    }
    public solid(): Link {
      return this.dashed(false);
    }
  }

  // Wrapper of straight Link focusing on UX.
  class StraightLink implements GraphElementWrapper {
    private rectElement: svg.Rect;
    constructor() {
      this.rectElement = new svg.Rect();
    }

    getGraphElement(): svg.GraphElement {
      return this.rectElement;
    }
  }

  // Helps to organize rect shapes.
  class Layout extends ShapeWrapper {
    // Used to compute layout, not displayed.
    private rectElement: svg.Rect = new svg.Rect();

    private shapeList: ShapeWrapper[] = [];

    override getShape(): svg.Shape {
      return this.rectElement;
    }

    // Set to compute layout for the given shapes.
    setShapes(shapes: ShapeWrapper[]): ShapeWrapper {
      this.shapeList = shapes;
      return this;
    }
    getShapes(): ShapeWrapper[] {
      return this.shapeList;
    }
    shapes = this.getShapes;

    // Arranges shapes in a "tile" layout.
    tile(numOfShapesPerRow: number = 1, gapX: number = 5, gapY: number = 5): ShapeWrapper {
      if (!this.shapeList.length) { return this; }

      const numOfRows = Math.ceil(this.shapeList.length / numOfShapesPerRow);
      const shapeWidth = (this.width() - (numOfShapesPerRow - 1) * gapX) / numOfShapesPerRow;
      const shapeHeight = (this.height() - (numOfRows - 1) * gapY) / numOfRows;

      for (const [idx, shape] of this.shapeList.entries()) {
        const colIdx = idx % numOfShapesPerRow;
        const rowIdx = Math.floor(idx / numOfShapesPerRow);
        shape.move(
          this.left() + (gapX + shapeWidth) * colIdx,
          this.top() + (gapY + shapeHeight) * rowIdx,
          shapeWidth,
          shapeHeight)
      }

      return this;
    }
  }

  export class Drawer {
    public wrappers: GraphElementWrapper[] = [];

    private svgRenderer: svg.SVGRenderer;

    constructor(svgRenderer: svg.SVGRenderer) {
      this.svgRenderer = svgRenderer;
    }

    private registerGraphElement<T extends GraphElementWrapper>(graphElement: T): T {
      this.wrappers.push(graphElement);
      return graphElement;
    }

    // Manually set viewport / disables auto viewport.
    viewport(left: number, top: number, width: number, height: number) {
      this.svgRenderer.left = left;
      this.svgRenderer.top = top;
      this.svgRenderer.width = width;
      this.svgRenderer.height = height;
      this.svgRenderer.autoViewport = false;
    }
    // Sets viewport to auto.
    autoViewport(margin: number = 5) {
      this.svgRenderer.autoViewport = true;
      this.svgRenderer.autoViewportMargin = margin;
    }

    rect(
      text: string,
      left: number = 0,
      top: number = 0,
      width: number = DEFAULT_RECT_WIDTH,
      height: number = DEFAULT_RECT_HEIGHT): Rect {
      return this.registerGraphElement(new Rect().text(text).move(left, top, width, height));
    }

    crect(
      text: string,
      left: number = 0,
      top: number = 0,
      width: number = DEFAULT_RECT_WIDTH,
      height: number = DEFAULT_RECT_HEIGHT): Rect {
      return this.registerGraphElement(new Rect().text(text).cmove(left, top, width, height));
    }

    // Link, default to a link with a single control point.
    link(fromShape?: ShapeWrapper, fromDirection?: string, toShape?: ShapeWrapper, toDirection?: string, text?: string, type: string = DEFAULT_LINK_TYPE): Link {
      const link = new Link(type);
      if (fromShape && fromDirection && toShape && toDirection) {
        link.from(fromShape, fromDirection).to(toShape, toDirection);
      }
      if (text) {
        link.text(text);
      }
      return this.registerGraphElement(link);
    }
    // Straight link.
    slink(fromShape?: ShapeWrapper, fromDirection?: string, toShape?: ShapeWrapper, toDirection?: string, text?: string): Link {
      return this.link(fromShape, fromDirection, toShape, toDirection, text, 'straight');
    }

    // Create multiple links.
    links(fromShapes: ShapeWrapper[], fromDirection: string, toShapes: ShapeWrapper[], toDirection: string, type: string = DEFAULT_LINK_TYPE): Link[] {
      const links: Link[] = [];
      for (const fromShape of fromShapes) {
        for (const toShape of toShapes) {
          links.push(this.link(fromShape, fromDirection, toShape, toDirection, '', type));
        }
      }
      return links;
    }

    layout(): Layout {
      return new Layout();
    }

    finalize() {
      for (const elementWrapper of this.wrappers) {
        this.svgRenderer.addGraphElement(elementWrapper.getGraphElement());
      }
    }
  }
}
