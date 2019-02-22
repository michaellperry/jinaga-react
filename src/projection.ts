import { FieldSpecification, Transformer } from "./specifications";

/**
 * Set up a child view model.
 * The associated field in the parent view model is a single child.
 * Declare the specifications for the child fields.
 * 
 * @param field The name of the field in the parent view model
 * @param spec Specifications for the fields of the child view model
 */
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