import { Jinaga } from "jinaga";
import * as React from "react";
import { JinagaContext } from "../components/JinagaContext";
import { Store } from "../store/store";
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
        constructor(props: RootContainerProps) {
            super(props);
            const data = this.initialState();
            this.state = {
                store: data ? { data } : null
            };
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
    }
}