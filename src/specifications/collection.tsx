import { Jinaga, Preposition, Watch } from "jinaga";
import * as React from "react";
import { JinagaContext } from "../components/JinagaContext";
import { Mapping } from "../specifications/mapping";
import { addStoreItem, combineStorePath, getStoreData, getStoreItems, removeStoreItem, setStoreOrderBy, Store, StorePath } from "../store/store";
import { BeginWatch, FieldDeclaration, Mutator, WatchContext } from "./declaration";

export interface OrderByDeclaration<M, T> {
    initialOrderByState(m: M): T;
    createOrderByWatches(
        beginWatch: BeginWatch<M>,
        mutator: Mutator<Store>
    ): Watch<M, WatchContext>[];
    comparer(a: T, b: T): number;
}

/**
 * Set up a collection of child components.
 * The associated property is a render prop that produces the list of children.
 * Capitalize the property name so that it can be used as a React element.
 * 
 * @param preposition A Jinaga preposition using `j.for`
 * @param mapping A specification mapping for the child elements
 * @param orderBy (Optional) A comparison function used to sort the collection
 */
export function collection<M, U, VM, P, T>(
    preposition: Preposition<M, U>,
    mapping: Mapping<U, VM, P>,
    orderBy?: OrderByDeclaration<U, T>
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
            const initialOrderByState = orderBy ? orderBy.initialOrderByState(child) : null;
            mutator(addStoreItem(path, fieldName, hash, initialState, initialOrderByState, orderBy ? orderBy.comparer : null));
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
        if (orderBy) {
            orderBy.createOrderByWatches(beginChildWatch, mutator);
        }

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

const ascendingComparer:  <T>(a: T, b: T) => number = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const descendingComparer: <T>(a: T, b: T) => number = (a, b) => a > b ? -1 : a < b ? 1 : 0;

function orderByProperty<M, U, T>(
    preposition: Preposition<M, U>,
    selector: (m: U) => T,
    initialValue: T,
    comparer: (a: T, b: T) => number
): OrderByDeclaration<M, T> {
    function createWatches(
        beginWatch: BeginWatch<M>,
        mutator: Mutator<Store>
    ) {
        function resultAdded(path: StorePath, child: U): WatchContext {
            mutator(setStoreOrderBy(path, () => selector(child), comparer));
            return {
                resultRemoved: () =>{},
                storePath: path
            };
        }

        const watch = beginWatch(preposition, resultAdded);

        return [watch];
    }

    return {
        initialOrderByState: () => initialValue,
        createOrderByWatches: createWatches,
        comparer
    };
}

function orderByField<M, T>(
    selector: (m: M) => T,
    comparer: (a: T, b: T) => number
): OrderByDeclaration<M, T> {
    return {
        initialOrderByState: selector,
        createOrderByWatches: () => [],
        comparer
    };
}

export function ascending<M, U, T>(
    preposition: Preposition<M, U>,
    selector: (m: U) => T,
    initialValue: T
): OrderByDeclaration<M, T>;
export function ascending<M, T>(
    selector: (m: M) => T
): OrderByDeclaration<M, T>;
export function ascending<M, U, T>(
    prepositionOrSelector: Preposition<M, U> | ((m: M) => T),
    selectorOpt?: (m: U) => T,
    initialValueOpt?: T
) {
    if (prepositionOrSelector instanceof Preposition) {
        if (selectorOpt === undefined || initialValueOpt === undefined) {
            throw new Error("Selector and initial value are required to order by a property");
        }
        return orderByProperty(prepositionOrSelector, selectorOpt, initialValueOpt, ascendingComparer);
    }
    else {
        return orderByField(prepositionOrSelector, ascendingComparer);
    }
}

export function descending<M, U, T>(
    preposition: Preposition<M, U>,
    selector: (m: U) => T,
    initialValue: T
): OrderByDeclaration<M, T>;
export function descending<M, T>(
    selector: (m: M) => T
): OrderByDeclaration<M, T>;
export function descending<M, U, T>(
    prepositionOrSelector: Preposition<M, U> | ((m: M) => T),
    selectorOpt?: (m: U) => T,
    initialValueOpt?: T
) {
    if (prepositionOrSelector instanceof Preposition) {
        if (selectorOpt === undefined || initialValueOpt === undefined) {
            throw new Error("Selector and initial value are required to order by a property");
        }
        return orderByProperty(prepositionOrSelector, selectorOpt, initialValueOpt, descendingComparer);
    }
    else {
        return orderByField(prepositionOrSelector, descendingComparer);
    }
}