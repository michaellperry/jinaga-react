import { StatefulComponent } from "../src/index";
import { JinagaBrowser, Watch } from "jinaga";

import { expect } from "chai";

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

type ItemViewModel = {

};

type ApplicationState = {

};

class Application {
    state: ApplicationState;
    private watch: Watch<Item, ItemViewModel>;

    constructor() {
        this.state = {

        };
    }

    setState(state: ApplicationState) {
        this.state = state;
    }

    componentDidMount() {
        const root = {
            type: 'Application.Root',
            identity: 'home'
        };
        const watch = j.watch(root, j.for(Item.inRoot), i => <ItemViewModel>{}, vm => {});
        this.watch = watch;
    }

    componentWillUnmount() {
        this.watch.stop();
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