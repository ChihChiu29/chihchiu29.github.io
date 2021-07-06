function main() {
  const cmds = [
    'viewport 0 0 1000 1500',
    'var bigsize 400 250',
    'rect A hello world',
    'bgcolor A lightblue',
    'rect B foo bar \n and foo bar again',
    'stack X A B with stacked!',
    'move X 30 30 $bigsize',
    'rect C hello world',
    'rect D foo bar',
    'tile Y 3 C D with tiled!',
    'move Y 130 450 $bigsize',
    '~> X down Y up curly link downwards',
    'rectcentered aa some right side box',
    'move aa 800 50 $bigsize',
    '-> X right aa left straight link',
  ];

  const renderer = new SVGRenderer(document.querySelector('#canvas'));
  const interpreter = new DiagramLangInterpreter(renderer);
  for (const cmd of cmds) {
    interpreter.handleSingleCommand(cmd);
  }
  interpreter.finish();
  renderer.draw();
}

document.addEventListener("DOMContentLoaded", main);