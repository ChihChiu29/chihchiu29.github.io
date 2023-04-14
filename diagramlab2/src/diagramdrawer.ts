namespace diagramlang {
  const DEFAULT_RECT_WIDTH = 200;
  const DEFAULT_RECT_HEIGHT = 100;

  abstract class GraphElementWrapper {
    public abstract getGraphElement(): svg.GraphElement;
  }

  // Wrapper of Rect focusing on UX.
  class Rect implements GraphElementWrapper {
    private rectElement: svg.Rect;
    constructor() {
      this.rectElement = new svg.Rect();
    }

    getGraphElement(): svg.GraphElement {
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

  }

  // Wrapper of Link focusing on UX.
  class Link {

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
