import { Jinaga, Preposition, Watch } from "jinaga";
import * as React from "react";
import { SpecificationMapping } from "./specification";
import { Transformer } from "./types";
import { ContainerRefMap, IContainerComponent } from "./refsAllocator";

export function createJinagaComponent<M, VM, P>(
    j: Jinaga,
    connection: SpecificationMapping<M, VM, P>
): React.ComponentType<{ fact: M | undefined } & P> {
    type JinagaComponentProps = { fact: M | undefined } & P;
    type JinagaComponentState = { data: VM | undefined }

    return class extends React.Component<JinagaComponentProps, JinagaComponentState> implements IContainerComponent {
        private watches: Watch<M, any>[] = [];
        private containerRefs: ContainerRefMap = {};
        
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

        getContainerComponent(key: string) {
            console.log("Getting root container component for key " + key, Object.keys(this.containerRefs));
            if (this.containerRefs.hasOwnProperty(key)) {
                return this.containerRefs[key].current;
            }
            else {
                return null;
            }
        }

        private initialState(): VM | undefined {
            const fact = this.props.fact as M | undefined;
            if (fact) {
                const { result, refs } = connection.initialState(fact, this.containerRefs);
                console.log("Initialized root component; has container refs: ", JSON.stringify(Object.keys(this.containerRefs)))
                this.containerRefs = refs;
                return result;
            }
            else {
                return undefined;
            }
        }

        private async startWatches() {
            const model = this.props.fact;
            if (!model) {
                return;
            }

            this.setState({ data: undefined });
            let localData = this.initialState();

            function beginWatch<C, V>(
                preposition: Preposition<M, C>,
                resultAdded: (parent: undefined, child: C) => V,
                resultRemoved: (path: V) => void
            ) {
                return j.watch(model, preposition, c => resultAdded(undefined, c), resultRemoved);
            }

            const mutator = (parent: undefined, transformer: Transformer<VM>) => {
                const data = this.state.data || localData;
                if (data) {
                    const newData = transformer(data);
                    if (newData !== data) {
                        if (this.state.data) {
                            this.setState({ data: newData });
                        }
                        else {
                            localData = newData;
                        }
                    }
                }
            }

            const getComponent = (parent: undefined) => {
                console.log("Getting root component; has container refs: ", JSON.stringify(Object.keys(this.containerRefs)));
                return this;
            };
    
            this.watches = connection.createWatches(beginWatch, mutator, getComponent);
            await Promise.all(this.watches.map(w => w.load()));
            this.setState({ data: localData });
            localData = undefined;
        }

        private stopWatches() {
            this.watches.forEach(watch => watch.stop());
            this.watches = [];
        }
    }
}