import { Preposition } from "jinaga/dist/types/query/query-parser";

export interface StatefulComponent<S> {
    state: S;
    setState: (state: S) => void;
};

export interface Stoppable {
    stop(): void;
}

export interface FieldSpecification<Model, ViewModel> {
    initialize: (m: Model, vm: ViewModel) => ViewModel;
};

export class StateManager {
    constructor(
        private watches: Stoppable[]
    ) { }

    static forComponent<Model, ViewModel>(
        component: StatefulComponent<ViewModel>,
        model: Model,
        spec: FieldSpecification<Model, ViewModel>[]
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
    Model,
    ViewModel,
    ChildModel,
    K extends keyof ViewModel
>(
    field: K,
    preposition: Preposition<Model, ChildModel>,
    spec: FieldSpecification<ChildModel, Element<ViewModel[K]>>[]
) : FieldSpecification<Model, ViewModel> {
    return {
        initialize: (_, vm) => ({ ...vm, [field]: [] })
    };
}

export function fixed<
    Model,
    ViewModel,
    K extends keyof ViewModel
>(
    field: K,
    selector: (m: Model) => ViewModel[K]
) : FieldSpecification<Model, ViewModel> {
    return {
        initialize: (m, vm) => ({ ...vm, [field]: selector(m) })
    };
}