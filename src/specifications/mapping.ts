import * as React from "react";
import { BeginWatch, Mutator } from "./declaration";
import { Watch } from "jinaga";

export type Mapping<M, VM, P> = {
    initialState(m: M): VM;
    createWatches(
        beginWatch: BeginWatch<M>,
        mutator: Mutator<VM>
    ): Watch<M, () => void>[];
    PresentationComponent: React.ComponentType<VM & P>
}