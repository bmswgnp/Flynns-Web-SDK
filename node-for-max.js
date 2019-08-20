var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

const Missions = require("./Missions.js");
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


const midi = {
    threshold : 200,
    ready : false,
};

const playback = {
    paused : true,
    get playing() {
        return !this.paused;
    },
    set playing(newValue) {
        this.paused = !newValue;
    },
}

var mode;
[
    "playback",
    "scrub",
    "pan",
    "volume",
    "midi",
].forEach(_mode => {
    maxAPI.addHandler(_mode, () => {
        if(mode !== _mode) {
            maxAPI.post(`Mode switched from ${mode} to ${_mode}`);
            mode = _mode;
        }
    });
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

    switch(mode) {
        case "playback":
            if(false) { // play
                if(playback.paused) {
                    playback.playing = true;
                    maxAPI.outlet("live.path", "path", "live_set");
                    maxAPI.outlet("live.object", "call", "start_playing");    
                }
            }
            if(false) { // pause
                if(playback.playing) {
                    playback.paused = true;
                    maxAPI.outlet("live.path", "path", "live_set");
                    maxAPI.outlet("live.object", "call", "stop_playing");    
                }
            }
            break;
        case "scrub":
            if(false) {
                const scrub = 0;
                maxAPI.outlet("live.path", "path", "live_set");
                maxAPI.outlet("live.object", "call", "scrub_by", scrub);
            }
            break;
        case "pan":
            if(false) {
                const pan = Math.min(1, Math.max(-1, 0));
                maxAPI.outlet("live.path", "path", "live_set", "tracks", 0, "mixer_device", "panning");
                maxAPI.outlet("live.object", "set", "value", pan);
            }
            break;
        case "volume":
            if(false) {
                const volume = Math.min(1, Math.max(0, 0));
                maxAPI.outlet("live.path", "path", "live_set", "tracks", 0, "mixer_device", "volume");
                maxAPI.outlet("live.object", "set", "value", volume);
            }
            break;
        case "midi":
            if(false) {
                if(midi.ready) {
                    if(0 < midi.threshold) { // sensor value?
                        midi.ready = false;

                        const pitch = 69;
                        const velocity = 10;
                        const duration = 1;

                        maxAPI.post(`pitch: ${pitch}`);
                        maxAPI.post(`velocity: ${velocity}`);


                        maxAPI.outlet("noteout", "pitch", pitch);
                        maxAPI.outlet("noteout", "velocity", velocity);
                        maxAPI.outlet("noteout", "duration", duration);
                    }
                }
                else {
                    midi.ready = (0 > midi.threshold); // sensor value?
                }
            }
            break;
        default:
            break;
    }
});

maxAPI.post("Ready!");