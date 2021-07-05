function createSvgElement(tagName) {
  return document.createElementNS('http://www.w3.org/2000/svg', tagName);
}

/*
interface Point {
    x: float;
    y: float;
}
*/

class Style {
  borderWidth = 2;
  fillOpacity = 0.9;
  lineColor = '#545961';
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

    const defsElement = createSvgElement('defs');
    defsElement.innerHTML = `
            <marker id="endarrow" markerWidth="10" markerHeight="5" refX="10" refY="2.5" orient="auto" markerUnits="strokeWidth">
                <polygon points="0 0, 10 2.5, 0 5" fill="${this.style.lineColor}" />
            </marker>
        `;
    svgElement.append(defsElement);

    for (const element of this.elements) {
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
  }

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
    this.hasArrow = true;
  }

  addTo(/* SVGRenderer */renderer) {
    for (const elem of this.getElements(renderer.style)) {
      elem.setAttribute('stroke', renderer.style.lineColor);
      elem.setAttribute('stroke-width', renderer.style.linkWidth);
      elem.setAttribute('fill', 'transparent');
      renderer.addElement(elem, this.Z_VALUE);
    }
  }

  // @Abstract
  getElements(/* Style */style) {
    throw new Error('not implemented');
  }
}
