import { Jinaga, Preposition, Watch } from "jinaga";
import * as React from "react";
import { JinagaContext } from "../components/JinagaContext";
import { Store } from "../store/store";
import { Transformer, WatchContext } from "./declaration";
import { Mapping } from "./mapping";

export function jinagaContainer<M, VM, P>(
    j: Jinaga,
    mapping: Mapping<M, VM, P>
): React.ComponentType<{ fact: M | null } & P> {
    type RootContainerProps = { fact: M | null } & P;
    
    interface RootContainerState {
        store: Store | null;
    }
    
    return class RootContainer extends React.Component<RootContainerProps, RootContainerState> {
        private watches: Watch<M, WatchContext<VM>>[] = [];
        
        constructor(props: RootContainerProps) {
            super(props);
            this.state = {
                store: null
            };
        }

        componentDidMount() {
            this.startWatches();
        }

        componentWillUnmount() {
            this.stopWatches();
        }
    
        render() {
            const PresentationComponent = mapping.PresentationComponent;
            const { fact, ...rest } = this.props;
            const passThrough = rest as P;
            const store = this.state.store;

            if (store) {
                const data = store.data as VM;
                return (
                    <JinagaContext.Provider value={this.state.store}>
                        <PresentationComponent {...{...data, ...passThrough}} />
                    </JinagaContext.Provider>
                );
            }
            else {
                return <></>;
            }
        }

        private initialState(): VM | null {
            const fact = this.props.fact as M | null;
            return fact
                ? mapping.initialState(fact)
                : null;
        }

        private async startWatches() {
            const model = this.props.fact as M | null;
            if (!model) {
                return;
            }

            this.setState({ store: null });
            let localStore: Store | null = {
                data: this.initialState() as VM,
                items: {}
            };

            function beginWatch<U>(
                preposition: Preposition<M, U>,
                resultAdded: (child: U) => WatchContext<VM>
            ) {
                return j.watch(model, preposition, c => resultAdded(c), f => f.resultRemoved());
            }

            const mutator = (transformer: Transformer<VM>) => {
                const store = this.state.store || localStore;
                if (store) {
                    const newData = transformer(store.data as VM);
                    if (newData !== store.data) {
                        if (this.state.store) {
                            this.setState({ store });
                        }
                        else {
                            store.data = newData;
                        }
                    }
                }
            }
    
            this.watches = mapping.createWatches(beginWatch, mutator);
            await Promise.all(this.watches.map(w => w.load()));
            this.setState({ store: localStore });
            localStore = null;
        }

        private stopWatches() {
            this.watches.forEach(watch => watch.stop());
            this.watches = [];
        }
    }
}