import { expect } from "chai";
import { JinagaBrowser, Jinaga } from "jinaga";
import { StateManager, collection, fixed } from "../src/index";

class Root {
    static Type = 'Application.Root';
    type = Root.Type;

    constructor(
        public identifier: string
    ) { }
}

class Item {
    static Type = 'Application.Item';
    type = Item.Type;

    constructor(
        public root: Root,
        public createdAt: Date | string
    ) { }

    static inRoot(r: Root) {
        return Jinaga.match(<Item>{
            type: Item.Type,
            root: r
        });
    }
}

interface ItemViewModel {
    key: string;
    fact: Item;
}

interface ApplicationState {
    items: ItemViewModel[];
}

class Application {
    state: ApplicationState;
    private watch?: StateManager;

    constructor() {
        this.state = {
            items: []
        };
    }

    setState(state: ApplicationState) {
        this.state = state;
    }

    componentDidMount(j: Jinaga) {
        const root = new Root('home');
        this.watch = StateManager.forComponent(this, root, j, [
            collection('items', Jinaga.for(Item.inRoot), i => i.key, [
                fixed('key', i => j.hash(i)),
                fixed('fact', i => i)
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
});