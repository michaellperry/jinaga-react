import { Watch, Preposition } from "jinaga";
import * as React from "react";
import { BeginWatch, Mutator, ViewModel, ViewModelMappingSpecification, GetComponent } from "./types";

interface Type<T> extends Function {
    new (...args: any[]): T;
}

export interface SpecificationMapping<M, VM, Props> {
    initialState(m: M): VM;
    createWatches<P>(
        beginWatch: BeginWatch<M,P>,
        mutator: Mutator<P,VM>,
        getComponent: GetComponent<P>
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

        function fieldGetComponent<P, K extends keyof VM>(
            getComponent: GetComponent<P>,
            key: K
        ): GetComponent<Context<P,K>> {
            return (context) => {
                const parentComponent = getComponent(context.parent);
                if (parentComponent) {
                    // TODO: Get child by key
                    return parentComponent;
                }
                else {
                    return null;
                }
            }
        }

        return {
            initialState: m => Object.keys(specs).reduce((vm,key) => ({
                ...vm,
                [key]: specs[key].initialize(m)
            }), {} as VM),
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