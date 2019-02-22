import { FieldSpecification, Transformer } from "./specifications";

export function projection<
    Model,
    ViewModel,
    K extends keyof ViewModel
>(
    field: K,
    spec: FieldSpecification<Model, ViewModel[K]>[]
) : FieldSpecification<Model, ViewModel> {
    type ChildViewModel = ViewModel[K];

    return {
        initialize: (m, vm) => ({ ...vm, [field]: spec
            .reduce((c,s) => s.initialize(m, c), <ChildViewModel>{}) }),
        createWatch: (beginWatch, mutator) => {
            function continueMutator<Parent>(
                path: Parent,
                transformer: Transformer<ChildViewModel>
            ) {
                mutator(path, vm => ({ ...vm, [field]: transformer(vm[field]) }));
            }
            const watches = spec
                .map(s => s.createWatch(beginWatch, continueMutator))
                .reduce((a,b) => a.concat(b));
            return watches;
        }
    };
}