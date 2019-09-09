var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

const Missions = require("../node_module/Missions.js");
const maxAPI = require("max-api");

// Routing
app.use(express.static('public'));

server.listen(port, function () {
  console.log(`Server listening at port ${port}`);
});

// Messages
var connected = false;
io.on("connection", socket => {
    console.log("connected");
    connected = true;
});

const missions = new Missions(message => {
    if(connected)
        io.emit("message", message);
        
    const json = JSON.parse(message);

    switch(json.type) {
        case "fsr":
            json.values.forEach((value, index) => {
                maxAPI.outlet(json.type, index, value);
            });
            break;
        case "imu":
            break;
        default:
            break;
    }
});

maxAPI.post("Ready!");