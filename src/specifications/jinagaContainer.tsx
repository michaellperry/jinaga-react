import { Jinaga, Preposition, Watch } from "jinaga";
import * as React from "react";
import { JinagaContext } from "../components/JinagaContext";
import { Store, StorePath } from "../store/store";
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

        private async startWatches() {
            const model = this.props.fact as M | null;
            if (!model) {
                return;
            }

            this.setState({ store: null });
            let localStore: Store | null = {
                data: mapping.initialMappingState(model, []),
                items: {}
            };

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