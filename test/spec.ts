import { expect } from "chai";
import { Jinaga, JinagaBrowser } from "jinaga";
import { collection, field, mutable, property, StateManager } from "../src/index";
import { Item, ItemDeleted, Name, Root, SubItem, SubSubItem } from "./model";
import { ApplicationState } from "./viewModel";

class Application {
    state: ApplicationState;
    private watch?: StateManager;

    constructor() {
        this.state = {
            name: '',
            nameWithConflicts: {
                candidates: {},
                value: ''
            },
            items: []
        };
    }

    setState(state: ApplicationState) {
        this.state = state;
    }

    componentDidMount(j: Jinaga) {
        const root = new Root('home');
        this.watch = StateManager.forComponent(this, root, j, [
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
                ])
            ])
        ]);
    }

    componentWillUnmount() {
        if (this.watch) {
            this.watch.stop();
        }
    }
}

describe('Application State', () => {
    var j: Jinaga;
    var application: Application;

    beforeEach(() => {
        j = JinagaBrowser.create({});
        application = new Application();
        application.componentDidMount(j);
    });

    afterEach(() => {
        application.componentWillUnmount();
    })

    it('should watch', () => {
        expect(application.state).to.not.be.null;
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
        await j.fact(new Name(root, 'Modified', [ first ]));
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
        await j.fact(new Name(root, 'Modified', [ first ]));
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
});