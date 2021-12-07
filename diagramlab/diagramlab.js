const PAGE_PATH = '/diagramlab/diagramlab.html';

const GRAPH_URL_PARAM = 'g';

const DEFAULT_GRAPH = `// set draw area
viewport 0 0 1200 1200

// simple examples
rect A1 Rect at (0, 0)
move A1 0 0 200 50
rect A2 Rect centered (500, 25) \\n can use multi-line!
cmove A2 500 25 200 50
-> A1 right A2 left

// using composited shapes
rect B1 hello world
rect B2 foo bar
stack B_stacked B1 B2 with stacked!
move B_stacked 0 200 300 200
rect B10 hello world
rect B11 foo bar
rect B12 whatever
tile B_tiled1 1 B10 B11 B12 with tiled
move B_tiled1 600 200 300 200
rect B20 hello world
rect B21 foo bar
tile B_tiled2 1 B20 B21 with tiled using custom gap size usinggap 0 100
move B_tiled2 950 100 200 400

// links! straight/curved: -/~, solid/dash: -/--, ~/~~, start/end/double arrow: </>/<*>
~> B2 right B12 left solid curved link with ending arrow
- B2 right B_tiled1 left solid straight link without arrow
<~~ A2 down B_stacked up dashed curved link
<--> A1 right B_tiled1 up dahsed straight link with double arrows
// manually create link annotation using text
text link_annotation manuallly added link annotation \\n blah blah blah
move link_annotation 450 370 300 30

// use variables and properties "(\${...})", and math expressions "[...]"
var commonsize 300 50
// now use \${var} to create new rects with same size
rect D1 D1: rect at some position with some size
rect D2 D2: x value +500 relative to the one to the left,\\nsame y and same size
move D1 0 700 \${commonsize}
move D2 [\${D1.x}+500] \${D1.y} \${commonsize}
rect D3 put this between D1 and D2, shift it up
move D3 [(\${D1.left} + \${D2.left})/2] [\${D1.y}-\${D1.height}] \${commonsize}

// use grid layout and the special \${defaultsize} variable
// create a grid starting from (100, 500), with gap (200, 100)
var defaultsize 200 50
grid 100 500 200 100
rect C1 Rect cornered at grid (1, 1)
// use grid move, with default size (you don't have to use default size)
gmove C1 1 1
rect C2 Rect cornered at grid (3, 1)
gmove C2 3 1
~> C1 right C2 left
// next use centered grid move: cgmove
rect C3 Rect centered at grid (1, 2)
cgmove C3 1 2
rect C4 Rect centered at grid (3, 2)
cgmove C4 3 2

// change background color
var common_y_and_size 800 300 50
rect E1 color: "lightblue"
rect E2 color: "pink"
rect E3 color: "#7d4a91"
move E1 0 \${common_y_and_size}
bgcolor E1 lightblue
move E2 400 \${common_y_and_size}
bgcolor E2 pink
move E3 800 \${common_y_and_size}
bgcolor E3 #7d4a91
// finally, change all shapes starting with "D" to green!
bgcolor D* green`;

const INPUT_ELEMENT_CSS = '#input';

function draw(useGrid = true) {
  const renderer = new SVGRenderer(document.querySelector('#drawarea'));
  renderer.useGrid = useGrid;
  const interpreter = new DiagramLangInterpreter(renderer);
  const graphData = document.querySelector(INPUT_ELEMENT_CSS).value;
  for (const cmd of graphData.split('\n')) {
    interpreter.handleSingleCommand(cmd);
  }
  const report = interpreter.finish();
  renderer.draw();

  // Since drawing has no error, safe to update URL.
  if (graphData !== DEFAULT_GRAPH) {
    window.history.pushState(
      'updated diagram', 'Diagramlab',
      `${PAGE_PATH}?g=${encodeURIComponent(graphData)}`);
  }

  // Report mouse location when moving.
  const svgElement = document.querySelector('#drawarea svg');
  svgElement.removeEventListener('mousemove', reportLocationListener);
  svgElement.addEventListener('mousemove', reportLocationListener, false);

  // Report name of clicked named shape.
  // Ref: Fancy way to select elements with non empty attribute values: https://css-tricks.com/select-an-element-with-a-non-empty-attribute/
  // But here having a "name" attribute is enough.
  for (const elem of document.querySelectorAll('[name]')) {
    const nameElem = document.querySelector('#report #name');
    elem.addEventListener('mouseenter', (event) => {
      nameElem.innerText = `Element name: ${elem.getAttribute('name')}`;
    });
    elem.addEventListener('mouseleave', (event) => {
      nameElem.innerText = '';
    });
  }

  return {
    renderer: renderer,
    report: report,
  }
}

function save() {
  // References:
  //   - https://levelup.gitconnected.com/draw-an-svg-to-canvas-and-download-it-as-image-in-javascript-f7f7713cf81f
  //   - http://bl.ocks.org/biovisualize/8187844
  const drawResult = draw(/*useGrid*/false);
  const renderer = drawResult.renderer;
  const report = drawResult.report;
  const svgElement = document.querySelector('#drawarea svg');
  svgElement.setAttribute('viewBox', `${report.minX} ${report.minY} ${report.maxX - report.minX} ${report.maxY - report.minY}`);

  const { width, height } = svgElement.getBBox();
  var svgString = new XMLSerializer().serializeToString(svgElement);
  blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  let URL = window.URL || window.webkitURL || window;
  let blobURL = URL.createObjectURL(blob);
  image = new Image();
  image.onload = () => {
    // Canvas references:
    //   - https://stackoverflow.com/questions/38061836/blurry-svg-in-canvas
    //   - https://stackoverflow.com/questions/24395076/canvas-generated-by-canvg-is-blurry-on-retina-screen
    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');

    // In short:
    //   - devicePixelRatio decises how things are scaled on monitor.
    //   - to get a similar crisp feeling of the svg image, the canvas needs to be as large as viewport * scale factor.
    var pixelRatio = window.devicePixelRatio || 1;
    canvas.width = width;
    canvas.height = height;
    canvas.width *= pixelRatio;
    canvas.height *= pixelRatio;

    context.drawImage(image, 0, 0);
    let png = canvas.toDataURL();
    var link = document.createElement('a');
    link.download = 'diagram.png';
    link.style.opacity = "0";
    document.querySelector('#save-action').append(link);
    link.href = png;
    link.click();
    link.remove();
  };
  image.src = blobURL;
}

function reportLocationListener(evt) {
  const svgElement = document.querySelector('#drawarea svg');
  const pt = svgElement.createSVGPoint();
  pt.x = evt.clientX; pt.y = evt.clientY;
  const { x, y } = pt.matrixTransform(svgElement.getScreenCTM().inverse());
  document.querySelector('#report #location').innerText = `Coordinates: (${Math.floor(x)}, ${Math.floor(y)})`;
}

function onload() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const graphData = urlParams.get(GRAPH_URL_PARAM);
  if (graphData) {
    document.querySelector(INPUT_ELEMENT_CSS).value = decodeURIComponent(graphData);
  } else {
    document.querySelector(INPUT_ELEMENT_CSS).value = DEFAULT_GRAPH;
  }

  const interpreter = new DiagramLangInterpreter(document.querySelector('#drawarea'));
  document.querySelector('#reference').innerText = Object.keys(interpreter.handlerMap).join(', ');

  draw();
}

document.addEventListener("DOMContentLoaded", onload);
