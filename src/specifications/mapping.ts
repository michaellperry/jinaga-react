import { Watch } from "jinaga";
import * as React from "react";
import { Store, StorePath } from "../store/store";
import { BeginWatch, Mutator, WatchContext } from "./declaration";

export type Mapping<M, VM, P> = {
    initialMappingState(m: M, path: StorePath): VM;
    getMappingValue(store: Store): VM;
    createMappingWatches(
        beginWatch: BeginWatch<M>,
        mutator: Mutator<Store>
    ): Watch<M, WatchContext>[];
    PresentationComponent: React.ComponentType<VM & P>
}