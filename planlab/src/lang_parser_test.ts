function testLangParser() {
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

  const parser = new LangParser();
  console.log(parser.parseGroup(testData['groups']));
}

