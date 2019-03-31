import { Preposition, Watch } from "jinaga";

export type BeginWatch<M> = <U>(
    preposition: Preposition<M, U>,
    resultAdded: (child: U) => () => void) => Watch<U, () => void>;

export type Transformer<T> = (oldValue: T) => T;

export type Mutator<T> = (transformer: Transformer<T>) => void;

export type FieldDeclaration<M, T> = {
    initialState(m: M): T;
    createWatches(
        beginWatch: BeginWatch<M>,
        mutator: Mutator<T>
    ): Watch<M, () => void>[];
}

export type ViewModelDeclaration<M> = {
    [key: string]: FieldDeclaration<M, any>;
}