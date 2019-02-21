import { Jinaga, Preposition } from "jinaga";
import { useEffect, useState } from "react";
import { FieldSpecification, Transformer, ViewModelPath } from "./specifications";

export function useJinaga<Model, ViewModel>(
    j: Jinaga,
    model: Model,
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

        const watches = spec
            .map(s => s.createWatch(beginWatch, mutator))
            .reduce((a, b) => a.concat(b));

        return () => {
            watches.forEach(watch => watch.stop());
        };
    }, [model]);

    return state;
    
    function initialState() {
        return spec.reduce((vm, s) => s.initialize(model, vm), <ViewModel>{});
    }
}
