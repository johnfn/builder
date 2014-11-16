/// <reference path="../d/express.d.ts" />
/// <reference path="../d/node.d.ts" />

import express = require('express');
import http = require("http")
var app = express();

app.get('/', function(req, res){
  res.send('<h1>Hello world</h1>');
});

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(1337, '127.0.0.1');