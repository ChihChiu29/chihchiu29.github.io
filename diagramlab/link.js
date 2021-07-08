/**
 * A generic path-based link.
 */
class LinkPath extends Link {
  constructor() {
    super();
    this.text = '';
    this.dashed = false;
  }

  // @Abstract
  getPathCommand() {
    throw new Error('path command not implemented');
  }

  // @Implement
  getElements(/* Style */style) {
    const elements = [];

    const elem = createSvgElement('path');
    const cmd = this.getPathCommand();
    elem.setAttribute('d', cmd);
    const pathId = this.computeUniqueId(cmd);
    elem.setAttribute('id', pathId);
    elem.setAttribute('stroke', style.lineColor);
    elem.setAttribute('stroke-width', style.linkWidth);
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
      textElement.setAttribute('dy', -style.linkTextGapSize);
      textElement.innerHTML = `<textPath href="#${pathId}" startOffset="50%">${this.text}</textPath>`;
      elements.push(textElement);
    }

    return elements;
  }

  // Computes a unique ID from the path string.
  computeUniqueId(pathCommand) {
    const cmd = pathCommand.replaceAll(' ', '');
    return `LinkPath_cmd_${cmd}`;
  }
}

/**
 * A straight link.
 */
class LinkStraight extends LinkPath {
  // @Implement
  getPathCommand() {
    return `M ${this.from.x} ${this.from.y} L ${this.to.x} ${this.to.y}`;
  }
}

class LinkDoubleCurved extends LinkPath {
  constructor() {
    super();

    // See: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
    // Example: <path d="M 10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80" stroke="black" fill="transparent"/>
    this.ctrl1 = undefined;  // starting slope.
    this.middle = undefined;  // mid point.
    this.ctrl2 = undefined;  // with middle: mid point slope (it's closer to ctrl1).
    this.ctrl3 = undefined;  // ending slope.
  }

  // @Implement
  getPathCommand() {
    if (!this.ctrl1) {
      this.ctrl1 = this.from;
    }
    if (!this.middle) {
      this.middle = { x: (this.from.x + this.to.x) / 2, y: (this.from.y + this.to.y) / 2 };
    }
    if (!this.ctrl2) {
      this.ctrl2 = this.middle;
    }
    if (!this.ctrl3) {
      this.ctrl3 = this.to;
    }

    retur`M ${this.from.x} ${this.from.y}
    C ${this.ctrl1.x} ${this.ctrl1.y}, ${this.ctrl2.x} ${this.ctrl2.y}, ${this.middle.x} ${this.middle.y}
    S ${this.ctrl3.x} ${this.ctrl3.y}, ${this.to.x} ${this.to.y}`;
  }
}

class LinkSingleCurved extends LinkPath {
  constructor() {
    super();

    // See: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
    this.ctrl1 = undefined;  // starting slope.
    this.ctrl2 = undefined;  // ending slope.
  }

  // @Implement
  getPathCommand() {
    if (!this.ctrl1) {
      this.ctrl1 = this.from;
    }
    if (!this.ctrl2) {
      this.ctrl2 = this.middle;
    }

    return `M ${this.from.x} ${this.from.y} C ${this.ctrl1.x} ${this.ctrl1.y}, ${this.ctrl2.x} ${this.ctrl2.y}, ${this.to.x} ${this.to.y}`;
  }
}

/**
 * Possibly change connection direction for other considerations (etc. make text left to right).
 */
function _smartReConnection(/*SmartLinkStraight|SmartLinkSingleCurved*/smartLink) {
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

/**
 * A straight link, using postponed coordinates fetched from connected shapes.
 */
class SmartLinkStraight extends LinkStraight {
  constructor() {
    super();

    this.fromShape = undefined; /*Shape*/
    this.fromDirection = undefined;  // up/down/left/right
    this.toShape = undefined; /*Shape*/
    this.toDirection = undefined;  // up/down/left/right
  }

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
class SmartLinkSingleCurved extends LinkSingleCurved {
  constructor() {
    super();

    this.fromShape = undefined; /*Shape*/
    this.fromDirection = undefined;  // up/down/left/right
    this.toShape = undefined; /*Shape*/
    this.toDirection = undefined;  // up/down/left/right
  }

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
    this.ctrl1 = {};
    this.ctrl2 = {};

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
  }
}
