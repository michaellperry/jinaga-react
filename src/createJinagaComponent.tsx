import { Jinaga, Preposition, Watch } from "jinaga";
import * as React from "react";
import { SpecificationMapping } from "./specification";
import { Transformer } from "./types";
import { Query } from "jinaga/dist/types/query/query";

export function createJinagaComponent<M, VM, P>(
    j: Jinaga,
    connection: SpecificationMapping<M, VM, P>
): React.ComponentType<{ fact: M | undefined } & P> {
    type JinagaComponentProps = { fact: M | undefined } & P;
    type JinagaComponentState = { data: VM | undefined }

    return class extends React.Component<JinagaComponentProps, JinagaComponentState> {
        private watches: Watch<M, any>[] = [];
        
        constructor(props: JinagaComponentProps) {
            super(props);
            this.state = { data: undefined };
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
                this.setState({ data: undefined });
                this.startWatches();
            }
        }

        render() {
            const ItemComponent = connection.ItemComponent;
            const { fact, ...rest } = this.props;
            const otherProps = rest as P;
            return this.state.data
                ? <ItemComponent { ...{...this.state.data, ...otherProps} } />
                : <></>;
        }

        private initialState(): VM | undefined {
            const fact = this.props.fact as M | undefined;
            return fact ? connection.initialState(fact) : undefined;
        }

        private async startWatches() {
            console.log("Start watches");
            const model = this.props.fact;
            if (!model) {
                console.log("  no model; bail");
                return;
            }
            console.log("  model; yay!");

            this.setState({ data: undefined });
            var localData = this.initialState() as VM;
            console.log("  initial state: " + JSON.stringify(localData, null, 4));

            function beginWatch<C, V>(
                preposition: Preposition<M, C>,
                resultAdded: (parent: undefined, child: C) => V,
                resultRemoved: (path: V) => void
            ) {
                return j.watch(model, preposition, c => resultAdded(undefined, c), resultRemoved);
            }

            const mutator = (parent: undefined, transformer: Transformer<VM>) => {
                console.log("  mutating data");
                const data = this.state.data || localData;
                console.log("  old data: ", JSON.stringify(data, null, 4));
                const newData = transformer(data);
                if (newData !== data) {
                    console.log("  new data: ", JSON.stringify(newData, null, 4));
                    if (this.state.data) {
                        this.setState({ data: newData });
                    }
                    else {
                        localData = newData;
                    }
                }
            }
    
            this.watches = connection.createWatches(beginWatch, mutator);
            console.log("  created watches:" + this.watches
                .map((watch: any) => "\n    " + watch.query.toDescriptiveString())
                .join("")
            );
            await Promise.all(this.watches.map(w => w.load()));
            console.log("  loaded watches; new state = " + JSON.stringify(localData, null, 4));
            this.setState({ data: localData });
        }

        private stopWatches() {
            this.watches.forEach(watch => watch.stop());
            this.watches = [];
        }
    }
}