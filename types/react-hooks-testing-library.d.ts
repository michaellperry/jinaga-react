declare module 'react-hooks-testing-library';

export function renderHook<T, P>(render: () => T) : {
    result: { current: T },
    unmount: () => void,
    rerender: () => void
};

export function renderHook<T, P>(render: (props: P) => T, options: { initialProps: P }) : {
    result: { current: T },
    unmount: () => void,
    rerender: (newProps: P) => void
};