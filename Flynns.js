/*
    Future Considerations:
        reuse the same Sensor Array, passing a copy for eventListeners
            this saves memory and allows for differential analysis
            sensor instances can have a circular buffer of the last n values over time
                allows for velocity and stuff...
        
        BlueTooth WriteValue Protocol to change the dataStream (enable/disable or timing)
            saves battery life
            can send signals to preprocess any data on the ESP chip if possible
        
        WebUSB support (ESP - out of scope for this file)

        Semantic Insole and Sensor Information
            where a sensor is positioned on the foot (heel-to-toe, inner/outer)
            relative foot position (on toes, on heels, in the air)
            movement (heel-to-toe trajectory, previous sensor values...)

        Gesture EventListeners (onJump, onLand, onToes...)
            For flynns (onJump)
            For individual insoles (onToes)

        Accelerometer/Gyroscope support (need Hardware)
        
        Haptic Feedback (need Hardware)

        EventListeners for onConnected and OnDisconnected
*/

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

    // Helper Functions (stance, posture, balance, gait...)
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
        return "7a658cba-0dcd-4d02-bb97-80296cf72dfd";
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

    // Helper Functions (stance, posture, balance, gait...)
}

Flynns.Sensors = class Sensors extends Array {
    constructor(sensors, timestamp, isLeft) {
        super(...sensors);
        this.timestamp = timestamp;
        this.isLeft = isLeft;
    }

    static parse(isLeft, dataView, offset = 0) {
        const sensors = [];
        for(let index = 0; index < dataView.byteLength; index++) {
            const rawValue = dataView.getUint8(offset + index);

            const value = rawValue/255;

            const sensor = new Flynns.Sensor(value, isLeft, index);
            sensors[index] = sensor;
        }

        const timestamp = Date.now();

        return new this(sensors, timestamp, isLeft);
    }
}

// add a circular buffer for the last n values for differential analysis
Flynns.Sensor = class Sensor {
    constructor(value, isLeft, index) {
        this.value = value;
        this.isLeft = isLeft;
        this.index = index;
    }

    // Helper Properties/Functions (position, region)
}