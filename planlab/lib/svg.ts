namespace svg {
  export class ZSVGElement extends SVGElement {
    public zValue: number = 1;
  }

  function createSvgSvgElement(): SVGSVGElement {
    return document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  }
  export function createSvgElement(tagName: string): ZSVGElement {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', tagName) as ZSVGElement;
    elem.zValue = 1;
    return elem;
  }
  export function setAttr(element: ZSVGElement, attributeName: string, attributeValue: string | number) {
    element.setAttribute(attributeName, attributeValue.toString());
  }

  export class Style {
    public borderWidth = 2;
    public fillOpacity = 0.9;
    public lineColor = '#545961';
    public linkTextGapSize = 5;  // space between text and link.
    public linkWidth = 2;
    public textFontSize = 15;
    public textLineSpace = '1.2em';
  }

  /**
   * Helper to draw an SVG. Create one per draw action.
   */
  export class SVGRenderer {
    public hostElement: SVGSVGElement;
    public style: Style = new Style();

    public left: number = 0;
    public top: number = 0;
    public width: number = 0;
    public height: number = 0;

    public useGrid: boolean = true;

    private elements: ZSVGElement[] = [];

    constructor(hostElement: SVGSVGElement) {
      this.hostElement = hostElement;
    }

    addElement(element: ZSVGElement, zValue: number) {
      element.zValue = zValue;
      this.elements.push(element);
    }

    draw() {
      let svgElement = this.hostElement.querySelector('svg');
      if (svgElement) {
        svgElement.remove();
      }
      svgElement = createSvgSvgElement();
      svgElement.setAttribute('viewBox', `${this.left} ${this.top} ${this.width} ${this.height}`);

      // For arrow, see: http://thenewcode.com/1068/Making-Arrows-in-SVG
      // For grid, see: https://stackoverflow.com/questions/14208673/how-to-draw-grid-using-html5-and-canvas-or-svg
      const defsElement = createSvgElement('defs');
      defsElement.innerHTML = `
        <marker id="startarrow" markerWidth="12" markerHeight="7" refX="0" refY="3.5" orient="auto" markerUnits="strokeWidth">
          <polygon points="12 0, 12 7, 0 3.5" fill="${this.style.lineColor}" />
        </marker>
        <marker id="endarrow" markerWidth="12" markerHeight="7" refX="12" refY="3.5" orient="auto" markerUnits="strokeWidth">
          <polygon points="0 0, 12 3.5, 0 7" fill="${this.style.lineColor}" />
        </marker>
        <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="gray" stroke-width="0.5"/>
        </pattern>
        <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="url(#smallGrid)"/>
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="gray" stroke-width="1"/>
        </pattern>
      `;
      svgElement.append(defsElement);
      if (this.useGrid) {
        const rect = createSvgElement('rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', 'url(#grid)');
        svgElement.append(rect);
      }

      for (const element of this.elements.sort((e1, e2) => { return e1.zValue - e2.zValue; })) {
        svgElement.append(element);
      }

      this.hostElement.append(svgElement);
    }
  }

  export abstract class Shape {
    public x = 0;
    public y = 0;
    public width = 100;
    public height = 30;
    public bgColor = '#f5f3ed';
    public zValue = 1;

    public name: string | undefined;

    /**
     * Copy geometry and style properties.
     */
    copyProperties(other: Shape): void {
      this.x = other.x;
      this.y = other.y;
      this.width = other.width;
      this.height = other.height;
      this.bgColor = other.bgColor;
      this.zValue = other.zValue;
    }

    addTo(renderer: SVGRenderer): void {
      for (const elem of this.getElements(renderer.style)) {
        renderer.addElement(elem, this.zValue);
      }
    }

    public abstract getElements(style: Style): ZSVGElement[];

    getCenter(): geometry.Point {
      return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
    }

    getUpMiddle(): geometry.Point {
      return { x: this.getCenter().x, y: this.y };
    }

    getDownMiddle(): geometry.Point {
      return { x: this.getCenter().x, y: this.y + this.height };
    }

    getLeftMiddle(): geometry.Point {
      return { x: this.x, y: this.getCenter().y };
    }

    getRightMiddle(): geometry.Point {
      return { x: this.x + this.width, y: this.getCenter().y };
    }

    getConnectionPoint(direction: string) {
      if (direction === 'up') {
        return this.getUpMiddle();
      } else if (direction === 'down') {
        return this.getDownMiddle();
      } else if (direction === 'left') {
        return this.getLeftMiddle();
      } else if (direction === 'right') {
        return this.getRightMiddle();
      }
      throw new Error('direction not implemented');
    }
  }

  export abstract class Link {
    public from: geometry.Point = { x: 0, y: 0 };
    public to: geometry.Point = { x: 100, y: 100 };
    public hasArrow: number = 1;  // 0: no arrow, 1: endarrow, 2: startarrow, 3: both

    private Z_VALUE = 99999;

    addTo(renderer: SVGRenderer) {
      for (const elem of this.getElements(renderer.style)) {
        renderer.addElement(elem, this.Z_VALUE);
      }
    }

    public abstract getElements(/* Style */style: Style): ZSVGElement[];
  }

  /**
    * Multiline texts, parent is optional.
    */
  class MultilineTexts extends Shape {
    public GAP_LEFT = 5;  // space to the left of the text.

    private linesOfTexts: string[] = [];

    override copyProperties(other: Shape) {
      this.x = other.x;
      this.y = other.y;
      this.bgColor = other.bgColor;
      this.zValue = other.zValue;
    }

    override getElements(style: Style): ZSVGElement[] {
      const elem = createSvgElement('text');
      setAttr(elem, 'x', this.x);
      setAttr(elem, 'y', this.y);
      setAttr(elem, 'font-size', style.textFontSize);
      if (this.name) {
        setAttr(elem, 'name', this.name);
      }

      for (const lineOfText of this.linesOfTexts) {
        const textElement = createSvgElement('tspan');
        setAttr(textElement, 'x', this.x + this.GAP_LEFT);
        setAttr(textElement, 'dy', style.textLineSpace);
        textElement.textContent = lineOfText;
        elem.append(textElement);
      }
      return [elem];
    }
  }
}