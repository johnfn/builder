var express = require('express');
var coreServer = require('./server.js');
var util = require('util');

var app = express();

app.get('/', function (req, res) {
  console.log(JSON.stringify(coreServer, null, 2));

  res.send(coreServer.f());
});

var server = app.listen(3000, function () {
  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)
});