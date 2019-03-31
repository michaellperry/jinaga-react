import { Jinaga } from "jinaga";
import * as React from "react";
import { Mapping } from "./specificationFor";

export function jinagaContainer<M, VM, P>(
    j: Jinaga,
    connection: Mapping<M, VM, P>
): React.ComponentType<{ fact: M | undefined } & P> {
    throw new Error("Not yet implemented");
}