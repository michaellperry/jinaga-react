export interface StatefulComponent<S> {
    state: S;
    setState: (state: S) => void;
};

