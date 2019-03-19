import { Component } from 'react';
import { expect } from "chai";
import { Jinaga, JinagaBrowser } from "jinaga";
import { collection, field, mutable, projection, property, connectJinaga } from "../src";
import { Item, ItemDeleted, Name, Root, SubItem, SubSubItem } from "./model";
import { ApplicationState } from "./viewModel";

class Application extends Component<{ jinaga: Jinaga }, any, any> {
    context: { jinaga: Jinaga };
    private watch: Application;

    constructor(props: { jinaga: Jinaga }) {
        super(props);

        this.context = { jinaga: props.jinaga };

        const root = new Root('home');
        this.watch = connectJinaga<Root, ApplicationState>(j => ({
            model: root,
            specs: [
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
            ]
        }))(<any>this);
    }
}

describe('Application State', () => {
    let j: Jinaga;
    var application: Application;

    beforeEach(() => {
        j = JinagaBrowser.create({});
        application = new Application({ jinaga: j });
        application.componentDidMount();
    });

    afterEach(() => {
        application.componentWillUnmount();
    })

    it('should initialize view model', () => {
        expect(application.props).to.not.be.null;
    });

    it('should add to a collection', async () => {
        await j.fact(new Item(new Root('home'), new Date()));
        expect(application.state.items.length).to.equal(1);
    });

    it('should resolve the fact', async () => {
        await j.fact(new Item(new Root('home'), new Date()));
        expect(application.state.items[0].fact.type).to.equal(Item.Type);
    });

    it('should resolve the key', async () => {
        const item = await j.fact(new Item(new Root('home'), new Date()));
        expect(application.state.items[0].key).to.equal(j.hash(item));
    });

    it('should remove from a collection', async () => {
        const item = await j.fact(new Item(new Root('home'), new Date()));
        await j.fact(new ItemDeleted(item));
        expect(application.state.items.length).to.equal(0);
    });

    it('should resolve sub items', async () => {
        const item = await j.fact(new Item(new Root('home'), new Date()));
        await j.fact(new SubItem(item, new Date()));
        expect(application.state.items[0].subItems.length).to.equal(1);
    });

    it('should resolve fields of sub items', async () => {
        const item = await j.fact(new Item(new Root('home'), new Date()));
        const subItem = await j.fact(new SubItem(item, new Date()));
        expect(application.state.items[0].subItems[0].createdAt).to.equal(subItem.cretedAt);
    });

    it('should resolve sub sub items', async () => {
        const item = await j.fact(new Item(new Root('home'), new Date()));
        const subItem = await j.fact(new SubItem(item, new Date()));
        await j.fact(new SubSubItem(subItem, 'reindeer flotilla'));
        expect(application.state.items[0].subItems[0].subSubItems[0].id).to.equal('reindeer flotilla');
    });

    it('should resolve properties', async () => {
        await j.fact(new Name(new Root('home'), 'Home', []));
        expect(application.state.name).to.equal('Home');
    });

    it('should replace previous values', async () => {
        const root = await j.fact(new Root('home'));
        const first = await j.fact(new Name(root, 'Home', []));
        await j.fact(new Name(root, 'Modified', [first]));
        expect(application.state.name).to.equal('Modified');
    });

    it('should take second value in a conflict', async () => {
        const root = await j.fact(new Root('home'));
        await j.fact(new Name(root, 'Home', []));
        await j.fact(new Name(root, 'Modified', []));
        expect(application.state.name).to.equal('Modified');
    });

    it('should resolve mutable', async () => {
        await j.fact(new Name(new Root('home'), 'Home', []));
        expect(application.state.nameWithConflicts.value).to.equal('Home');
        expect(Object.keys(application.state.nameWithConflicts.candidates).length).to.equal(1);
    });

    it('should replace previous value in mutable', async () => {
        const root = await j.fact(new Root('home'));
        const first = await j.fact(new Name(root, 'Home', []));
        await j.fact(new Name(root, 'Modified', [first]));
        expect(application.state.nameWithConflicts.value).to.equal('Modified');
        expect(Object.keys(application.state.nameWithConflicts.candidates).length).to.equal(1);
    });

    it('should apply resolver in a conflict', async () => {
        const root = await j.fact(new Root('home'));
        await j.fact(new Name(root, 'Home', []));
        await j.fact(new Name(root, 'Modified', []));
        expect(application.state.nameWithConflicts.value).to.equal('Home, Modified');
        expect(Object.keys(application.state.nameWithConflicts.candidates).length).to.equal(2);
    });

    it('should initialize projection', () => {
        expect(application.state.recycleBin).to.not.be.undefined;
        expect(application.state.recycleBin.deletedItems.length).to.equal(0);
    });

    it('should resolve projection', async () => {
        const item = await j.fact(new Item(new Root('home'), new Date()));
        await j.fact(new ItemDeleted(item));
        expect(application.state.recycleBin.deletedItems.length).to.equal(1);
        expect(application.state.recycleBin.deletedItems[0].fact).to.not.be.null;
    });

    it('should initialize child projections', async () => {
        const item = await j.fact(new Item(new Root('home'), new Date()));
        expect(application.state.items[0].madeUp.key).to.equal(j.hash(item));
    });
});