console.log("popup.js");

const style = document.getElementsByTagName("style")[0]
const image = document.getElementsByTagName("img")[0];
const ratio = image.naturalWidth/image.naturalHeight;
var scale = image.clientWidth/image.clientHeight;
window.addEventListener("resize", event => {
    image.width = image.height * ratio;
    scale = image.clientWidth/image.clientHeight;
    sensors.forEach(sensor => resizeSensor(sensor));
});

const sensors = [];
const sensorStyle = style.sheet.cssRules[1];
const addSensor = (x, y) => {
    const sensor = document.createElement("div");
    sensor.className = "sensor";
    sensor.dataset.index = sensors.length;
    sensor.dataset.x = x;
    sensor.dataset.y = y;
    document.body.appendChild(sensor);
    sensors.push(sensor);
    resizeSensor(sensor);
}
const resizeSensor = sensor => {
    const x = Number(sensor.dataset.x);
    const y = Number(sensor.dataset.y);
    sensor.style.left = x*image.clientWidth;
    sensor.style.top = y*image.clientHeight;
    sensor.style.width = sensor.style.height = scale*40;
}

Missions.sensorPositions.forEach(sensorPosition => {
    const {x, y} = sensorPosition;
    addSensor(x, y);
});
addSensor(0, 0);
const centerSensor = sensors[sensors.length-1];
centerSensor.style.backgroundColor = `rgba(0, 0, 255, 1)`;

const numberofValidSensors = Missions.sensorPositions.length - Missions.ignoredPositions.length;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.type == "missions") {
        const {json} = message;
        switch(json.type) {
            case "fsr":
                const {sum, average, values} = json;
                values.forEach((value, index) => {
                    if(!Missions.ignoredPositions.includes(index)) {
                        sensors[index].style.backgroundColor = `rgba(0, 255, 0, ${value/100})`;
                    }
                });

                centerSensor.dataset.x = average.x;
                centerSensor.dataset.y = average.y;
                resizeSensor(centerSensor);
                centerSensor.style.backgroundColor = `rgba(255, 0, 0, ${Math.min(5*sum/numberofValidSensors, 1)})`;    
                
                break;
            default:
                break;
        }
    }
});