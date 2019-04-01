import { Transformer } from "../specifications/declaration";

type HashMap = {
    [key: string]: any
}

interface StoreItem {
    hash: string;
    orderBy: any;
    data: HashMap;
    items: { [collectionName: string]: StoreItem[] };
}

export interface Store {
    data: HashMap;
    items: { [collectionName: string]: StoreItem[] };
}

export function createStore(data: HashMap): Store {
    return {
        data,
        items: {}
    };
}

export type StorePath = {
    collectionName: string;
    hash: string;
}[];

function findItems(s: StoreItem | null, key: string) {
    return s ? s.items[key]: null;
}

function findItem(items: StoreItem[] | null, hash: string) {
    return items ? items.find(i => i.hash === hash) || null : null;
}

function findStoreItem(path: StorePath, store: Store | null) {
    return path.reduce(
        (s, p) => findItem(findItems(s, p.collectionName), p.hash),
        store as StoreItem | null);
}

export function getStoreData(store: Store | null, path: StorePath): HashMap | null {
    const item = findStoreItem(path, store);
    return item ? item.data : null;
}

export function getStoreItems(store: Store | null, path: StorePath, collectionName: string) {
    return findItems(findStoreItem(path, store), collectionName) || [];
}

export function combineStorePath(path: StorePath, collectionName: string, hash: string) {
    return [ ...path, { collectionName, hash } ];
}

function transformStoreItem(path: StorePath, transformer: Transformer<StoreItem>): Transformer<Store> {
    const t = path.reduceRight((t,p) => (storeItem: StoreItem) => {
        const items = storeItem.items[p.collectionName];
        if (!items) {
            return storeItem;
        }
        else {
            return {
                ...storeItem,
                items: {
                    ...storeItem.items,
                    [p.collectionName]: items.map(item => item.hash === p.hash
                        ? t(item)
                        : item)
                }
            };
        }
    }, transformer);
    return store => t(store as StoreItem) as Store;
}

export function setStoreData(path: StorePath, transformer: Transformer<HashMap>) {
    return transformStoreItem(path, storeItem => ({
        ...storeItem,
        data: transformer(storeItem.data)
    }));
}

export function setStoreOrderBy(path: StorePath, transformer: Transformer<any>, comparer: (a: any, b: any) => number) {
    const parentPath = path.slice(0, path.length-1);
    const { hash, collectionName } = path[path.length-1];
    return transformStoreItem(parentPath, storeItem => {
        const items = storeItem.items[collectionName] || [];
        return {
            ...storeItem,
            items: {
                ...storeItem.items,
                [collectionName]: items
                    .map(item => item.hash === hash
                        ? { ...item, orderBy: transformer(item.orderBy) }
                        : item)
                    .sort((a,b) => comparer(a.orderBy, b.orderBy))
            }
        };
    });
}

export function setFieldValue<T>(fieldName: string, transformer: Transformer<T>): Transformer<HashMap> {
    return data => ({
        ...data,
        [fieldName]: transformer(data[fieldName])
    });
}

export function addStoreItem(path: StorePath, collectionName: string, hash: string, data: HashMap, orderBy: any, comparer: (a: any, b: any) => number | null) {
    function sort(items: StoreItem[]) {
        return comparer ? items.sort((a,b) => comparer(a.orderBy, b.orderBy)) : items;
    }
    return transformStoreItem(path, storeItem => {
        const items = storeItem.items[collectionName] || [];
        return {
            ...storeItem,
            items: {
                ...storeItem.items,
                [collectionName]: sort([
                    ...items,
                    {
                        hash,
                        data,
                        orderBy,
                        items: {}
                    }
                ])
            }
        };
    });
}

export function removeStoreItem(path: StorePath, collectionName: string, hash: string) {
    return transformStoreItem(path, storeItem => {
        const items = storeItem.items[collectionName];
        if (!items) {
            return storeItem;
        }
        else {
            return {
                ...storeItem,
                items: {
                    ...storeItem.items,
                    [collectionName]: items.filter(i => i.hash !== hash)
                }
            };
        }
    });
}