/**
 * Multiline texts, parent is optional.
 */
class MultilineTexts extends Shape {
  GAP_LEFT = 5;  // space to the left of the text.

  constructor(lineOfTexts) {
    super();
    this.lineOfTexts = lineOfTexts;
  }

  // @Override
  copyProperties(/* Shape */other) {
    this.x = other.x;
    this.y = other.y;
    this.bgColor = other.bgColor;
    this.zValue = other.zValue;
  }

  // @Implement
  getElements(/* Style */style) {
    const elem = createSvgElement('text');
    elem.setAttribute('x', this.x);
    elem.setAttribute('y', this.y);
    elem.setAttribute('font-size', style.textFontSize);

    for (const lineOfText of this.lineOfTexts) {
      const textElement = createSvgElement('tspan');
      textElement.setAttribute('x', this.x + this.GAP_LEFT);
      textElement.setAttribute('dy', style.textLineSpace);
      textElement.textContent = lineOfText;
      elem.append(textElement);
    }
    return [elem];
  }
}

/**
 * A single line of text centered in a region.
 */
class _CenteredText extends Shape {
  constructor(singleLineOfText) {
    super();
    this.text = singleLineOfText;
  }

  // @Implement
  getElements(/* Style */style) {
    const elem = createSvgElement('text');
    const center = this.getCenter();
    elem.setAttribute('x', center.x);
    elem.setAttribute('y', center.y);
    elem.setAttribute('font-size', style.textFontSize);
    elem.setAttribute('dominant-baseline', 'middle');
    elem.setAttribute('text-anchor', 'middle');
    elem.textContent = this.text;
    return [elem];
  }
}

/**
 * A raw rect with border etc., no text.
 */
class _Rect extends Shape {
  CORNER_RADIUS = 5;

  // @Implement
  getElements(/* Style */style) {
    const elem = createSvgElement('rect');
    elem.setAttribute('x', this.x);
    elem.setAttribute('y', this.y);
    elem.setAttribute('width', this.width);
    elem.setAttribute('height', this.height);
    elem.setAttribute('rx', this.CORNER_RADIUS);
    elem.setAttribute('ry', this.CORNER_RADIUS);

    elem.setAttribute('stroke', style.lineColor);
    elem.setAttribute('stroke-width', style.borderWidth);
    elem.setAttribute('fill', this.bgColor);
    elem.setAttribute('fill-opacity', style.fillOpacity);
    return [elem];
  }
}

/**
 * A rect shape with some text support.
 */
class Rect extends Shape {
  constructor() {
    super();

    // You should only use one of the following.
    this.texts = [];  // multiline texts starting from top-left corner.
    this.centeredText = '';  // centered single line of text.
  }

  // @Implement
  getElements(/* Style */style) {
    const elements = [];

    const rect = new _Rect();
    rect.copyProperties(this);
    elements.push(...rect.getElements(style));

    if (this.texts.length) {
      const multilineTexts = new MultilineTexts(this.texts);
      multilineTexts.copyProperties(this);
      elements.push(...multilineTexts.getElements(style));
    }

    if (this.centeredText) {
      const centeredText = new _CenteredText(this.centeredText);
      centeredText.copyProperties(this);
      elements.push(...centeredText.getElements(style));
    }

    return elements;
  }
}

/**
 * Stack multiple shapes by providing a x and y shift for background shapes.
 */
class StackContainer extends Shape {
  constructor() {
    super();

    // Shifts in x and y for each stacked shape.
    this.shiftX = 10;  // half of shiftY is a good choice.
    this.shiftY = 25;  // style.textFontSize + 10 is a good choice.
    // Shapes to tile, background to foreground. All shapes will be set to the container's size.
    this.shapes = [];
  }

  // @Override
  getElements(/* Style */style) {
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
 * Show multiple shapes in tile layout.
 */
class TileContainer extends Shape {
  constructor() {
    super();

    // How many shapes to put per row. Affects how shapes are resized.
    this.numOfShapesPerRow = 3;
    // Gap size between shapes.
    this.gapX = 10;
    this.gapY = 10;
    // Shapes to tile. All shapes will be reshaped according to the container's size.
    this.shapes = [];
  }

  // @Override
  getElements(/* Style */style) {
    if (!this.shapes.length) {
      return [];
    }

    const numOfRows = Math.ceil(this.shapes.length / this.numOfShapesPerRow);
    const shapeWidth = (this.width - (this.numOfShapesPerRow - 1) * this.gapX) / this.numOfShapesPerRow;
    const shapeHeight = (this.height - (numOfRows - 1) * this.gapY) / numOfRows;

    const elements = [];
    for (const idx in this.shapes) {
      const shape = this.shapes[idx];

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
  constructor() {
    super();

    this.title = '';  // Title text.
    this.childGapX = 10;  // Child gap in x, affects both left and right of the child.
    this.childGapY = 5;  // Child gap in x, affects both top and bottom of the child.
    this.childShiftY = 20; // Child shift in y (to avoid title text), affects only top. `style.textFontSize + 10` is a good choice.
    this.childShape = undefined;  // Child shape. Will be resized when rendering.
  }

  // @Implement
  getElements(/* Style */style) {
    if (!this.childShape) {
      return [];
    }

    const elements = [];

    const rect = new Rect();
    rect.copyProperties(this);
    rect.texts = [this.title];
    elements.push(...rect.getElements(style));

    this.childShape.x = this.x + this.childGapX;
    this.childShape.y = this.y + this.childGapY + this.childShiftY;
    this.childShape.width = this.width - this.childGapX * 2;
    this.childShape.height = this.height - this.childGapY * 2 - this.childShiftY;
    elements.push(...this.childShape.getElements(style));

    return elements;
  }
}
