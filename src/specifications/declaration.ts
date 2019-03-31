import { Preposition, Watch } from "jinaga";

export type Transformer<T> = (oldValue: T) => T;

export type Mutator<T> = (transformer: Transformer<T>) => void;

export interface WatchContext<VM> {
    resultRemoved(): void;
    mutator: Mutator<VM>;
}

export type BeginWatch<M> = <U>(
    preposition: Preposition<M, U>,
    resultAdded: (child: U) => WatchContext<any>) => Watch<U, WatchContext<any>>;

export type FieldDeclaration<M, T> = {
    initialState(m: M): T;
    createWatches(
        beginWatch: BeginWatch<M>,
        mutator: Mutator<T>
    ): Watch<M, WatchContext<any>>[];
}

export type ViewModelDeclaration<M> = {
    [key: string]: FieldDeclaration<M, any>;
}