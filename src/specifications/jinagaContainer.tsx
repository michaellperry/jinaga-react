import { Jinaga } from "jinaga";
import * as React from "react";
import { Mapping } from "./specificationFor";
import { RootContainer } from "../components/RootContaner";

export function jinagaContainer<M, VM, P>(
    j: Jinaga,
    connection: Mapping<M, VM, P>
): React.ComponentType<{ fact: M | undefined } & P> {
    return (props) => <RootContainer {...props} />;
}