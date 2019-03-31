export type FieldDeclaration<M, T> = {
    initialState(m: M): T;
}

export type ViewModelDeclaration<M> = {
    [key: string]: FieldDeclaration<M, any>;
}