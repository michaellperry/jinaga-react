import * as React from "react";

export interface IContainerComponent {
}

export type ContainerRefMap = { [key: string]: React.RefObject<IContainerComponent> };

export class RefSlot {
    constructor(
        private key: string,
        private map: ContainerRefMap
    ) { }

    getRef() {
        if (this.map.hasOwnProperty(this.key)) {
            return {
                ref: this.map[this.key],
                map: this.map
            };
        }
        else {
            const ref = React.createRef();
            const map = { ...this.map, [this.key]: ref };
            return { ref, map };
        }
    }

    noRef() {
        return this.map;
    }
}