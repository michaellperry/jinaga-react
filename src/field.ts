import { FieldMappingSpecification } from "./types";

/**
 * Set up a field which derives its value from a fact.
 * This can either be a field of the fact as in `field(x => x.identifier)`,
 * the hash of the fact as in `field(x => j.hash(x))`, or some computation thereof.
 * 
 * @param selector A lambda that selects the value for that field from a fact
 */
export function field<M, T>(selector: (m: M) => T): FieldMappingSpecification<M, T> {
    return {
        initialState: (m, slot) => ({
            result: selector(m),
            refs: slot.noRef()
        }),
        createWatches: (beginWatch, mutator) => []
    };
}