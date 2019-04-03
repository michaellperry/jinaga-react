import { FieldDeclaration } from "./declaration";

/**
 * Set up a field which derives its value from a fact.
 * This can either be a field of the fact as in `field(x => x.identifier)`,
 * the hash of the fact as in `field(x => j.hash(x))`, or some computation thereof.
 * 
 * @param selector A lambda that selects the value for that field from a fact
 */
export function field<M, T>(selector: (m: M) => T): FieldDeclaration<M, T> {
    return {
        initialFieldState: m => selector(m),
        getFieldValue: (store, fieldName) => store.data[fieldName],
        createFieldWatches: () => []
    };
}