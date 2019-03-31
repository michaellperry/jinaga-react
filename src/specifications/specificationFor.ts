import { FieldDeclaration, ViewModelDeclaration } from "./declaration";
import { Mapping } from "./mapping";

type FieldType<M, D> = D extends FieldDeclaration<M, infer T> ? T : never;

type ViewModel<M, D> = {
    [F in keyof D]: FieldType<M, D[F]>
}

interface Type<T> extends Function {
    new (...args: any[]): T;
}

type Specification<M, VMD extends ViewModelDeclaration<M>> =
    <P>(PresentationComponent: React.ComponentType<ViewModel<M, VMD> & P>) =>
        Mapping<M, ViewModel<M, VMD>, P>;

export function specificationFor<M, VMD extends ViewModelDeclaration<M>>(
    modelConstructor: Type<M>,
    declaration: VMD
): Specification<M, VMD> {
    type VM = ViewModel<M, VMD>;

    return PresentationComponent => {
        return {
            initialState: m => Object.keys(declaration)
                .reduce((vm,key) => ({
                    ...vm,
                    [key]: declaration[key].initialState(m)
                }), {} as VM),
            PresentationComponent
        };
    }
}