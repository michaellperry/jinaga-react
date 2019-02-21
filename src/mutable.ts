import { Jinaga, Preposition } from "jinaga";
import { BeginWatch, FieldSpecification, Mutator, ViewModelPath } from "./specifications";

export interface Mutable<Fact, T> {
    candidates: { [hash: string]: Fact };
    value: T;
}

/**
 * Produce an array of facts from a set of candidates.
 * Use this function to change the value of a mutable property.
 * First, set up the property in the view model with `mutable`.
 * Then, freeze the property while the user is editing the value.
 * Finally, when they finish, create a new fact recording the new value and `prior(candidates)`.
 * 
 * @param mutable A mutable field of the view model, as specified with `mutable`
 */
export function prior<Fact, T>(mutable: Mutable<Fact, T>) {
    return Object
        .keys(mutable.candidates)
        .map(key => mutable.candidates[key]);
}

/**
 * Set up a view model field that represents a property that will eventually be changed.
 * The field will be of type `Mutable`, which has an array of `candidates` and a single `value`.
 * The property follows the pattern of a successor having a value and an array of prior properties.
 * Provide a preposition that uses `suchThat` to exclude facts that appear in a prior array.
 * This specification will pass all matching facts to the resolver.
 * If a conflict occurs, the array passed to the resolver will have more than one element.
 * 
 * To mutate the value, use `j.fact` to record a new fact having the new value and an
 * array listing all of the candidates.
 * Use the function `prior(candidates)` to produce the array.
 * 
 * @param field The name of the field in the view model
 * @param preposition A Jinaga preposition using `j.for`
 * @param resolver A function that determines a single value given an array of candidate facts
 */
export function mutable<
    Model,
    ViewModel,
    PropertyModel,
    K extends keyof ViewModel,
    ValueType
>(
    field: K,
    preposition: Preposition<Model, PropertyModel>,
    resolver: (candidates: PropertyModel[]) => ValueType
) : FieldSpecification<Model, ViewModel> {
    function createWatch<Parent>(
        beginWatch: BeginWatch<Model, PropertyModel, Parent, ViewModelPath<Parent, string>>,
        mutator: Mutator<Parent, ViewModel>
    ) {
        function resultAdded(parent: Parent, child: PropertyModel) {
            const hash = Jinaga.hash(child);
            mutator(parent, (vm) => {
                const { candidates } : Mutable<PropertyModel, ValueType> = <any>vm[field];
                const newCandidates = { ...candidates, [hash]: child };
                const newValue = resolver(Object
                    .keys(newCandidates)
                    .map(key => newCandidates[key]));
                const newMutable = {
                    candidates: newCandidates,
                    value: newValue
                };
                return { ...vm, [field]: newMutable };
            });
            return { parent, id: hash };
        }

        function resultRemoved({ parent, id: hash } : ViewModelPath<Parent, string>) {
            mutator(parent, (vm) => {
                const { candidates } : Mutable<PropertyModel, ValueType> = <any>vm[field];
                const { [hash]: fact, ...newCandidates } = candidates;
                const newValue = resolver(Object
                    .keys(newCandidates)
                    .map(key => newCandidates[key]));
                const newMutable = {
                    candidates: newCandidates,
                    value: newValue
                };
                return { ...vm, [field]: newMutable };
            });
        }

        const watch = beginWatch(preposition, resultAdded, resultRemoved);
        return [watch];
    }

    return {
        initialize: (m, vm) => ({ ...vm, [field]: {
            candidates: {},
            value: resolver([])
        } }),
        createWatch
    }
}
