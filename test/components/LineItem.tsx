import { Jinaga as j } from "jinaga";
import * as React from "react";
import { field, specificationFor } from "../../src";
import { Item } from "../model";

const lineItemSpec = specificationFor(Item, {
    hash: field(i => j.hash(i))
});

export const lineItemMapping = lineItemSpec(({ hash }) =>
    <>
        <p data-testid="item_hash">{hash}</p>
    </>
);
