import { Preposition } from "jinaga";
import { BeginWatch, FieldSpecification, Mutator, Transformer, ViewModelPath } from "./specifications";

export type Element<A> = A extends Array<infer E> ? E : never;

/**
 * Set up a collection of child view models.
 * The associated field in the parent view model is an array of children.
 * Declare the specifications for the child fields.
 * Children must have a field that uniquely identifies them, such as a hash.
 * Declare a hash using systax such as `field('key', x => j.hash(x))`.
 * 
 * @param field The name of the field in the parent view model
 * @param preposition A Jinaga preposition using `j.for`
 * @param key A lambda that identifies the field of the child object which uniquely identifies it
 * @param spec Specifications for the fields of child objects
 */
export function collection<
    Model,
    ViewModel,
    ChildModel,
    K extends keyof ViewModel,
    KeyType
>(
    field: K,
    preposition: Preposition<Model, ChildModel>,
    key: (childViewModel: Element<ViewModel[K]>) => KeyType,
    spec: FieldSpecification<ChildModel, Element<ViewModel[K]>>[]
) : FieldSpecification<Model, ViewModel> {
    type ChildViewModel = Element<ViewModel[K]>;

    function createWatch<Parent>(
        beginWatch : BeginWatch<Model, ChildModel, Parent, ViewModelPath<Parent, KeyType>>,
        mutator : Mutator<Parent, ViewModel>
    ) {
        function resultAdded(parent: Parent, child: ChildModel) {
            const childViewModel = spec.reduce(
                (vm, s) => s.initialize(child, vm),
                <ChildViewModel>{});
            mutator(parent, vm => {
                const oldCollection : ChildViewModel[] = <any>vm[field];
                const newCollection = [ ...oldCollection, childViewModel ];
                const newViewModel = { ...vm, [field]: newCollection };
                return newViewModel;
            });
            return { parent, id: key(childViewModel) };
        }

        function resultRemoved({ parent, id } : ViewModelPath<Parent, KeyType>) {
            mutator(parent, vm => {
                const oldCollection : ChildViewModel[] = <any>vm[field];
                const newCollection = oldCollection.filter(c => key(c) !== id);
                const newViewModel = { ...vm, [field]: newCollection };
                return newViewModel;
            });
        }

        const watch = beginWatch(preposition, resultAdded, resultRemoved);

        function continueWatch<GrandchildModel, GrandchildKeyType>(
            preposition: Preposition<ChildModel, GrandchildModel>,
            resultAdded: (parent: ViewModelPath<Parent, KeyType>, gm: GrandchildModel) => ViewModelPath< ViewModelPath<Parent, KeyType>, GrandchildKeyType>,
            resultRemoved: (gvm: ViewModelPath< ViewModelPath<Parent, KeyType>, GrandchildKeyType>) => void
        ) {
            return watch.watch(preposition, resultAdded, resultRemoved);
        }

        function continueMutator({parent, id}: ViewModelPath<Parent, KeyType>, transformer: Transformer<ChildViewModel>) {
            mutator(parent, vm => {
                const oldCollection: ChildViewModel[] = <any>vm[field];
                const newCollection = oldCollection.map(c =>
                    key(c) === id ? transformer(c) : c);
                return { ...vm, [field]: newCollection };
            });
        }

        spec.forEach(s => s.createWatch(continueWatch, continueMutator));

        return [watch];
    }
    return {
        initialize: (_, vm) => ({ ...vm, [field]: [] }),
        createWatch
    };
}