import { Jinaga, Preposition, Watch } from "jinaga";
import * as React from "react";
import { SpecificationMapping } from "./specification";
import { Transformer } from "./types";

export function createJinagaComponent<M, VM, P>(j: Jinaga, connection: SpecificationMapping<M, VM, P>) {
    type JinagaComponentProps = { fact: M } & P;
    type JinagaComponentState = { data: VM }

    return class extends React.Component<JinagaComponentProps, JinagaComponentState> {
        private watches: Watch<M, any>[] = [];
        
        constructor(props: JinagaComponentProps) {
            super(props);
            this.state = { data: connection.initialState(this.props.fact) };
        }

        componentDidMount() {
            this.startWatches();
        }

        componentWillUnmount() {
            this.stopWatches();
        }

        componentDidUpdate(prevProps: JinagaComponentProps) {
            if (prevProps.fact !== this.props.fact) {
                this.stopWatches();
                this.setState({ data: connection.initialState(this.props.fact) });
                this.startWatches();
            }
        }

        render() {
            const ItemComponent = connection.ItemComponent;
            const { fact, ...rest } = this.props;
            const otherProps = rest as P;
            return <ItemComponent { ...{...this.state.data, ...otherProps} } />;
        }

        private startWatches() {
            const model = this.props.fact;
            if (!model) {
                return;
            }

            function beginWatch<C, V>(
                preposition: Preposition<M, C>,
                resultAdded: (parent: undefined, child: C) => V,
                resultRemoved: (path: V) => void
            ) {
                return j.watch(model, preposition, c => resultAdded(undefined, c), resultRemoved);
            }

            const mutator = (parent: undefined, transformer: Transformer<VM>) => {
                const newData = transformer(this.state.data);
                if (newData !== this.state.data) {
                    this.setState({ data: newData });
                }
            }
    
            this.watches = connection.createWatches(beginWatch, mutator);
        }

        private stopWatches() {
            this.watches.forEach(watch => watch.stop());
            this.watches = [];
        }
    }
}