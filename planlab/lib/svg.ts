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

  // Used to pass in any CSS style.
  export type CssStyle = { [key: string]: string };
  function applyCustomCssStyle(elem: ZSVGElement, cssStyle: CssStyle) {
    for (const [key, value] of Object.entries(cssStyle)) {
      setAttr(elem, key, value);
    }
  }

  /**
   * Helper to draw an SVG. Create one per draw action.
   */
  export class SVGRenderer {
    public hostElement: HTMLElement;
    public style: Style = new Style();

    public left: number = 0;
    public top: number = 0;
    public width: number = 0;
    public height: number = 0;

    public useGrid: boolean = true;

    private elements: ZSVGElement[] = [];

    constructor(hostElement: HTMLElement) {
      this.hostElement = hostElement;
    }

    public addShape(shape: Shape) {
      for (const elem of shape.getElements(this.style)) {
        this.addElement(elem, elem.zValue);
      }
    }

    addElement(element: ZSVGElement, zValue: number) {
      element.zValue = zValue;
      this.elements.push(element);
    }

    public draw() {
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

    public abstract getElements(style: Style): ZSVGElement[];
  }

  /**
    * Multiline texts, parent is optional.
    */
  class MultilineTexts extends Shape {
    public GAP_LEFT = 5;  // space to the left of the text.

    public linesOfTexts: string[] = [];
    public customTextCssStyle: CssStyle = {};

    constructor(linesOfTexts: string[]) {
      super();
      this.linesOfTexts = linesOfTexts;
    }

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

      applyCustomCssStyle(elem, this.customTextCssStyle);
      return [elem];
    }
  }

  /**
   * A single line of text centered in a region.
   */
  class _CenteredText extends Shape {
    public text: string = '';
    public customTextCssStyle: CssStyle = {};

    constructor(singleLineOfText: string) {
      super();
      this.text = singleLineOfText;
    }

    // @Implement
    override getElements(style: Style): ZSVGElement[] {
      const elem = createSvgElement('text');
      const center = this.getCenter();
      setAttr(elem, 'x', center.x);
      setAttr(elem, 'y', center.y);
      setAttr(elem, 'font-size', style.textFontSize);
      setAttr(elem, 'dominant-baseline', 'middle');
      setAttr(elem, 'text-anchor', 'middle');
      elem.textContent = this.text;
      if (this.name) {
        setAttr(elem, 'name', this.name);
      }
      applyCustomCssStyle(elem, this.customTextCssStyle);
      return [elem];
    }
  }

  /**
   * A raw rect with border etc., no text.
   */
  class _Rect extends Shape {
    public CORNER_RADIUS = 5;

    public customRectCssStyle: CssStyle = {};

    // @Implement
    override getElements(style: Style): ZSVGElement[] {
      const elem = createSvgElement('rect');
      setAttr(elem, 'x', this.x);
      setAttr(elem, 'y', this.y);
      setAttr(elem, 'width', this.width);
      setAttr(elem, 'height', this.height);
      setAttr(elem, 'rx', this.CORNER_RADIUS);
      setAttr(elem, 'ry', this.CORNER_RADIUS);

      setAttr(elem, 'stroke', style.lineColor);
      setAttr(elem, 'stroke-width', style.borderWidth);
      setAttr(elem, 'fill', this.bgColor);
      setAttr(elem, 'fill-opacity', style.fillOpacity);

      if (this.name) {
        setAttr(elem, 'name', this.name);
      }
      applyCustomCssStyle(elem, this.customRectCssStyle);
      return [elem];
    }
  }

  /**
   * A rect shape with some text support.
   */
  export class Rect extends Shape {
    // You should only use one of the following.
    public texts: string[] = [];  // multiline texts starting from top-left corner.
    public centeredText: string = ''; // centered single line of text.

    // Used to change rect and text styles.
    public customRectCssStyle: CssStyle = {};
    public customTextCssStyle: CssStyle = {};

    override getElements(style: Style): ZSVGElement[] {
      const elements = [];

      const rect = new _Rect();
      rect.copyProperties(this);
      rect.customRectCssStyle = this.customRectCssStyle;
      if (this.name) {
        // Pass the name to the actual rect element.
        rect.name = this.name;
      }
      elements.push(...rect.getElements(style));

      if (this.texts.length) {
        const multilineTexts = new MultilineTexts(this.texts);
        multilineTexts.copyProperties(this);
        multilineTexts.customTextCssStyle = this.customTextCssStyle;
        elements.push(...multilineTexts.getElements(style));
      }

      if (this.centeredText) {
        const centeredText = new _CenteredText(this.centeredText);
        centeredText.copyProperties(this);
        centeredText.customTextCssStyle = this.customTextCssStyle;
        elements.push(...centeredText.getElements(style));
      }

      return elements;
    }
  }

  /**
   * Borderless container to stack multiple shapes by providing a x and y shift for background shapes.
   */
  class StackContainer extends Shape {

    // Shifts in x and y for each stacked shape.
    public shiftX = 10;  // half of shiftY is a good choice.
    public shiftY = 25;  // style.textFontSize + 10 is a good choice.
    // Shapes to tile, background to foreground. All shapes will be set to the container's size.
    public shapes: Shape[] = [];

    constructor() {
      super();
    }

    // @Override
    override getElements(style: Style): ZSVGElement[] {
      if (!this.shapes.length) {
        return [];
      }

      const numOfShapes = this.shapes.length;
      const shapeWidth = this.width - this.shiftX * (numOfShapes - 1);
      const shapeHeight = this.height - this.shiftY * (numOfShapes - 1);

      const elements = [];
      let accumulatedShiftX = 0;
      let accumulatedShiftY = 0;
      for (const shape of this.shapes) {
        shape.x = this.x + accumulatedShiftX;
        shape.y = this.y + accumulatedShiftY;
        shape.width = shapeWidth;
        shape.height = shapeHeight;
        elements.push(...shape.getElements(style));
        accumulatedShiftX += this.shiftX;
        accumulatedShiftY += this.shiftY;
      }

      return elements;
    }
  }

  /**
   * Borderless container to show multiple shapes in tile layout.
   */
  class TileContainer extends Shape {
    // How many shapes to put per row. Affects how shapes are resized.
    public numOfShapesPerRow = 3;
    // Gap size between shapes.
    public gapX = 10;
    public gapY = 10;
    // Shapes to tile. All shapes will be reshaped according to the container's size.
    public shapes: Shape[] = [];

    constructor() {
      super();
    }

    // @Override
    override getElements(style: Style): ZSVGElement[] {
      if (!this.shapes.length) {
        return [];
      }

      const numOfRows = Math.ceil(this.shapes.length / this.numOfShapesPerRow);
      const shapeWidth = (this.width - (this.numOfShapesPerRow - 1) * this.gapX) / this.numOfShapesPerRow;
      const shapeHeight = (this.height - (numOfRows - 1) * this.gapY) / numOfRows;

      const elements = [];
      for (const [idx, shape] of this.shapes.entries()) {
        const colIdx = idx % this.numOfShapesPerRow;
        const rowIdx = Math.floor(idx / this.numOfShapesPerRow);
        shape.x = this.x + (this.gapX + shapeWidth) * colIdx;
        shape.y = this.y + (this.gapY + shapeHeight) * rowIdx;
        shape.width = shapeWidth;
        shape.height = shapeHeight;
        elements.push(...shape.getElements(style));
      }

      return elements;
    }
  }

  /**
   * A container providing a title for a child shape.
   */
  class TitledContainer extends Shape {
    public title = '';  // Title text.
    public childGapX = 10;  // Child gap in x, affects both left and right of the child.
    public childGapY = 5;  // Child gap in x, affects both top and bottom of the child.
    public childShiftY = 20; // Child shift in y (to avoid title text), affects only top. `style.textFontSize + 10` is a good choice.
    public childShape?: Shape;  // Child shape. Will be resized when rendering.

    constructor() {
      super();
    }

    // @Implement
    override getElements(style: Style): ZSVGElement[] {
      if (!this.childShape) {
        return [];
      }

      const elements = [];

      const rect = new Rect();
      rect.copyProperties(this);
      rect.texts = [this.title];
      if (this.name) {
        rect.name = this.name;
      }
      elements.push(...rect.getElements(style));

      this.childShape.x = this.x + this.childGapX;
      this.childShape.y = this.y + this.childGapY + this.childShiftY;
      this.childShape.width = this.width - this.childGapX * 2;
      this.childShape.height = this.height - this.childGapY * 2 - this.childShiftY;
      elements.push(...this.childShape.getElements(style));

      return elements;
    }
  }

  /**
   * A raw polygon with border etc., no text.
   */
  abstract class _Polygon extends Shape {

    // Returns a list of vertices as one string like polygon element's points
    // attribute.
    abstract getPoints(): string;

    // @Implement
    override getElements(style: Style): ZSVGElement[] {
      const elem = createSvgElement('polygon');
      setAttr(elem, 'points', this.getPoints());

      setAttr(elem, 'stroke', style.lineColor);
      setAttr(elem, 'stroke-width', style.borderWidth);
      setAttr(elem, 'fill', this.bgColor);
      setAttr(elem, 'fill-opacity', style.fillOpacity);

      if (this.name) {
        setAttr(elem, 'name', this.name);
      }
      return [elem];
    }
  }

  /**
   * A polygon with centered text support.
   */
  class ShapeWithCenteredText extends Shape {
    public getShape?: () => Shape;  // function that returns a shape without text.
    public text = '';  // centered single line of text.

    constructor() {
      super();
    }

    // @Implement
    override getElements(style: Style): ZSVGElement[] {
      if (!this.getShape) {
        throw new Error('you need to set getShape function first');
      }
      const elements = [];

      const shape = this.getShape();
      shape.copyProperties(this);
      if (this.name) {
        // Pass the name to the actual rect element.
        shape.name = this.name;
      }
      elements.push(...shape.getElements(style));

      if (this.text) {
        const centeredText = new _CenteredText(this.text);
        centeredText.copyProperties(this);
        elements.push(...centeredText.getElements(style));
      }

      return elements;
    }
  }

  /**
   * A raw diamond shape without text. Use WithCenteredText to add text to it.
   */
  class Diamond extends _Polygon {

    // @Implement
    override getPoints(): string {
      const left = this.x;
      const right = this.x + this.width;
      const top = this.y;
      const bottom = this.y + this.height;
      const midX = this.x + this.width / 2;
      const midY = this.y + this.height / 2;
      return `${midX} ${top} ${right} ${midY} ${midX} ${bottom} ${left} ${midY}`;
    }
  }



}  // namespace svg
