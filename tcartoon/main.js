// References:
//   - SVG color: https://stackoverflow.com/questions/22252472/how-to-change-the-color-of-an-svg-element#:~:text=You%20can't%20change%20the,or%20using%20inline.
//   - Use codepen: https://codepen.io/sosuke/pen/Pjoqqp
let channel = '';
let viewers = {};

const WIDTH = 600;
const IMAGEY = 20;

const CAT_MAX_INDEX = 5;

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function updateViewers() {
  // From: `https://tmi.twitch.tv/group/user/{channel}/chatters`
  // Example response: {"_links":{},"chatter_count":2,"chatters":{"broadcaster":[],"vips":[],"moderators":[],"staff":[],"admins":[],"global_mods":[],"viewers":["anotherttvviewer","mslenity"]}}
  // Here the response data is simply a list of viewer IDs.
  $.get(`/viewers`).done((data) => {
    const newViewers = data;
    const previousViewers = Object.keys(viewers);
    playground = document.querySelector('#playground');

    for (const viewer of previousViewers) {
      if (!newViewers.includes(viewer)) {
        viewers[viewer].remove();
        delete viewers[viewer];
      }
    }
    for (const viewer of newViewers) {
      if (!previousViewers.includes(viewer)) {
        const catIndex = getRandomInt(CAT_MAX_INDEX);
        const durationSec = Math.random() * 10 + 5;
        const viewerElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        viewerElement.innerHTML = `
          <text font-size="24" text-anchor="start" x="5" style="fill:green">${viewer}</text>
          <animateTransform attributeName="transform" attributeType="XML" type="translate" values="0 ${IMAGEY}; ${WIDTH - 10} ${IMAGEY}; 0 ${IMAGEY}" dur="${durationSec}s" repeatCount="indefinite" additive="sum" />
          <g>
            <image xlink:href="./data/cat${catIndex}.svg"></image>
            <animateTransform attributeName="transform" attributeType="XML" type="scale" values="1; 1.05; 1" repeatCount="indefinite" dur="0.5s" fill="freeze" additive="sum" />
          </g>
        `;
        viewers[viewer] = viewerElement;
        playground.append(viewerElement);
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  channel = urlParams.get('channel');

  setInterval(updateViewers, 2000);
});
