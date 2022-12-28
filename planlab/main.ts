const PAGE_PATH = '/planlab/';

const GRAPH_URL_PARAM = 'g';

const DEFAULT_GRAPH = `# See usage from the following example, have fun!

# Define groups using the "groups" keyword.
# Name for each group needs to be unique. Name can start with "^" which
# means that the group is hidden from display.
# Do not forget the ending ":" when a group contains children.
groups:
  - ^Quarters  # any group has "HIDE" in name is hidden.
  - Exp:
    - Online:
      - RD
      - RR
    - Offline
  - ML Infra Tooling

# Define items belonging to a group by starting with the group name used 
# in the "groups" definition.
#   - Item name does not need to be unique, and it is used for styling, see
#     the "styles" section below.
#   - The "name" part can:
#       - Start with a "^" character to make the name hidden. There
#         is a config to hide names from all items, see "global" section below.
#       - Start with a ";" character to make text centered. When using with "^",
#         "^" needs to start first.
#       - When using special characters, the actual "name" does not include
#         the special characters. For example for "^;Foo", the actual name is
#         "Foo".
#   - There is no specification on how items occupy different rows -- the layout 
#     will automatically pack items into minimal number of rows.
#   - Only "leaf" group can have items, and watchout of trailing spaces.
Quarters:
  - ^Q1: 1-1, name is hidden
  - Q2: 2-2, normal style
  - ;Q3: 3-3, text centered
  - ^;Q4: 4-4, hidden & centered

RD:
  # Syntax: column span (from-to, 1-based), description
  - B: 1-2, (100%, TL)
  - X: 1-4, (80%, Main IC)
  - B: 3-4, (100%, TL)

RR:
  - B: 1-1, (100%)
  - X: 2-4, (80%)

ML Infra Tooling:
  - Y: 1-4, (100%, TL & Main IC)

# Optional -- tweak layout and styling using the "global" keyword.
# The keys are those defined in RendererStyleConfig, see:
# https://github.com/ChihChiu29/chihchiu29.github.io/blob/master/planlab/src/layout_renderer.ts
global:
  - rowHeight: 25
  - groupColGap: 5
  - rowGap: 5
  - itemColWidth: 200
  - customGroupWidths: [40, 60, 60]
  - hideItemNames: false
  - defaultGroupBgColor: "#fcfccc"
  - defaultItemBgColor: "#6eb2ff"
  - defaultGroupStyles: {
    rectStyle: {},
    textStyle: {},
  }
  - defaultItemStyles: {
    rectStyle: {},
    textStyle: { fill: 'white', },
  }

# Optional -- override styling for groups/items using "styles" keyword.
# Each entity has "rect" and "text" subgroups, inside which any css property can be used.
# Multiple groups can be used together as a comma separated string.
styles:
  - Q1, Q2, Q3, Q4:
    - rect: { fill: pink }
    - text: { font-weight: bold, fill: red }
  - Exp:
    - rect: { fill: grey }
  - Online:
    - text: { writing-mode: tb }
  - B:
    - rect: { fill: darkblue }
  - Y:
    - rect: { fill: darkgreen }
`;

const INPUT_ELEMENT_CSS = '#input';
const DRAW_AREA_SELECTOR = '#drawarea';

// Very likely we don't need this forever since Renderer has a similar margin in place already.
const SAVE_SVG_MARGIN = 0;

function draw(useGrid = true): RenderReport {
  const graphData = (document.querySelector(INPUT_ELEMENT_CSS) as HTMLInputElement)!.value;
  const parser = new LangParser();
  parser.parse(graphData);
  console.log(parser.groups);

  const renderer = new Renderer(document.querySelector(DRAW_AREA_SELECTOR)!, parser);
  const report = renderer.render(useGrid);

  // Since drawing has no error, safe to update URL.
  // The old way use URI encode, which cannot hanle "%" correctly -- keep it for a bit longer then delete (when base64 encoding proven to work).
  // if (graphData !== DEFAULT_GRAPH) {
  //   window.history.pushState(
  //     'updated', 'Planlab',
  //     `${PAGE_PATH}?g=${encodeURIComponent(graphData)}`);
  // }
  if (graphData !== DEFAULT_GRAPH) {
    window.history.pushState(
      'updated', 'Planlab',
      `${PAGE_PATH}?g=${btoa(graphData)}`);
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
  const report: RenderReport = draw(/*useGrid*/false);
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
    // inputElement.value = decodeURIComponent(graphData);
    inputElement.value = atob(graphData);
  } else {
    inputElement.value = DEFAULT_GRAPH;
  }

  draw();
}

window.addEventListener('DOMContentLoaded', function () {
  // runTests();
  main();
});
