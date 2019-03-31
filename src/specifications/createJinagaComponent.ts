import { Jinaga } from "jinaga";
import * as React from "react";
import { SpecificationMapping } from "./specificationFor";

export function createJinagaComponent<M, VM, P>(
    j: Jinaga,
    connection: SpecificationMapping<M, VM, P>
): React.ComponentType<{ fact: M | undefined } & P> {
    throw new Error("Not yet implemented");
}