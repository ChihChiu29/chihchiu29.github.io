"use strict";
function main() {
    runTests();
}
window.addEventListener('load', function () {
    main();
});
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
