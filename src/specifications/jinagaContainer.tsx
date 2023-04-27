import { Jinaga, Preposition, Watch } from "jinaga";
import * as React from "react";
import { JinagaContext } from "../components/JinagaContext";
import { HashMap, Store, StorePath, createStore } from "../store/store";
import { Transformer, WatchContext } from "./declaration";
import { Mapping } from "./mapping";

export function jinagaContainer<M, VM extends HashMap, P>(
    j: Jinaga,
    mapping: Mapping<M, VM, P>
): React.ComponentType<{ fact: M | null } & P> {
    type RootContainerProps = { fact: M | null } & P;
    
    interface RootContainerState {
        store: Store | null;
    }
    
    return class RootContainer extends React.Component<RootContainerProps, RootContainerState> {
        private watches: Watch<M, WatchContext>[] = [];
        
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

        componentDidUpdate(prevProps: RootContainerProps) {
            if (prevProps.fact !== this.props.fact) {
                this.stopWatches();
                this.setState({ store: null });
                this.startWatches();
            }
        }

        render() {
            const PresentationComponent = mapping.PresentationComponent;
            const { fact, ...rest } = this.props;
            const passThrough = rest as P;
            const store = this.state.store;

            const vm = store ? mapping.getMappingValue(store) : null;
            return vm
                ? (
                    <JinagaContext.Provider value={this.state.store}>
                        <PresentationComponent {...{...vm, ...passThrough}} />
                    </JinagaContext.Provider>
                )
                : <></>;
        }

        private async startWatches() {
            const model = this.props.fact as M | null;
            if (!model) {
                return;
            }

            this.setState({ store: null });
            let localStore: Store | null = createStore(
                mapping.initialMappingState(model, []),
                mapping.initialMappingItems(model, [])
            );

            function beginWatch<U>(
                preposition: Preposition<M, U>,
                resultAdded: (path: StorePath, child: U) => WatchContext
            ) {
                return j.watch(model, preposition, c => resultAdded([], c), f => f.resultRemoved());
            }

            const mutator = (transformer: Transformer<Store>) => {
                const store = this.state.store || localStore;
                if (store) {
                    if (this.state.store) {
                        this.setState({ store: transformer(store) });
                    }
                    else {
                        localStore = transformer(store);
                    }
                }
            }
    
            this.watches = mapping.createMappingWatches(beginWatch, mutator);
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