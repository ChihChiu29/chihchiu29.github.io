const PAGE_PATH = '.';

const GRAPH_URL_PARAM = 'g';

// Use chrome dev tool to test the code, start with:
//   var renderer = new svg.SVGRenderer(document.querySelector(DRAW_AREA_SELECTOR));
//   d = new diagramlang.Drawer(renderer);
const DEFAULT_GRAPH = `
// Quickstart:
//   - Every action starts with the drawer 'd'.
//   - 'd.rect' creates a new rect with text. Then you can use:
//     move, cmove, text, up/down/left/right, cx, cy, color, style, textColor, ...
//   - 'd.link' creates a link that can connect two rects. Then use:
//     from, to, text, dashed, ...
//   - 'd.links' creates a group of links from two groups of shapes.
//   - 'd.layout' creates a layout object that helps to layout shapes. Try:
//     move, cmove, tile
// The example below has some illustration of APIs, for a more complete list, visit:
// https://github.com/ChihChiu29/chihchiu29.github.io/blob/master/diagramlab2/src/diagramdrawer.ts
// Alternatively, use Chrome dev tool then creates an instance of 'd' to play with it:
//   var renderer = new svg.SVGRenderer(document.querySelector(DRAW_AREA_SELECTOR));
//   d = new diagramlang.Drawer(renderer);
// Note that using this d it won't draw anything, but the auto-completion should
// help you get familiar with the interfaces.

var w = 140;
var h = 60;
var O = d.rect("THINK").cmove(200, 300, w, 60).color("purple3")
         .textStyle({"font-size": 26, "font-weight": "bold"});

function createLoop(text, width, height) {
  return d.rect(text, O.cx(), O.cy() - height / 2, width, height)
          .textStyle({"font-size": 26});
}
var l1 = createLoop("Inner Loop - Development", 500, 200).color("blue2")
    .style({rx: '20%', ry: '20%', stroke: 'none'}).setZ(-100);
var l2 = createLoop("Outer Loop - Experimentation", 800, 400).color("blue1")
    .style({rx: '50%', ry: '50%', stroke: 'none'})
    .textPos(false, true).textShift(0, 10).setZ(-101);

var a1 = d.rect("Create / Modify CL").cmove(l1.cx(), l1.top(), w, h);
var a2 = d.rect("Run Dev Servers").cmove(l1.right(), l1.cy(), w, h);
d.link(O, "up", a1, "left");
d.link(a1, "right", a2, "up");
var a3 = d.layout().setShapes(
  d.rect("Interactive Testing"),
  d.rect("Debugging"),
  d.rect("Tee traffic & Analysis"),
  d.rect("...")).cmove(l1.cx(), l1.bottom(), w * 1.5, h * 2).tile();
d.links([a2], "down", a3.shapes(), "right");
d.links(a3.shapes(), "left", [O], "down");

var b1 = d.rect("Setup Experiment").cmove(l2.cx(), l2.top(), w, h);
var b2 = d.rect("Run Experiment").cmove(l2.right(), l2.cy(), w, h);
var b3 = d.rect("Collect Data").cmove(l2.cx(), l2.bottom(), w, h);
d.link(O, "up", b1, "left");
d.link(b1, "right", b2, "up");
d.link(b2, "down", b3, "right");
d.link(b3, "left", O, "down");

// Since we no longer need the loops for location, make them bigger to look better.
l1.cmove(l1.cx(), l1.cy(), l1.width() + 200, l1.height() + 50);
l2.cmove(l2.cx(), l2.cy(), l2.width() + 250, l2.height() + 200);
`;

const INPUT_ELEMENT_CSS = '#input';
const DRAW_AREA_SELECTOR = '#drawarea';

interface CodeMirrorInterface {
  getValue: () => string;
  setValue: (value: string) => void;
}

// @ts-ignore
const CODE_MIRROR_ELEMENT: CodeMirrorInterface = CodeMirror(
  document.querySelector(INPUT_ELEMENT_CSS), {
  value: DEFAULT_GRAPH,
  mode: 'javascript',
});

// Very likely we don't need this forever since Renderer has a similar margin in place already.
const SAVE_SVG_MARGIN = 0;

function draw(useGrid = true): svg.RenderReport {
  const renderer = new svg.SVGRenderer(document.querySelector(DRAW_AREA_SELECTOR)!);
  renderer.useGrid = useGrid;
  const graphData = getInputElement().getValue();

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

  return report;
}

function save() {
  // References:
  //   - https://levelup.gitconnected.com/draw-an-svg-to-canvas-and-download-it-as-image-in-javascript-f7f7713cf81f
  //   - http://bl.ocks.org/biovisualize/8187844
  const report: svg.RenderReport = draw(/*useGrid*/false);
  const svgElement = document.querySelector('#drawarea svg') as SVGSVGElement;
  // Now done within svgRender.
  // svgElement.setAttribute(
  //   'viewBox',
  //   `${report.dimension.x - SAVE_SVG_MARGIN} 
  //     ${report.dimension.y - SAVE_SVG_MARGIN}
  //     ${report.dimension.width + SAVE_SVG_MARGIN * 2}
  //     ${report.dimension.height + SAVE_SVG_MARGIN * 2}`);

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

function getInputElement(): CodeMirrorInterface {
  return CODE_MIRROR_ELEMENT;
}

function main() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const graphData = urlParams.get(GRAPH_URL_PARAM);
  const inputElement = getInputElement();
  if (graphData) {
    // inputElement.value = atob(graphData);  // base64 without compression
    inputElement.setValue(LZString.decompressFromBase64(atob(graphData)));  // with compression
  }

  draw();
}

window.addEventListener('DOMContentLoaded', function () {
  main();
});
