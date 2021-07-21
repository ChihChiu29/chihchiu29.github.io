/**
 * Hanles diagram language interpretation. Requires all other files in this directory.
 */

/**
 * Command interpreter.
 * 
 * All commands start with a unique action keyword, followed by space separated parameters.
 */
class DiagramLangInterpreter {
  constructor(/*SVGRenderer*/renderer) {
    this.renderer = renderer;
    this.style = renderer.style;

    this.vars = {};  // variables that can be used in commands.
    this.shapeMap = {};  // all shapes.
    this.links = [];  // all links.
    this.ignoreShapes = [];  // will not draw shapes with these names.
    this.nextZValue = 0;

    // Can be initialized and used by commands.
    this.grid = undefined;

    this.handlerMap = {
      'bgcolor': this.setBgColor.bind(this),
      'diamond': this.createDiamond.bind(this),
      'grid': this.gridInitialize.bind(this),
      'gmove': this.gridMove.bind(this),
      'gridmove': this.gridMove.bind(this),
      'move': this.move.bind(this),
      'rect': this.createRect.bind(this),
      'rectc': this.createRectCenteredText.bind(this),
      'rectcentered': this.createRectCenteredText.bind(this),
      'stack': this.stackShapes.bind(this),
      'text': this.createMultilineText.bind(this),
      'tile': this.tileShapes.bind(this),
      'var': this.defineVar.bind(this),
      'viewport': this.viewport.bind(this),
      '-': this.linkStraight.bind(this),
      '->': this.linkStraight.bind(this),
      '<-': this.linkStraight.bind(this),
      '<->': this.linkStraight.bind(this),
      '--': this.linkStraight.bind(this),
      '-->': this.linkStraight.bind(this),
      '<--': this.linkStraight.bind(this),
      '<-->': this.linkStraight.bind(this),
      '~': this.linkSingleCurved.bind(this),
      '~>': this.linkSingleCurved.bind(this),
      '<~': this.linkSingleCurved.bind(this),
      '<~>': this.linkSingleCurved.bind(this),
      '~~': this.linkSingleCurved.bind(this),
      '~~>': this.linkSingleCurved.bind(this),
      '<~~': this.linkSingleCurved.bind(this),
      '<~~>': this.linkSingleCurved.bind(this),
    }
  }

  // SHOULD NOT DO ANYTHING MORE AFTER THIS CALL.
  finish() {
    for (const shapeName of Object.keys(this.shapeMap)) {
      if (this.ignoreShapes.indexOf(shapeName) >= 0) {
        continue;
      }
      this.shapeMap[shapeName].addTo(this.renderer);
    }
    for (const link of this.links) {
      link.addTo(this.renderer);
    }
  }

  _getNextZValue() {
    this.nextZValue += 1;
    return this.nextZValue;
  }

  _getShape(name) {
    if (!this.shapeMap[name]) {
      throw new Error(`shape with name ${name} does not exist`);
    }
    return this.shapeMap[name];
  }

  _setShape(name, shape) {
    if (this.shapeMap[name]) {
      throw new Error(`shape with name ${name} already exists`);
    }
    shape.zValue = this._getNextZValue();
    this.shapeMap[name] = shape;
  }

  _removeShape(name) {
    this.ignoreShapes.push(name);
  }

  _addLink(link) {
    this.links.push(link);
  }

  /**
   * Splits keyword from a command string, and call corresponding functions.
   */
  handleSingleCommand(/*string*/cmd) {
    if (!cmd || cmd.startsWith('//')) {
      return;  // empty or comment.
    }
    // For easier var matching implementation, since otherwise it's not easy to mute $foo for the line $foobar.
    cmd += ' ';
    for (const varName of Object.keys(this.vars)) {
      cmd = cmd.replaceAll(`${varName} `, `${this.vars[varName]} `);
    }

    try {
      cmd = this._preprocessCmd(cmd);
      console.log(`Processing cmd: "${cmd}"`);
      let cmdArray = cmd.split(' ');
      cmdArray = cmdArray.filter(cmd => cmd.length > 0);

      const keyword = cmdArray[0];
      if (this.handlerMap[keyword]) {
        this.handlerMap[keyword](cmdArray);
      } else {
        throw new Error('command not recoganized')
      }
    } catch (err) {
      alert(`CMD "${cmd}" gives error: "${err}"`);
      throw err;
    }
  }

  /**
   * Returns:
   *   {
   *      left: string to the left of leftDelimiter | original string
   *      right: string to the right of rightDelimiter | undefined
   *      middle: string between left and right delimiters | undefined
   *   }
   * right and middle are undefined if leftDelimiter is not found.
   * If leftDelimiter is found but not rightDelimiter, raise error.
   */
  _splitStringForParsing = (str, leftDelimiter, rightDelimiter) => {
    const leftIdx = str.indexOf(leftDelimiter);
    if (leftIdx < 0) {
      return { left: str };
    }
    const rightIdx = str.indexOf(rightDelimiter);
    if (rightIdx < 0) {
      throw new Error(
        `leftDelimiter ("${leftDelimiter}") and rightDelimiter ("${rightDelimiter}") does not match in "${str}"`);
    }

    return {
      left: str.slice(0, leftIdx),
      right: str.slice(rightIdx + rightDelimiter.length),
      middle: str.slice(leftIdx + leftDelimiter.length, rightIdx),
    };
  }

  /**
   * Performs various pre-processing on the commands.
   */
  _preprocessCmd(cmd) {
    cmd = cmd.trim();

    // Replace special syntax: "${name.property}"
    // Supports property: left, right, up, down, width, height
    while (true) {
      const result = this._splitStringForParsing(cmd, '${', '}');
      if (!result.right) {
        break;
      }
      const midPair = result.middle.trim().split('.');
      if (midPair.length != 2) {
        throw new Error(`does not know how to interprete ${result.middle}`);
      }
      const shape = this._getShape(midPair[0]);
      let midResult;
      switch (midPair[1]) {
        case 'left':
          midResult = shape.x;
          break;
        case 'right':
          midResult = shape.x + shape.width;
          break;
        case 'up':
          midResult = shape.y;
          break;
        case 'down':
          midResult = shape.y + shape.height;
          break;
        case 'width':
          midResult = shape.width;
          break;
        case 'height':
          midResult = shape.height;
          break;
        default:
          throw new Error(`does not understand property "${midPair[1]}" of shape "${midPair[0]}"`);
      }
      cmd = `${result.left}${midResult}${result.right}`;
    }

    // Replace special syntax: "(math expression)"
    // Note that it's ok to use "( )" for non-math expression, but doing so
    // will prevents all math expression to the right of it being processed.
    while (true) {
      const result = this._splitStringForParsing(cmd, '(', ')');
      if (!result.right) {
        break;
      }
      const midResult = MATH_PARSER.parse(result.middle);
      if (isNaN(midResult)) {
        break;  // not math expression, no change on cmd.
      }
      cmd = `${result.left}${midResult}${result.right}`;
    }

    return cmd;
  }

  /**
   * Creates a Diamond shape with centered text.
   * 
   * Syntax:
   *   diamond [name] [single line text]
   */
  createDiamond(cmdArray) {
    this.createPolygon(cmdArray, () => { return new Diamond(); });
  }

  /**
   * Creates an area for multiline texts.
   * 
   * Syntax:
   *   text [name] [multiline text (break line with "\n")]
   */
  createMultilineText(cmdArray) {
    const name = cmdArray[1];
    const text = cmdArray.splice(2).join(' ');
    const multilineTexts = text.split('\\n');
    const elem = new MultilineTexts(multilineTexts);
    elem.name = name;

    this._setShape(name, elem);
  }

  /**
   * Creates a Polygon shape with centered text.
   * 
   * To help to create syntax:
   *   [polygon type] [name] [single line text]
   */
  createPolygon(cmdArray, getShapeFunction) {
    const name = cmdArray[1];
    const text = cmdArray.splice(2).join(' ');
    const shape = new ShapeWithCenteredText();
    shape.getShape = getShapeFunction;
    shape.text = text;
    shape.name = name;

    this._setShape(name, shape);
  }

  /**
   * Creates a Rect with multiline text.
   * 
   * Syntax:
   *   rect [rect name] [multiline text (break line with "\n")]
   */
  createRect(cmdArray) {
    const name = cmdArray[1];
    const text = cmdArray.splice(2).join(' ');
    const multilineTexts = text.split('\\n');
    const rect = new Rect();
    rect.texts = multilineTexts;
    rect.name = name;

    this._setShape(name, rect);
  }

  /**
   * Creates a Rect with centered text.
   * 
   * Syntax:
   *   rectc [rect name] [single line text]
   */
  createRectCenteredText(cmdArray) {
    const name = cmdArray[1];
    const text = cmdArray.splice(2).join(' ');
    const rect = new Rect();
    rect.centeredText = text;
    rect.name = name;

    this._setShape(name, rect);
  }

  /**
   * Defines a variable for following commands.
   * 
   * Syntax:
   *   var [var name] [string values]
   */
  defineVar(cmdArray) {
    const varName = cmdArray[1];
    this.vars[`$${varName}`] = cmdArray.splice(2).join(' ');
  }

  /**
   * Initializes a grid layout. If viewport is changed the current layout would be invalid.
   * 
   * Syntax:
   *   grid [number of columns] [number of rows] [column gap] [row gap]
   */
  gridInitialize(cmdArray) {
    this.grid = new GridLayout();
    this.grid.viewport.x = this.renderer.left;
    this.grid.viewport.y = this.renderer.top;
    this.grid.viewport.width = this.renderer.width;
    this.grid.viewport.height = this.renderer.height;
    this.grid.numOfCols = parseInt(cmdArray[1]);
    this.grid.numOfRows = parseInt(cmdArray[2]);
    this.grid.colGap = parseInt(cmdArray[3]);
    this.grid.rowGap = parseInt(cmdArray[4]);
  }

  /**
   * Moves and resizes a shape using an initialized grid layout.
   * 
   * You should call gridInitialize first.
   * This function moves and resizes a shape that would span the rectangular area starting from
   * cell (startColIdx, startRowIdx) to cell (endColIdx, endRowIdx).
   *
   * Syntax:
   *   gridmove/gmove [name] [startColIdx] [startRowIdx] [endColIdx=startColIdx] [endRowIdx=startRowIdx]
   */
  gridMove(cmdArray) {
    if (!this.grid) {
      throw new Error('grid layout not initialized, or is invalid due to new change of viewport');
    }
    const startColIdx = parseInt(cmdArray[2]);
    const startRowIdx = parseInt(cmdArray[3]);
    let endColIdx;
    if (cmdArray[4]) {
      endColIdx = parseInt(cmdArray[4]);
    } else {
      endColIdx = startColIdx;
    }
    let endRowIdx;
    if (cmdArray[5]) {
      endRowIdx = parseInt(cmdArray[5]);
    } else {
      endRowIdx = startRowIdx;
    }
    const { x, y, width, height } = this.grid.getBoundingBox(startColIdx, startRowIdx, endColIdx, endRowIdx);

    const shape = this._getShape(cmdArray[1]);
    shape.x = x;
    shape.y = y;
    shape.width = width;
    shape.height = height;
  }

  /**
   * Creates a smart single curved (Bezier) link between shapes.
   *
   * Syntax:
   *   ~> [from shape] [direction (up/down/left/right)] [to shape] [direction] [text along path]
   *   Use ~~> for dashed line.
   */
  linkSingleCurved(cmdArray) {
    const cmd = cmdArray[0];
    const link = new SmartLinkSingleCurved();
    link.fromShape = this._getShape(cmdArray[1]);
    link.fromDirection = cmdArray[2];
    link.toShape = this._getShape(cmdArray[3]);
    link.toDirection = cmdArray[4];
    link.text = cmdArray.splice(5).join(' ');
    if (cmd.endsWith('>')) {
      if (cmd.startsWith('<')) {
        link.hasArrow = 3;
      } else {
        link.hasArrow = 1;
      }
    } else if (cmd.startsWith('<')) {
      link.hasArrow = 2;
    } else {
      link.hasArrow = 0;
    }
    if (cmd.indexOf('~~') >= 0) {
      link.dashed = true;
    }
    this._addLink(link);
  }

  /**
   * Creates a straight link between shapes.
   *
   * Syntax:
   *   -> [from shape] [direction (up/down/left/right)] [to shape] [direction] [text along path]
   *   Use --> for dashed line.
   */
  linkStraight(cmdArray) {
    const cmd = cmdArray[0];
    const link = new SmartLinkStraight();
    link.fromShape = this._getShape(cmdArray[1]);
    link.fromDirection = cmdArray[2];
    link.toShape = this._getShape(cmdArray[3]);
    link.toDirection = cmdArray[4];
    link.text = cmdArray.splice(5).join(' ');
    if (cmd.endsWith('>')) {
      if (cmd.startsWith('<')) {
        link.hasArrow = 3;
      } else {
        link.hasArrow = 1;
      }
    } else if (cmd.startsWith('<')) {
      link.hasArrow = 2;
    } else {
      link.hasArrow = 0;
    }
    if (cmd.indexOf('--') >= 0) {
      link.dashed = true;
    }
    this._addLink(link);
  }

  /**
   * Moves and resizes a shape.
   *
   * Syntax:
   *   move [name] [left] [top] [width] [height]
   */
  move(cmdArray) {
    const shape = this._getShape(cmdArray[1]);
    shape.x = parseInt(cmdArray[2]);
    shape.y = parseInt(cmdArray[3]);
    shape.width = parseInt(cmdArray[4]);
    shape.height = parseInt(cmdArray[5]);
  }

  /**
   * Sets background color for a shape
   *
   * Syntax:
   *   bgcolor [shape name] [CSS color (single word)]
   */
  setBgColor(cmdArray) {
    const shape = this._getShape(cmdArray[1]);
    shape.bgColor = cmdArray[2];
  }

  /**
   * Stacks shapes to a new shape.
   *
   * Syntax:
   *   stack [name of the stack shape] [list of shapes to stack> with [title text]
   */
  stackShapes(cmdArray) {
    const name = cmdArray[1];
    cmdArray = cmdArray.splice(2);
    const withKeywordIndex = cmdArray.indexOf('with');
    if (withKeywordIndex < 0) {
      throw new Error('stack shapes "with" keyword not found');
    }
    const shapeNames = cmdArray.slice(0, withKeywordIndex);
    const title = cmdArray.slice(withKeywordIndex + 1).join(' ');

    const shapes = [];
    for (const shapeName of shapeNames) {
      shapes.push(this._getShape(shapeName));
      this._removeShape(shapeName);
    }
    const titledContainer = new TitledContainer();
    const stackContainer = new StackContainer();
    stackContainer.shapes = shapes;
    titledContainer.title = title;
    titledContainer.childShape = stackContainer;
    titledContainer.name = name;

    this._setShape(name, titledContainer);
  }

  /**
   * Tile shapes to a new shape.
   *
   * Syntax:
   *   tile [name of the stack shape] [number of shapes per row] [list of shapes to stack] with [title text]
   */
  tileShapes(cmdArray) {
    const name = cmdArray[1];
    const numOfShapesPerRow = parseInt(cmdArray[2]);
    cmdArray = cmdArray.splice(3);
    const withKeywordIndex = cmdArray.indexOf('with');
    if (withKeywordIndex < 0) {
      throw new Error('tile shapes "with" keyword not found');
    }
    const shapeNames = cmdArray.slice(0, withKeywordIndex);
    const title = cmdArray.slice(withKeywordIndex + 1).join(' ');

    const shapes = [];
    for (const shapeName of shapeNames) {
      shapes.push(this._getShape(shapeName));
      this._removeShape(shapeName);
    }
    const titledContainer = new TitledContainer();
    const tileContainer = new TileContainer();
    tileContainer.numOfShapesPerRow = numOfShapesPerRow;
    tileContainer.shapes = shapes;
    titledContainer.title = title;
    titledContainer.childShape = tileContainer;
    titledContainer.name = name;

    this._setShape(name, titledContainer);
  }

  /**
   * Changes viewport size.
   *
   * Syntax:
   *   viewport [left] [top] [width] [height]
   */
  viewport(cmdArray) {
    this.renderer.left = parseInt(cmdArray[1]);
    this.renderer.top = parseInt(cmdArray[2]);
    this.renderer.width = parseInt(cmdArray[3]);
    this.renderer.height = parseInt(cmdArray[4]);
    // Changing viewport invalidates grid layout.
    this.grid = undefined;
  }
}