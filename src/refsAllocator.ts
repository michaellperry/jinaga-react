import * as React from "react";

export interface IContainerComponent {
    getContainerComponent(key: string): IContainerComponent | null;
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
            console.log("Allocated ref for key " + this.key);
            const ref = React.createRef<IContainerComponent>();
            const map = { ...this.map, [this.key]: ref };
            return { ref, map };
        }
    }

    noRef() {
        return this.map;
    }
}