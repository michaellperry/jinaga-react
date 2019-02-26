import { Jinaga, Preposition } from "jinaga";
import { useEffect, useState } from "react";
import { FieldSpecification, Transformer, ViewModelPath } from "./specifications";

/**
 * A React hook that creates a view model from a Jinaga fact and a tree of specifications.
 * Call this function in a React function component to establish the component's state.
 * Internally, it uses `useState` to create a state variable, and `useEffect` to
 * watch for changes while the component is mounted.
 * 
 * @param j An instance of Jinaga
 * @param model The starting fact for the specifications
 * @param spec Specifications for all of the members of the state
 */
export function useJinaga<Model, ViewModel>(
    j: Jinaga,
    model: Model | null,
    spec: FieldSpecification<Model, ViewModel>[]
): ViewModel {
    const [state, setState] = useState(initialState);
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

        const watches = model ? spec
            .map(s => s.createWatch(beginWatch, mutator))
            .reduce((a, b) => a.concat(b)) : [];

        return () => {
            watches.forEach(watch => watch.stop());
            setState(initialState());
        };
    }, [model]);

    return state;
    
    function initialState() {
        return spec.reduce((vm, s) => s.initialize(model, vm), <ViewModel>{});
    }
}
