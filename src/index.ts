import { Preposition } from "jinaga/dist/types/query/query-parser";

export interface StatefulComponent<S> {
    state: S;
    setState: (state: S) => void;
};

export interface Stoppable {
    stop(): void;
}

export interface FieldSpecification<Model, T> {
    initialize: (m: Model) => T;
};

export class StateManager {
    constructor(
        private watches: Stoppable[]
    ) { }

    static forComponent<Model, ViewModel>(
        component: StatefulComponent<ViewModel>,
        model: Model,
        spec: { [K in keyof ViewModel]: FieldSpecification<Model, ViewModel[K]> }
    ) {
        return new StateManager([]);
    }

    stop() {
        this.watches.forEach(watch => watch.stop());
        this.watches = [];
    }
}

export type Element<A> = A extends Array<infer E> ? E : never;

export function collection<
    ParentModel,
    ChildModel,
    ChildViewModelArray
>(
    preposition: Preposition<ParentModel, ChildModel>,
    spec: { [K in keyof Element<ChildViewModelArray>]: FieldSpecification<ChildModel, Element<ChildViewModelArray>[K]> }
) : FieldSpecification<ParentModel, ChildViewModelArray> {
    return {
        initialize: _ => <any>[]
    };
}

export function fixed<Model, T>(
    selector: (m: Model) => T
) : FieldSpecification<Model, T> {
    return {
        initialize: m => selector(m)
    };
}