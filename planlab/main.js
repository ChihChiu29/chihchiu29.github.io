"use strict";
function main() {
    testLangParser();
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
    parseGroup(groupsYaml) {
        this.groups = new Map();
        this.parseGroupRecursive(groupsYaml, 0, this.groups);
        // Return only for testing.
        return this.groups;
    }
    // Recursive parse groups, returns the names of the top level groups.
    parseGroupRecursive(subgroupYaml, currentDepth, groups) {
        const groupNames = [];
        for (const subgroup of subgroupYaml) {
            let name;
            if (typeof (subgroup) !== 'object') {
                // leaf
                name = subgroup.toString();
                groups.set(name, { name, depth: currentDepth, children: [] });
            }
            else {
                // group with a single key
                name = Object.keys(subgroup)[0];
                const subgroupNames = this.parseGroupRecursive(subgroup[name], currentDepth + 1, groups);
                groups.set(name, { name, depth: currentDepth, children: subgroupNames });
            }
            groupNames.push(name);
        }
        return groupNames;
    }
}
function testLangParser() {
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
    const parser = new LangParser();
    console.log(parser.parseGroup(testData['groups']));
}
