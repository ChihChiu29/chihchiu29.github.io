function main() {
  const cmds = [
    'viewport 0 0 1500 2000',

    'var bigsize 400 250',
    'var gap 200',

    'rect A hello world',
    'bgcolor A lightblue',
    'rect B foo bar \n and foo bar again',
    'stack X A B with stacked!',
    'move X 30 30 ${bigsize}',

    'rect C hello world',
    'rect D foo bar',
    'tile Y 3 C D with tiled!',
    'var newY [${X.down} + ${gap}]',
    'move Y [${X.right}+50] ${newY} ${bigsize}',

    '~> X down Y up curly link downwards',
    'rectcentered aa some right side box',
    'move aa 800 50 ${bigsize}',
    '--> X right aa left straight dahsed link',

    'grid 5 5 20 20',
    'rect r1 try out grid layout',
    'rect r2 try out grid layout',
    'rect r3 try out grid layout',
    'gmove r1 0 2',
    'gmove r2 4 2',
    'gmove r3 0 4 4 4',
    '~> r1 down r3 up input 1',
    '~> r2 down r3 up input 2',
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