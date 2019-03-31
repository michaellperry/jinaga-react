import { Preposition, Watch } from "jinaga";
import * as React from "react";
import { ContainerRefMap, RefSlot } from "./refsAllocator";
import { BeginWatch, GetComponent, Mutator, ViewModel, ViewModelMappingSpecification } from "./types";

interface Type<T> extends Function {
    new (...args: any[]): T;
}

export type SpecificationMapping<M, VM, Props> = {
    initialState(m: M, refs: ContainerRefMap): { result: VM, refs: ContainerRefMap };
    createWatches<C>(
        beginWatch: BeginWatch<M, C>,
        mutator: Mutator<C, VM>,
        getComponent: GetComponent<C>
    ): Watch<M, any>[];
    ItemComponent: React.ComponentType<VM & Props>
}

export function specificationFor<M, Spec extends ViewModelMappingSpecification<M>>(
    modelConstructor: Type<M>,
    specs: Spec
): <P>(ItemComponent: React.ComponentType<ViewModel<M, Spec> & P>) => SpecificationMapping<M, ViewModel<M, Spec>, P> {
    return ItemComponent => {
        type VM = ViewModel<M, Spec>;
        type Context<P, K> = { parent: P; key: K };

        function fieldBeginWatch<M, P, K extends keyof VM>(
            beginWatch: BeginWatch<M, P>,
            key: K
        ): BeginWatch<M, Context<P,K>> {
            return <U, C>(
                preposition: Preposition<M, U>,
                resultAdded: (parent: Context<P,K>, child: U) => C,
                resultRemoved: (context: C) => void
            ) =>
                beginWatch(
                    preposition,
                    (parent, child) => resultAdded({ parent, key }, child),
                    resultRemoved
                );
        }

        function fieldMutator<P, K extends keyof VM>(
            mutator: Mutator<P, VM>,
            key: K
        ): Mutator<Context<P,K>, VM[K]> {
            return (context, transformer) => mutator(context.parent, vm => ({
                ...vm,
                [key]: transformer(vm[key])
            }));
        }

        function fieldGetComponent<P, K extends keyof VM & string>(
            getComponent: GetComponent<P>,
            key: K
        ): GetComponent<Context<P,K>> {
            return (context) => {
                console.log("Getting field component: ", context.parent);
                const parentComponent = getComponent(context.parent);
                if (parentComponent) {
                    console.log("  found parent: getting key " + key);
                    return parentComponent.getContainerComponent(key);
                }
                else {
                    return null;
                }
            }
        }

        return {
            initialState: (m, inRefs) => {
                const { vm, r } = (
                    Object.keys(specs).reduce(({ vm, r },key) => {
                        const { result, refs } = specs[key].initialState(m, new RefSlot(key, r));
                        return {
                            vm: ({
                                ...vm,
                                [key]: result
                            }),
                            r: refs
                        };
                    }, { vm: {} as VM, r: inRefs })
                );
                return { result: vm, refs: r };
            },
            createWatches: (beginWatch, mutator, getComponent) => {
                const watches = Object.keys(specs)
                    .map(key => specs[key].createWatches(
                        fieldBeginWatch(beginWatch, key),
                        fieldMutator(mutator, key),
                        fieldGetComponent(getComponent, key)
                    ))
                    .reduce((a,b) => a.concat(b));
                return watches;
            },
            ItemComponent
        }
    }
}