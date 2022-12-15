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
  console.log(testData);
  console.log(parser.parseGroupStructure(testData['groups']));
}

function testParsingGroupItems(parser: LangParser) {
  const testData = jsyaml.load(`
    RD:
      - B: 1-4, 100, (TL)
      - X: 1-4, 80, (Main IC)
    `) as { groups: any[] };
  console.log(testData);
  console.log(parser.parseGroupItems(testData));
}

function testParser() {
  const parser = new LangParser();
  testParsingGroupStructure(parser);
  testParsingGroupItems(parser);
}