import {EventDispatcher} from "../../node_modules/three/src/core/EventDispatcher.js";

class Missions {
    constructor() {
        if(window.navigator.bluetooth == undefined) {
            console.warn("Web Bluetooth is not enabled for this device");
        }

        this.addEventListener("characteristicvaluechanged", event => {
            const dataView = this[event.detail.side].characteristic.value;
            const sensorData = [0, 2, 4, 6, 8, 10].map(index => 100*dataView.getUint16(index, true)/Math.pow(2, 12));
            this.dispatchEvent({
                type : "sensorData",
                detail : {
                    side : event.detail.side,
                    sensorData,
                    average : this.getAverage(sensorData),
                }
            });
        });

        this.serviceUUID = "7a658cba-0dcd-4d02-bb97-80296cf72dfd";
        this.characteristicUUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

        this.left = {};
        this.right = {};

        ["left", "right"].forEach(side => {
            this[side].rate = {};
            this[side].rate.arrayBuffer = new ArrayBuffer(1);
            this[side].rate.dataView = new DataView(this[side].rate.arrayBuffer);
            this[side].rate.dataView.setUint8(0, 20);
        });
    }

    connect(side) {
        if(!this.isConnected(side)) {
            if(window.navigator.bluetooth !== undefined) {
                return window.navigator.bluetooth.requestDevice({
                    filters : [
                        {namePrefix : (side == "left")? "LEFT" : "RIGHT"},
                        {services : [this.serviceUUID]},
                    ],
                }).then(device => {
                    this[side].device = device;
    
                    device.addEventListener("gattserverdisconnected", event => {
                        this.dispatchEvent(event);
                    });
                    return device.gatt.connect();
                }).then(server => {
                    this[side].server = server;
    
                    return server.getPrimaryService(this.serviceUUID);
                }).then(service => {
                    this[side].service = service;
    
                    return service.getCharacteristic(this.characteristicUUID);
                }).then(characteristic => {
                    this[side].characteristic = characteristic;

                    this.dispatchEvent({
                        type : "connect",
                        side,
                    });

                    characteristic.addEventListener("characteristicvaluechanged", event => {
                        this.dispatchEvent({
                            type : event.type,
                            detail : {
                                side
                            }
                        });
                    });

                    return characteristic.startNotifications();
                });
            }
            else {
                console.error("Bluetooth is not enabled");
            }
        }
        else {
            console.warn("device is already connected");
        }
    }

    isConnected(side) {
        return (this[side].device !== undefined && this[side].device.gatt.connected && this[side].characteristic !== undefined);
    }

    disconnect(side) {
        if(this.isConnected(side)) {
            this[side].characteristic.stopNotifications()
                .then(() => {
                    this[side].disconnect();
                });
        }
    }

    start(side) {
        if(this.isConnected(side))
            return this.setRate(side);
    }

    stop(side) {
        if(this.isConnected(side))
            return this.setRate(side, 0);
    }

    setRate(side, rate) {
        if(rate !== undefined)
            this[side].rate.dataView.setUint8(0, rate);
        
        if(this.isConnected(side))
            return this[side].characteristic.writeValue(this[side].rate.dataView.buffer);
    }

    getAverage(sensorData) {
        const sum = sensorData.reduce((sum, value) => sum+value, 0);
        return sensorData.reduce((average, value, index) => {
            const weight = value/sum || 0;
            const position = this.sensorPositions[this.sensorDataIndices[index]];

            average.x += weight * position.x;
            average.y += weight * position.y;

            return average;
        }, {x:0, y:0});
    }

    get sensorPositions() {
        return this.constructor.sensorPositions;
    }
    get sensorDataIndices() {
        return this.constructor.sensorDataIndices;
    }
}

Object.assign(Missions.prototype, EventDispatcher.prototype);

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

Missions.sensorDataIndices = [5, 4, 15, 10, 2, 0];

window.Missions = Missions;

export default Missions;