function main() {
  const cmds = [
    'viewport 0 0 1500 2000',

    'var bigsize 400 250',
    'var gap 200',

    'rect A hello world',
    'bgcolor A lightblue',
    'rect B foo bar \n and foo bar again',
    'stack X A B with stacked!',
    'cmove X 300 200 ${bigsize}',

    'rect C hello world',
    'rect D foo bar',
    'tile Y 3 C D with tiled!',
    'var newY [${X.down} + ${gap}]',
    'cmove Y [${X.right}+50] ${newY} ${bigsize}',

    '~> X down Y up curly link downwards',
    'crect aa some right side box',
    'move aa 800 50 ${bigsize}',
    '--> X right aa left straight dahsed link',

    'grid 150 700 400 100',
    'var size 200 50',
    'rect r1 try out grid layout',
    'cmove r1 ${X1} ${Y3} ${size}',
    'rect r2 try out grid layout',
    'rect r3 try out grid layout',
    'cgmove r2 2 3 ${size}',
    'cgmove r3 2 5 ${size}',
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