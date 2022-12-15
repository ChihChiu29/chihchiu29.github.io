"use strict";
function main() {
    testParser();
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
    // A map from a string to either a string
    groups = new Map();
    maxGroupDepth = 0;
    constructor() {
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
     * Example input: parsed YAML object of:
     * - RD:
     *   - B: 1-4, 100, (TL)
     *   - X: 1-4, 80, (Main IC)
     * A.k.a: {RD: [{B: '...', X: '...'}]}
     */
    parseGroupItems(groupItemYaml) {
        const groupItemConfig = groupItemYaml;
        const groupName = this.getSingleKey(groupItemYaml);
        // Key should be checked before calling this function.
        const group = this.groups.get(groupName);
        for (const itemConfig of groupItemConfig[groupName]) {
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
    console.log(testData);
    console.log(parser.parseGroupStructure(testData['groups']));
}
function testParsingGroupItems(parser) {
    const testData = jsyaml.load(`
    RD:
      - B: 1-4, 100, (TL)
      - X: 1-4, 80, (Main IC)
    `);
    console.log(testData);
    console.log(parser.parseGroupItems(testData));
}
function testParser() {
    const parser = new LangParser();
    testParsingGroupStructure(parser);
    testParsingGroupItems(parser);
}
