import { Jinaga, Preposition } from "jinaga";
import * as React from "react";
import { SpecificationMapping } from "./specification";
import { BeginWatch, FieldMappingSpecification, Mutator, Transformer } from "./types";

export type Comparer<T> = (a: T, b: T) => number;

/**
 * Set up a collection of child view models.
 * The associated field in the parent view model is an array of children.
 * Declare the specifications for the child fields.
 * Children must have a field that uniquely identifies them, such as a hash.
 * Declare a hash using systax such as `field('key', x => j.hash(x))`.
 * 
 * @param preposition A Jinaga preposition using `j.for`
 * @param mapping A specification mapping for the child elements
 * @param comparer (Optional) A comparison function used to sort the collection
 */
export function collection<M, U, VM, P>(
    preposition: Preposition<M,U>,
    mapping: SpecificationMapping<U,VM,P>,
    comparer: Comparer<U>
): FieldMappingSpecification<M, undefined> {
    interface CollectionComponentItem {
        hash: string;
        viewModel: VM;
    };
    interface CollectionComponentProps {
        items: CollectionComponentItem[];
        passThrough: P;
    };

    const ItemComponent = mapping.ItemComponent;

    class CollectionComponent extends React.Component<CollectionComponentProps> {
        constructor(props: CollectionComponentProps) {
            super(props);
        }
        render() {
            return (
                <>
                    { this.props.items.map(item =>
                        <ItemComponent key={item.hash} {...{...item.viewModel, ...this.props.passThrough}} />
                    )}
                </>
            )
        }
    }
    
    function createWatches<Parent>(
        beginWatch: BeginWatch<M, Parent>,
        mutator: Mutator<Parent, undefined>
    ) {
        type Context = { parent: Parent, hash: string };

        function resultAdded(parent: Parent, child: U) {
            const hash = Jinaga.hash(child);
            const item: CollectionComponentItem = {
                hash,
                viewModel: mapping.initialState(child)
            }
            mutator(parent, component => undefined);
            return { parent, hash };
        }

        function resultRemoved({ parent, hash }: Context) {
            mutator(parent, component => undefined);
        }

        const watch = beginWatch(preposition, resultAdded, resultRemoved);

        function beginChildWatch<C,V>(
            preposition: Preposition<U,C>,
            resultAdded: (parent: Context, child: C) => V,
            resultRemoved: (path: V) => void
        ) {
            return watch.watch(preposition, resultAdded, resultRemoved);
        }

        function childMutator({ parent, hash }: Context, transformer: Transformer<VM>) {
            mutator(parent, component => undefined)
        }

        mapping.createWatches(beginChildWatch, childMutator);
        return [ watch ];
    }

    return {
        // TODO: Where do the pass through props come from?
        initialize: m => undefined,
        createWatches
    }
}

export function ascending<T, F>(field: (m: T) => F) : Comparer<T> {
    return (a, b) => {
        const fa = field(a);
        const fb = field(b);
        return fa < fb ? -1 : fa > fb ? 1 : 0;;
    };
}

export function descending<T, F>(field: (m: T) => F) : Comparer<T> {
    return (a, b) => {
        const fa = field(a);
        const fb = field(b);
        return fa < fb ? 1 : fa > fb ? -1 : 0;;
    };
}