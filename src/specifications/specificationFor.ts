import { Store, StorePath } from '../store/store';
import { BeginWatch, Mutator, ViewModel, ViewModelDeclaration } from './declaration';
import { Mapping, Specification } from './mapping';

interface Type<T> extends Function {
    new (...args: any[]): T;
}

/**
 * Start here.
 * Create a specification for a certain type of fact.
 * The specification declares a set of fields based on Jinaga queries.
 * 
 * Declare the fields as a JavaScript object.
 * Each field of this declaration object has the same name as the resulting field.
 * 
 * To pass these fields as props into a component, use {@link mapProps}.
 * To get these fields as state in a function component, use {@link useResult}.
 * 
 * @param modelConstructor Constructor for the root fact.
 * @param declaration A declaration of the props to pass to the root component.
 */
export function specificationFor<M, VMD extends ViewModelDeclaration<M>>(
    modelConstructor: Type<M>,
    declaration: VMD
): Specification<M, ViewModel<M, VMD>> {
    type VM = ViewModel<M, VMD>;

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

    const initialMappingState = (m: M, path: StorePath) => Object.keys(declaration)
        .reduce((vm,fieldName) => ({
            ...vm,
            [fieldName]: declaration[fieldName].initialFieldState(m, path, fieldName)
        }), {} as VM);

    const initialMappingItems = (m: M, path: StorePath) => Object.keys(declaration)
        .reduce((vm,fieldName) => ({
            ...vm,
            [fieldName]: declaration[fieldName].initialFieldItems(m, path, fieldName)
        }), {});

    function mapProps<P>(PresentationComponent: React.ComponentType<VM & P>) : Mapping<M, VM, P> {
        return {
            initialMappingState,
            initialMappingItems,
            getMappingValue,
            createMappingWatches,
            PresentationComponent
        };
    }

    let specification : Specification<M, VM> = <any>mapProps.bind(null);
    specification.initialMappingState = initialMappingState;
    specification.initialMappingItems = initialMappingItems;
    specification.getMappingValue = getMappingValue;
    specification.createMappingWatches = createMappingWatches;
    return specification;
}