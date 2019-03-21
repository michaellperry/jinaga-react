import React, { Component, ReactNode } from 'react';
import flow from 'lodash/fp/flow';
import map from 'lodash/fp/map';
import flatten from 'lodash/fp/flatten';
import forEach from 'lodash/forEach';
import JinagaContext from './jinagaProvider';

const connectJinaga = (config) => (WrappedComponent) =>
  class extends Component {
    static contextType = JinagaContext;

    static getDerivedStateFromProps(props, state) {
      if (!state) {
        this.state = config.specs.reduce(
          (vm, s) => s.initialize(config.model, vm),
          {});
      }
    }

    componentDidMount() {
      const { jinaga } = this.context;

      const beginWatch = (
        preposition,
        resultAdded,
        resultRemoved,
      ) => jinaga.watch(config.model, preposition, c => resultAdded(undefined, c), resultRemoved);

      const mutator = (_, transformer) => this.setState(transformer(this.state));

      this.watches = flow(
        map(spec => spec.createWatch(beginWatch, mutator)),
        flatten,
      )(config.specs);
    }

    componentWillUnmount() {
      forEach(this.watches, watch => watch.stop());
      this.watches = [];
    }

    render() {
      return <WrappedComponent {...this.props} {...this.state} />;
    }
  };
export { connectJinaga };