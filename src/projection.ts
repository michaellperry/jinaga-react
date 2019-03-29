import { FieldMappingSpecification, ViewModel, ViewModelMappingSpecification } from "./types";

/**
 * Set up a child view model.
 * The associated field in the parent view model is a single child.
 * Declare the specifications for the child fields.
 * 
 * @param spec Specifications for the fields of the child view model
 */
export function projection<M, Spec extends ViewModelMappingSpecification<M>>(
    spec: Spec
) : FieldMappingSpecification<M, ViewModel<M, Spec>> {
    type ChildViewModel = ViewModel<M, Spec>;

    return {
        initialize: m => Object.keys(spec)
            .reduce((vm,key) => ({ ...vm, [key]: spec[key].initialize(m) }), <ChildViewModel>{}),
        createWatches: (beginWatch, mutator) => Object.keys(spec)
            .map(key => spec[key].createWatches(beginWatch, (context, transformer) => (
                mutator(context, vm => ({ ...vm, [key]: transformer(vm[key]) }))
            )))
            .reduce((a,b) => a.concat(b))
    };
}