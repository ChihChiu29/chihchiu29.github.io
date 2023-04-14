const PAGE_PATH = '/planlab/';

const GRAPH_URL_PARAM = 'g';

const DEFAULT_GRAPH = `
d.viewport(0, 0, 1200, 1000);

var w = 200;
var h = 100;
var O = d.rect("THINK").cmove(100, 500, w, 300).color("purple2");

function createLoop(text, width, height) {
  return d.rect(text, O.cx(), O.cy() - height / 2, width, height);
}
var l1 = createLoop("Inner Loop", 500, 300).color("grey3").setZ(-100);
var l2 = createLoop("Middle Loop", 700, 500).color("grey2").setZ(-101);
var l3 = createLoop("Outer Loop", 900, 700).color("grey1").setZ(-102);




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
  const encodedGraphData = btoa(LZString.compressToBase64(graphData));  // with compression
  if (graphData !== DEFAULT_GRAPH) {
    window.history.pushState(
      'updated', 'Planlab',
      `${PAGE_PATH}?g=${encodedGraphData}`);
  }

  // Report mouse location when moving.
  const svgElement = document.querySelector('#drawarea svg')!;
  svgElement.removeEventListener('mousemove', reportLocationListener);
  svgElement.addEventListener('mousemove', reportLocationListener, false);

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
