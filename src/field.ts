import { FieldSpecification } from "./specifications";

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