type FieldMappingSpecification<M, T> = {
}

type ViewModelMappingSpecification<M> = {
    [key: string]: FieldMappingSpecification<M, any>;
}

export type Mapping<M, VM, Props> = {
}

type FieldMappingOutput<M, FMS> = FMS extends FieldMappingSpecification<M, infer T> ? T : never;

type ViewModel<M, FMS> = {
    [F in keyof FMS]: FieldMappingOutput<M, FMS[F]>
}

interface Type<T> extends Function {
    new (...args: any[]): T;
}

export function specificationFor<M, Spec extends ViewModelMappingSpecification<M>>(
    modelConstructor: Type<M>,
    specs: Spec
): <P>(PresentationComponent: React.ComponentType<ViewModel<M, Spec> & P>) => Mapping<M, ViewModel<M, Spec>, P> {
    throw new Error("Not yet implemented");
}