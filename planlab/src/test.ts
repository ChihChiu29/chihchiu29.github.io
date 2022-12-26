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

  assert(parser.groups.get('Exp')?.depth === 0);
  assert(parser.groups.get('ML')?.depth === 0);
  assert(parser.groups.get('Online')?.depth === 1);
  assert(parser.groups.get('Offline')?.depth === 1);
  assert(parser.groups.get('RD')?.depth === 2);
  assert(parser.groups.get('RR')?.depth === 2);
}

function testParsingGroupItems(parser: LangParser) {
  const testData = jsyaml.load(`
    RD:
      - B: 1-4, 100, (TL)
      - X: 1-4, 80, (Main IC)
    `) as { RD: ItemYaml[] };
  console.log(parser.parseGroupItems('RD', testData['RD']));

  const rd = parser.groups.get('RD')!;
  assert(rd.items[0]!.name === 'B');
  assert(rd.items[0]!.spanFromColumn === 1);
  assert(rd.items[0]!.spanUntilColumn === 4);
  assert(rd.items[0]!.capacityPercentage === 100);
  assert(rd.items[0]!.description === '(TL)');
  assert(rd.items[1]!.name === 'X');
  assert(rd.items[1]!.spanFromColumn === 1);
  assert(rd.items[1]!.spanUntilColumn === 4);
  assert(rd.items[1]!.capacityPercentage === 80);
  assert(rd.items[1]!.description === '(Main IC)');
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

  // Test that "B" rowIndex is 0 instead of 2.
  assert(group.items[2]!.rowIndex == 0);
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
