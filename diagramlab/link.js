/**
 * A generic path-based link.
 */
class LinkPath extends Link {
  // @Abstract
  getPathCommand() {
    throw new Error('path command not implemented');
  }

  // @Implement
  getElements(/* Style */style) {
    const elem = createSvgElement('path');
    elem.setAttribute('d', this.getPathCommand());
    if (this.hasArrow) {
      elem.setAttribute('marker-end', 'url(#endarrow)');
    }
    return [elem];
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

    retur `M ${this.from.x} ${this.from.y}
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

class LinkSmartSingleCurved extends LinkSingleCurved {
  setParamsFromShapes(
    /*Shape*/fromShape,
    /*string*/fromDirection,  // up/down/left/right
    /*Shape*/toShape,
    /*string*/toDirection,  // up/down/left/right
  ) {
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
