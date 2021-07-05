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
    this.shapeMap = {};
    this.links = [];
    this.nextZValue = 0;

    this.handlerMap = {
      'bgcolor': this.setBgColor.bind(this),
      'move': this.move.bind(this),
      'rect': this.createRect.bind(this),
      'rectc': this.createRectCenteredText.bind(this),
      'rectcentered': this.createRectCenteredText.bind(this),
      'stack': this.stackShapes.bind(this),
      'tile': this.tileShapes.bind(this),
      'var': this.defineVar.bind(this),
      'viewport': this.viewport.bind(this),
      '->': this.directConnect.bind(this),
      '~>': this.smartConnect.bind(this),
    }
  }

  // SHOULD NOT DO ANYTHING MORE AFTER THIS CALL.
  finish() {
    for (const shapeName of Object.keys(this.shapeMap)) {
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
    this.shapeMap[name] = shape;
  }

  _removeShape(name) {
    delete this.shapeMap[name];
  }

  _addLink(link) {
    this.links.push(link);
  }

  /**
   * Splits keyword from a command string, and call corresponding functions.
   */
  handleSingleCommand(/*string*/cmd) {
    cmd = cmd.trim();
    if (!cmd) {
      return;
    }
    for (const varName of Object.keys(this.vars)) {
      cmd = cmd.replace(varName, this.vars[varName]);
    }

    try {
      const cmdArray = cmd.split(' ');
      const keyword = cmdArray[0];
      const params = cmdArray.splice(1);
      if (this.handlerMap[keyword]) {
        this.handlerMap[keyword](params);
      }
    } catch (err) {
      alert(`CMD "${cmd}" gives error: "${err}"`);
      throw err;
    }
  }

  /**
   * Creates a Rect with multiline text.
   * 
   * Syntax:
   *   rect <rect name> <multiline text (break line with "\n")>
   */
  createRect(cmdArray) {
    const name = cmdArray[0];
    const text = cmdArray.splice(1).join(' ');
    const multilineTexts = text.split('\n');
    const rect = new Rect();
    rect.zValue = this._getNextZValue();
    rect.texts = multilineTexts;

    this._setShape(name, rect);
  }

  /**
   * Creates a Rect with centered text.
   * 
   * Syntax:
   *   rect <rect name> <single line text>
   */
  createRectCenteredText(cmdArray) {
    const name = cmdArray[0];
    const text = cmdArray.splice(1).join(' ');
    const rect = new Rect();
    rect.zValue = this._getNextZValue();
    rect.centeredText = text;

    this._setShape(name, rect);
  }

  /**
   * Creates a straight link between shapes.
   *
   * Syntax:
   *   -> <from shape> <direction (up/down/left/right)> <to shape> <direction>
   */
  directConnect(cmdArray) {
    const fromShape = this._getShape(cmdArray[0]);
    const fromDirection = cmdArray[1];
    const toShape = this._getShape(cmdArray[2]);
    const toDirection = cmdArray[3];
    const link = new LinkStraight();
    link.from = fromShape.getConnectionPoint(fromDirection);
    link.to = toShape.getConnectionPoint(toDirection);
    this._addLink(link);
  }

  /**
   * Defines a variable for following commands.
   * 
   * Syntax:
   *   var <var name> <string values>
   */
  defineVar(cmdArray) {
    const varName = cmdArray[0];
    this.vars[`$${varName}`] = cmdArray.splice(1).join(' ');
  }

  /**
   * Moves and resizes a shape.
   *
   * Syntax:
   *   move <name> left top width height
   */
  move(cmdArray) {
    const shape = this._getShape(cmdArray[0]);
    shape.x = parseInt(cmdArray[1]);
    shape.y = parseInt(cmdArray[2]);
    shape.width = parseInt(cmdArray[3]);
    shape.height = parseInt(cmdArray[4]);
  }

  /**
   * Sets background color for a shape
   *
   * Syntax:
   *   bgcolor <shape name> <color (single word)>
   */
  setBgColor(cmdArray) {
    const shape = this._getShape(cmdArray[0]);
    shape.bgColor = cmdArray[1];
  }

  /**
   * Creates a smart single curved link between shapes.
   *
   * Syntax:
   *   ~> <from shape> <direction (up/down/left/right)> <to shape> <direction>
   */
  smartConnect(cmdArray) {
    const fromShape = this._getShape(cmdArray[0]);
    const fromDirection = cmdArray[1];
    const toShape = this._getShape(cmdArray[2]);
    const toDirection = cmdArray[3];
    const link = new LinkSmartSingleCurved();
    link.setParamsFromShapes(fromShape, fromDirection, toShape, toDirection);
    this._addLink(link);
  }

  /**
   * Stacks shapes to a new shape.
   *
   * Syntax:
   *   stack <name of the stack shape> <list of shapes to stack> with <title text>
   */
  stackShapes(cmdArray) {
    const name = cmdArray[0];
    cmdArray = cmdArray.splice(1);
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

    this._setShape(name, titledContainer);
  }

  /**
   * Tile shapes to a new shape.
   *
   * Syntax:
   *   tile <name of the stack shape> <number of shapes per row> <list of shapes to stack> with <title text>
   */
  tileShapes(cmdArray) {
    const name = cmdArray[0];
    const numOfShapesPerRow = parseInt(cmdArray[1]);
    cmdArray = cmdArray.splice(2);
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

    this._setShape(name, titledContainer);
  }

  /**
   * Changes viewport size.
   *
   * Syntax:
   *   viewport left top width height
   */
  viewport(cmdArray) {
    this.renderer.left = parseInt(cmdArray[0]);
    this.renderer.top = parseInt(cmdArray[1]);
    this.renderer.width = parseInt(cmdArray[2]);
    this.renderer.height = parseInt(cmdArray[3]);
  }
}