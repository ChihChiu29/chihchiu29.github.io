"use strict";
const PAGE_PATH = '/planlab/';
const GRAPH_URL_PARAM = 'g';
const DEFAULT_GRAPH = ``;
const INPUT_ELEMENT_CSS = '#input';
const DRAW_AREA_SELECTOR = '#drawarea';
// Very likely we don't need this forever since Renderer has a similar margin in place already.
const SAVE_SVG_MARGIN = 0;
function draw(useGrid = true) {
    const renderer = new svg.SVGRenderer(document.querySelector(DRAW_AREA_SELECTOR));
    const graphData = document.querySelector(INPUT_ELEMENT_CSS).value;
    // `d` is the keyword used in the user provided code.
    const d = new DiagramDrawer(renderer);
    eval(graphData);
    const report = renderer.draw();
    // Since drawing has no error, safe to update URL.
    // const encodedGraphData = btoa(graphData);  // base64 encode without compression
    const encodedGraphData = btoa(LZString.compressToBase64(graphData)); // with compression
    if (graphData !== DEFAULT_GRAPH) {
        window.history.pushState('updated', 'Planlab', `${PAGE_PATH}?g=${encodedGraphData}`);
    }
    // Report mouse location when moving.
    const svgElement = document.querySelector('#drawarea svg');
    svgElement.removeEventListener('mousemove', reportLocationListener);
    svgElement.addEventListener('mousemove', reportLocationListener, false);
    return report;
}
function save() {
    // References:
    //   - https://levelup.gitconnected.com/draw-an-svg-to-canvas-and-download-it-as-image-in-javascript-f7f7713cf81f
    //   - http://bl.ocks.org/biovisualize/8187844
    const report = draw(/*useGrid*/ false);
    const svgElement = document.querySelector('#drawarea svg');
    svgElement.setAttribute('viewBox', `${report.dimension.x - SAVE_SVG_MARGIN} 
      ${report.dimension.y - SAVE_SVG_MARGIN}
      ${report.dimension.width + SAVE_SVG_MARGIN * 2}
      ${report.dimension.height + SAVE_SVG_MARGIN * 2}`);
    const { width, height } = svgElement.getBBox();
    var svgString = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    let URL = window.URL || window.webkitURL || window;
    let blobURL = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
        // Canvas references:
        //   - https://stackoverflow.com/questions/38061836/blurry-svg-in-canvas
        //   - https://stackoverflow.com/questions/24395076/canvas-generated-by-canvg-is-blurry-on-retina-screen
        let canvas = document.createElement('canvas');
        let context = canvas.getContext('2d');
        // In short:
        //   - devicePixelRatio decises how things are scaled on monitor.
        //   - to get a similar crisp feeling of the svg image, the canvas needs to be as large as viewport * scale factor.
        var pixelRatio = window.devicePixelRatio || 1;
        canvas.width = width;
        canvas.height = height;
        canvas.width *= pixelRatio;
        canvas.height *= pixelRatio;
        context.drawImage(image, 0, 0);
        let png = canvas.toDataURL();
        var link = document.createElement('a');
        link.download = 'diagram.png';
        link.style.opacity = "0";
        document.querySelector('#save-action').append(link);
        link.href = png;
        link.click();
        link.remove();
    };
    image.src = blobURL;
}
function reportLocationListener(evt) {
    const svgElement = document.querySelector('#drawarea svg');
    const pt = svgElement.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const { x, y } = pt.matrixTransform(svgElement.getScreenCTM().inverse());
    document.querySelector('#report #location').innerText = `Coordinates: (${Math.floor(x)}, ${Math.floor(y)})`;
}
function main() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const graphData = urlParams.get(GRAPH_URL_PARAM);
    const inputElement = document.querySelector(INPUT_ELEMENT_CSS);
    if (graphData) {
        // inputElement.value = atob(graphData);  // base64 without compression
        inputElement.value = LZString.decompressFromBase64(atob(graphData)); // with compression
    }
    else {
        inputElement.value = DEFAULT_GRAPH;
    }
    draw();
}
window.addEventListener('DOMContentLoaded', function () {
    main();
    // runTests();
});
var geometry;
(function (geometry) {
    /**
     * Finds the minimal bounding rect of two rects; r1 can use NaN values in which case r2 values are used.
     */
    function getMinimalCommonBoundingRect(r1, r2) {
        const left = r1.x < r2.x ? r1.x : r2.x;
        const top = r1.y < r2.y ? r1.y : r2.y;
        const r1Right = r1.x + r1.width;
        const r2Right = r2.x + r2.width;
        const right = r1Right > r2Right ? r1Right : r2Right;
        const r1Down = r1.y + r1.height;
        const r2Down = r2.y + r2.height;
        const down = r1Down > r2Down ? r1Down : r2Down;
        return {
            x: left,
            y: top,
            width: right - left,
            height: down - top,
        };
    }
    geometry.getMinimalCommonBoundingRect = getMinimalCommonBoundingRect;
})(geometry || (geometry = {}));
var Strings;
(function (Strings) {
    // Returns if str contains subStr.
    function contains(str, subStr) {
        return str.indexOf(subStr) >= 0;
    }
    Strings.contains = contains;
    // Split a string using separator, trim the resulted segments.
    function splitAndTrim(str, separator) {
        return str.split(separator).map(s => s.trim());
    }
    Strings.splitAndTrim = splitAndTrim;
})(Strings || (Strings = {}));
var svg;
(function (svg) {
    class ZSVGElement extends SVGElement {
        zValue = 1;
        zsvgCustomStyle;
    }
    svg.ZSVGElement = ZSVGElement;
    function createSvgSvgElement() {
        return document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    }
    function createSvgElement(tagName) {
        const elem = document.createElementNS('http://www.w3.org/2000/svg', tagName);
        elem.zValue = 1;
        return elem;
    }
    svg.createSvgElement = createSvgElement;
    function setAttr(element, attributeName, attributeValue) {
        element.setAttribute(attributeName, attributeValue.toString());
    }
    svg.setAttr = setAttr;
    class Style {
        borderWidth = 2;
        fillOpacity = 0.9;
        lineColor = '#545961';
        linkTextGapSize = 5; // space between text and link.
        linkWidth = 2;
        textFontSize = 15;
        textLineSpace = '1.2em';
    }
    svg.Style = Style;
    function applyCustomCssStyle(elem, cssStyle) {
        for (const [key, value] of Object.entries(cssStyle)) {
            setAttr(elem, key, value);
        }
    }
    /**
     * Helper to draw an SVG. Create one per draw action.
     */
    class SVGRenderer {
        hostElement;
        svgElement;
        style = new Style();
        left = 0;
        top = 0;
        width = 0;
        height = 0;
        useGrid = true;
        elements = [];
        constructor(hostElement) {
            this.hostElement = hostElement;
            let svgElement = this.hostElement.querySelector('svg');
            if (svgElement) {
                svgElement.remove();
            }
            this.svgElement = createSvgSvgElement();
            this.hostElement.append(this.svgElement);
        }
        addShape(shape) {
            for (const elem of shape.getElements(this.style, this.svgElement)) {
                this.addElement(elem, elem.zValue);
            }
        }
        addElement(element, zValue) {
            element.zValue = zValue;
            this.elements.push(element);
        }
        draw() {
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
            const report = {
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
    svg.SVGRenderer = SVGRenderer;
    class Shape {
        x = 0;
        y = 0;
        width = 100;
        height = 30;
        bgColor = '#f5f3ed';
        zValue = 1;
        name;
        /**
         * Copy geometry and style properties.
         */
        copyProperties(other) {
            this.x = other.x;
            this.y = other.y;
            this.width = other.width;
            this.height = other.height;
            this.bgColor = other.bgColor;
            this.zValue = other.zValue;
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
        getConnectionPoint(direction) {
            if (direction === 'up') {
                return this.getUpMiddle();
            }
            else if (direction === 'down') {
                return this.getDownMiddle();
            }
            else if (direction === 'left') {
                return this.getLeftMiddle();
            }
            else if (direction === 'right') {
                return this.getRightMiddle();
            }
            throw new Error('direction not implemented');
        }
    }
    svg.Shape = Shape;
    class Link {
        from = { x: 0, y: 0 };
        to = { x: 100, y: 100 };
        hasArrow = 1; // 0: no arrow, 1: endarrow, 2: startarrow, 3: both
        Z_VALUE = 99999;
        addTo(renderer) {
            for (const elem of this.getElements(renderer.style)) {
                renderer.addElement(elem, this.Z_VALUE);
            }
        }
    }
    svg.Link = Link;
    // From: https://github.com/dowjones/svg-text
    class MagicText extends Shape {
        text;
        textAlignToCenter = true; // otherwise to left
        textverticalAlignToCenter = true; // otherwise to top
        outerWidth; // with of texts; default to element width
        customTextCssStyle = {};
        constructor(text) {
            super();
            this.text = text;
        }
        copyProperties(other) {
            this.x = other.x;
            this.y = other.y;
            this.width = other.width;
            this.height = other.height;
            this.bgColor = other.bgColor;
            this.zValue = other.zValue;
        }
        getElements(style, svgElement) {
            const center = this.getCenter();
            // Requires `svg-text.js` in HTML.
            // @ts-ignore
            const SvgText = window.SvgText.default;
            const svgTextOption = {
                text: this.text,
                element: svgElement,
                x: this.textAlignToCenter ? center.x : this.x,
                y: this.textverticalAlignToCenter ? center.y : this.y,
                outerWidth: this.outerWidth ? this.outerWidth : this.width,
                outerHeight: this.height,
                align: this.textAlignToCenter ? 'center' : 'left',
                verticalAlign: this.textverticalAlignToCenter ? 'middle' : 'top',
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
      * Multiline texts, parent is optional.
      */
    class MultilineTexts extends Shape {
        GAP_LEFT = 5; // space to the left of the text.
        linesOfTexts = [];
        customTextCssStyle = {};
        constructor(linesOfTexts) {
            super();
            this.linesOfTexts = linesOfTexts;
        }
        copyProperties(other) {
            this.x = other.x;
            this.y = other.y;
            this.bgColor = other.bgColor;
            this.zValue = other.zValue;
        }
        getElements(style, svgElement) {
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
        text = '';
        customTextCssStyle = {};
        constructor(singleLineOfText) {
            super();
            this.text = singleLineOfText;
        }
        // @Implement
        getElements(style, svgElement) {
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
        CORNER_RADIUS = 5;
        customRectCssStyle = {};
        // @Implement
        getElements(style, svgElement) {
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
    class Rect extends Shape {
        text = '';
        textAlignToCenter = true; // otherwise to left
        textverticalAlignToCenter = true; // otherwise to top
        outerWidth; // with of texts; default to element width
        // Used to change rect and text styles.
        customRectCssStyle = {};
        customTextCssStyle = {};
        getElements(style, svgElement) {
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
                textElem.outerWidth = this.outerWidth;
                textElem.customTextCssStyle = this.customTextCssStyle;
                elements.push(...textElem.getElements(style, svgElement));
            }
            return elements;
        }
    }
    svg.Rect = Rect;
    // /**
    //  * A rect shape with some text support.
    //  */
    // export class Rect extends Shape {
    //   // You should only use one of the following.
    //   public texts: string[] = [];  // multiline texts starting from top-left corner.
    //   public centeredText: string = ''; // centered single line of text.
    //   // Used to change rect and text styles.
    //   public customRectCssStyle: CssStyle = {};
    //   public customTextCssStyle: CssStyle = {};
    //   override getElements(style: Style): ZSVGElement[] {
    //     const elements = [];
    //     const rect = new _Rect();
    //     rect.copyProperties(this);
    //     rect.customRectCssStyle = this.customRectCssStyle;
    //     if (this.name) {
    //       // Pass the name to the actual rect element.
    //       rect.name = this.name;
    //     }
    //     elements.push(...rect.getElements(style));
    //     if (this.texts.length) {
    //       const multilineTexts = new MultilineTexts(this.texts);
    //       multilineTexts.copyProperties(this);
    //       multilineTexts.customTextCssStyle = this.customTextCssStyle;
    //       elements.push(...multilineTexts.getElements(style));
    //     }
    //     if (this.centeredText) {
    //       const centeredText = new _CenteredText(this.centeredText);
    //       centeredText.copyProperties(this);
    //       centeredText.customTextCssStyle = this.customTextCssStyle;
    //       elements.push(...centeredText.getElements(style));
    //     }
    //     return elements;
    //   }
    // }
    /**
     * Borderless container to stack multiple shapes by providing a x and y shift for background shapes.
     */
    class StackContainer extends Shape {
        // Shifts in x and y for each stacked shape.
        shiftX = 10; // half of shiftY is a good choice.
        shiftY = 25; // style.textFontSize + 10 is a good choice.
        // Shapes to tile, background to foreground. All shapes will be set to the container's size.
        shapes = [];
        constructor() {
            super();
        }
        // @Override
        getElements(style, svgElement) {
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
        numOfShapesPerRow = 3;
        // Gap size between shapes.
        gapX = 10;
        gapY = 10;
        // Shapes to tile. All shapes will be reshaped according to the container's size.
        shapes = [];
        constructor() {
            super();
        }
        // @Override
        getElements(style, svgElement) {
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
        title = ''; // Title text.
        childGapX = 10; // Child gap in x, affects both left and right of the child.
        childGapY = 5; // Child gap in x, affects both top and bottom of the child.
        childShiftY = 20; // Child shift in y (to avoid title text), affects only top. `style.textFontSize + 10` is a good choice.
        childShape; // Child shape. Will be resized when rendering.
        constructor() {
            super();
        }
        // @Implement
        getElements(style, svgElement) {
            if (!this.childShape) {
                return [];
            }
            const elements = [];
            const rect = new Rect();
            rect.copyProperties(this);
            rect.text = this.title;
            rect.textverticalAlignToCenter = false;
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
    class _Polygon extends Shape {
        // @Implement
        getElements(style, svgElement) {
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
        getShape; // function that returns a shape without text.
        text = ''; // centered single line of text.
        constructor() {
            super();
        }
        // @Implement
        getElements(style, svgElement) {
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
        getPoints() {
            const left = this.x;
            const right = this.x + this.width;
            const top = this.y;
            const bottom = this.y + this.height;
            const midX = this.x + this.width / 2;
            const midY = this.y + this.height / 2;
            return `${midX} ${top} ${right} ${midY} ${midX} ${bottom} ${left} ${midY}`;
        }
    }
})(svg || (svg = {})); // namespace svg
function assert(value, expectedValue) {
    if (value !== expectedValue) {
        throw `${value} does not equal to expected value ${expectedValue}`;
    }
}
var color;
(function (color) {
    /**
     * Gets the CSS color string from the given description.
     * If the description is not among the keys, it's assumed to be a color string
     * and it's returned.
     */
    function getColor(descriptionOrColor, palette) {
        return palette.get(descriptionOrColor) || descriptionOrColor;
    }
    color.getColor = getColor;
    color.WHITE = '#FFFFFF';
    color.BLACK = '#000000';
    // 9 colors with 4 scales each, and 8 grey scales.
    color.PALETTE_LUCID = new Map(Object.entries({
        'grey1': '#FFFFFF',
        'grey2': '#F2F3F5',
        'grey3': '#DFE3E8',
        'grey4': '#CED4DB',
        'grey5': '#979EA9',
        'grey6': '#6F7681',
        'grey7': '#4C535D',
        'grey8': '#000000',
        'slateblue1': '#F2F2FF',
        'slateblue2': '#DEDEFF',
        'slateblue3': '#9391FF',
        'slateblue4': '#635DFF',
        'purple1': '#FBF0FF',
        'purple2': '#F4D9FF',
        'purple3': '#E08FFF',
        'purple4': '#BA24F6',
        'pink1': '#FFF0FB',
        'pink2': '#FFD6F5',
        'pink3': '#FF80DF',
        'pink4': '#D916A8',
        'red1': '#FFF0F0',
        'red2': '#FFD9D9',
        'red3': '#FF8F8F',
        'red4': '#E81313',
        'orange1': '#FFF3D9',
        'orange2': '#FFDDA6',
        'orange3': '#FC9432',
        'orange4': '#CC4E00',
        'yellow1': '#FCFCCA',
        'yellow2': '#FFF7A1',
        'yellow3': '#FFE342',
        'yellow4': '#FCCE14',
        'green1': '#E3FAE3',
        'green2': '#C3F7C9',
        'green3': '#54C45E',
        'green4': '#008A0E',
        'cyan1': '#D7FAF5',
        'cyan2': '#B8F5ED',
        'cyan3': '#00C2A8',
        'cyan4': '#008573',
        'blue1': '#EDF5FF',
        'blue2': '#CFE4FF',
        'blue3': '#6DB1FF',
        'blue4': '#1071E5',
    }));
})(color || (color = {}));
class DiagramDrawer {
    svgRenderer;
    constructor(svgRenderer) {
        this.svgRenderer = svgRenderer;
    }
}
const USE_PALETTE = color.PALETTE_LUCID;
/**
 * Resolves a CustomStyleWithShortcuts to a new CustomStyle object.
 * If style if not defined, create an empty CustomStyle object.
 */
function resolveCustomStyle(style) {
    if (style) {
        const resolvedStyle = { rect: { ...style.rect }, text: { ...style.text } };
        // Next resolve custom color settings.
        if (style.bgcolor) {
            resolvedStyle.rect['fill'] = color.getColor(style.bgcolor, USE_PALETTE);
        }
        if (style.textcolor) {
            resolvedStyle.text['fill'] = color.getColor(style.textcolor, USE_PALETTE);
        }
        return resolvedStyle;
    }
    else {
        return { rect: {}, text: {} };
    }
}
/**
 * Creates a new CustomStyle from merging two CustomStyleWithShortcuts objects.
 * The two CustomStyleWithShortcuts objects are resolved individually first.
 */
function resolveAndMergeCustomStyles(source, target) {
    const resolvedSource = resolveCustomStyle(source);
    const resolvedTarget = resolveCustomStyle(target);
    return {
        ...resolvedSource, ...resolvedTarget,
        rect: { ...resolvedSource.rect, ...resolvedTarget.rect },
        text: { ...resolvedSource.text, ...resolvedTarget.text },
    };
}
class RenderStyleConfig {
    // Both groups and items.
    // Height of each row.
    rowHeight = 25;
    rowGap = 5;
    // Whether to report capacity and capacity sum.
    reportCapacity = true;
    // Items only.
    // Width of a column for items.
    itemColWidth = 300;
    itemColGap = 10;
    // If true, hide all item names in rendering.
    hideItemNames = false;
    // Can override defaultItemBgColor.
    defaultItemStyles = {
        rect: {
            stroke: 'none',
        },
        bgcolor: '#6EB2FF',
        text: {},
        textcolor: 'white',
    };
    // Groups only.
    // Default width of group when not set in custom.
    defaultGroupWidth = 60;
    groupColGap = 5;
    // A map from group depth to width.
    customGroupWidths = [];
    // Can override defaultGroupBgColor.
    defaultGroupStyles = {
        rect: {
            stroke: 'none',
        },
        bgcolor: '#FCFCCC',
        text: {},
        textcolor: undefined,
    };
}
