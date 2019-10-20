import {EventDispatcher} from "../../node_modules/three/src/core/EventDispatcher.js";

class Missions {
    constructor() {
        if(window.navigator.bluetooth == undefined) {
            console.warn("Web Bluetooth is not enabled for this device");
        }

        this.addEventListener("characteristicvaluechanged", event => {
            const sensorData = Array.from(new Uint8Array(this[event.detail.side].characteristic.value.buffer));

            this.dispatchEvent({
                type : "sensorData",
                detail : {
                    side : event.detail.side,
                    sensorData,
                    average : this.getAverage(sensorData),
                }
            });
        });

        /**
         * Service universally unique identifier
         * @type {string}
         * @private
        */
        this.serviceUUID = "7a658cba-0dcd-4d02-bb97-80296cf72dfd";

        /** 
         * Characteristic universally unique identifier
         * @type {string}
         * @private
        */
        this.characteristicUUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

        /** @typedef {{ arrayBuffer : ArrayBuffer, dataView : DataView }} Rate */
        /** @typedef {{ rate : Rate, device : BluetoothDevice, server : BluetoothRemoteGATTServer, service : BluetoothRemoteGATTService, characteristic : BluetoothRemoteGATTCharacteristic }} Mission */

        /**  @type {Mission} */
        this.left = {};

        /**  @type {Mission} */
        this.right = {};

        ["left", "right"].forEach(side => {
            this[side].rate = {};
            this[side].rate.arrayBuffer = new ArrayBuffer(1);
            this[side].rate.dataView = new DataView(this[side].rate.arrayBuffer);
            this[side].rate.dataView.setUint8(0, 20);
        });
    }

    /** @typedef {("left"|"right")} SideEnum */
    /** @typedef {(0 | 20 | 40 | 80 | 160)} RateEnum */

    /**
     * Connect to one of the Insoles
     * @param {SideEnum} side
     * @returns {Promise<BluetoothDevice>} a BluetoothDevice instance
     */
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
                    /*
                    characteristic.startNotifications()
                        .then(characteristic => {
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
                        })
                    */
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

    /**
     * @param {SideEnum} side 
     * @returns {Boolean}
     */
    isConnected(side) {
        return (this[side].device !== undefined && this[side].device.gatt.connected && this[side].characteristic !== undefined);
    }

    /**
     * @param {SideEnum} side
     */
    disconnect(side) {
        if(this.isConnected(side)) {
            this[side].characteristic.stopNotifications()
                .then(() => {
                    this[side].disconnect();
                });
        }
    }

    /**
     * @param {SideEnum} side
     * @returns {void | Promise}
     */
    start(side) {
        if(this.isConnected(side))
            return this.setRate(side);
    }

    /**
     * @param {SideEnum} side
     * @returns {Promise | void}
     */
    stop(side) {
        if(this.isConnected(side))
            return this.setRate(side, 0);
    }

    /**
     * @param {SideEnum} side
     * @param {RateEnum} rate the data rate, in milliseconds
     * - if 0, then it stops streaming
     * @returns {Promise | void}
     */
    setRate(side, rate) {
        if(rate !== undefined)
            this[side].rate.dataView.setUint8(0, rate);
        
        if(this.isConnected(side))
            return this[side].characteristic.writeValue(this[side].rate.dataView.buffer);
    }

    /**
     * average sensor position
     * @param {number[]} sensorData 
     * @returns {{x : number, y : number}}
     * @private
     */
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