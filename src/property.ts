import { Preposition } from "jinaga";
import { BeginWatch, FieldSpecification, Mutator } from "./specifications";

/**
 * Set up a view model field that holds the value of a Jinaga property.
 * The property follows the pattern of a successor having a value and an array of prior properties.
 * Provide a preposition that uses `suchThat` to exclude facts that appear in a prior array.
 * If a conflict occurs, this specification will select the last fact is sees, which may be different from another node.
 * 
 * @param field The name of the field in the view model
 * @param preposition A Jinaga preposition using `j.for`
 * @param selector A lambda that selects the value of the property from the fact
 * @param initialValue The value that the property has when no facts satisfy the preposition
 */
export function property<
    Model,
    ViewModel,
    PropertyModel,
    K extends keyof ViewModel
>(
    field: K,
    preposition: Preposition<Model, PropertyModel>,
    selector: (m: PropertyModel) => ViewModel[K],
    initialValue: ViewModel[K]
) : FieldSpecification<Model, ViewModel> {
    function createWatch<Parent>(
        beginWatch : BeginWatch<Model, PropertyModel, Parent, Parent>,
        mutator : Mutator<Parent, ViewModel>
    ) {
        function resultAdded(parent: Parent, child: PropertyModel) {
            mutator(parent, vm => {
                const newValue = selector(child);
                const newViewModel = { ...vm, [field]: newValue };
                return newViewModel;
            });
            return parent;
        }

        function resultRemoved(parent : Parent) {
        }

        const watch = beginWatch(preposition, resultAdded, resultRemoved);

        return [watch];
    }
    return {
        initialize: (_, vm) => ({ ...vm, [field]: initialValue }),
        createWatch
    };
}