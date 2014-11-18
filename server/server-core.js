var express = require('express');
var path = require('path');
var coreServer = require('./server.js');
var util = require('util');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('views', __dirname + '/../views');
app.set('view engine', 'jade');

app.use(express.static(path.join(__dirname, '..')));

app.get('/', function (req, res) {
  res.render('index');
});

var server = http.listen(8000, function () {
  var host = server.address().address
  var port = server.address().port

  console.log('Running game at http://%s:%s', host, port)
});

io.on('connection', function(socket) {
  console.log('a user connected');

  io.emit('map-generation', {
    for: 'everyone'
  });

  socket.on('message', function(msg) {
    console.log("message received:", msg);
  });
});