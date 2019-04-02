import { Jinaga as j } from "jinaga";
import * as React from "react";
import { ascending, collection, field, mutable, property, specificationFor } from "../../src";
import { Item, Name, Root } from "../model";
import { lineItemMapping } from "./LineItem";

const applicationSpec = specificationFor(Root, {
    identifier: field(r => r.identifier),
    name: property(j.for(Name.inRoot), n => n.value, ""),
    nameWithConflicts: mutable(j.for(Name.inRoot), names => names
        .map(n => n.value)
        .join(", ")
    ),
    Items: collection(j.for(Item.inRoot), lineItemMapping, ascending(i => i.createdAt))
});

interface ApplicationExtraProps {
    greeting: string;
}

export const applicationMapping = applicationSpec<ApplicationExtraProps>(
    ({ identifier, name, nameWithConflicts, Items, greeting }) => (
    <>
        <p data-testid="greeting">{greeting}</p>
        <p data-testid="identifier">{identifier}</p>
        <p data-testid="name">{name}</p>
        <p data-testid="nameWithConflicts">{nameWithConflicts.value}</p>
        <Items greeting={`Hola! ${greeting}!`} />
    </>
))