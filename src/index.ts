import { Jinaga, Preposition, Watch } from "jinaga";
import { useEffect, useState } from "react";

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

export function useJinaga<Model, ViewModel>(
    model: Model,
    j: Jinaga,
    spec: FieldSpecification<Model, ViewModel>[]
) : ViewModel {
    const [ state, setState ] = useState(initialState);

    useEffect(() => {
        function mutator(_: undefined, transformer: Transformer<ViewModel>) {
            setState(state => transformer(state));
        }
    
        function beginWatch<ChildModel, Id>(
            preposition: Preposition<Model, ChildModel>,
            resultAdded: (parent: undefined, child: ChildModel) => ViewModelPath<undefined, Id>,
            resultRemoved: (path: ViewModelPath<undefined, Id>) => void
        ) {
            return j.watch(model, preposition, c => resultAdded(undefined, c), resultRemoved);
        }

        const watches = spec
            .map(s => s.createWatch(beginWatch, mutator))
            .reduce((a, b) => a.concat(b));

        return () => {
            watches.forEach(watch => watch.stop());
        };
    }, [model]);

    return state;

    function initialState() {
        return spec.reduce(
            (vm, s) => s.initialize(model, vm),
            <ViewModel>{});
    }
}

/**
 * Manages state for a React component.
 * Declare a private field in the component class.
 * The `Model` type is the starting Jinaga fact.
 * The `ViewModel` type is the type of the React component state.
 */
export class StateManager<Model, ViewModel> {
    private watches: Watch<Model, any>[] = [];

    constructor(
        private mutator: Mutator<undefined, ViewModel>,
        private model: Model,
        private j: Jinaga,
        private spec: FieldSpecification<Model, ViewModel>[]
    ) { }

    /**
     * Create a state manager for a React component.
     * Call this function in the constructor.
     * Use `initialState` to initialize the `state` of the component.
     * Call `start` in `componentDidMount`, and `stop` in `componentWillUnmount`.
     * 
     * @param component A React component
     * @param model The starting fact for the specifications
     * @param j An instance of Jinaga
     * @param spec Specifications for all of the members of the component's state
     */
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

    /**
     * Start the watches defined in the specifications.
     * Call this function in `componentDidMount`.
     */
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

    /**
     * Stop all of the watches.
     * Call this function in `componentWillUnmount`.
     */
    stop() {
        this.watches.forEach(watch => watch.stop());
        this.watches = [];
    }

    /**
     * Get the initial state of the component.
     * Call this function in the constructor and assign the result to `this.state`.
     */
    initialState() {
        return this.spec.reduce(
            (vm, s) => s.initialize(this.model, vm),
            <ViewModel>{});
    }
}

export type Element<A> = A extends Array<infer E> ? E : never;

/**
 * Set up a collection of child view models.
 * The associated field in the parent view model is an array of children.
 * Declare the specifications for the child fields.
 * Children must have a field that uniquely identifies them, such as a hash.
 * Declare a hash using systax such as `field('key', x => j.hash(x))`.
 * 
 * @param field The name of the field in the parent view model
 * @param preposition A Jinaga preposition using `j.for`
 * @param key A lambda that identifies the field of the child object which uniquely identifies it
 * @param spec Specifications for the fields of child objects
 */
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

/**
 * Set up a view model field that holds the value of a Jinaga property.
 * The property follows the pattern of a successor having a value and an array of prior properties.
 * Provide a preposition that uses `suchThat` to exclude facts that appear in a prior array.
 * If a conflict occurs, this specification will select the last fact is sees, which may be different from another node.
 * 
 * @param field The name of the field in the view model
 * @param preposition A Jinaga preposition using `j.for`
 * @param selector A lambda that selects the value of the property from the fact
 * @param initialValue The value that the property has when no facts satisfy the preposition
 */
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

export function prior<Fact, T>(mutable: Mutable<Fact, T>) {
    return Object
        .keys(mutable.candidates)
        .map(key => mutable.candidates[key]);
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