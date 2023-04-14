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

    public setZ(z: number) {
      this.getShape().zValue = z;
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

    public left() { return this.rectElement.x; }
    public right() { return this.rectElement.x + this.rectElement.width; }
    public top() { return this.rectElement.y; }
    up = this.top;
    public bottom() { return this.rectElement.y + this.rectElement.height; }
    down = this.bottom;
    public cx() { return this.rectElement.x + this.rectElement.width / 2; }
    public cy() { return this.rectElement.y + this.rectElement.height / 2; }

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

    // Set style override on rect or on text.
    public style(style: svg.CssStyle, onRect: boolean = true): Rect {
      if (onRect) {
        this.rectElement.customRectCssStyle = svg.mergeCssStyles(this.rectElement.customRectCssStyle, style);
      } else {
        this.rectElement.customTextCssStyle = svg.mergeCssStyles(this.rectElement.customRectCssStyle, style);
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
    constructor(type: string = 'curved') {
      if (type === 'curved') {
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

    link(): Link {
      return new Link();
    }

    finalize() {
      for (const elementWrapper of this.wrappers) {
        this.svgRenderer.addGraphElement(elementWrapper.getGraphElement());
      }
    }
  }
}
