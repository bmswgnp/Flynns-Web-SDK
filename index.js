/*
    TODO
        Agora-io sender/receiver
        Max for Live (umenu)
*/

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

// Routing
app.use(express.static('public'));

server.listen(port, function () {
  console.log(`Server listening at port ${port}`);
});

// Messages
io.on("connection", socket => {
    console.log("connected");
});

const Missions = require("./Missions.js");
const missions = new Missions(message => {
    io.emit("message", message);
    console.log(JSON.parse(message))
});