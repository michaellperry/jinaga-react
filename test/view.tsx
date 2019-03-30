import { Jinaga as j, JinagaBrowser } from "jinaga";
import { collection, field, mutable, projection, property, specificationFor, createJinagaComponent } from "../src";
import { Item, ItemDeleted, Name, Root, SubItem, SubSubItem } from "./model";
import { ApplicationState } from "./viewModel";
import * as React from "react";

const applicationSpec = specificationFor(Root, {
    identifier: field(r =>r.identifier),
    name: property(j.for(Name.inRoot), n => n.value, ""),
    nameWithConflicts: mutable(j.for(Name.inRoot), names => names
        .map(n => n.value)
        .join(", ")
    )
});

export const applicationMapping = applicationSpec(({ identifier, name, nameWithConflicts }) =>
    <>
        <p data-testid="identifier">{identifier}</p>
        <p data-testid="name">{name}</p>
        <p data-testid="nameWithConflicts">{nameWithConflicts.value}</p>
    </>
);

/*
property('name', j.for(Name.inRoot), n => n.value, ''),
mutable('nameWithConflicts', j.for(Name.inRoot), names => names
    .map(n => n.value)
    .join(', ')),
collection('items', j.for(Item.inRoot), i => i.key, [
    field('key', i => j.hash(i)),
    field('fact', i => i),
    collection('subItems', j.for(SubItem.inItem), s => s.createdAt, [
        field('createdAt', s => s.cretedAt),
        collection('subSubItems', j.for(SubSubItem.inSubItem), ssi => ssi.id, [
            field('id', ssi => ssi.id)
        ])
    ]),
    projection('madeUp', [
        field('key', i => j.hash(i))
    ])
]),
projection('recycleBin', [
    collection('deletedItems', j.for(Item.deletedFromRoot), i => i.key, [
        field('key', i => j.hash(i)),
        field('fact', i => i)
    ])
])
*/