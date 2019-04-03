import * as React from "react";
import { FieldDeclaration } from "./declaration";
import { Mapping } from "./mapping";

export function projection<M, VM extends {}, P>(
    mapping: Mapping<M, VM, P>
): FieldDeclaration<M, (props: P) => JSX.Element> {
    const PresentationComponent = mapping.PresentationComponent;

    return {
        initialFieldState: (m, path) => (props: P) => {
            const vm = mapping.initialMappingState(m, path);
            const projectionProps = Object.assign({}, vm, props);
            return <PresentationComponent {...projectionProps} />;
        },
        createFieldWatches: (beginWatch, mutator) => mapping.createMappingWatches(beginWatch, mutator)
    };
}
