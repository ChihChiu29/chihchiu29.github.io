"use strict";
const PAGE_PATH = '.';
const GRAPH_URL_PARAM = 'g';
// Use chrome dev tool to test the code, start with:
//   var renderer = new svg.SVGRenderer(document.querySelector(DRAW_AREA_SELECTOR));
//   d = new diagramlang.Drawer(renderer);
const DEFAULT_GRAPH = `
// Quickstart:
//   - Every action starts with the drawer 'd'.
//   - 'd.rect' creates a new rect with text. Then you can use:
//     move, cmove, text, up/down/left/right, cx, cy, color, style, textColor, ...
//   - 'd.link' creates a link that can connect two rects. Then use:
//     from, to, text, dashed, ...
// The example below has some illustration of APIs, for a more complete list, visit:
// https://github.com/ChihChiu29/chihchiu29.github.io/blob/master/diagramlab2/src/diagramdrawer.ts
// Alternatively, use Chrome dev tool then creates an instance of 'd' to play with it:
//   var renderer = new svg.SVGRenderer(document.querySelector(DRAW_AREA_SELECTOR));
//   d = new diagramlang.Drawer(renderer);
// Note that using this d it won't draw anything, but the auto-completion should
// help you get familiar with the interfaces.

d.viewport(0, 0, 1200, 600);

var w = 140;
var h = 60;
var O = d.rect("THINK DEBUG ANALYZE").cmove(200, 300, w, 120).color("purple3")
         .textStyle({"font-size": 26, "font-weight": "bold"});

function createLoop(text, width, height) {
  return d.rect(text, O.cx(), O.cy() - height / 2, width, height)
          .textStyle({"font-size": 24, "font-weight": "lighter"});
}
var l1 = createLoop("Inner Loop - Development", 500, 200).color("blue3")
    .style({rx: '20%', ry: '20%', stroke: 'none'}).setZ(-100);
var l2 = createLoop("Outer Loop - Experimentation", 800, 400).color("blue2")
    .style({rx: '20%', ry: '20%', stroke: 'none'})
    .textPos(false, true).textShift(0, 10).setZ(-101);

var a1 = d.rect("Create CL").cmove(l1.cx(), l1.top(), w, h);
var a2 = d.rect("Run Dev Server").cmove(l1.right(), l1.cy(), w, h);
var a3 = d.rect("Interactive Testing").cmove(l1.cx(), l1.bottom(), w, h);
d.link(O, "up", a1, "left");
d.link(a1, "right", a2, "up");
d.link(a2, "down", a3, "right");
d.link(a3, "left", O, "down");

var b1 = d.rect("Setup Experiment").cmove(l2.cx(), l2.top(), w, h);
var b2 = d.rect("Run Experiment").cmove(l2.right(), l2.cy(), w, h);
var b3 = d.rect("Collect Data").cmove(l2.cx(), l2.bottom(), w, h);
d.link(O, "up", b1, "left");
d.link(b1, "right", b2, "up");
d.link(b2, "down", b3, "right");
d.link(b3, "left", O, "down");

// Since we no longer need the loops for location, make them bigger to look better.
l1.cmove(l1.cx(), l1.cy(), l1.width() + 200, l1.height() + 100);
l2.cmove(l2.cx(), l2.cy(), l2.width() + 250, l2.height() + 150);
`;
const INPUT_ELEMENT_CSS = '#input';
const DRAW_AREA_SELECTOR = '#drawarea';
// @ts-ignore
const CODE_MIRROR_ELEMENT = CodeMirror(document.querySelector(INPUT_ELEMENT_CSS), {
    value: DEFAULT_GRAPH,
    mode: 'javascript',
});
// Very likely we don't need this forever since Renderer has a similar margin in place already.
const SAVE_SVG_MARGIN = 0;
function draw(useGrid = true) {
    const renderer = new svg.SVGRenderer(document.querySelector(DRAW_AREA_SELECTOR));
    renderer.useGrid = useGrid;
    const graphData = getInputElement().getValue();
    // `d` is the keyword used in the user provided code.
    const d = new diagramlang.Drawer(renderer);
    try {
        eval(graphData);
    }
    catch (error) {
        alert(error);
    }
    d.finalize();
    const report = renderer.draw();
    // Since drawing has no error, safe to update URL.
    // const encodedGraphData = btoa(graphData);  // base64 encode without compression
    if (graphData !== DEFAULT_GRAPH) {
        const encodedGraphData = btoa(LZString.compressToBase64(graphData)); // with compression
        window.history.pushState('updated', 'DiagramLab2', `${PAGE_PATH}?g=${encodedGraphData}`);
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
function getInputElement() {
    return CODE_MIRROR_ELEMENT;
}
function main() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const graphData = urlParams.get(GRAPH_URL_PARAM);
    const inputElement = getInputElement();
    if (graphData) {
        // inputElement.value = atob(graphData);  // base64 without compression
        inputElement.setValue(LZString.decompressFromBase64(atob(graphData))); // with compression
    }
    draw();
}
window.addEventListener('DOMContentLoaded', function () {
    main();
});
var colors;
(function (colors) {
    /**
     * Gets the CSS color string from the given description.
     * If the description is not among the keys, it's assumed to be a color string
     * and it's returned.
     */
    function getColor(descriptionOrColor, palette) {
        return palette.get(descriptionOrColor) || descriptionOrColor;
    }
    colors.getColor = getColor;
    colors.WHITE = '#FFFFFF';
    colors.BLACK = '#000000';
    // 9 colors with 4 scales each, and 8 grey scales.
    colors.PALETTE_LUCID = new Map(Object.entries({
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
})(colors || (colors = {}));
var geometry;
(function (geometry) {
    /**
     * Gets a middle point between two points.
     */
    function getMiddlePoint(pt1, pt2) {
        return { x: (pt1.x + pt2.x) / 2, y: (pt1.y + pt2.y) / 2 };
    }
    geometry.getMiddlePoint = getMiddlePoint;
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
    // Returns a new style merged from base with override.
    function mergeCssStyles(base, override) {
        return { ...base, ...override };
    }
    svg.mergeCssStyles = mergeCssStyles;
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
        cssElement;
        style = new Style();
        left = 0;
        top = 0;
        width = 0;
        height = 0;
        useGrid = true;
        elements = [];
        reportRect = { x: NaN, y: NaN, width: NaN, height: NaN };
        constructor(hostElement) {
            this.hostElement = hostElement;
            let svgElement = this.hostElement.querySelector('svg');
            if (svgElement) {
                svgElement.remove();
            }
            this.svgElement = createSvgSvgElement();
            this.hostElement.append(this.svgElement);
            let cssElement = this.hostElement.querySelector('style');
            if (cssElement) {
                cssElement.remove();
            }
            this.cssElement = document.createElement('style');
            this.hostElement.append(this.cssElement);
        }
        // Needs to be called after graphElement is no longer modified.
        addGraphElement(graphElement) {
            for (const elem of graphElement.getElements(this.style, { svgElement: this.svgElement, cssElement: this.cssElement })) {
                this.addElement(elem, elem.zValue);
            }
            if (graphElement instanceof Shape) {
                this.reportRect = geometry.getMinimalCommonBoundingRect(this.reportRect, {
                    x: graphElement.x,
                    y: graphElement.y,
                    width: graphElement.width,
                    height: graphElement.height
                });
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
            for (const element of this.elements.sort((e1, e2) => { return e1.zValue - e2.zValue; })) {
                svgElement.append(element);
            }
            return { dimension: this.reportRect, message: '' };
        }
    }
    svg.SVGRenderer = SVGRenderer;
    class GraphElement {
    }
    svg.GraphElement = GraphElement;
    class Shape extends GraphElement {
        x = 0;
        y = 0;
        width = 100;
        height = 30;
        bgColor = '#f5f3ed';
        zValue = 1;
        name;
        getElements(style, drawingElements) {
            const elements = this.getElementsImpl(style, drawingElements);
            elements.map((elem) => { elem.zValue = this.zValue; });
            return elements;
        }
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
            if (direction === 'up' || direction === 'top') {
                return this.getUpMiddle();
            }
            else if (direction === 'down' || direction === 'bottom') {
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
    class Link extends GraphElement {
        from = { x: 0, y: 0 };
        to = { x: 100, y: 100 };
        hasArrow = 1; // 0: no arrow, 1: endarrow, 2: startarrow, 3: both
    }
    svg.Link = Link;
    // From: https://github.com/dowjones/svg-text
    class MagicText extends Shape {
        text;
        textAlignToCenter = true; // otherwise to left
        textVerticalAlignToCenter = true; // otherwise to top
        textShift = { x: 0, y: 0 }; // text shift relative to anchor
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
        getElementsImpl(style, drawingElements) {
            const center = this.getCenter();
            // Requires `svg-text.js` in HTML.
            // @ts-ignore
            const SvgText = window.SvgText.default;
            const svgTextOption = {
                text: this.text,
                element: drawingElements.svgElement,
                x: (this.textAlignToCenter ? center.x : this.x) + this.textShift.x,
                y: (this.textVerticalAlignToCenter ? center.y : this.y) + this.textShift.y,
                outerWidth: this.outerWidth ? this.outerWidth : this.width,
                outerHeight: this.height,
                align: this.textAlignToCenter ? 'center' : 'left',
                verticalAlign: this.textVerticalAlignToCenter ? 'middle' : 'top',
                padding: this.textAlignToCenter ? 0 : '0 0 0 5',
                textOverflow: 'ellipsis',
                style: this.customTextCssStyle,
                // WARNING: when `style` is set, if `styleElement` is not set, it will be
                // the first `<style>`, then it will KEEP APPENDING TO IT until the css
                // becomes too long then crash.
                styleElement: drawingElements.cssElement,
            };
            // @ts-ignore
            const svgText = new SvgText(svgTextOption);
            const elem = svgText.text;
            // DO NOT DO THIS, since then changing text style is done at a much later time,
            // and it can mess up with the text newline computation.
            // elem.zsvgCustomStyle = this.customTextCssStyle;
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
        text = '';
        customTextCssStyle = {};
        constructor(singleLineOfText) {
            super();
            this.text = singleLineOfText;
        }
        // @Implement
        getElementsImpl(style, drawingElements) {
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
        getElementsImpl(style, drawingElements) {
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
        textVerticalAlignToCenter = true; // otherwise to top
        textShift = { x: 0, y: 0 };
        outerWidth; // with of texts; default to element width
        // Used to change rect and text styles.
        customRectCssStyle = {};
        customTextCssStyle = {};
        getElementsImpl(style, drawingElements) {
            const elements = [];
            const rect = new _Rect();
            rect.copyProperties(this);
            rect.customRectCssStyle = this.customRectCssStyle;
            if (this.name) {
                // Pass the name to the actual rect element.
                rect.name = this.name;
            }
            elements.push(...rect.getElements(style, drawingElements));
            if (this.text) {
                const textElem = new MagicText(this.text);
                textElem.copyProperties(this);
                textElem.textAlignToCenter = this.textAlignToCenter;
                textElem.textVerticalAlignToCenter = this.textVerticalAlignToCenter;
                textElem.textShift = this.textShift;
                textElem.outerWidth = this.outerWidth;
                textElem.customTextCssStyle = this.customTextCssStyle;
                elements.push(...textElem.getElements(style, drawingElements));
            }
            return elements;
        }
    }
    svg.Rect = Rect;
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
        getElementsImpl(style, drawingElements) {
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
                elements.push(...shape.getElements(style, drawingElements));
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
        getElementsImpl(style, drawingElements) {
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
                elements.push(...shape.getElements(style, drawingElements));
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
        getElementsImpl(style, drawingElements) {
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
            elements.push(...rect.getElements(style, drawingElements));
            this.childShape.x = this.x + this.childGapX;
            this.childShape.y = this.y + this.childGapY + this.childShiftY;
            this.childShape.width = this.width - this.childGapX * 2;
            this.childShape.height = this.height - this.childGapY * 2 - this.childShiftY;
            elements.push(...this.childShape.getElements(style, drawingElements));
            return elements;
        }
    }
    /**
     * A raw polygon with border etc., no text.
     */
    class _Polygon extends Shape {
        // @Implement
        getElementsImpl(style, drawingElements) {
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
        getElementsImpl(style, drawingElements) {
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
            elements.push(...shape.getElements(style, drawingElements));
            if (this.text) {
                const centeredText = new _CenteredText(this.text);
                centeredText.copyProperties(this);
                elements.push(...centeredText.getElements(style, drawingElements));
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
    // ---------------- LINKS BELOW ---------------------------------------------
    const DEFAULT_SHAPE = new Rect();
    /**
   * A generic path-based link.
   */
    class LinkPath extends Link {
        text = '';
        dashed = false;
        getElements(style, drawingElements) {
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
            }
            else if (this.hasArrow === 2) {
                elem.setAttribute('marker-start', 'url(#startarrow)');
            }
            else if (this.hasArrow === 3) {
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
                textElement.setAttribute('dy', `${-style.linkTextGapSize}`);
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
    class LinkStraight extends LinkPath {
        getPathCommand() {
            return `M ${this.from.x} ${this.from.y} L ${this.to.x} ${this.to.y}`;
        }
    }
    class LinkSingleCurved extends LinkPath {
        // Optional control points.
        // See: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
        ctrl1;
        ctrl2;
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
    class SmartLinkStraight extends LinkStraight {
        fromShape = DEFAULT_SHAPE;
        fromDirection = 'right'; // up/down/left/right
        toShape = DEFAULT_SHAPE;
        toDirection = 'left'; // up/down/left/right
        // NOT used; adding here to match interface from SmartLinkSingleCurved.
        sharpness = 0;
        // @Override
        getPathCommand() {
            _smartReConnection(this);
            this.from = this.fromShape.getConnectionPoint(this.fromDirection);
            this.to = this.toShape.getConnectionPoint(this.toDirection);
            return super.getPathCommand();
        }
    }
    svg.SmartLinkStraight = SmartLinkStraight;
    /**
     * A singlely curved link, using postponed coordinates fetched from connected shapes.
     */
    class SmartLinkSingleCurved extends LinkSingleCurved {
        fromShape = DEFAULT_SHAPE;
        fromDirection = 'right'; // up/down/left/right
        toShape = DEFAULT_SHAPE;
        toDirection = 'left'; // up/down/left/right
        // Controls how "sharp" the turn is.
        sharpness = 0.9;
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
            }
            else if (toP.x < fromP.x) {
                if (fromDirection === 'right' || toDirection === 'left') {
                    console.log(error);
                }
            }
            if (toP.y > fromP.y) {
                if (fromDirection === 'up' || toDirection === 'down') {
                    console.log(error);
                }
            }
            else if (toP.y < fromP.y) {
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
            }
            else {
                this.ctrl1.x = toP.x;
                this.ctrl1.y = fromP.y;
            }
            if (toDirection === 'up' || toDirection === 'down') {
                this.ctrl2.x = toP.x;
                this.ctrl2.y = fromP.y;
            }
            else {
                this.ctrl2.x = fromP.x;
                this.ctrl2.y = toP.y;
            }
            const mid = geometry.getMiddlePoint(this.from, this.to);
            this.ctrl2.x = this.ctrl2.x * this.sharpness + mid.x * (1 - this.sharpness);
            this.ctrl2.y = this.ctrl2.y * this.sharpness + mid.y * (1 - this.sharpness);
        }
    }
    svg.SmartLinkSingleCurved = SmartLinkSingleCurved;
    /**
     * Possibly change connection direction for other considerations (etc. make text left to right).
     */
    function _smartReConnection(smartLink) {
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
        }
        else if (smartLink.hasArrow === 2) {
            smartLink.hasArrow = 1;
        }
    }
})(svg || (svg = {})); // namespace svg
function assert(value, expectedValue) {
    if (value !== expectedValue) {
        throw `${value} does not equal to expected value ${expectedValue}`;
    }
}
var diagramlang;
(function (diagramlang) {
    const DEFAULT_RECT_WIDTH = 200;
    const DEFAULT_RECT_HEIGHT = 100;
    const DEFAULT_COLOR_PALETTE = colors.PALETTE_LUCID;
    class GraphElementWrapper {
    }
    class ShapeWrapper {
        getGraphElement() {
            return this.getShape();
        }
        setZ(z) {
            this.getShape().zValue = z;
            return this;
        }
    }
    // Wrapper of Rect focusing on UX.
    class Rect extends ShapeWrapper {
        rectElement;
        constructor() {
            super();
            this.rectElement = new svg.Rect();
        }
        getShape() {
            return this.rectElement;
        }
        left() { return this.rectElement.x; }
        right() { return this.rectElement.x + this.rectElement.width; }
        top() { return this.rectElement.y; }
        up = this.top;
        bottom() { return this.rectElement.y + this.rectElement.height; }
        down = this.bottom;
        cx() { return this.rectElement.x + this.rectElement.width / 2; }
        cy() { return this.rectElement.y + this.rectElement.height / 2; }
        width() { return this.rectElement.width; }
        height() { return this.rectElement.height; }
        text(text) {
            this.rectElement.text = text;
            return this;
        }
        moveCorner(left, top, width, height) {
            this.maybeSetSize(width, height);
            this.rectElement.x = left;
            this.rectElement.y = top;
            return this;
        }
        move = this.moveCorner;
        moveCenter(x, y, width, height) {
            this.maybeSetSize(width, height);
            this.rectElement.x = x - this.rectElement.width / 2;
            this.rectElement.y = y - this.rectElement.height / 2;
            return this;
        }
        cmove = this.moveCenter;
        maybeSetSize(width, height) {
            if (width) {
                this.rectElement.width = width;
            }
            if (height) {
                this.rectElement.height = height;
            }
        }
        // Sets location of the text, left/center, top/center.
        textPos(left = false, top = false) {
            this.rectElement.textAlignToCenter = !left;
            this.rectElement.textVerticalAlignToCenter = !top;
            return this;
        }
        textShift(shiftX, shiftY) {
            this.rectElement.textShift = { x: shiftX, y: shiftY };
            return this;
        }
        // Set style override on rect or on text.
        style(style, onRect = true) {
            if (onRect) {
                this.rectElement.customRectCssStyle = svg.mergeCssStyles(this.rectElement.customRectCssStyle, style);
            }
            else {
                this.rectElement.customTextCssStyle = svg.mergeCssStyles(this.rectElement.customTextCssStyle, style);
            }
            return this;
        }
        textStyle(style) {
            return this.style(style, false);
        }
        // Set color on rect and on text.
        color(color, palette_name, onRect = true) {
            return this.style({ fill: this.getColor(color, palette_name) }, onRect);
        }
        textColor(color, palette_name) {
            return this.color(color, palette_name, false);
        }
        getColor(color, palette_name) {
            if (palette_name === 'lucid') {
                return colors.getColor(color, colors.PALETTE_LUCID);
            }
            else {
                return colors.getColor(color, DEFAULT_COLOR_PALETTE);
            }
        }
    }
    // Wrapper of Link focusing on UX.
    class Link {
        link;
        constructor(type = 'curved') {
            if (type === 'curved') {
                this.link = new svg.SmartLinkSingleCurved();
            }
            else {
                this.link = new svg.SmartLinkStraight();
            }
        }
        getGraphElement() {
            return this.link;
        }
        text(text) {
            this.link.text = text;
            return this;
        }
        from(shapeWrapper, connectionDirection) {
            this.link.fromShape = shapeWrapper.getShape();
            this.link.fromDirection = connectionDirection;
            return this;
        }
        to(shapeWrapper, connectionDirection) {
            this.link.toShape = shapeWrapper.getShape();
            this.link.toDirection = connectionDirection;
            return this;
        }
        sharpness(sharpness) {
            this.link.sharpness = sharpness;
        }
        // Link style.
        dashed(isDashed = true) {
            this.link.dashed = isDashed;
            return this;
        }
        solid() {
            return this.dashed(false);
        }
    }
    // Wrapper of straight Link focusing on UX.
    class StraightLink {
        rectElement;
        constructor() {
            this.rectElement = new svg.Rect();
        }
        getGraphElement() {
            return this.rectElement;
        }
    }
    class Drawer {
        wrappers = [];
        svgRenderer;
        constructor(svgRenderer) {
            this.svgRenderer = svgRenderer;
        }
        registerGraphElement(graphElement) {
            this.wrappers.push(graphElement);
            return graphElement;
        }
        viewport(left, top, width, height) {
            this.svgRenderer.left = left;
            this.svgRenderer.top = top;
            this.svgRenderer.width = width;
            this.svgRenderer.height = height;
        }
        rect(text, left = 0, top = 0, width = DEFAULT_RECT_WIDTH, height = DEFAULT_RECT_HEIGHT) {
            return this.registerGraphElement(new Rect().text(text).move(left, top, width, height));
        }
        crect(text, left = 0, top = 0, width = DEFAULT_RECT_WIDTH, height = DEFAULT_RECT_HEIGHT) {
            return this.registerGraphElement(new Rect().text(text).cmove(left, top, width, height));
        }
        link(fromShape, fromDirection, toShape, toDirection, text) {
            const link = new Link();
            if (fromShape && fromDirection && toShape && toDirection) {
                link.from(fromShape, fromDirection).to(toShape, toDirection);
            }
            if (text) {
                link.text(text);
            }
            return this.registerGraphElement(link);
        }
        finalize() {
            for (const elementWrapper of this.wrappers) {
                this.svgRenderer.addGraphElement(elementWrapper.getGraphElement());
            }
        }
    }
    diagramlang.Drawer = Drawer;
})(diagramlang || (diagramlang = {}));
