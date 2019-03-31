import * as React from "react";
import { JinagaContext } from "./JinagaContext";
import { Store } from "../store/store";

interface RootContainerProps<M> {
    fact: M;
}

interface RootContainerState {
    store: Store;
}

export class RootContainer<M> extends React.Component<RootContainerProps<M>, RootContainerState> {
    constructor(props: RootContainerProps<M>) {
        super(props);
        this.state = {
            store: {}
        };
    }

    render() {
        return (
            <JinagaContext.Provider value={this.state.store}>
            </JinagaContext.Provider>
        )
    }
}