function testParsingGroupStructure() {
  const testData = jsyaml.load(`
    groups:
      - Exp:
        - Online:
          - RD
          - RR
        - Offline
      - ML
    `) as { groups: any[] };
  const parser = new LangParser();
  parser.parseGroupStructure(testData.groups);

  console.log(parser.groups);

  assert(parser.groups.get('Exp')?.depth, 0);
  assert(parser.groups.get('ML')?.depth, 0);
  assert(parser.groups.get('Online')?.depth, 1);
  assert(parser.groups.get('Offline')?.depth, 1);
  assert(parser.groups.get('RD')?.depth, 2);
  assert(parser.groups.get('RR')?.depth, 2);
}

function testParsingSpeicalGroupNames() {
  const testData = jsyaml.load(`
    groups:
      - ^hidden
      - (key)Using Key
      - ^(hidden_with_key)hidden and with key
    `) as { groups: any[] };
  const parser = new LangParser();
  parser.parseGroupStructure(testData.groups);

  console.log(parser.groups);

  assert(parser.groups.get('hidden')?.hide, true);
  assert(parser.groups.get('key')?.displayName, 'Using Key');
  assert(parser.groups.get('hidden_with_key')?.hide, true);
  assert(parser.groups.get('hidden_with_key')?.displayName, 'hidden and with key');
}

function testParsingGroupItems() {
  const groupData = jsyaml.load(`
    groups:
      - RD
    `) as { groups: any[] };
  const itemData = jsyaml.load(`
    RD:
      - B: 1-4, (TL)
      - X: 1-4, (Main IC)
    `) as { RD: ItemYaml[] };
  const parser = new LangParser();
  parser.parseGroupStructure(groupData.groups);
  parser.parseGroupItems('RD', itemData.RD);
  console.log(parser.groups);

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

function testParsingGroupItemsSpecialRulesOnNames() {
  const groupData = jsyaml.load(`
    groups:
      - RD
    `) as { groups: any[] };
  const itemData = jsyaml.load(`
    RD:
      - B0: 1-1
      - ^B1: 1-1
      - ;B2: 1-1
      - ^;B3: 1-1
    `) as { RD: ItemYaml[] };

  const parser = new LangParser();
  parser.parseGroupStructure(groupData.groups);
  parser.parseGroupItems('RD', itemData.RD);
  console.log(parser.groups);

  const rd = parser.groups.get('RD')!;
  let item;
  item = rd.items[0];
  assert(item.name, 'B0');
  assert(item.hideName, false);
  assert(item.textCentered, false);
  item = rd.items[1];
  assert(item.name, 'B1');
  assert(item.hideName, true);
  item = rd.items[2];
  assert(item.name, 'B2');
  assert(item.textCentered, true);
  item = rd.items[3];
  assert(item.name, 'B3');
  assert(item.hideName, true);
  assert(item.textCentered, true);
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
  testParsingGroupStructure();
  testParsingSpeicalGroupNames();
  testParsingGroupItems();
  testParsingGroupItemsSpecialRulesOnNames();
  testParseLayoutConfig();
  testParseStyles();
  testComputeItemRowIndices();
  testComputeGroupRowIndices();
  testParse();
}
