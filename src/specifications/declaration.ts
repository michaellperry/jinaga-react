import { Preposition, Watch } from "jinaga";
import { Store, StorePath, StoreItem } from "../store/store";

export type Transformer<T> = (oldValue: T) => T;

export type Mutator<T> = (transformer: Transformer<T>) => void;

export interface WatchContext {
    resultRemoved(): void;
    storePath: StorePath;
}

export type BeginWatch<M> = <U>(
    preposition: Preposition<M, U>,
    resultAdded: (path: StorePath, child: U) => WatchContext) => Watch<U, WatchContext>;

export type FieldDeclaration<M, T> = {
    initialFieldState(m: M, path: StorePath, fieldName: string): T;
    initialFieldItems(m: M, path: StorePath, fieldName: string): StoreItem[] | undefined;
    createFieldWatches(
        beginWatch: BeginWatch<M>,
        mutator: Mutator<Store>,
        fieldName: string
    ): Watch<any, WatchContext>[];
    getFieldValue(
        store: Store,
        fieldName: string
    ): T;
}

export type ViewModelDeclaration<M> = {
    [fieldName: string]: FieldDeclaration<M, any>;
}

export type FieldType<M, D> = D extends FieldDeclaration<M, infer T> ? T : never;

export type ViewModel<M, D> = {
    [F in keyof D]: FieldType<M, D[F]>
}

export interface OrderByDeclaration<M, T> {
    initialOrderByState(m: M): T;
    createOrderByWatches(
        beginWatch: BeginWatch<M>,
        mutator: Mutator<Store>
    ): Watch<any, WatchContext>[];
    comparer(a: T, b: T): number;
}