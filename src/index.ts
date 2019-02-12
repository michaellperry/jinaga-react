export interface StatefulComponent<S> {
    state: S;
    setState: (state: S) => void;
};

export interface Stoppable {
    stop(): void;
}

export class StateManager {
    constructor(
        private watches: Stoppable[]
    ) { }

    stop() {
        this.watches.forEach(watch => watch.stop());
        this.watches = [];
    }
}