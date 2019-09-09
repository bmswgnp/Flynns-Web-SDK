var scalar = 200;
var threshold = 0.5;
var sum = 10;

window.addEventListener("click", event => {
    console.log("Hello");
    if(window.missions == undefined) {
        window.missions = new Missions();

        window.missions.open()
            .then(() => {
                missions.callback = json => {
                    if(json.sum > sum) {
                        const scrollY = json.average.y - threshold;
                        window.scrollBy(0, scalar * scrollY);    
                    }

                    window.postMessage({
                        type : "missions",
                        json,
                    });
                }
            });
    }
});