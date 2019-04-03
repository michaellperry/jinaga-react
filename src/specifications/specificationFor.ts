import { Store } from "../store/store";
import { BeginWatch, Mutator, ViewModel, ViewModelDeclaration } from "./declaration";
import { Mapping } from "./mapping";

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

        return {
            initialMappingState: (m, path) => Object.keys(declaration)
                .reduce((vm,fieldName) => ({
                    ...vm,
                    [fieldName]: declaration[fieldName].initialFieldState(m, path, fieldName)
                }), {} as VM),
            createMappingWatches: createMappingWatches,
            PresentationComponent
        };
    }
}