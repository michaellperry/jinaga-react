declare module 'react-hooks-testing-library';

export function renderHook<T>(render: () => T) : {
    result: { current: T },
    unmount: () => void
};