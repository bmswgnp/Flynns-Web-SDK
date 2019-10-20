/**
 * Sensor Position
 * @typedef {Object} SensorPosition
 * @property {number} x - horizontal interpolation
 * @property {number} y - vertical interpolation
 */

class MissionsSingleViewerElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode : "open"});

        this.shadowRoot.innerHTML = `
            <style>
                img {
                    height: 100%;
                    width: 100%;
                    object-fit: scale-down;
                }
                img[right] {
                    transform: scaleX(-1);
                }

                .sensor {
                    position: absolute;
                }
            </style>
            
            <img src="../../images/mission.png"></img>
        `;

        /**
         * pressure sensor values, ranging from 0 to 100
         * @type number[]
         */
        this.values = [];

        this.sensorPositions.forEach((sensorPosition, index) => {
            this.shadowRoot.innerHTML += `
                <div class="sensor" data-index="${index}" data-x="${sensorPosition.x}" data-y="${sensorPosition.y}"></div>
            `;
        });

        this.color = {
            r : 0,
            g : 255,
            b : 0,
        };

        this.update();
        window.addEventListener("resize", event => {
            this.resize();
        });
        this.addEventListener("load", event => {
            this.resize();
        });
        

        this.img = this.shadowRoot.querySelector(`img`);
        this.imgRatio = this.img.naturalWidth/this.img.naturalHeight;
    }

    /**
     * Resize
     */
    resize() {
        const ratio = this.img.clientWidth/this.img.clientHeight;
        var imgWidth, imgHeight;

        if(ratio < this.imgRatio) {
            imgWidth = this.img.clientWidth;
            imgHeight = imgWidth/this.imgRatio;
        }
        else {
            imgHeight = this.img.clientHeight;
            imgWidth = imgHeight * this.imgRatio;
        }

        this.scale = imgHeight / this.img.naturalHeight;

        const offsetTop = (this.img.clientHeight - imgHeight) / 2;
        const offsetLeft = (this.img.clientWidth - imgWidth) / 2;

        this.shadowRoot.querySelectorAll(`.sensor`).forEach(sensor => {            
            var x = Number(sensor.dataset.x);
            const y = Number(sensor.dataset.y);

            if(this.side == "right") {
                x = 1-x-0.085;
            }
            
            sensor.style.top = this.img.offsetTop + (y * imgHeight) + offsetTop;
            sensor.style.left = this.img.offsetLeft + (x * imgWidth) + offsetLeft;

            sensor.style.width = sensor.style.height = this.scale*65;
        });
    }

    start() {
        if(!this._continue) {
            this._continue = true;
            this.loop();
        }
    }
    
    stop() {
        this._continue = false;
    }

    loop() {
        if(this._continue) {
            this.update();
            this.resize();
            window.requestAnimationFrame(() => this.loop());
        }
    }

    update() {
        this.shadowRoot.querySelectorAll(`.sensor`).forEach(sensor => {
            const index = Number(sensor.dataset.index);
            const value = this.values[index] || 0;
            sensor.style.backgroundColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${value/100})`;
        });
    }

    connectedCallback() {
        this.resize();
    }

    disconnectedCallback() {

    }

    static get observedAttributes() {
        return [
            "left", "right",
        ];
    }

    /**
     * @return {string} "left" or "right"
     */
    get side() {
        return (this.img.getAttribute("right") == null)?
            "left" :
            "right";
    }

    /**
     * @param {string} newValue Accepts either 2 strings:
     * - "left"
     * - "right"
     */
    set side(newValue) {
        if(newValue == "left") {
            this.img.removeAttribute("right");
        }
        else {
            this.img.setAttribute("right", '');
        }
    }


    attributeChangedCallback(attributeName, oldValue, newValue) {
        switch(attributeName) {
            case "left":
                this.side = (newValue !== null)?
                    "left" :
                    "right";
                break;
            case "right":
                    this.side = (newValue !== null)?
                        "right" :
                        "left";
                    break;
            default:
                break;
        }
    }
    
    /**
     * Gets Sensor positions
     * @type {SensorPosition[]} sensor positions
     */
    get sensorPositions() {
        return this.constructor.sensorPositions;
    }
}

MissionsSingleViewerElement.allSensorPositions = [
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

MissionsSingleViewerElement.ignoredPositions = [];

MissionsSingleViewerElement.sensorPositions = MissionsSingleViewerElement.allSensorPositions.slice();
MissionsSingleViewerElement.ignoredPositions.forEach(index => {
    delete MissionsSingleViewerElement.sensorPositions[index];
});

if(document.createElement("ukaton-missions-single-viewer").constructor.name == "HTMLElement")
    customElements.define("ukaton-missions-single-viewer", MissionsSingleViewerElement);

export default MissionsSingleViewerElement;