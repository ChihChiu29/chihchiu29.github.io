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
        addTo(renderer) {
            for (const elem of this.getElements(renderer.style)) {
                renderer.addElement(elem, this.zValue);
            }
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
})(svg || (svg = {}));
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
class LangParser {
    GROUP_STRUCT_KEYWORD = 'groups';
    // A map from a string to either a string
    groups = new Map();
    maxGroupDepth = 0;
    constructor() {
    }
    /**
     * Entry point.
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
        // Compute row indices.
        for (const group of this.groups.values()) {
            LayoutComputation.computeItemRowIndices(group);
        }
    }
    /**
     * Parses a group structure object into Group[].
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
            if (typeof (subgroup) !== 'object') {
                // leaf
                name = subgroup.toString();
                // Items will be filled later
                groups.set(name, { name, depth: currentDepth, children: [], items: [] });
            }
            else {
                // group with a single key
                name = this.getSingleKey(subgroup);
                const subgroupNames = this.parseGroupRecursive(subgroup[name], currentDepth + 1, groups);
                groups.set(name, { name, depth: currentDepth, children: subgroupNames });
            }
            groupNames.push(name);
        }
        return groupNames;
    }
    // Parses a single item config of type '1-4, 80, (Main IC)'.
    parseItemConfig(name, config) {
        const item = { name, spanFromColumn: 0, spanUntilColumn: 0, capacityPercentage: 100 };
        const configSegments = config.split(',').map(s => s.trim());
        const spanSegments = configSegments[0].split('-');
        item.spanFromColumn = Number(spanSegments[0]);
        item.spanUntilColumn = Number(spanSegments[1]);
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
    /**
     * Compute row indices of the items in the given group.
     *
     * No-op for group with no items.
     */
    function computeItemRowIndices(leafGroup) {
        const items = leafGroup.items;
        if (!items) {
            return;
        }
        let maxNumberOfColumns = Math.max(...items.map(item => item.spanUntilColumn));
        let maxNumberOfRows = items.length;
        // { `row,column`: occupied }
        const spaces = new Map();
        // Initializes row indices and spaces.
        for (const [rowIdx, item] of items.entries()) {
            item.rowIndex = rowIdx;
            for (let colIdx = item.spanFromColumn; colIdx <= item.spanUntilColumn; colIdx++) {
                spaces.set(getRowColKey(rowIdx, colIdx), true);
            }
        }
        // Condenses row indices.
        let modificationHappened = false;
        while (true) {
            for (const item of items) {
                const rowIdx = item.rowIndex;
                for (let tryRowIdx = 0; tryRowIdx < rowIdx; tryRowIdx++) {
                    if (!isSpaceFull(spaces, tryRowIdx, item.spanFromColumn, item.spanUntilColumn)) {
                        for (let colIdx = item.spanFromColumn; colIdx <= item.spanUntilColumn; colIdx++) {
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
    }
    LayoutComputation.computeItemRowIndices = computeItemRowIndices;
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
}
function testParsingGroupItems(parser) {
    const testData = jsyaml.load(`
    RD:
      - B: 1-4, 100, (TL)
      - X: 1-4, 80, (Main IC)
    `);
    console.log(parser.parseGroupItems('RD', testData['RD']));
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
  `)['groups']);
    const group = parser.parseGroupItems('RD', testData['RD']);
    LayoutComputation.computeItemRowIndices(group);
    console.log(group);
    assert(group.items[2].rowIndex == 0);
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
    testParse();
}
function assert(value) {
    if (!value) {
        throw `${value} is not true`;
    }
}
