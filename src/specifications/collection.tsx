import { Jinaga, Preposition, Watch } from "jinaga";
import * as React from "react";
import { JinagaContext } from "../components/JinagaContext";
import { Mapping } from "../specifications/mapping";
import { BeginWatch, FieldDeclaration, Mutator, Transformer, WatchContext } from "./declaration";
import { getStoreData, StorePath, getStoreItems, combineStorePath, addStoreItem, Store, removeStoreItem } from "../store/store";

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
        path: StorePath;
        passThrough: P;
    }

    class ItemContainer extends React.Component<ItemContainerProps> {
        static contextType = JinagaContext;
        context!: React.ContextType<typeof JinagaContext>

        constructor(props: ItemContainerProps) {
            super(props);
        }

        render() {
            const data = getStoreData(this.context, this.props.path) as VM;
            return <PresentationComponent {...{...data, ...this.props.passThrough}} />;
        }
    }

    interface CollectionContainerProps {
        path: StorePath;
        collectionName: string;
        passThrough: P;
    };

    class CollectionContainer extends React.Component<CollectionContainerProps> {
        static contextType = JinagaContext;
        context!: React.ContextType<typeof JinagaContext>

        constructor(props: CollectionContainerProps) {
            super(props);
        }

        render() {
            const items = getStoreItems(this.context, this.props.path, this.props.collectionName);
            return (
                <>
                    { items.map(item =>
                        <ItemContainer
                            key={item.hash}
                            path={combineStorePath(this.props.path, this.props.collectionName, item.hash)}
                            passThrough={this.props.passThrough} />
                    )}
                </>
            );
        }
    }
    
    function createWatches(
        beginWatch: BeginWatch<M>,
        mutator: Mutator<Store>,
        fieldName: string
    ) {
        function resultAdded(path: StorePath, child: U): WatchContext {
            const hash = Jinaga.hash(child);
            const childPath = combineStorePath(path, fieldName, hash);
            const initialState = mapping.initialMappingState(child, childPath);
            mutator(addStoreItem(path, fieldName, hash, initialState));
            return {
                resultRemoved: () => {
                    mutator(removeStoreItem(path, fieldName, hash));
                },
                storePath: childPath
            }
        }

        const watch = beginWatch(preposition, resultAdded);

        function beginChildWatch<C>(
            preposition: Preposition<U,C>,
            resultAdded: (path: StorePath, child: C) => WatchContext
        ): Watch<C, WatchContext> {
            return watch.watch(
                preposition,
                ({ storePath }, c) => resultAdded(storePath, c),
                ({ resultRemoved }) => { resultRemoved(); }
            );
        }

        mapping.createMappingWatches(beginChildWatch, mutator);
        return [ watch ];
    }

    return {
        initialFieldState: (m, path, fieldName) => props => <CollectionContainer
            path={path}
            collectionName={fieldName}
            passThrough={props} />,
        createFieldWatches: createWatches
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