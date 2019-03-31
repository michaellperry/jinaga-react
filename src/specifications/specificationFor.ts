import { FieldDeclaration, ViewModelDeclaration, BeginWatch, Mutator } from "./declaration";
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
        function fieldMutator<K extends keyof VM>(
            mutator: Mutator<VM>,
            key: K
        ): Mutator<VM[K]> {
            return transformer => mutator(vm => ({
                ...vm,
                [key]: transformer(vm[key])
            }));
        }

        function createWatches(
            beginWatch: BeginWatch<M>,
            mutator: Mutator<VM>
        ) {
            return Object.keys(declaration)
                .map(key => declaration[key].createWatches(
                    beginWatch,
                    fieldMutator(mutator, key)
                ))
                .reduce((a,b) => a.concat(b));
        }

        return {
            initialState: m => Object.keys(declaration)
                .reduce((vm,key) => ({
                    ...vm,
                    [key]: declaration[key].initialState(m)
                }), {} as VM),
            createWatches,
            PresentationComponent
        };
    }
}