const PAGE_PATH = '/planlab/';

const GRAPH_URL_PARAM = 'g';

const DEFAULT_GRAPH = `# style setting
# simple examples
global:  # global config for layout and style
  - rowHeight: 25
  - groupColGap: 5
  - rowGap: 5
  - itemColWidth: 100
  - customGroupWidths: [40, 60, 60]
  - defaultGroupBgColor: "#f7d577"

styles:  # define styles for groups and items
  - Exp:
    - rect: { fill: grey }
  - B:
    - rect: { fill: darkblue }

groups:
  - Exp:
    - Online:
      - RD
      - RR
    - Offline
  - ML

RD:
  - B: 1-2, 100
  - X: 1-4, 80
  - B: 3-4, 100

RR:
  - B: 1-1, 100
  - X: 2-4, 80
`;

const INPUT_ELEMENT_CSS = '#input';
const DRAW_AREA_SELECTOR = '#drawarea';

const SAVE_SVG_MARGIN = 5;

function draw() {
  const graphData = (document.querySelector(INPUT_ELEMENT_CSS) as HTMLInputElement)!.value;
  const parser = new LangParser();
  parser.parse(graphData);

  const renderer = new Renderer(document.querySelector(DRAW_AREA_SELECTOR)!, parser);
  renderer.render();

  // Since drawing has no error, safe to update URL.
  if (graphData !== DEFAULT_GRAPH) {
    window.history.pushState(
      'updated', 'Planlab',
      `${PAGE_PATH}?g=${encodeURIComponent(graphData)}`);
  }
}

// function save() {
//   // References:
//   //   - https://levelup.gitconnected.com/draw-an-svg-to-canvas-and-download-it-as-image-in-javascript-f7f7713cf81f
//   //   - http://bl.ocks.org/biovisualize/8187844
//   const drawResult = draw(/*useGrid*/false);
//   const renderer = drawResult.renderer;
//   const report = drawResult.report;
//   const svgElement = document.querySelector('#drawarea svg') as SVGSVGElement;
//   svgElement.setAttribute(
//     'viewBox',
//     `${report.minX - SAVE_SVG_MARGIN} 
//       ${report.minY - SAVE_SVG_MARGIN}
//       ${report.maxX - report.minX + SAVE_SVG_MARGIN * 2}
//       ${report.maxY - report.minY + SAVE_SVG_MARGIN * 2}`);

//   const { width, height } = svgElement.getBBox();
//   var svgString = new XMLSerializer().serializeToString(svgElement);
//   const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
//   let URL = window.URL || window.webkitURL || window;
//   let blobURL = URL.createObjectURL(blob);
//   const image = new Image();
//   image.onload = () => {
//     // Canvas references:
//     //   - https://stackoverflow.com/questions/38061836/blurry-svg-in-canvas
//     //   - https://stackoverflow.com/questions/24395076/canvas-generated-by-canvg-is-blurry-on-retina-screen
//     let canvas = document.createElement('canvas');
//     let context = canvas.getContext('2d');

//     // In short:
//     //   - devicePixelRatio decises how things are scaled on monitor.
//     //   - to get a similar crisp feeling of the svg image, the canvas needs to be as large as viewport * scale factor.
//     var pixelRatio = window.devicePixelRatio || 1;
//     canvas.width = width;
//     canvas.height = height;
//     canvas.width *= pixelRatio;
//     canvas.height *= pixelRatio;

//     context.drawImage(image, 0, 0);
//     let png = canvas.toDataURL();
//     var link = document.createElement('a');
//     link.download = 'diagram.png';
//     link.style.opacity = "0";
//     document.querySelector('#save-action').append(link);
//     link.href = png;
//     link.click();
//     link.remove();
//   };
//   image.src = blobURL;
// }

function main() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const graphData = urlParams.get(GRAPH_URL_PARAM);
  const inputElement = document.querySelector(INPUT_ELEMENT_CSS) as HTMLInputElement;
  if (graphData) {
    inputElement.value = decodeURIComponent(graphData);
  } else {
    inputElement.value = DEFAULT_GRAPH;
  }

  draw();
}

window.addEventListener('DOMContentLoaded', function () {
  // runTests();
  main();
});
