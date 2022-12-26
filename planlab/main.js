"use strict";
function main() {
    runTests();
}
window.addEventListener('load', function () {
    main();
});
var svg;
(function (svg) {
    class ZSVGElement extends SVGElement {
        zValue = 1;
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
    /**
     * Helper to draw an SVG. Create one per draw action.
     */
    class SVGRenderer {
        hostElement;
        style = new Style();
        left = 0;
        top = 0;
        width = 0;
        height = 0;
        useGrid = true;
        elements = [];
        constructor(hostElement) {
            this.hostElement = hostElement;
        }
        addShape(shape) {
            for (const elem of shape.getElements(this.style)) {
                this.addElement(elem, elem.zValue);
            }
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
            svgElement = createSvgSvgElement();
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
    /**
      * Multiline texts, parent is optional.
      */
    class MultilineTexts extends Shape {
        GAP_LEFT = 5; // space to the left of the text.
        linesOfTexts = [];
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
        getElements(style) {
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
            return [elem];
        }
    }
    /**
     * A single line of text centered in a region.
     */
    class _CenteredText extends Shape {
        text = '';
        constructor(singleLineOfText) {
            super();
            this.text = singleLineOfText;
        }
        // @Implement
        getElements(style) {
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
            return [elem];
        }
    }
    /**
     * A raw rect with border etc., no text.
     */
    class _Rect extends Shape {
        CORNER_RADIUS = 5;
        // @Implement
        getElements(style) {
            const elem = createSvgElement('rect');
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
            return [elem];
        }
    }
    /**
     * A rect shape with some text support.
     */
    class Rect extends Shape {
        // You should only use one of the following.
        texts = []; // multiline texts starting from top-left corner.
        centeredText = ''; // centered single line of text.
        getElements(style) {
            const elements = [];
            const rect = new _Rect();
            rect.copyProperties(this);
            if (this.name) {
                // Pass the name to the actual rect element.
                rect.name = this.name;
            }
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
        getElements(style) {
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
        getElements(style) {
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
                elements.push(...shape.getElements(style));
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
        getElements(style) {
            if (!this.childShape) {
                return [];
            }
            const elements = [];
            const rect = new Rect();
            rect.copyProperties(this);
            rect.texts = [this.title];
            if (this.name) {
                rect.name = this.name;
            }
            elements.push(...rect.getElements(style));
            this.childShape.x = this.x + this.childGapX;
            this.childShape.y = this.y + this.childGapY + this.childShiftY;
            this.childShape.width = this.width - this.childGapX * 2;
            this.childShape.height = this.height - this.childGapY * 2 - this.childShiftY;
            elements.push(...this.childShape.getElements(style));
            return elements;
        }
    }
    /**
     * A raw polygon with border etc., no text.
     */
    class _Polygon extends Shape {
        // @Implement
        getElements(style) {
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
        getElements(style) {
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
            elements.push(...shape.getElements(style));
            if (this.text) {
                const centeredText = new _CenteredText(this.text);
                centeredText.copyProperties(this);
                elements.push(...centeredText.getElements(style));
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
// const test = jsyaml.load(`
// groups:
//  - Exp Understanding
//   - Online
//    - RD
//    - RR
//   - Offline
// items:
//  - RD:
//   - X:
//    - weight: 
//  - b
//  - c
// d: [Q1, Q2]
// itemcolums: [Q1, Q2, Q3, Q4]
// `);
function getExampleYaml() {
    return `
groups:
  - Exp:
    - Online:
      - RD
      - RR
    - Offline
  - ML
`;
}
// Creates a default item.
function createItem() {
    return {
        name: '',
        spanFromCol: -1,
        spanToCol: -1,
        capacityPercentage: -1,
        description: '',
        rowIndex: -1,
        customBgColor: '',
    };
}
// Creates a default group.
function createGroup() {
    return {
        name: '',
        depth: -1,
        children: [],
        items: [],
        rowIndex: -1,
        rowSpan: -1,
        customBgColor: '',
    };
}
class LangParser {
    GROUP_STRUCT_KEYWORD = 'groups';
    // A map from a string to either a string
    groups = new Map();
    rendererStyleConfig = new RendererStyleConfig();
    constructor() { }
    /**
     * Entry point for parsing group configs.
     * It does NOT compute layout.
     */
    parse(content) {
        const contentYaml = jsyaml.load(content);
        // Get all groups.
        this.parseGroupStructure(contentYaml[this.GROUP_STRUCT_KEYWORD]);
        // Parse others.
        for (const key of Object.keys(contentYaml)) {
            if (this.groups.has(key)) {
                // Group-item assignment.
                this.parseGroupItems(key, contentYaml[key]);
            }
        }
    }
    /**
     * Parses a group structure object into Map<group, Group>.
     *
     * Example input: parsed YAML object of:
     * - Exp:
     *  - Online:
     *    - RD
     *    - RR
     *  - Offline
     * - ML
     */
    parseGroupStructure(groupsYaml) {
        this.groups = new Map();
        this.parseGroupRecursive(groupsYaml, 0, this.groups);
        // Return only for testing.
        return this.groups;
    }
    /**
     * Parses items that belong to a group.
     *
     * Requires group structure to be parsed first.
     *
     * Example: to parse something like:
     * - RD:
     *   - B: 1-4, 100, (TL)
     *   - X: 1-4, 80, (Main IC)
     * Input: 'RD', [{B: '...', X: '...'}]
     */
    parseGroupItems(name, items) {
        const groupName = name;
        // Key should be checked before calling this function.
        const group = this.groups.get(groupName);
        for (const itemConfig of items) {
            const itemName = this.getSingleKey(itemConfig);
            group.items.push(this.parseItemConfig(itemName, itemConfig[itemName]));
        }
        // Return only for testing.
        return group;
    }
    // Recursive parse groups, returns the names of the top level groups.
    parseGroupRecursive(subgroupYaml, currentDepth, groups) {
        const groupNames = [];
        for (const subgroup of subgroupYaml) {
            let name;
            const group = createGroup();
            if (typeof (subgroup) !== 'object') {
                // leaf
                name = subgroup.toString();
            }
            else {
                // group object with a single key
                name = this.getSingleKey(subgroup);
                const subgroupNames = this.parseGroupRecursive(subgroup[name], currentDepth + 1, groups);
                group.children = subgroupNames;
            }
            group.name = name;
            group.depth = currentDepth;
            groups.set(name, group);
            groupNames.push(name);
        }
        return groupNames;
    }
    // Parses a single item config of type '1-4, 80, (Main IC)'.
    parseItemConfig(name, config) {
        const item = createItem();
        item.name = name;
        const configSegments = config.split(',').map(s => s.trim());
        const spanSegments = configSegments[0].split('-');
        item.spanFromCol = Number(spanSegments[0]);
        item.spanToCol = Number(spanSegments[1]);
        item.capacityPercentage = Number(configSegments[1]);
        if (configSegments.length > 2) {
            item.description = configSegments[2];
        }
        return item;
    }
    getSingleKey(obj) {
        const keys = Object.keys(obj);
        if (keys.length !== 1) {
            throw `Object ${obj.toString()} needs to have only 1 key`;
        }
        return Object.keys(obj)[0];
    }
}
var LayoutComputation;
(function (LayoutComputation) {
    // Compute item row indices for all groups.
    function computeAllItemRowIndices(groups) {
        for (const group of groups.values()) {
            computeItemRowIndices(group);
        }
    }
    LayoutComputation.computeAllItemRowIndices = computeAllItemRowIndices;
    /**
     * Compute row indices of the items in the given group.
     *
     * No-op for group with no items.
     */
    function computeItemRowIndices(leafGroup) {
        if (!isLeafGroup(leafGroup)) {
            return;
        }
        if (!hasItems(leafGroup)) {
            leafGroup.rowSpan = 1;
            return;
        }
        const items = leafGroup.items;
        // let maxNumberOfColumns: number = Math.max(...items.map(item => item.spanUntilColumn));
        // let maxNumberOfRows: number = items.length;
        // { `row,column`: occupied }
        const spaces = new Map();
        // Initializes row indices and spaces.
        for (const [rowIdx, item] of items.entries()) {
            item.rowIndex = rowIdx;
            for (let colIdx = item.spanFromCol; colIdx <= item.spanToCol; colIdx++) {
                spaces.set(getRowColKey(rowIdx, colIdx), true);
            }
        }
        // Condenses row indices.
        let modificationHappened = false;
        while (true) {
            for (const item of items) {
                const rowIdx = item.rowIndex;
                for (let tryRowIdx = 0; tryRowIdx < rowIdx; tryRowIdx++) {
                    if (!isSpaceFull(spaces, tryRowIdx, item.spanFromCol, item.spanToCol)) {
                        for (let colIdx = item.spanFromCol; colIdx <= item.spanToCol; colIdx++) {
                            spaces.set(getRowColKey(tryRowIdx, colIdx), true);
                            spaces.set(getRowColKey(rowIdx, colIdx), false);
                        }
                        item.rowIndex = tryRowIdx;
                        modificationHappened = true;
                        break;
                    }
                }
            }
            // Whether should stop.
            if (modificationHappened) {
                modificationHappened = false;
            }
            else {
                break;
            }
        }
        leafGroup.rowSpan = Math.max(...(items.map(i => i.rowIndex))) + 1;
    }
    LayoutComputation.computeItemRowIndices = computeItemRowIndices;
    /**
     * Compute layout row indices for all groups.
     *
     * Needs to be called after `computeItemRowIndices` for all leaf groups.
     */
    function computeGroupRowIndices(groups) {
        let currentRowIndex = 0;
        for (const group of groups.values()) {
            if (group.depth !== 0) {
                continue;
            }
            currentRowIndex += computeGroupIndicesRecursive(group, currentRowIndex, groups);
        }
    }
    LayoutComputation.computeGroupRowIndices = computeGroupRowIndices;
    // Recursively compute row related indices for a single group and its children, returns the top-level / total row span.
    function computeGroupIndicesRecursive(group, currentRowIndex, groups) {
        group.rowIndex = currentRowIndex;
        if (hasChildren(group) && hasItems(group)) {
            console.log('Error for group:');
            console.log(group);
            throw new Error('a group cannot have both children and items');
        }
        // Not leaf.
        if (hasChildren(group)) {
            let rowSpan = 0;
            for (const childGroupName of group.children) {
                const childGroup = groups.get(childGroupName);
                rowSpan += computeGroupIndicesRecursive(childGroup, currentRowIndex + rowSpan, groups);
            }
            group.rowSpan = rowSpan;
        }
        // For leaf group this is already set.
        return group.rowSpan;
    }
    function isLeafGroup(group) {
        return !hasChildren(group);
    }
    function hasChildren(group) {
        return group.children.length > 0;
    }
    function hasItems(group) {
        return group.items.length > 0;
    }
    function isSpaceFull(spaces, row, colFrom, colUntil) {
        for (let colIdx = colFrom; colIdx <= colUntil; colIdx++) {
            if (spaces.get(getRowColKey(row, colIdx))) {
                return true;
            }
        }
        return false;
    }
    function getRowColKey(row, col) {
        return `${row},${col}`;
    }
})(LayoutComputation || (LayoutComputation = {}));
class RendererStyleConfig {
    // Both groups and items.
    // Height of each row.
    rowHeight = 100;
    rowGap = 10;
    // Whether to report capacity and capacity sum.
    reportCapacity = true;
    // Items only.
    // Width of a column for items.
    itemColWidth = 300;
    defaultItemBgColor = '#545961';
    itemColGap = 10;
    // Groups only.
    // Default width of group when not set in custom.
    defaultGroupWidth = 200;
    groupGap = 10;
    // A map from group depth to width.
    customGroupWidths = [];
    defaultGroupBgColor = '#327ba8';
}
class Renderer {
    drawArea;
    groups;
    style;
    // Postions.
    // "left" values for groups of each depth.
    groupLeftValues = [];
    // Widths for groups of each depth.
    groupWidths = [];
    // Items will be draw using this "left" value as the starting point.
    itemBaseLeftValue = 0;
    constructor(svgElement, parser) {
        this.groups = parser.groups;
        this.drawArea = svgElement;
        this.style = parser.rendererStyleConfig;
    }
    // Renders groups.
    render() {
        // First compute layout.
        LayoutComputation.computeAllItemRowIndices(this.groups);
        LayoutComputation.computeGroupRowIndices(this.groups);
        // Next prepare style related compuation.
        this.prepareStyle();
        // Start drawing!
        const svgRenderer = new svg.SVGRenderer(this.drawArea);
        for (const group of this.groups.values()) {
            for (const item of group.items) {
                this.drawItem(item, group, svgRenderer);
            }
            this.drawGroup(group, svgRenderer);
        }
    }
    prepareStyle() {
        // Compute group widths.
        this.groupWidths = [...this.style.customGroupWidths];
        const maxGroupDepth = Math.max(...[...this.groups.values()].map(g => g.depth));
        for (let i = 0; i <= maxGroupDepth; i++) {
            if (!this.groupWidths[i]) {
                this.groupWidths[i] = this.style.defaultGroupWidth;
            }
        }
        let nextLeftValue = 0;
        for (const [i, width] of this.groupWidths.entries()) {
            this.groupLeftValues[i] = nextLeftValue;
            nextLeftValue += width + this.style.groupGap;
        }
        this.itemBaseLeftValue = nextLeftValue;
    }
    drawGroup(group, renderer) {
        const rect = new svg.Rect();
        rect.centeredText = group.name;
        rect.x = this.groupLeftValues[group.depth];
        rect.y = this.getTop(group.rowIndex);
        rect.width = this.groupWidths[group.depth];
        rect.height = this.getHeight(group.rowSpan);
        renderer.addShape(rect);
    }
    drawItem(item, ownerGroup, renderer) {
        let content = item.name;
        if (this.style.reportCapacity) {
            content += ` (${item.capacityPercentage}%)`;
        }
        if (item.description) {
            content += ` ${item.description}`;
        }
        const rect = new svg.Rect();
        rect.texts = [content];
        rect.x = this.getItemLeft(item.spanFromCol);
        rect.y = this.getTop(ownerGroup.rowIndex + item.rowIndex);
        rect.width = this.getItemWidth(item.spanFromCol, item.spanToCol);
        rect.height = this.style.rowHeight;
        renderer.addShape(rect);
    }
    // The the "top" value for an item with the given row index.
    getTop(rowIndex) {
        return rowIndex * (this.style.rowHeight + this.style.rowGap);
    }
    // The height of an item for the given row span.
    getHeight(rowSpan) {
        return rowSpan * this.style.rowHeight + (rowSpan - 1) * this.style.rowGap;
    }
    // The "left" value for an item.
    getItemLeft(colIdx) {
        return this.itemBaseLeftValue + colIdx * (this.style.itemColWidth + this.style.itemColGap);
    }
    // The width of an item.
    getItemWidth(fromCol, toCol) {
        const colSpan = toCol - fromCol;
        return (colSpan + 1) * this.style.itemColWidth + colSpan * this.style.itemColGap;
    }
}
function testParsingGroupStructure(parser) {
    const testData = jsyaml.load(`
    groups:
      - Exp:
        - Online:
          - RD
          - RR
        - Offline
      - ML
    `);
    console.log(parser.parseGroupStructure(testData['groups']));
    assert(parser.groups.get('Exp')?.depth, 0);
    assert(parser.groups.get('ML')?.depth, 0);
    assert(parser.groups.get('Online')?.depth, 1);
    assert(parser.groups.get('Offline')?.depth, 1);
    assert(parser.groups.get('RD')?.depth, 2);
    assert(parser.groups.get('RR')?.depth, 2);
}
function testParsingGroupItems(parser) {
    const testData = jsyaml.load(`
    RD:
      - B: 1-4, 100, (TL)
      - X: 1-4, 80, (Main IC)
    `);
    console.log(parser.parseGroupItems('RD', testData['RD']));
    const rd = parser.groups.get('RD');
    assert(rd.items[0].name, 'B');
    assert(rd.items[0].spanFromCol, 1);
    assert(rd.items[0].spanToCol, 4);
    assert(rd.items[0].capacityPercentage, 100);
    assert(rd.items[0].description, '(TL)');
    assert(rd.items[1].name, 'X');
    assert(rd.items[1].spanFromCol, 1);
    assert(rd.items[1].spanToCol, 4);
    assert(rd.items[1].capacityPercentage, 80);
    assert(rd.items[1].description, '(Main IC)');
}
function testComputeItemRowIndices() {
    const testData = jsyaml.load(`
    RD:
      - B: 1-2, 100
      - X: 1-4, 80
      - B: 3-4, 100
    `);
    const parser = new LangParser();
    parser.parseGroupStructure(jsyaml.load(`
    groups:
      - RD
      - RR
  `)['groups']);
    parser.parseGroupItems('RD', testData['RD']);
    const rd = parser.groups.get('RD');
    const rr = parser.groups.get('RR');
    LayoutComputation.computeItemRowIndices(rd);
    LayoutComputation.computeItemRowIndices(rr);
    console.log(parser.groups);
    // Test that "B" rowIndex is 0 instead of 2.
    assert(rd.items[2].rowIndex, 0);
    assert(rd.rowSpan, 2);
    assert(rr.rowSpan, 1);
}
function testComputeGroupRowIndices() {
    const testData = jsyaml.load(`
    RD:
      - B: 1-2, 100
      - X: 1-4, 80
    `);
    const parser = new LangParser();
    parser.parseGroupStructure(jsyaml.load(`
    groups:
      - Exp:
        - Online:
          - RD
          - RR
        - Offline
      - ML
  `)['groups']);
    parser.parseGroupItems('RD', testData['RD']);
    LayoutComputation.computeAllItemRowIndices(parser.groups);
    LayoutComputation.computeGroupRowIndices(parser.groups);
    console.log(parser.groups);
    assert(parser.groups.get('ML').rowIndex, 4);
}
function testParse() {
    const content = `
    groups:
      - Exp:
        - Online:
          - RD
          - RR
        - Offline
      - ML

    RD:
      - B: 1-2, 100
      - X: 1-4, 80
      - B: 3-4, 100
    `;
    const parser = new LangParser();
    parser.parse(content);
    console.log(parser.groups);
}
function runTests() {
    const parser = new LangParser();
    testParsingGroupStructure(parser);
    testParsingGroupItems(parser);
    testComputeItemRowIndices();
    testComputeGroupRowIndices();
    testParse();
}
function assert(value, expectedValue) {
    if (value !== expectedValue) {
        throw `${value} does not equal to expected value ${expectedValue}`;
    }
}
