import * as React from "react";
import { Root } from "../model";
import { specificationFor } from "../../src/specifications/specificationFor";
import { field } from "../../src/specifications/field";

const applicationSpec = specificationFor(Root, {
    identifier: field(r => r.identifier)
});

interface ApplicationExtraProps {
    greeting: string;
}

export const applicationMapping = applicationSpec<ApplicationExtraProps>(({ identifier, greeting }) => (
    <>
        <p data-testid="greeting">{greeting}</p>
        <p data-testid="identifier">{identifier}</p>
    </>
))