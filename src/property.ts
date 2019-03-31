import { Preposition } from "jinaga";
import { BeginWatch, FieldMappingSpecification, Mutator } from "./types";

/**
 * Set up a view model field that holds the value of a Jinaga property.
 * The property follows the pattern of a successor having a value and an array of prior properties.
 * Provide a preposition that uses `suchThat` to exclude facts that appear in a prior array.
 * If a conflict occurs, this specification will select the last fact is sees, which may be different from another node.
 * 
 * @param preposition A Jinaga preposition using `j.for`
 * @param selector A lambda that selects the value of the property from the fact
 * @param initialValue The value that the property has when no facts satisfy the preposition
 */
export function property<M, U, T>(
    preposition: Preposition<M, U>,
    selector: (m: U) => T,
    initialValue: T
) : FieldMappingSpecification<M, T> {
    function createWatches<Parent>(
        beginWatch : BeginWatch<M, Parent>,
        mutator : Mutator<Parent, T>
    ) {
        function resultAdded(parent: Parent, child: U) {
            mutator(parent, vm => selector(child));
            return parent;
        }

        function resultRemoved(parent : Parent) {
        }

        const watch = beginWatch(preposition, resultAdded, resultRemoved);

        return [watch];
    }

    return {
        initialState: (m, refs) => ({
            result: initialValue,
            refs
        }),
        createWatches
    };
}