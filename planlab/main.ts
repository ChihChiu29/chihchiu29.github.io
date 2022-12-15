console.log('hello world!');

const test = jsyaml.load(`
a:
 - b
 - c
`);

console.log(test);