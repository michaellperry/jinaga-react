import { Preposition, Watch } from "jinaga";

export type Transformer<T> = (oldValue: T) => T;

export type Mutator<C, T> = (context: C, transformer: Transformer<T>) => void;

export type BeginWatch<M, P> = <U, C>(
    preposition: Preposition<M, U>,
    resultAdded: (parent: P, child: U) => C,
    resultRemoved: (context: C) => void) => Watch<U, C>;

export type FieldMappingSpecification<M, T> = {
    initialize(m: M): T;
    createWatches<C>(
        beginWatch: BeginWatch<M, C>,
        mutator: Mutator<C, T>
    ): Watch<M, any>[];
};

export type ViewModelMappingSpecification<M> = {
    [key: string]: FieldMappingSpecification<M, any>;
}

export type FieldMappingOutput<M, FMS> = FMS extends FieldMappingSpecification<M, infer T> ? T : never;

export type ViewModel<M, FMS> = {
    [F in keyof FMS]: FieldMappingOutput<M, FMS[F]>
}