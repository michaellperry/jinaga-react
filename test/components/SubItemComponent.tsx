import { Jinaga as j } from "jinaga";
import * as React from "react";
import { field, specificationFor, collection, mapProps } from "../../src";
import { SubItem, SubSubItem } from "../model";
import { subSubItemMapping } from "./SubSubItemComponent";

const subItemSpec = specificationFor(SubItem, {
    createdAt: field(s => s.createdAt),
    SubSubItems: collection(j.for(SubSubItem.inSubItem), subSubItemMapping)
});

export const subItemMapping = mapProps(subItemSpec).to(({ createdAt, SubSubItems }) => (
    <>
        <p data-testid="subitem_createdat">{createdAt.toString()}</p>
        <SubSubItems />
    </>
));