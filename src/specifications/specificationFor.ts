import { Store } from "../store/store";
import { BeginWatch, Mutator, ViewModel, ViewModelDeclaration } from "./declaration";
import { Mapping } from "./mapping";

interface Type<T> extends Function {
    new (...args: any[]): T;
}

type Specification<M, VMD extends ViewModelDeclaration<M>> =
    <P>(PresentationComponent: React.ComponentType<ViewModel<M, VMD> & P>) =>
        Mapping<M, ViewModel<M, VMD>, P>;

/**
 * Start here.
 * Create a specification for a certain type of fact.
 * The specification determines what props are passed to a component in order to render the fact.
 * 
 * Declare the props as a JavaScript object.
 * Each field of this declaration object has the same name as the resulting prop.
 * The value of the field determines how the 
 * 
 * @param modelConstructor Constructor for the root fact.
 * @param declaration A declaration of the props to pass to the root component.
 */
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

        function getMappingValue(store: Store): VM {
            return Object.keys(declaration)
                .reduce((vm,fieldName) => ({
                    ...vm,
                    [fieldName]: declaration[fieldName].getFieldValue(store, fieldName)
                }), {} as VM);
        }

        return {
            initialMappingState: (m, path) => Object.keys(declaration)
                .reduce((vm,fieldName) => ({
                    ...vm,
                    [fieldName]: declaration[fieldName].initialFieldState(m, path, fieldName)
                }), {} as VM),
            initialMappingItems: (m, path) => Object.keys(declaration)
                .reduce((vm,fieldName) => ({
                    ...vm,
                    [fieldName]: declaration[fieldName].initialFieldItems(m, path, fieldName)
                }), {}),
            getMappingValue,
            createMappingWatches,
            PresentationComponent
        };
    }
}