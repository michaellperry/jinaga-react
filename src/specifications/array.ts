import { Jinaga, Preposition, Watch } from "jinaga";
import { addStoreItem, combineStorePath, removeStoreItem, Store, StoreItem, StorePath } from "../store/store";
import { BeginWatch, FieldDeclaration, Mutator, ViewModel, ViewModelDeclaration, WatchContext } from "./declaration";

export function array<M, U, VMD extends ViewModelDeclaration<U>>(
    preposition: Preposition<M, U>,
    declaration: VMD
): FieldDeclaration<M, ViewModel<U, VMD>[]>{
    type VM = ViewModel<U, VMD>;

    function createMappingWatches(
        beginWatch: BeginWatch<M>,
        mutator: Mutator<Store>
    ) {
        return Object.keys(declaration)
            .map(fieldName => declaration[fieldName].createFieldWatches(
                beginWatch,
                mutator,
                fieldName
            ))
            .reduce((a,b) => a.concat(b));
    }

    function initialMappingState(child: U, childPath: StorePath) {
        return Object.keys(declaration)
            .reduce((vm,fieldName) => Object.assign({}, vm, {
                [fieldName]: declaration[fieldName].initialFieldState(child, childPath, fieldName)
            }), {} as VM)
    }

    function initialMappingItems(child: U, childPath: StorePath) {
        return Object.keys(declaration)
            .reduce((vm,fieldName) => Object.assign({}, vm, {
                [fieldName]: declaration[fieldName].initialFieldItems(child, childPath, fieldName)
            }), {})
    }
    
    function createFieldWatches(
        beginWatch: BeginWatch<M>,
        mutator: Mutator<Store>,
        fieldName: string
    ) {
        function resultAdded(path: StorePath, child: U): WatchContext {
            const hash = Jinaga.hash(child);
            const childPath = combineStorePath(path, fieldName, hash);
            const data = initialMappingState(child, childPath);
            const items = initialMappingItems(child, childPath);
            const item: StoreItem = {
                hash,
                data,
                items,
                orderBy: null
            };
            mutator(addStoreItem(path, fieldName, item, null));
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

        createMappingWatches(beginChildWatch, mutator);

        return [ watch ];
    }

    function getFieldValue(
        store: Store,
        collectionName: string
    ): VM[] {
        const items = store.items[collectionName];
        if (!items) {
            return [];
        }

        const value = items.map(item => Object.keys(declaration)
            .reduce((vm,childFieldName) => Object.assign({}, vm, {
                [childFieldName]: declaration[childFieldName].getFieldValue(item, childFieldName)
            }), {} as VM));
        return value;
    }

    return {
        initialFieldState: () => [],
        initialFieldItems: () => [],
        getFieldValue,
        createFieldWatches
    }
}