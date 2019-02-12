import { Preposition } from "jinaga/dist/types/query/query-parser";

export interface StatefulComponent<S> {
    state: S;
    setState: (state: S) => void;
};

export interface Stoppable {
    stop(): void;
}

export type FieldSpecification<Model, ViewModel, T> = {

};

export class StateManager {
    constructor(
        private watches: Stoppable[]
    ) { }

    static forComponent<Model, ViewModel>(
        component: StatefulComponent<ViewModel>,
        model: Model,
        spec: { [K in keyof ViewModel]: FieldSpecification<Model, ViewModel, ViewModel[K]> }
    ) {
        return new StateManager([]);
    }

    stop() {
        this.watches.forEach(watch => watch.stop());
        this.watches = [];
    }
}

export function collection<
    ChildViewModel
>() {
    function create<
        ParentModel,
        ParentViewModel,
        ChildModel
    >(
        preposition: Preposition<ParentModel, ChildModel>,
        spec: { [K in keyof ChildViewModel]: FieldSpecification<ChildModel, ChildViewModel, ChildViewModel[K]> }
    ) : FieldSpecification<ParentModel, ParentViewModel, ChildViewModel[]> {
        return null;
    }

    return create;
}

export function fixed<Model, ViewModel, T>(
    selector: (m: Model) => T
) : FieldSpecification<Model, ViewModel, T> {
    return null;
}