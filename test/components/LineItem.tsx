import { Jinaga as j } from "jinaga";
import * as React from "react";
import { field, specificationFor, collection } from "../../src";
import { Item, SubItem } from "../model";
import { subItemMapping } from "./SubItemComponent";

const lineItemSpec = specificationFor(Item, {
    hash: field(i => j.hash(i)),
    SubItems: collection(j.for(SubItem.inItem), subItemMapping)
});

export const lineItemMapping = lineItemSpec<{ greeting: string }>(({ hash, greeting, SubItems }) =>
    <>
        <p data-testid="item_hash">{hash}</p>
        <p data-testid="item_greeting">{greeting}</p>
        <SubItems />
    </>
);
