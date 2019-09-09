class Missions {
    constructor() {
        this.callback = json => console.log(json);
        this.string = '';
        this.textDecoder = new TextDecoder();
    }

    open() {
        return navigator.serial.requestPort({})
            .then(serialPort => {
                this.serialPort = serialPort;
                return serialPort.open({baudrate : 115200});
            })
            .then(() => {
                // https://streams.spec.whatwg.org/
                this.serialPort.readable.pipeTo(new WritableStream({
                    write : (chunk) => {
                        this.string += this.textDecoder.decode(chunk);
                        const json = this.parse(this.string);
                        if(json !== undefined) {
                            this.callback(json);
                        }
                    },
                    close : () => {
                        console.log("close");
                    },
                    abort : (error) => {
                        console.log("error", error);
                    }
                }));
            });
    }

    parse() {
        const stringArray = Array.from(this.string);
        const start = stringArray.findIndex(value => value == '{');
        if(start >= 0) {
            const end = stringArray.findIndex(value => value == '}');
            if(end >= 0 && end > start) {
                const jsonString = this.string.substring(start, end+1);
                this.string = this.string.substr(end+1);
                return JSON.parse(jsonString);
            }
        }
    }

    get sensorPositions() {
        return Missions.sensorPositions;
    }
    get ignoredPositions() {
        return Missions.ignoredPositions;
    }

    close() {
        this.serialPort.close();
    }
}

Missions.sensorPositions = [
    [0.37, 0.69],
    [0.37, 0.851],
    [0.365, 0.782],
    [0.455, 0.151],
    [0.377, 0.263],
    [0.502, 0.23],
    [0.365, 0.374],
    [0.42, 0.453],
    [0.467, 0.342],
    [0.584, 0.305],
    [0.62, 0.211],
    [0.55, 0.421],
    [0.599, 0.105],
    [0.48, 0.852],
    [0.481, 0.783],
    [0.484, 0.69],
].map(position => {
    return {
        x : position[0],
        y : position[1],
    };
});

Missions.ignoredPositions = [0, 3, 6, 7, 8, 11, 12, 15];