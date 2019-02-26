import { FieldSpecification } from "./specifications";

/**
 * Set up a field which derives its value from a fact.
 * This can either be a field of the fact as in `field('identifier', x => x.identifier)`,
 * the hash of the fact as in `field('hash', x => j.hash(x))`, or some computation thereof.
 * 
 * @param field A field of the view model
 * @param selector A lambda that selects the value for that field from a fact
 */
export function field<
    Model,
    ViewModel,
    K extends keyof ViewModel
>(
    field: K,
    selector: (m: Model) => ViewModel[K]
) : FieldSpecification<Model, ViewModel> {
    return {
        initialize: (m, vm) => ({ ...vm, [field]: m ? selector(m) : null }),
        createWatch: (beginWatch, mutator) => []
    };
}