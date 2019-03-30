import { Jinaga, Preposition } from "jinaga";
import * as React from "react";
import { SpecificationMapping } from "./specification";
import { BeginWatch, FieldMappingSpecification, GetComponent, IContainerComponent, Mutator, Transformer } from "./types";

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
): FieldMappingSpecification<M, (passThrough: P) => JSX.Element> {
    const ItemComponent = mapping.ItemComponent;

    interface ItemContainerProps {
        hash: string;
        fact: U;
        passThrough: P;
    }

    interface ItemContainerState {
        data: VM;
    }

    class ItemContainer extends React.Component<ItemContainerProps, ItemContainerState> {
        constructor(props: ItemContainerProps) {
            super(props);
            this.state = {
                data: mapping.initialState(this.props.fact)
            };
        }

        render() {
            return <ItemComponent {...{...this.state.data, ...this.props.passThrough}} />;
        }

        mutate(transformer: Transformer<VM>) {
            this.setState({
                data: transformer(this.state.data)
            });
        }
    }

    interface CollectionContainerProps {
        passThrough: P;
    };

    interface CollectionContainerState {
        items: {
            hash: string;
            fact: U;
            // orderBy: U;
        }[];
    }

    type ChildRefMap = { [hash: string]: React.RefObject<ItemContainer> };

    class CollectionContainer extends React.Component<CollectionContainerProps, CollectionContainerState> {
        private childRefs: ChildRefMap = {};

        constructor(props: CollectionContainerProps) {
            super(props);
            this.state = {
                items: []
            };
        }

        render() {
            this.createRefs();
            return (
                <>
                    { this.state.items.map(item =>
                        <ItemContainer
                            key={item.hash}
                            hash={item.hash}
                            fact={item.fact}
                            ref={this.childRefs[item.hash]}
                            passThrough={this.props.passThrough} />
                    )}
                </>
            );
        }

        addItem(hash: string, fact: U) {
            this.setState({
                items: [
                    ...this.state.items,
                    {
                        hash,
                        fact
                    }
                ]
            });
        }

        removeItem(hash: string) {
            this.setState({
                items: this.state.items.filter(
                    item => item.hash !== hash)
            });
        }

        getItemContainer(hash: string) {
            return this.childRefs[hash].current;
        }

        private createRefs() {
            const newChildRefs = this.state.items.reduce((r,item) => ({
                ...r,
                [item.hash]: this.childRefs[item.hash] || React.createRef<ItemContainer>()
            }), {} as ChildRefMap);
            this.childRefs = newChildRefs;
        }
    }
    
    function createWatches<Parent>(
        beginWatch: BeginWatch<M, Parent>,
        mutator: Mutator<Parent, (passThrough: P) => JSX.Element>,
        getComponent: GetComponent<Parent>
    ) {
        type Context = { parent: Parent, hash: string };

        function getCollectionContainer(parent: Parent): CollectionContainer | null {
            const parentComponent = getComponent(parent);
            return null;
        }

        function resultAdded(parent: Parent, child: U) {
            const hash = Jinaga.hash(child);
            const collectionContainer = getCollectionContainer(parent);
            if (collectionContainer) {
                collectionContainer.addItem(hash, child);
            }
            return { parent, hash };
        }

        function resultRemoved({ parent, hash }: Context) {
            const collectionContainer = getCollectionContainer(parent);
            if (collectionContainer) {
                collectionContainer.removeItem(hash);
            }
        }

        const watch = beginWatch(preposition, resultAdded, resultRemoved);

        function beginChildWatch<C,V>(
            preposition: Preposition<U,C>,
            resultAdded: (parent: Context, child: C) => V,
            resultRemoved: (path: V) => void
        ) {
            return watch.watch(preposition, resultAdded, resultRemoved);
        }

        function getChildComponent({ parent, hash }: Context): IContainerComponent | null {
            const collectionContainer = getCollectionContainer(parent);
            if (collectionContainer) {
                const itemContainer = collectionContainer.getItemContainer(hash);
                return itemContainer;
            }
            else {
                return null;
            }
        }

        function childMutator({ parent, hash }: Context, transformer: Transformer<VM>) {
            const itemContainer = getChildComponent({ parent, hash });
            const collectionContainer = getCollectionContainer(parent);
            if (collectionContainer) {
                const itemContainer = collectionContainer.getItemContainer(hash);
                if (itemContainer) {
                    itemContainer.mutate(transformer);
                }
            }
        }

        mapping.createWatches(beginChildWatch, childMutator, getChildComponent);
        return [ watch ];
    }

    return {
        initialize: m => passThrough => <CollectionContainer passThrough={passThrough} />,
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