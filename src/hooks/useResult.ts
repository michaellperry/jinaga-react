import { Jinaga, Preposition, Watch } from 'jinaga';
import * as React from 'react';

import { Transformer, WatchContext } from '../specifications/declaration';
import { Specification } from '../specifications/mapping';
import { createStore, Store, StorePath } from '../store/store';

export function useResult<M, VM>(j: Jinaga, fact: M | null, specification: Specification<M, VM>): VM | null {
  const [ store, setStore ] = React.useState<Store | null>(null);
  const [ loaded, setLoaded ] = React.useState<boolean>(false);

  React.useEffect(() => {
    setLoaded(false);
    if (fact === null) {
      setStore(null);
      return () => {};
    }

    setStore(initializeStore(fact, specification));
    const watches = startWatches(j, fact, specification, setStore);
    Promise.all(watches.map(w => w.load())).then(() => {
      setLoaded(true);
    });
    return () => {
      stopWatches(watches);
    };
  }, [fact]);

  const vm = (store && loaded) ? specification.getMappingValue(store) : null;
  return vm;
}

function initializeStore<M, VM>(fact: M, specification: Specification<M, VM>): Store {
  return createStore(
    specification.initialMappingState(fact, []),
    specification.initialMappingItems(fact, [])
  );
}

function startWatches<M, VM>(
  j: Jinaga,
  fact: M,
  specification: Specification<M, VM>,
  setStore: React.Dispatch<React.SetStateAction<Store | null>>
): Watch<M, WatchContext>[] {
  if (!fact) {
    return [];
  }

  const mutator = (transformer: Transformer<Store>) => {
    setStore(s => s === null ? null : transformer(s));
  };

  function beginWatch<U>(
      preposition: Preposition<M, U>,
      resultAdded: (path: StorePath, child: U) => WatchContext
  ) {
      return j.watch(fact, preposition, c => resultAdded([], c), f => f.resultRemoved());
  }

  return specification.createMappingWatches(beginWatch, mutator);
}

function stopWatches<M>(watches: Watch<M, WatchContext>[]) {
  watches.forEach(watch => watch.stop());
}