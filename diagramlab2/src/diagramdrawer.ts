namespace diagramlang {
  const DEFAULT_RECT_WIDTH = 200;
  const DEFAULT_RECT_HEIGHT = 100;

  const DEFAULT_COLOR_PALETTE = colors.PALETTE_LUCID;

  abstract class GraphElementWrapper {
    public abstract getGraphElement(): svg.GraphElement;
  }

  abstract class ShapeWrapper {
    getGraphElement() {
      return this.getShape();
    }
    public abstract getShape(): svg.Shape;

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

    public left(): number { return this.rectElement.x; }
    public right(): number { return this.rectElement.x + this.rectElement.width; }
    public top(): number { return this.rectElement.y; }
    up = this.top;
    public bottom(): number { return this.rectElement.y + this.rectElement.height; }
    down = this.bottom;
    public cx(): number { return this.rectElement.x + this.rectElement.width / 2; }
    public cy(): number { return this.rectElement.y + this.rectElement.height / 2; }

    public width(): number { return this.rectElement.width; }
    public height(): number { return this.rectElement.height; }

    public text(text: string): Rect {
      this.rectElement.text = text;
      return this;
    }

    public moveCorner(left: number, top: number, width?: number, height?: number): Rect {
      this.maybeSetSize(width, height);
      this.rectElement.x = left;
      this.rectElement.y = top;
      return this;
    }
    move = this.moveCorner;

    public moveCenter(x: number, y: number, width?: number, height?: number): Rect {
      this.maybeSetSize(width, height);
      this.rectElement.x = x - this.rectElement.width / 2;
      this.rectElement.y = y - this.rectElement.height / 2;
      return this;
    }
    cmove = this.moveCenter;

    private maybeSetSize(width?: number, height?: number) {
      if (width) {
        this.rectElement.width = width;
      }
      if (height) {
        this.rectElement.height = height;
      }
    }

    // Sets location of the text, left/center, top/center.
    public textPos(left: boolean = false, top: boolean = false): Rect {
      this.rectElement.textAlignToCenter = !left;
      this.rectElement.textVerticalAlignToCenter = !top;
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

    viewport(left: number, top: number, width: number, height: number) {
      this.svgRenderer.left = left;
      this.svgRenderer.top = top;
      this.svgRenderer.width = width;
      this.svgRenderer.height = height;
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
    link(fromShape?: ShapeWrapper, fromDirection?: string, toShape?: ShapeWrapper, toDirection?: string, text?: string, type: string = 'curved_single_ctrl'): Link {
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

    finalize() {
      for (const elementWrapper of this.wrappers) {
        this.svgRenderer.addGraphElement(elementWrapper.getGraphElement());
      }
    }
  }
}
