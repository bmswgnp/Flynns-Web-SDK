import MissionsSingleViewerElement from "./SingleViewerElement.js";

class MissionsViewerElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode : "open"});
        
        this.style.display = "flex";
        this.style.height = "100%";

        this.shadowRoot.innerHTML = `
            <style>
                ukaton-missions-single-viewer {
                    flex : 1;
                }
            </style>
            
            <ukaton-missions-single-viewer left></ukaton-missions-single-viewer>
            <ukaton-missions-single-viewer right></ukaton-missions-single-viewer>
        `;

        /**
         * The Left Mission Element
         * @type {MissionsSingleViewerElement}
         */
        this.left = this.shadowRoot.querySelector(`ukaton-missions-single-viewer[left]`);
        
        /** @type {MissionsSingleViewerElement} */
        this.right = this.shadowRoot.querySelector(`ukaton-missions-single-viewer[right]`);
    }
    
    /**
     * Starts
     */
    start() {
        this.left.start();
        this.right.start();
    }

    /**
     * Stops
     */
    stop() {
        this.left.stop();
        this.right.stop();
    }
}

if(document.createElement("ukaton-missions-viewer").constructor.name == "HTMLElement")
    customElements.define("ukaton-missions-viewer", MissionsViewerElement);

export default MissionsViewerElement;