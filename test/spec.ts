import { expect } from "chai";
import { JinagaBrowser } from "jinaga";
import { StateManager } from "../src/index";


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
    private watch: StateManager;

    constructor() {
        this.state = {

        };
    }

    setState(state: ApplicationState) {
        this.state = state;
    }

    componentDidMount() {
        const root = new Root('home');
        this.watch = new StateManager([
            j.watch(root, j.for(Item.inRoot), i => <ItemViewModel>{}, vm => {})
        ]);
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