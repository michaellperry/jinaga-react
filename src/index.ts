export interface StatefulComponent<S> {
    state: S;
    setState: (state: S) => void;
};

export interface Stoppable {
    stop(): void;
}

export type FieldSpecification = {

};

export class StateManager {
    constructor(
        private watches: Stoppable[]
    ) { }

    static forComponent<Model, ViewModel>(
        component: StatefulComponent<ViewModel>,
        model: Model,
        spec: { [K in keyof ViewModel]: FieldSpecification }
    ) {
        return new StateManager([]);
    }

    stop() {
        this.watches.forEach(watch => watch.stop());
        this.watches = [];
    }
}