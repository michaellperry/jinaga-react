import { Watch } from "jinaga";
import * as React from "react";
import { Store, StorePath, StoreItem } from "../store/store";
import { BeginWatch, Mutator, WatchContext } from "./declaration";

type SpecificationBase<M, VM> = {
    initialMappingState(m: M, path: StorePath): VM;
    initialMappingItems(m: M, path: StorePath): { [collectionName: string]: StoreItem[] };
    getMappingValue(store: Store): VM;
    createMappingWatches(
        beginWatch: BeginWatch<M>,
        mutator: Mutator<Store>
    ): Watch<M, WatchContext>[];
};

export type Specification<M, VM> = SpecificationBase<M, VM> & {
    /**
     * @deprecated Use the mapProps method instead.
     */
    <P>(PresentationComponent: React.ComponentType<VM & P>):
        Mapping<M, VM, P>;
};

export type Mapping<M, VM, P> = SpecificationBase<M, VM> & {
    PresentationComponent: React.ComponentType<VM & P>
};

export type ResultOf<S> = S extends SpecificationBase<any, infer VM> ? VM : never;