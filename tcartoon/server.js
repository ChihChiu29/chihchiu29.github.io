var got = require('got');
var path = require('path');
var express = require('express');
var app = express();
var fs = require('fs');

var viewers = ['aa', 'bb'];
const port = 8080;

function updateViewers() {
  got('https://tmi.twitch.tv/group/user/supercatomeow/chatters', { json: true }).then(response => {
    viewers = response.body.chatters.viewers;
    console.log(`updated viewers: ${viewers}`);
  }).catch(error => {
    console.log(error);
  });
}

setInterval(updateViewers, 10000);

var dir = path.join(__dirname, '');

var mime = {
  html: 'text/html',
  txt: 'text/plain',
  css: 'text/css',
  gif: 'image/gif',
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  js: 'application/javascript'
};

app.get('*', function (req, res) {
  console.log(req.path);
  if (req.path === '/viewers') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(viewers));
    return;
  }

  var file = path.join(dir, req.path.replace(/\/$/, '/index.html'));
  if (file.indexOf(dir + path.sep) !== 0) {
    return res.status(403).end('Forbidden');
  }
  var type = mime[path.extname(file).slice(1)] || 'text/plain';
  var s = fs.createReadStream(file);
  s.on('open', function () {
    res.set('Content-Type', type);
    s.pipe(res);
  });
  s.on('error', function () {
    res.set('Content-Type', 'text/plain');
    res.status(404).end('Not found');
  });
});

app.listen(port, function () {
  console.log(`Listening on http://localhost:${port}/`);
});
