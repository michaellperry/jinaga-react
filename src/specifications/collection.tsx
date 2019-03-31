import { Jinaga, Preposition, Watch } from "jinaga";
import * as React from "react";
import { Mapping } from "../specifications/mapping";
import { BeginWatch, FieldDeclaration, Mutator, Transformer, WatchContext } from "./declaration";

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
    mapping: Mapping<U,VM,P>,
    comparer: Comparer<U>
): FieldDeclaration<M, (props: P) => JSX.Element> {
    const PresentationComponent = mapping.PresentationComponent;

    interface ItemContainerProps {
        hash: string;
        passThrough: P;
    }

    class ItemContainer extends React.Component<ItemContainerProps> {
        constructor(props: ItemContainerProps) {
            super(props);
        }

        render() {
            const data = {} as VM;
            return <PresentationComponent {...{...data, ...this.props.passThrough}} />;
        }
    }

    interface CollectionContainerProps {
        passThrough: P;
    };

    class CollectionContainer extends React.Component<CollectionContainerProps> {
        constructor(props: CollectionContainerProps) {
            super(props);
        }

        render() {
            const items = [] as ItemContainerProps[];
            return (
                <>
                    { items.map(item =>
                        <ItemContainer
                            key={item.hash}
                            hash={item.hash}
                            passThrough={this.props.passThrough} />
                    )}
                </>
            );
        }
    }
    
    function createWatches(
        beginWatch: BeginWatch<M>,
        mutator: Mutator<(passThrough: P) => JSX.Element>
    ) {
        function resultAdded(child: U): WatchContext<VM> {
            const hash = Jinaga.hash(child);
            return {
                resultRemoved: () => {},
                mutator: t => {}
            }
        }

        const watch = beginWatch(preposition, resultAdded);

        function beginChildWatch<C>(
            preposition: Preposition<U,C>,
            resultAdded: (child: C) => WatchContext<any>
        ): Watch<C, WatchContext<any>> {
            return watch.watch(preposition, ({resultRemoved, mutator}) => (child: C) => {
                return resultAdded(child);
            });
        }

        function childMutator(transformer: Transformer<VM>) {
        }

        mapping.createWatches(beginChildWatch, childMutator);
        return [ watch ];
    }

    return {
        initialState: m => props => <CollectionContainer
            passThrough={props} />,
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