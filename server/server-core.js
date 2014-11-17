var express = require('express');
var coreServer = require('./server.js');
var util = require('util');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var app = express();

app.set('views', __dirname + '/../views');
app.set('view engine', 'jade');

/*
app.set("view options", {layout: false});
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
*/

app.get('/', function (req, res) {
  // console.log(JSON.stringify(coreServer, null, 2));

  res.render('index');
});

var server = app.listen(3000, function () {
  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)
});

io.on('connection', function(socket){
  console.log('a user connected');
});