import * as React from "react";

export type Mapping<M, VM, P> = {
    initialState(m: M): VM;
    PresentationComponent: React.ComponentType<VM & P>
}