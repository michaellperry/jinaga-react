import { Jinaga, Preposition } from "jinaga";
import { BeginWatch, FieldSpecification, Mutator, ViewModelPath } from "./specifications";

export interface Mutable<Fact, T> {
    candidates: { [hash: string]: Fact };
    value: T;
}

export function prior<Fact, T>(mutable: Mutable<Fact, T>) {
    return Object
        .keys(mutable.candidates)
        .map(key => mutable.candidates[key]);
}

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
