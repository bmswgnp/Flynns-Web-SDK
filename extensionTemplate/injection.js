// Injects the Flynns class into the Page
class Flynns {
    constructor() {
        this.eventListeners = {
            characteristicvaluechanged : [],
            sensorData : [],
        };
        this.insoles = {
            left : new Flynns.Insole(true),
            right : new Flynns.Insole(false),
        }
    }

    connect(isLeft = true) {
        const insole = isLeft?
            this.insoles.left :
            this.insoles.right;
        return insole.connect()
            .then(() => {
                for(let eventListenerType in this.eventListeners)
                    if(insole.eventListeners[eventListenerType])
                        insole.addEventListener(eventListenerType, event => this.eventListeners[eventListenerType].forEach(callback => callback(event)));
            })
    }
    disconnect() {
        // cleanup
    }

    isConnected(isLeft = true) {
        return isLeft?
            this.insoles.left.isConnected :
            this.insoles.right.isConnected;
    }
    areConnected() {
        return [true, false].every(isLeft => this.isConnected(isLeft));
    }

    addEventListener(type, callback) {
        if(this.eventListeners[type])
            return this.eventListeners[type].push(callback);
        else
            throw "Event listener " + type + " is not defined";
    }
    removeEventListener(callback) {
        if(this.eventListeners[type])
            if(this.eventListeners[type].includes(callback))
                return this.eventListeners[type].splice(this.eventListeners[type].indexOf(callback), 1);
            else
                throw "callback is not included in " + type + " event listeners";
        else
            throw "Event Listener " + type + " is not defined";
    }
}

Flynns.Insole = class Insole {
    constructor(isLeft = true) {
        this.isLeft = isLeft;
        this.isConnected = false;

        this.eventListeners = {
            characteristicvaluechanged : [],
            sensorData : [],
        }
    }

    get isRight() {
        return !this.isLeft;
    }

    get serviceUUID() {
        return this.isLeft?
            "4fafc201-1fb5-459e-8fcc-c5c9c331914b" :
            "7a658cba-0dcd-4d02-bb97-80296cf72dfd" ;
    }

    get characteristicUUID() {
        return "beb5483e-36e1-4688-b7f5-ea07361b26a8";
    }

    connect() {
        const configOptions = {
            filters : [
                {services : [this.serviceUUID]}
            ]
        };

        return navigator.bluetooth.requestDevice(configOptions)
            .then(device => {
                this._device = device;
                return device.gatt.connect();
            })
            .then(server => {
                this._server = server;
                return server.getPrimaryService(this.serviceUUID);
            })
            .then(service => {
                this._service = service;
                return service.getCharacteristic(this.characteristicUUID);
            })
            .then(characteristic => {
                this._characteristic = characteristic;
                return characteristic.startNotifications();
            })
            .then(characteristic => {
                this.isConnected = true;
                return characteristic.addEventListener("characteristicvaluechanged", event => this.characteristicvaluechanged.call(this, event));
            })
    }
    disconnect() {
        // cleanup
    }

    characteristicvaluechanged(event) {
        const dataView = event.target.value;
        const sensors = Flynns.Sensors.parse(this.isLeft, dataView);
        this.sensors = sensors;

        this.eventListeners.characteristicvaluechanged.forEach(callback => callback(event));
        this.eventListeners.sensorData.forEach(callback => callback(this));
    }

    addEventListener(type, callback) {
        if(this.eventListeners[type])
            return this.eventListeners[type].push(callback);
        else
            throw "Event listener " + type + " is not defined";
    }
    removeEventListener(callback) {
        if(this.eventListeners[type])
            if(this.eventListeners[type].includes(callback))
                return this.eventListeners[type].splice(this.eventListeners[type].indexOf(callback), 1);
            else
                throw "callback is not included in " + type + " event listeners";
        else
            throw "Event Listener " + type + " is not defined";
    }
}

Flynns.Sensors = class Sensors extends Array {
    constructor(sensors, timestamp, isLeft) {
        super(...sensors);
        this.timestamp = timestamp;
        this.isLeft = isLeft;
    }

    static parse(isLeft, dataView, offset = 0) {
        const decoder = new TextDecoder("utf-8");
        const sensorValuesString = decoder.decode(dataView.buffer);
        const sensorValueStrings = sensorValuesString.split(',');
        const sensorValues = sensorValueStrings.map(sensorValueString => Number(sensorValueString));
        const sensors = sensorValues.map((sensorValue, sensorIndex) => new Flynns.Sensor(sensorValue, isLeft, sensorIndex));
        
        const timestamp = Date.now();
        
        return new this(sensors, timestamp, isLeft);
    }
}

Flynns.Sensor = class Sensor {
    constructor(value, isLeft, index) {
        this.value = value;
        this.isLeft = isLeft;
        this.index = index;
    }
}

const flynns = new Flynns();
// add eventListeners here for custom page behavior

// from content.js
window.addEventListener("message", (event) => {
    switch(event.data.message) {
        case "connectInsole":
            flynns.connect(event.data.isLeft)
                .then(() => {
                    window.postMessage({message: "flynnConnected", isLeft: event.data.isLeft});
                });
            break;
        case "isInsoleConnected":
            window.postMessage({message: "insoleConnectionStatus", isLeft: event.data.isLeft, isConnected: flynns.insoles[event.data.isLeft? "left":"right"].isConnected});
            break;
        default:
            break;
    }
})