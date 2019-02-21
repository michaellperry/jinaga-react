import { Jinaga, Preposition, Watch } from "jinaga";

export interface StatefulComponent<S> {
    state: S;
    setState: (state: S) => void;
};

export type ViewModelPath<Parent, Id> = {
    parent: Parent,
    id: Id
};

export type BeginWatch<Model, ChildModel, Parent, Path> = (
    preposition: Preposition<Model, ChildModel>,
    resultAdded: (parent: Parent, child: ChildModel) => Path,
    resultRemoved: (path: Path) => void
) => Watch<ChildModel, Path>;

export type Transformer<ViewModel> = (oldViewModel: ViewModel) => ViewModel;

export type Mutator<Path, ViewModel> = (path: Path, transformer: Transformer<ViewModel>) => void;

export interface FieldSpecificationComplete<Model, ViewModel, ChildModel, Parent, Path> {
    initialize(m: Model, vm: ViewModel): ViewModel;
    createWatch(
        beginWatch: BeginWatch<Model, ChildModel, Parent, Path>,
        mutator: Mutator<Parent, ViewModel>
    ) : Watch<ChildModel, Parent>[]
};

export type FieldSpecification<Model, ViewModel> =
    FieldSpecificationComplete<Model, ViewModel, any, any, any>;

export class StateManager<Model, ViewModel> {
    private watches: Watch<Model, any>[] = [];

    constructor(
        private mutator: Mutator<undefined, ViewModel>,
        private model: Model,
        private j: Jinaga,
        private spec: FieldSpecification<Model, ViewModel>[]
    ) { }

    static forComponent<Model, ViewModel>(
        component: StatefulComponent<ViewModel>,
        model: Model,
        j: Jinaga,
        spec: FieldSpecification<Model, ViewModel>[]
    ) {
        function mutator(_: undefined, transformer: Transformer<ViewModel>) {
            component.setState(transformer(component.state));
        }
        return new StateManager<Model, ViewModel>(mutator, model, j, spec);
    }

    start() {
        const j = this.j;
        const model = this.model;

        function beginWatch<ChildModel, Id>(
            preposition: Preposition<Model, ChildModel>,
            resultAdded: (parent: undefined, child: ChildModel) => ViewModelPath<undefined, Id>,
            resultRemoved: (path: ViewModelPath<undefined, Id>) => void
        ) {
            return j.watch(model, preposition, c => resultAdded(undefined, c), resultRemoved);
        }

        this.watches.forEach(watch => watch.stop());
        this.watches = this.spec
            .map(s => s.createWatch(beginWatch, this.mutator))
            .reduce((a, b) => a.concat(b));
    }

    stop() {
        this.watches.forEach(watch => watch.stop());
        this.watches = [];
    }

    initialState() {
        return this.spec.reduce(
            (vm, s) => s.initialize(this.model, vm),
            <ViewModel>{});
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
        beginWatch : BeginWatch<Model, ChildModel, Parent, ViewModelPath<Parent, KeyType>>,
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

export function property<
    Model,
    ViewModel,
    PropertyModel,
    K extends keyof ViewModel
>(
    field: K,
    preposition: Preposition<Model, PropertyModel>,
    selector: (m: PropertyModel) => ViewModel[K],
    initialValue: ViewModel[K]
) : FieldSpecification<Model, ViewModel> {
    function createWatch<Parent>(
        beginWatch : BeginWatch<Model, PropertyModel, Parent, Parent>,
        mutator : Mutator<Parent, ViewModel>
    ) {
        function resultAdded(parent: Parent, child: PropertyModel) {
            mutator(parent, vm => {
                const newValue = selector(child);
                const newViewModel = { ...vm, [field]: newValue };
                return newViewModel;
            });
            return parent;
        }

        function resultRemoved(parent : Parent) {
        }

        const watch = beginWatch(preposition, resultAdded, resultRemoved);

        return [watch];
    }
    return {
        initialize: (_, vm) => ({ ...vm, [field]: initialValue }),
        createWatch
    };
}

export interface Mutable<Fact, T> {
    candidates: { [hash: string]: Fact };
    value: T;
}

export function mutable<
    Model,
    ViewModel,
    PropertyModel,
    K extends keyof ViewModel,
    ValueType
>(
    field: K,
    preposition: Preposition<Model, PropertyModel>,
    resolver: (candidates: PropertyModel[]) => ValueType
) : FieldSpecification<Model, ViewModel> {
    function createWatch<Parent>(
        beginWatch: BeginWatch<Model, PropertyModel, Parent, ViewModelPath<Parent, string>>,
        mutator: Mutator<Parent, ViewModel>
    ) {
        function resultAdded(parent: Parent, child: PropertyModel) {
            const hash = Jinaga.hash(child);
            mutator(parent, (vm) => {
                const { candidates } : Mutable<PropertyModel, ValueType> = <any>vm[field];
                const newCandidates = { ...candidates, [hash]: child };
                const newValue = resolver(Object
                    .keys(newCandidates)
                    .map(key => newCandidates[key]));
                const newMutable = {
                    candidates: newCandidates,
                    value: newValue
                };
                return { ...vm, [field]: newMutable };
            });
            return { parent, id: hash };
        }

        function resultRemoved({ parent, id: hash } : ViewModelPath<Parent, string>) {
            mutator(parent, (vm) => {
                const { candidates } : Mutable<PropertyModel, ValueType> = <any>vm[field];
                const { [hash]: fact, ...newCandidates } = candidates;
                const newValue = resolver(Object
                    .keys(newCandidates)
                    .map(key => newCandidates[key]));
                const newMutable = {
                    candidates: newCandidates,
                    value: newValue
                };
                return { ...vm, [field]: newMutable };
            });
        }

        const watch = beginWatch(preposition, resultAdded, resultRemoved);
        return [watch];
    }

    return {
        initialize: (m, vm) => ({ ...vm, [field]: {
            candidates: {},
            value: resolver([])
        } }),
        createWatch
    }
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