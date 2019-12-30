import { Specification, Mapping } from './mapping';

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