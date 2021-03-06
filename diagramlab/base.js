function createSvgElement(tagName) {
  return document.createElementNS('http://www.w3.org/2000/svg', tagName);
}

/*
interface Point {
  x: float;
  y: float;
}

interface BoundingRect {
  x: float;
  y: float;
  width: float;
  height: float;
}
*/

class Style {
  borderWidth = 2;
  fillOpacity = 0.9;
  lineColor = '#545961';
  linkTextGapSize = 5;  // space between text and link.
  linkWidth = 2;
  textFontSize = 15;
  textLineSpace = '1.2em';
}

/**
 * Helper to draw an SVG. Create one per draw action.
 */
class SVGRenderer {
  constructor(hostElement, style = new Style()) {
    this.hostElement = hostElement;
    this.style = style;

    this.left = 0;
    this.top = 0;
    this.width = 640;
    this.height = 480;
    this.useGrid = true;

    this.elements = [];
  }

  addElement(element, zValue) {
    element.zValue = zValue;
    this.elements.push(element);
  }

  draw() {
    let svgElement = this.hostElement.querySelector('svg');
    if (svgElement) {
      svgElement.remove();
    }
    svgElement = createSvgElement('svg');
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

class Shape {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.width = 100;
    this.height = 30;
    this.bgColor = '#f5f3ed';
    this.zValue = 1;

    // Optional properties.
    this.name = undefined;
  }

  /**
   * Copy geometry and style properties.
   */
  copyProperties(/* Shape */other) {
    this.x = other.x;
    this.y = other.y;
    this.width = other.width;
    this.height = other.height;
    this.bgColor = other.bgColor;
    this.zValue = other.zValue;
  }

  addTo(renderer) {
    for (const elem of this.getElements(renderer.style)) {
      renderer.addElement(elem, this.zValue);
    }
  }

  // @Abstract
  getElements(/* Style */style) {
    throw new Error('not implemented');
  }

  getCenter() {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
  }

  getUpMiddle() {
    return { x: this.getCenter().x, y: this.y };
  }

  getDownMiddle() {
    return { x: this.getCenter().x, y: this.y + this.height };
  }

  getLeftMiddle() {
    return { x: this.x, y: this.getCenter().y };
  }

  getRightMiddle() {
    return { x: this.x + this.width, y: this.getCenter().y };
  }

  getConnectionPoint(/*string*/direction) {
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

class Link {
  Z_VALUE = 99999;

  constructor() {
    this.from = { x: 0, y: 0 };
    this.to = { x: 100, y: 100 };
    this.hasArrow = 1;  // 0: no arrow, 1: endarrow, 2: startarrow, 3: both
  }

  addTo(/* SVGRenderer */renderer) {
    for (const elem of this.getElements(renderer.style)) {
      renderer.addElement(elem, this.Z_VALUE);
    }
  }

  // @Abstract
  getElements(/* Style */style) {
    throw new Error('not implemented');
  }
}
