import { Mutable } from "../src";
import { Item, Name } from "./model";

export interface SubSubItemViewModel {
    id: string;
}

export interface SubItemViewModel {
    createdAt: Date | string;
    subSubItems: SubSubItemViewModel[];
}

export interface ItemViewModel {
    key: string;
    fact: Item;
    subItems: SubItemViewModel[]
}

export interface ApplicationState {
    name: string;
    nameWithConflicts: Mutable<Name, string>;
    items: ItemViewModel[];
}