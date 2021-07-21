const PAGE_PATH = '/diagramlab/diagramlab.html';

const GRAPH_URL_PARAM = 'g';

const DEFAULT_GRAPH = `// set draw area
viewport 0 0 1200 1200

// simple examples
rect A1 hello world
rect A2 foo bar \\n text in new line
move A1 0 0 200 50
move A2 500 0 200 50
-> A1 right A2 left

// using composited shapes
rect B1 hello world
rect B2 foo bar
stack B_stacked B1 B2 with stacked!
rect B10 hello world
rect B11 foo bar
rect B12 whatever
tile B_tiled 1 B10 B11 B12 with tiled
move B_stacked 0 200 300 200
move B_tiled 800 200 300 200

// links! straight/curved: -/~, solid/dash: -/--, ~/~~, start/end/double arrow: </>/<*>
~> B2 right B12 left solid curved link with ending arrow
- B2 right B_tiled left solid straight link without arrow
<~~ A2 down B_stacked up dashed curved link
<--> A1 right B_tiled up dahsed straight link with double arrows
// manually create link annotation using text
text link_annotation manuallly added link annotation \\n blah blah blah
move link_annotation 450 370 300 30

// use grid layout
// 10x10 table, with 20 gap between columns and 20 gap between rows
grid 10 10 20 20
rect C1 single cell \\n rect
// move C1 to column 0 and row 6, it has the size of a single cell
gmove C1 0 6
rect C2 multi-cell \\n rect
// move C2 to column 5 and row 5, and makes it to span till column 6 and row 6
gmove C2 5 5 6 6
// links still work
~> C1 right C2 left
// finally, if you use stack or tile, (like normal rect) you need to gmove the stacked or tiled shape

// use variables
var commonsize 300 50
var common_y 1000
// now use $var to create new rects with same size
rect D1 new rect of same size and y 1
rect D2 new rect of same size and y 2
move D1 0 $common_y $commonsize
move D2 500 $common_y $commonsize

// change background color
var common_y_and_size 1100 300 50
rect E1 color: "lightblue"
rect E2 color: "pink"
rect E3 color: "#7d4a91"
move E1 0 $common_y_and_size
bgcolor E1 lightblue
move E2 400 $common_y_and_size
bgcolor E2 pink
move E3 800 $common_y_and_size
bgcolor E3 #7d4a91`;

const INPUT_ELEMENT_CSS = '#input';

function draw(useGrid = true) {
  const renderer = new SVGRenderer(document.querySelector('#drawarea'));
  renderer.useGrid = useGrid;
  const interpreter = new DiagramLangInterpreter(renderer);
  const graphData = document.querySelector(INPUT_ELEMENT_CSS).value;
  for (const cmd of graphData.split('\n')) {
    interpreter.handleSingleCommand(cmd);
  }
  interpreter.finish();
  renderer.draw();

  // Since drawing has no error, safe to update URL.
  window.history.pushState(
    'updated diagram', 'Diagramlab',
    `${PAGE_PATH}?g=${encodeURIComponent(graphData)}`);

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

  return renderer;
}

function save() {
  // References:
  //   - https://levelup.gitconnected.com/draw-an-svg-to-canvas-and-download-it-as-image-in-javascript-f7f7713cf81f
  //   - http://bl.ocks.org/biovisualize/8187844
  const renderer = draw(/*useGrid*/false);
  const svgElement = document.querySelector('#drawarea svg');

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
    canvas.width = renderer.width;
    canvas.height = renderer.height;
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
}

document.addEventListener("DOMContentLoaded", onload);