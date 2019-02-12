import { expect } from "chai";
import { JinagaBrowser } from "jinaga";
import { StateManager, collection, fixed } from "../src/index";

const j = JinagaBrowser.create({});

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
        public createdAt: Date
    ) { }

    static inRoot(r: Root) {
        return j.match(<Item>{
            type: Item.Type,
            root: r
        });
    }
}

interface ItemViewModel {
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

    componentDidMount() {
        const root = new Root('home');
        this.watch = StateManager.forComponent(this, root, {
            items: collection(j.for(Item.inRoot), {
                fact: fixed(i => i)
            })
        });
    }

    componentWillUnmount() {
        if (this.watch) {
            this.watch.stop();
        }
    }
}

describe('Application State', () => {
    it('should watch', () => {
        const application = new Application();
        application.componentDidMount();
        application.componentWillUnmount();
        expect(application.state).to.not.be.null;
    });
});