import { createRequire } from "module";
const require = createRequire(import.meta.url);

const express = require('express');
const fs = require('fs');
const path = require('path');

const logging = require('./logging');

// See: https://bobbyhadz.com/blog/javascript-dirname-is-not-defined-in-es-module-scope
// import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8087;

// Server.
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

var app = express();
app.get('*', function (req, res) {
  logging.info('Server request', req.path);

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

app.listen(PORT, function () {
  // If port is already occupied, use `npx kill-port ${PORT}` to kill it.
  logging.info('Server', `Listening on http://localhost:${PORT}/`);
});
