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

function getExampleYaml(): string {
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