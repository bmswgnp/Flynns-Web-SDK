const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const baudRate = 115200;
const path = "COM9";

class Missions {
    constructor(callback = json => console.log(json)) {
        this.port = new SerialPort(path, {baudRate});
        this.parser = this.port.pipe(new Readline({ delimiter: '\n' }))

        this.port.on("open", () => {
            console.log("open");
            this.parser.on("data", data => {
                const string = data.toString();
                if(string[0] === '{') {
                    callback(string);
                }
            });
        });
    }
}

module.exports = Missions;