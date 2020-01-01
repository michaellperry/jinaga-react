import { Specification, Mapping } from '../specifications/mapping';

/**
 * Map a specification to the properties of a component.
 * The specification determines what props are passed to the component in order to render the fact.
 * If the component takes additional props, they will remain unbound.
 * In TypeScript, pass the unbound props type to the generic function *to*.
 * 
 * Unbound props are set in the resulting container component when either {@link container} or {@link jinagaContainer} is used.
 * 
 * @param specification A specification created by {@link specificationFor}, which defines the properties.
 */
export function mapProps<M, VM>(
  specification: Specification<M, VM>
): { to: <P>(PresentationComponent: React.ComponentType<VM & P>) => Mapping<M, VM, P> } {
  return (
    {
      to: PresentationComponent => (
        {
          ...specification,
          PresentationComponent
        })
    }
  );
}