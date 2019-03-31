import * as React from "react";
import { BeginWatch, Mutator, WatchContext } from "./declaration";
import { Watch } from "jinaga";

export type Mapping<M, VM, P> = {
    initialState(m: M): VM;
    createWatches(
        beginWatch: BeginWatch<M>,
        mutator: Mutator<VM>
    ): Watch<M, WatchContext>[];
    PresentationComponent: React.ComponentType<VM & P>
}