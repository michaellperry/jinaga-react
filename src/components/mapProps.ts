import { Specification, Mapping } from '../specifications/mapping';

/**
 * Map a specification to the properties of a component.
 * 
 * @param specification A specification created by specificationFor, which defines the properties
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