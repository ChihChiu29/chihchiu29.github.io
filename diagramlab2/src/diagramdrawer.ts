namespace diagramlang {

  class Rect {

  }

  class Link {

  }

  export class Drawer {
    private svgRenderer: svg.SVGRenderer;
    constructor(svgRenderer: svg.SVGRenderer) {
      this.svgRenderer = svgRenderer;
    }

    rect(): Rect {
      return new Rect();
    }

    link(): Link {
      return new Link();
    }
  }
}
