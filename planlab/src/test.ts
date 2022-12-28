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

  assert(parser.groups.get('Exp')?.depth, 0);
  assert(parser.groups.get('ML')?.depth, 0);
  assert(parser.groups.get('Online')?.depth, 1);
  assert(parser.groups.get('Offline')?.depth, 1);
  assert(parser.groups.get('RD')?.depth, 2);
  assert(parser.groups.get('RR')?.depth, 2);
}

function testParsingGroupItems(parser: LangParser) {
  const testData = jsyaml.load(`
    RD:
      - B: 1-4, 100, (TL)
      - X: 1-4, 80, (Main IC)
    `) as { RD: ItemYaml[] };
  console.log(parser.parseGroupItems('RD', testData['RD']));

  const rd = parser.groups.get('RD')!;
  assert(rd.items[0]!.name, 'B');
  assert(rd.items[0]!.spanFromCol, 0);
  assert(rd.items[0]!.spanToCol, 3);
  assert(rd.items[0]!.description, '(TL)');
  assert(rd.items[1]!.name, 'X');
  assert(rd.items[1]!.spanFromCol, 0);
  assert(rd.items[1]!.spanToCol, 3);
  assert(rd.items[1]!.description, '(Main IC)');
}

function testParseLayoutConfig() {
  const testData = jsyaml.load(`
    global:
      - rowHeight: 50
      - customGroupWidths: [20, 40, 40]
    `) as { global: any[] };
  const parser = new LangParser();
  parser.parseGlobalStyleConfig(testData.global);

  console.log(parser.rendererStyleConfig);

  assert(parser.rendererStyleConfig.rowHeight, 50);
  assert(parser.rendererStyleConfig.customGroupWidths[2], 40);
}

function testParseStyles() {
  const testData = jsyaml.load(`
    styles:
      - B:
        - text: { font-weight: bold }
      - BD:
        - rect: { fill: red }
    `) as { styles: any[] };
  const parser = new LangParser();
  parser.parseStyles(testData['styles']);

  console.log(parser.customStyles);

  assert(parser.customStyles.get('B')?.textStyle['font-weight'], 'bold');
  assert(parser.customStyles.get('BD')?.rectStyle['fill'], 'red');
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
      - RR
  `) as { groups: any[] })['groups']);
  parser.parseGroupItems('RD', testData['RD']);

  const rd = parser.groups.get('RD')!;
  const rr = parser.groups.get('RR')!;
  LayoutComputation.computeItemRowIndices(rd);
  LayoutComputation.computeItemRowIndices(rr);

  console.log(parser.groups);

  // Test that "B" rowIndex is 0 instead of 2.
  assert(rd.items[2]!.rowIndex, 0);
  assert(rd.rowSpan, 2);
  assert(rr.rowSpan, 1);
}

function testComputeGroupRowIndices() {
  const testData = jsyaml.load(`
    RD:
      - B: 1-2, 100
      - X: 1-4, 80
    `) as { RD: ItemYaml[] };
  const parser = new LangParser();
  parser.parseGroupStructure((jsyaml.load(`
    groups:
      - Exp:
        - Online:
          - RD
          - RR
        - Offline
      - ML
  `) as { groups: any[] })['groups']);
  parser.parseGroupItems('RD', testData['RD']);

  LayoutComputation.computeAllItemRowIndices(parser.groups);
  LayoutComputation.computeGroupRowIndices(parser.groups);

  console.log(parser.groups);

  assert(parser.groups.get('ML')!.rowIndex, 4);
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
  testParseLayoutConfig();
  testParseStyles();
  testComputeItemRowIndices();
  testComputeGroupRowIndices();
  testParse();
}
