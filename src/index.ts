import { Preposition } from "jinaga/dist/types/query/query-parser";
import { Jinaga, Watch } from "jinaga";

export interface StatefulComponent<S> {
    state: S;
    setState: (state: S) => void;
};

export interface Stoppable {
    stop(): void;
}

export type BeginWatch<Model, ChildModel, ChildViewModel> = (
    preposition: Preposition<Model, ChildModel>,
    resultAdded: (child: ChildModel) => ChildViewModel,
    resultRemoved: (childViewModel: ChildViewModel) => void
) => Watch<ChildModel, ChildViewModel>;

export type Transformer<ViewModel> = (oldViewModel: ViewModel) => ViewModel;

export type Mutator<ViewModel> = (transformer: Transformer<ViewModel>) => void;

export interface FieldSpecification<Model, ViewModel> {
    initialize(m: Model, vm: ViewModel): ViewModel;
    createWatch(
        beginWatch: BeginWatch<Model, any, any>,
        mutator: Mutator<any>
    ) : Watch<any, any>[]
};

export class StateManager {
    constructor(
        private watches: Stoppable[]
    ) { }

    static forComponent<Model, ViewModel>(
        component: StatefulComponent<ViewModel>,
        model: Model,
        j: Jinaga,
        spec: FieldSpecification<Model, ViewModel>[]
    ) {
        function beginWatch<ChildModel, ChildViewModel>(
            preposition: Preposition<Model, ChildModel>,
            resultAdded: (child: ChildModel) => ChildViewModel,
            resultRemoved: (childViewModel: ChildViewModel) => void
        ) {
            return j.watch(model, preposition, resultAdded, resultRemoved);
        }
        function mutator(transformer: Transformer<ViewModel>) {
            component.setState(transformer(component.state));
        }
        const watches = spec
            .map(s => s.createWatch(beginWatch, mutator))
            .reduce((a, b) => a.concat(b));
        return new StateManager(watches);
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
    K extends keyof ViewModel,
    KeyType
>(
    field: K,
    preposition: Preposition<Model, ChildModel>,
    key: (childViewModel: Element<ViewModel[K]>) => KeyType,
    spec: FieldSpecification<ChildModel, Element<ViewModel[K]>>[]
) : FieldSpecification<Model, ViewModel> {
    type ChildViewModel = Element<ViewModel[K]>;

    function createWatch(
        beginWatch : BeginWatch<Model, ChildModel, ChildViewModel>,
        mutator : Mutator<ViewModel>
    ) {
        function resultAdded(child: ChildModel) : ChildViewModel {
            const childViewModel = spec.reduce(
                (vm, s) => s.initialize(child, vm),
                <ChildViewModel>{});
            mutator(vm => {
                const oldCollection : ChildViewModel[] = <any>vm[field];
                const newCollection = [ ...oldCollection, childViewModel ];
                const newViewModel = { ...vm, [field]: newCollection };
                return newViewModel;
            });
            return childViewModel;
        }

        function resultRemoved(childViewModel: ChildViewModel) : void {
            const keyToRemove = key(childViewModel);
            mutator(vm => {
                const oldCollection : ChildViewModel[] = <any>vm[field];
                const newCollection = oldCollection.filter(c => key(c) !== keyToRemove);
                const newViewModel = { ...vm, [field]: newCollection };
                return newViewModel;
            });
        }

        return [beginWatch(preposition, resultAdded, resultRemoved)];
    }
    return {
        initialize: (_, vm) => ({ ...vm, [field]: [] }),
        createWatch
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
        initialize: (m, vm) => ({ ...vm, [field]: selector(m) }),
        createWatch: (beginWatch, mutator) => []
    };
}