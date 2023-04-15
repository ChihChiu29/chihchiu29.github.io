namespace svg {
  export class ZSVGElement extends SVGElement {
    public zValue: number = 1;
    public zsvgCustomStyle?: CssStyle;
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
  // Returns a new style merged from base with override.
  export function mergeCssStyles(base: CssStyle, override: CssStyle): CssStyle {
    return { ...base, ...override };
  }
  function applyCustomCssStyle(elem: ZSVGElement, cssStyle: CssStyle) {
    for (const [key, value] of Object.entries(cssStyle)) {
      setAttr(elem, key, value);
    }
  }

  export interface RenderReport {
    dimension: geometry.BoundingRect;
    message: string;
  }

  /**
   * Helper to draw an SVG. Create one per draw action.
   */
  export class SVGRenderer {
    public hostElement: HTMLElement;
    private svgElement: SVGSVGElement;
    public style: Style = new Style();

    public left: number = 0;
    public top: number = 0;
    public width: number = 0;
    public height: number = 0;

    public useGrid: boolean = true;

    private elements: ZSVGElement[] = [];

    constructor(hostElement: HTMLElement) {
      this.hostElement = hostElement;

      let svgElement = this.hostElement.querySelector('svg');
      if (svgElement) {
        svgElement.remove();
      }
      this.svgElement = createSvgSvgElement();
      this.hostElement.append(this.svgElement);
    }

    // Needs to be called after graphElement is no longer modified.
    public addGraphElement(graphElement: GraphElement) {
      for (const elem of graphElement.getElements(this.style, this.svgElement)) {
        this.addElement(elem, elem.zValue);
      }
    }

    private addElement(element: ZSVGElement, zValue: number) {
      element.zValue = zValue;
      this.elements.push(element);
    }

    public draw(): RenderReport {
      const svgElement = this.svgElement;
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

      const report: RenderReport = {
        dimension: {
          x: NaN,
          y: NaN,
          width: NaN,
          height: NaN,
        },
        message: '',
      };
      for (const element of this.elements.sort((e1, e2) => { return e1.zValue - e2.zValue; })) {
        svgElement.append(element);
        report.dimension = geometry.getMinimalCommonBoundingRect(report.dimension, element.getBoundingClientRect());
      }

      return report;
    }
  }

  export abstract class GraphElement {
    public abstract getElements(style: Style, svgElement: SVGSVGElement): ZSVGElement[];
  }

  export abstract class Shape extends GraphElement {
    public x = 0;
    public y = 0;
    public width = 100;
    public height = 30;
    public bgColor = '#f5f3ed';
    public zValue = 1;

    public name: string | undefined;

    public getElements(style: Style, svgElement: SVGSVGElement): ZSVGElement[] {
      const elements = this.getElementsImpl(style, svgElement)
      elements.map((elem) => { elem.zValue = this.zValue });
      return elements;
    }
    public abstract getElementsImpl(style: Style, svgElement: SVGSVGElement): ZSVGElement[];

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
      if (direction === 'up' || direction === 'top') {
        return this.getUpMiddle();
      } else if (direction === 'down' || direction === 'bottom') {
        return this.getDownMiddle();
      } else if (direction === 'left') {
        return this.getLeftMiddle();
      } else if (direction === 'right') {
        return this.getRightMiddle();
      }
      throw new Error('direction not implemented');
    }
  }

  export abstract class Link extends GraphElement {
    public from: geometry.Point = { x: 0, y: 0 };
    public to: geometry.Point = { x: 100, y: 100 };
    public hasArrow: number = 1;  // 0: no arrow, 1: endarrow, 2: startarrow, 3: both
  }

  // From: https://github.com/dowjones/svg-text
  class MagicText extends Shape {
    public text: string;
    public textAlignToCenter = true;  // otherwise to left
    public textVerticalAlignToCenter = true;  // otherwise to top
    public outerWidth?: number; // with of texts; default to element width
    public customTextCssStyle: CssStyle = {};

    constructor(text: string) {
      super();
      this.text = text;
    }

    override copyProperties(other: Shape) {
      this.x = other.x;
      this.y = other.y;
      this.width = other.width;
      this.height = other.height;
      this.bgColor = other.bgColor;
      this.zValue = other.zValue;
    }

    override getElementsImpl(style: Style, svgElement: SVGSVGElement): ZSVGElement[] {
      const center = this.getCenter();

      // Requires `svg-text.js` in HTML.
      // @ts-ignore
      const SvgText = window.SvgText.default;
      const svgTextOption = {
        text: this.text,
        element: svgElement,
        x: this.textAlignToCenter ? center.x : this.x,
        y: this.textVerticalAlignToCenter ? center.y : this.y,
        outerWidth: this.outerWidth ? this.outerWidth : this.width,
        outerHeight: this.height,
        align: this.textAlignToCenter ? 'center' : 'left',
        verticalAlign: this.textVerticalAlignToCenter ? 'middle' : 'top',
        padding: this.textAlignToCenter ? 0 : '0 0 0 5',
        textOverflow: 'ellipsis',
      };
      const svgText = new SvgText(svgTextOption);
      const elem = svgText.text;
      elem.zsvgCustomStyle = this.customTextCssStyle;

      if (this.name) {
        setAttr(elem, 'name', this.name);
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
    override getElementsImpl(style: Style, svgElement: SVGSVGElement): ZSVGElement[] {
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
    override getElementsImpl(style: Style, svgElement: SVGSVGElement): ZSVGElement[] {
      const elem = createSvgElement('rect');
      elem.zsvgCustomStyle = this.customRectCssStyle;
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
    public text: string = '';
    public textAlignToCenter = true;  // otherwise to left
    public textVerticalAlignToCenter = true;  // otherwise to top
    public outerWidth?: number; // with of texts; default to element width

    // Used to change rect and text styles.
    public customRectCssStyle: CssStyle = {};
    public customTextCssStyle: CssStyle = {};

    override getElementsImpl(style: Style, svgElement: SVGSVGElement): ZSVGElement[] {
      const elements = [];

      const rect = new _Rect();
      rect.copyProperties(this);
      rect.customRectCssStyle = this.customRectCssStyle;
      if (this.name) {
        // Pass the name to the actual rect element.
        rect.name = this.name;
      }
      elements.push(...rect.getElements(style, svgElement));

      if (this.text) {
        const textElem = new MagicText(this.text);
        textElem.copyProperties(this);
        textElem.textAlignToCenter = this.textAlignToCenter;
        textElem.textVerticalAlignToCenter = this.textVerticalAlignToCenter;
        textElem.outerWidth = this.outerWidth;
        textElem.customTextCssStyle = this.customTextCssStyle;
        elements.push(...textElem.getElements(style, svgElement));
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
    override getElementsImpl(style: Style, svgElement: SVGSVGElement): ZSVGElement[] {
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
        elements.push(...shape.getElements(style, svgElement));
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
    override getElementsImpl(style: Style, svgElement: SVGSVGElement): ZSVGElement[] {
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
        elements.push(...shape.getElements(style, svgElement));
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
    override getElementsImpl(style: Style, svgElement: SVGSVGElement): ZSVGElement[] {
      if (!this.childShape) {
        return [];
      }

      const elements = [];

      const rect = new Rect();
      rect.copyProperties(this);
      rect.text = this.title;
      rect.textVerticalAlignToCenter = false;
      if (this.name) {
        rect.name = this.name;
      }
      elements.push(...rect.getElements(style, svgElement));

      this.childShape.x = this.x + this.childGapX;
      this.childShape.y = this.y + this.childGapY + this.childShiftY;
      this.childShape.width = this.width - this.childGapX * 2;
      this.childShape.height = this.height - this.childGapY * 2 - this.childShiftY;
      elements.push(...this.childShape.getElements(style, svgElement));

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
    override getElementsImpl(style: Style, svgElement: SVGSVGElement): ZSVGElement[] {
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
    override getElementsImpl(style: Style, svgElement: SVGSVGElement): ZSVGElement[] {
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
      elements.push(...shape.getElements(style, svgElement));

      if (this.text) {
        const centeredText = new _CenteredText(this.text);
        centeredText.copyProperties(this);
        elements.push(...centeredText.getElements(style, svgElement));
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


  // ---------------- LINKS BELOW ---------------------------------------------

  const DEFAULT_SHAPE = new Rect();

  /**
 * A generic path-based link.
 */
  abstract class LinkPath extends Link {
    public text: string = '';
    public dashed: boolean = false;

    // The actual path command.
    abstract getPathCommand(): string;

    override getElements(style: Style, svgElement: SVGSVGElement) {
      const elements = [];

      const elem = createSvgElement('path');
      const cmd = this.getPathCommand();
      elem.setAttribute('d', cmd);
      const pathId = this.computeUniqueId(cmd);
      elem.setAttribute('id', pathId);
      elem.setAttribute('stroke', style.lineColor);
      elem.setAttribute('stroke-width', `${style.linkWidth}`);
      elem.setAttribute('fill', 'transparent');
      if (this.hasArrow === 1) {
        elem.setAttribute('marker-end', 'url(#endarrow)');
      } else if (this.hasArrow === 2) {
        elem.setAttribute('marker-start', 'url(#startarrow)');
      } else if (this.hasArrow === 3) {
        elem.setAttribute('marker-start', 'url(#startarrow)');
        elem.setAttribute('marker-end', 'url(#endarrow)');
      }
      if (this.dashed) {
        elem.setAttribute('stroke-dasharray', '5,5');
      }
      elements.push(elem);

      if (this.text) {
        const textElement = createSvgElement('text');
        textElement.setAttribute('text-anchor', 'middle');
        textElement.setAttribute('dy', `${- style.linkTextGapSize}`);
        textElement.innerHTML = `<textPath href="#${pathId}" startOffset="50%">${this.text}</textPath>`;
        elements.push(textElement);
      }

      return elements;
    }

    // Computes a unique ID from the path string.
    protected computeUniqueId(pathCommand: string): string {
      const cmd = pathCommand.replaceAll(' ', '');
      return `LinkPath_cmd_${cmd}`;
    }
  }

  class LinkStraight extends LinkPath {
    override getPathCommand() {
      return `M ${this.from.x} ${this.from.y} L ${this.to.x} ${this.to.y}`;
    }
  }

  class LinkSingleCurved extends LinkPath {
    // Optional control points.
    // See: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
    public ctrl1?: geometry.Point;
    public ctrl2?: geometry.Point;

    // @Implement
    getPathCommand() {
      if (!this.ctrl1) {
        this.ctrl1 = this.from;
      }
      if (!this.ctrl2) {
        this.ctrl2 = geometry.getMiddlePoint(this.from, this.to);
      }

      return `M ${this.from.x} ${this.from.y} C ${this.ctrl1.x} ${this.ctrl1.y}, ${this.ctrl2.x} ${this.ctrl2.y}, ${this.to.x} ${this.to.y}`;
    }
  }

  /**
   * A straight link, using postponed coordinates fetched from connected shapes.
   */
  export class SmartLinkStraight extends LinkStraight {
    public fromShape: Shape = DEFAULT_SHAPE;
    public fromDirection: string = 'right';  // up/down/left/right
    public toShape: Shape = DEFAULT_SHAPE;
    public toDirection = 'left';  // up/down/left/right

    // NOT used; adding here to match interface from SmartLinkSingleCurved.
    public sharpness: number = 0;

    // @Override
    getPathCommand() {
      _smartReConnection(this);
      this.from = this.fromShape.getConnectionPoint(this.fromDirection);
      this.to = this.toShape.getConnectionPoint(this.toDirection);
      return super.getPathCommand();
    }
  }

  /**
   * A singlely curved link, using postponed coordinates fetched from connected shapes.
   */
  export class SmartLinkSingleCurved extends LinkSingleCurved {
    public fromShape: Shape = DEFAULT_SHAPE;
    public fromDirection: string = 'right';  // up/down/left/right
    public toShape: Shape = DEFAULT_SHAPE;
    public toDirection = 'left';  // up/down/left/right

    // Controls how "sharp" the turn is.
    public sharpness: number = 0.9;

    // @Override
    getPathCommand() {
      _smartReConnection(this);
      this._setParamsFromShapes();
      return super.getPathCommand();
    }

    _setParamsFromShapes() {
      const fromShape = this.fromShape;
      const toShape = this.toShape;
      const fromDirection = this.fromDirection;
      const toDirection = this.toDirection;

      const error = `no pretty link from ${fromDirection} to ${toDirection}`;
      const fromP = fromShape.getConnectionPoint(fromDirection);
      const toP = toShape.getConnectionPoint(toDirection);
      if (toP.x > fromP.x) {
        if (fromDirection === 'left' || toDirection === 'right') {
          console.log(error);
        }
      } else if (toP.x < fromP.x) {
        if (fromDirection === 'right' || toDirection === 'left') {
          console.log(error);
        }
      }
      if (toP.y > fromP.y) {
        if (fromDirection === 'up' || toDirection === 'down') {
          console.log(error);
        }
      } else if (toP.y < fromP.y) {
        if (fromDirection === 'down' || toDirection === 'up') {
          console.log(error);
        }
      }

      this.from = fromP;
      this.to = toP;
      this.ctrl1 = { x: 0, y: 0 };
      this.ctrl2 = { x: 0, y: 0 };

      if (fromDirection === 'up' || fromDirection === 'down') {
        this.ctrl1.x = fromP.x;
        this.ctrl1.y = toP.y;
      } else {
        this.ctrl1.x = toP.x;
        this.ctrl1.y = fromP.y;
      }

      if (toDirection === 'up' || toDirection === 'down') {
        this.ctrl2.x = toP.x;
        this.ctrl2.y = fromP.y;
      } else {
        this.ctrl2.x = fromP.x;
        this.ctrl2.y = toP.y;
      }

      const mid = geometry.getMiddlePoint(this.from, this.to);
      this.ctrl2.x = this.ctrl2.x * this.sharpness + mid.x * (1 - this.sharpness);
      this.ctrl2.y = this.ctrl2.y * this.sharpness + mid.y * (1 - this.sharpness);
    }
  }

  /**
   * Possibly change connection direction for other considerations (etc. make text left to right).
   */
  function _smartReConnection(smartLink: SmartLinkStraight | SmartLinkSingleCurved) {
    const from = smartLink.fromShape.getConnectionPoint(smartLink.fromDirection);
    const to = smartLink.toShape.getConnectionPoint(smartLink.toDirection);
    if (from.x <= to.x) {
      return;
    }

    const oldFromShape = smartLink.fromShape;
    smartLink.fromShape = smartLink.toShape;
    smartLink.toShape = oldFromShape;
    const oldFromDirection = smartLink.fromDirection;
    smartLink.fromDirection = smartLink.toDirection;
    smartLink.toDirection = oldFromDirection;
    if (smartLink.hasArrow === 1) {
      smartLink.hasArrow = 2;
    } else if (smartLink.hasArrow === 2) {
      smartLink.hasArrow = 1;
    }
  }

}  // namespace svg
