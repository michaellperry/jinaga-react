import { Jinaga as j } from "jinaga";

export class Root {
    static Type = 'Application.Root';
    type = Root.Type;

    constructor(
        public identifier: string
    ) { }
}

export class Item {
    static Type = 'Application.Item';
    type = Item.Type;

    constructor(
        public root: Root,
        public createdAt: Date | string
    ) { }

    static inRoot(r: Root) {
        return j.match(<Item>{
            type: Item.Type,
            root: r
        }).suchThat(j.not(Item.isDeleted));
    }

    static isDeleted(i: Item) {
        return j.exists(<ItemDeleted>{
            type: ItemDeleted.Type,
            item: i
        });
    }
}

export class ItemDeleted {
    static Type = 'Application.Item.Deleted';
    type = ItemDeleted.Type;

    constructor(
        public item: Item
    ) { }
}

export class SubItem {
    static Type = 'Application.SubItem';
    type = SubItem.Type;

    constructor(
        public item: Item,
        public cretedAt: Date | string
    ) { }

    static inItem(i: Item) {
        return j.match(<SubItem> {
            type: SubItem.Type,
            item: i
        });
    }
}

export class SubSubItem {
    static Type = 'Application.SubSubItem';
    type = SubSubItem.Type;

    constructor(
        public subItem: SubItem,
        public id: string
    ) { }

    static inSubItem(si: SubItem) {
        return j.match(<SubSubItem>{
            type: SubSubItem.Type,
            subItem: si
        });
    }
}