import { Preposition } from "jinaga";
import { setFieldValue, setStoreData, Store, StorePath } from "../store/store";
import { BeginWatch, FieldDeclaration, Mutator, WatchContext } from "./declaration";

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
) : FieldDeclaration<M, T> {
    function createFieldWatches(
        beginWatch: BeginWatch<M>,
        mutator: Mutator<Store>,
        fieldName: string
    ) {
        function resultAdded(path: StorePath, child: U): WatchContext {
            mutator(setStoreData(path, setFieldValue(fieldName, () => selector(child))));
            return {
                resultRemoved: () =>{},
                storePath: path
            };
        }

        const watch = beginWatch(preposition, resultAdded);

        return [watch];
    }

    return {
        initialFieldState: () => initialValue,
        getFieldValue: (store, fieldName) => store.data[fieldName],
        createFieldWatches
    };
}