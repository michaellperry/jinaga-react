import { Jinaga, Preposition, Watch } from "jinaga";
import { FieldSpecification, Mutator, Transformer, ViewModelPath } from "./specifications";

export interface StatefulComponent<S> {
    state: S;
    setState: (state: S) => void;
};

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
        private j: Jinaga,
        private model: Model,
        private spec: FieldSpecification<Model, ViewModel>[]
    ) { }

    /**
     * Create a state manager for a React component.
     * Call this function in the constructor.
     * Use `initialState` to initialize the `state` of the component.
     * Call `start` in `componentDidMount`, and `stop` in `componentWillUnmount`.
     * 
     * @param component A React component
     * @param j An instance of Jinaga
     * @param model The starting fact for the specifications
     * @param spec Specifications for all of the members of the component's state
     */
    static forComponent<Model, ViewModel>(
        component: StatefulComponent<ViewModel>,
        j: Jinaga,
        model: Model,
        spec: FieldSpecification<Model, ViewModel>[]
    ) {
        function mutator(_: undefined, transformer: Transformer<ViewModel>) {
            component.setState(transformer(component.state));
        }
        return new StateManager<Model, ViewModel>(mutator, j, model, spec);
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