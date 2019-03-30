import { Watch } from "jinaga";
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
        return {
            initialState: m => Object.keys(specs).reduce((vm,key) => ({
                ...vm,
                [key]: specs[key].initialize(m)
            }), {} as VM),
            createWatches: (beginWatch, mutator, getComponent) => {
                const watches = Object.keys(specs)
                    .map(key => specs[key].createWatches(
                        beginWatch,
                        (path, transformer) => mutator(path, vm => ({
                            ...vm,
                            [key]: transformer(vm[key])
                        })),
                        getComponent
                    ))
                    .reduce((a,b) => a.concat(b));
                return watches;
            },
            ItemComponent
        }
    }
}