const PAGE_PATH = '.';

const GRAPH_URL_PARAM = 'g';

// Use chrome dev tool to test the code, start with:
//   var renderer = new svg.SVGRenderer(document.querySelector(DRAW_AREA_SELECTOR));
//   d = new diagramlang.Drawer(renderer);
const DEFAULT_GRAPH = `
d.viewport(0, 0, 1500, 1200);

var w = 140;
var h = 60;
var O = d.rect("THINK DEBUG ANALYZE").cmove(200, 600, w, 120).color("purple3")
         .textStyle({"font-size": 26, "font-weight": "bold"});

function createLoop(text, width, height) {
  return d.rect(text, O.cx(), O.cy() - height / 2, width, height)
          .textStyle({"font-size": 24, "font-weight": "lighter"});
}
var l1 = createLoop("Inner Loop - Development", 500, 200).color("blue3")
    .style({rx: '20%', ry: '20%', stroke: 'none'}).setZ(-100);
var l2 = createLoop("Outer Loop - Experimentation", 800, 400).color("blue2")
    .style({rx: '20%', ry: '20%', stroke: 'none'})
    .textPos(false, true).textShift(0, 10).setZ(-101);

var a1 = d.rect("Create CL").cmove(l1.cx(), l1.top(), w, h);
var a2 = d.rect("Run Dev Server").cmove(l1.right(), l1.cy(), w, h);
var a3 = d.rect("Interactive Testing").cmove(l1.cx(), l1.bottom(), w, h);
d.link(O, "up", a1, "left");
d.link(a1, "right", a2, "up");
d.link(a2, "down", a3, "right");
d.link(a3, "left", O, "down");

var b1 = d.rect("Setup Experiment").cmove(l2.cx(), l2.top(), w, h);
var b2 = d.rect("Run Experiment").cmove(l2.right(), l2.cy(), w, h);
var b3 = d.rect("Collect Data").cmove(l2.cx(), l2.bottom(), w, h);
d.link(O, "up", b1, "left");
d.link(b1, "right", b2, "up");
d.link(b2, "down", b3, "right");
d.link(b3, "left", O, "down");

// Since we no longer need the loops for location, make them bigger to look better.
l1.cmove(l1.cx(), l1.cy(), l1.width() + 200, l1.height() + 100);
l2.cmove(l2.cx(), l2.cy(), l2.width() + 250, l2.height() + 150);
`;

const INPUT_ELEMENT_CSS = '#input';
const DRAW_AREA_SELECTOR = '#drawarea';

// Very likely we don't need this forever since Renderer has a similar margin in place already.
const SAVE_SVG_MARGIN = 0;

function draw(useGrid = true): svg.RenderReport {
  const renderer = new svg.SVGRenderer(document.querySelector(DRAW_AREA_SELECTOR)!);
  const graphData = (document.querySelector(INPUT_ELEMENT_CSS) as HTMLInputElement)!.value;

  // `d` is the keyword used in the user provided code.
  const d = new diagramlang.Drawer(renderer);
  try {
    eval(graphData);
  } catch (error) {
    alert(error);
  }
  d.finalize();
  const report = renderer.draw();

  // Since drawing has no error, safe to update URL.
  // const encodedGraphData = btoa(graphData);  // base64 encode without compression
  if (graphData !== DEFAULT_GRAPH) {
    const encodedGraphData = btoa(LZString.compressToBase64(graphData));  // with compression
    window.history.pushState(
      'updated', 'DiagramLab2',
      `${PAGE_PATH}?g=${encodedGraphData}`);
  }

  // Report mouse location when moving.
  const svgElement = document.querySelector('#drawarea svg')!;
  svgElement.removeEventListener('mousemove', reportLocationListener);
  svgElement.addEventListener('mousemove', reportLocationListener, false);

  console.log(report);
  return report;
}

function save() {
  // References:
  //   - https://levelup.gitconnected.com/draw-an-svg-to-canvas-and-download-it-as-image-in-javascript-f7f7713cf81f
  //   - http://bl.ocks.org/biovisualize/8187844
  const report: svg.RenderReport = draw(/*useGrid*/false);
  const svgElement = document.querySelector('#drawarea svg') as SVGSVGElement;
  svgElement.setAttribute(
    'viewBox',
    `${report.dimension.x - SAVE_SVG_MARGIN} 
      ${report.dimension.y - SAVE_SVG_MARGIN}
      ${report.dimension.width + SAVE_SVG_MARGIN * 2}
      ${report.dimension.height + SAVE_SVG_MARGIN * 2}`);

  const { width, height } = svgElement.getBBox();
  var svgString = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  let URL = window.URL || window.webkitURL || window;
  let blobURL = URL.createObjectURL(blob);
  const image = new Image();
  image.onload = () => {
    // Canvas references:
    //   - https://stackoverflow.com/questions/38061836/blurry-svg-in-canvas
    //   - https://stackoverflow.com/questions/24395076/canvas-generated-by-canvg-is-blurry-on-retina-screen
    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d')!;

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
    document.querySelector('#save-action')!.append(link);
    link.href = png;
    link.click();
    link.remove();
  };
  image.src = blobURL;
}

function reportLocationListener(evt: any) {
  const svgElement = document.querySelector('#drawarea svg') as SVGSVGElement;
  const pt = svgElement.createSVGPoint();
  pt.x = evt.clientX; pt.y = evt.clientY;
  const { x, y } = pt.matrixTransform(svgElement.getScreenCTM()!.inverse());
  (document.querySelector('#report #location')! as HTMLElement).innerText = `Coordinates: (${Math.floor(x)}, ${Math.floor(y)})`;
}

function main() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const graphData = urlParams.get(GRAPH_URL_PARAM);
  const inputElement = document.querySelector(INPUT_ELEMENT_CSS) as HTMLInputElement;
  if (graphData) {
    // inputElement.value = atob(graphData);  // base64 without compression
    inputElement.value = LZString.decompressFromBase64(atob(graphData));  // with compression
  } else {
    inputElement.value = DEFAULT_GRAPH;
  }

  draw();
}

window.addEventListener('DOMContentLoaded', function () {
  main();
  // runTests();
});
