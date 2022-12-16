function testParsingGroupStructure(parser: LangParser) {
  const testData = jsyaml.load(`
    groups:
      - Exp:
        - Online:
          - RD
          - RR
        - Offline
      - ML
    `) as { groups: any[] };
  console.log(parser.parseGroupStructure(testData['groups']));
}

function testParsingGroupItems(parser: LangParser) {
  const testData = jsyaml.load(`
    RD:
      - B: 1-4, 100, (TL)
      - X: 1-4, 80, (Main IC)
    `) as { RD: ItemYaml[] };
  console.log(parser.parseGroupItems('RD', testData['RD']));
}

function testComputeItemRowIndices() {
  const testData = jsyaml.load(`
    RD:
      - B: 1-2, 100
      - X: 1-4, 80
      - B: 3-4, 100
    `) as { RD: ItemYaml[] };
  const parser = new LangParser();
  parser.parseGroupStructure((jsyaml.load(`
    groups:
      - RD
  `) as { groups: any[] })['groups']);
  const group = parser.parseGroupItems('RD', testData['RD']);
  LayoutComputation.computeItemRowIndices(group);
  console.log(group);

  assert(group.items![2].rowIndex == 0);
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