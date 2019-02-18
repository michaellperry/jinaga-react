import { Jinaga, Watch } from "jinaga";
import { Preposition } from "jinaga/dist/types/query/query-parser";

export interface StatefulComponent<S> {
    state: S;
    setState: (state: S) => void;
};

export interface Stoppable {
    stop(): void;
}

export type ViewModelPath<Parent, Id> = {
    parent: Parent,
    id: Id
};

export type BeginWatch<Model, ChildModel, Parent, Id> = (
    preposition: Preposition<Model, ChildModel>,
    resultAdded: (parent: Parent, child: ChildModel) => ViewModelPath<Parent, Id>,
    resultRemoved: (path: ViewModelPath<Parent, Id>) => void
) => Watch<ChildModel, ViewModelPath<Parent, Id>>;

export type Transformer<ViewModel> = (oldViewModel: ViewModel) => ViewModel;

export type Mutator<Path, ViewModel> = (path: Path, transformer: Transformer<ViewModel>) => void;

export interface FieldSpecificationComplete<Model, ViewModel, ChildModel, Parent, Id> {
    initialize(m: Model, vm: ViewModel): ViewModel;
    createWatch(
        beginWatch: BeginWatch<Model, ChildModel, Parent, Id>,
        mutator: Mutator<Parent, ViewModel>
    ) : Watch<ChildModel, Parent>[]
};

export type FieldSpecification<Model, ViewModel> =
    FieldSpecificationComplete<Model, ViewModel, any, any, any>;

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
        function beginWatch<ChildModel, Id>(
            preposition: Preposition<Model, ChildModel>,
            resultAdded: (parent: undefined, child: ChildModel) => ViewModelPath<undefined, Id>,
            resultRemoved: (path: ViewModelPath<undefined, Id>) => void
        ) {
            return j.watch(model, preposition, c => resultAdded(undefined, c), resultRemoved);
        }
        function mutator(path: undefined, transformer: Transformer<ViewModel>) {
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

    function createWatch<Parent>(
        beginWatch : BeginWatch<Model, ChildModel, Parent, KeyType>,
        mutator : Mutator<Parent, ViewModel>
    ) {
        function resultAdded(parent: Parent, child: ChildModel) {
            const childViewModel = spec.reduce(
                (vm, s) => s.initialize(child, vm),
                <ChildViewModel>{});
            mutator(parent, vm => {
                const oldCollection : ChildViewModel[] = <any>vm[field];
                const newCollection = [ ...oldCollection, childViewModel ];
                const newViewModel = { ...vm, [field]: newCollection };
                return newViewModel;
            });
            return { parent, id: key(childViewModel) };
        }

        function resultRemoved({ parent, id } : ViewModelPath<Parent, KeyType>) {
            mutator(parent, vm => {
                const oldCollection : ChildViewModel[] = <any>vm[field];
                const newCollection = oldCollection.filter(c => key(c) !== id);
                const newViewModel = { ...vm, [field]: newCollection };
                return newViewModel;
            });
        }

        const watch = beginWatch(preposition, resultAdded, resultRemoved);

        function continueWatch<GrandchildModel, GrandchildKeyType>(
            preposition: Preposition<ChildModel, GrandchildModel>,
            resultAdded: (parent: ViewModelPath<Parent, KeyType>, gm: GrandchildModel) => ViewModelPath< ViewModelPath<Parent, KeyType>, GrandchildKeyType>,
            resultRemoved: (gvm: ViewModelPath< ViewModelPath<Parent, KeyType>, GrandchildKeyType>) => void
        ) {
            return watch.watch(preposition, resultAdded, resultRemoved);
        }

        function continueMutator({parent, id}: ViewModelPath<Parent, KeyType>, transformer: Transformer<ChildViewModel>) {
            mutator(parent, vm => {
                const oldCollection: ChildViewModel[] = <any>vm[field];
                const newCollection = oldCollection.map(c =>
                    key(c) === id ? transformer(c) : c);
                return { ...vm, [field]: newCollection };
            });
        }

        spec.forEach(s => s.createWatch(continueWatch, continueMutator));

        return [watch];
    }
    return {
        initialize: (_, vm) => ({ ...vm, [field]: [] }),
        createWatch
    };
}

export function field<
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