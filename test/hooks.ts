import { expect } from "chai";
import { JinagaBrowser } from "jinaga";
import { JSDOM } from "jsdom";
import { renderHook } from "react-hooks-testing-library";
import { collection, field, property, useJinaga } from "../src";
import { ascending } from "../src/collection";
import { Item, Name, Root, ItemDescription } from "./model";
import { ApplicationState } from "./viewModel";

const { window } = new JSDOM('<!doctype html><html><body></body></html>');
// @ts-ignore
global['document'] = window.document;
// @ts-ignore
global['window'] = window;

describe('useJinaga', () => {
    it('should initialize state', async () => {
        const j = JinagaBrowser.create({});
        const root = await j.fact(new Root('home'));
        const { result, unmount } = renderHook(() => useJinaga<Root, ApplicationState>(j, root, [
            property('name', j.for(Name.inRoot), n => n.value, 'initial name')
        ]));

        expect(result.current.name).to.equal('initial name');

        unmount();
    });

    it('should initialize children', async () => {
        const j = JinagaBrowser.create({});
        const root = await j.fact(new Root('home'));
        const { result, unmount } = renderHook(() => useJinaga<Root, ApplicationState>(j, root, [
            collection('items', j.for(Item.inRoot), i => i.key, [
                field('key', i => j.hash(i))
            ])
        ]));

        expect(result.current.items.length).to.equal(0);

        await j.fact(new Item(root, new Date()));

        expect(result.current.items.length).to.equal(1);
        expect(result.current.items[0].key).to.not.be.null;
        expect(result.current.items[0].key).to.not.equal('');

        unmount();
    });

    it('should update a property', async () => {
        const j = JinagaBrowser.create({});
        const root = await j.fact(new Root('home'));
        const { result, unmount } = renderHook(() => useJinaga<Root, ApplicationState>(j, root, [
            property('name', j.for(Name.inRoot), n => n.value, '')
        ]));

        const first = await j.fact(new Name(root, 'Bandersnatch', []));
        expect(result.current.name).to.equal('Bandersnatch');

        await j.fact(new Name(root, 'Jabberwocky', [first]));
        expect(result.current.name).to.equal('Jabberwocky');

        unmount();
    });

    it('should stop watching when unmounted', async () => {
        const j = JinagaBrowser.create({});
        const root = await j.fact(new Root('home'));
        const { result, unmount } = renderHook(() => useJinaga<Root, ApplicationState>(j, root, [
            property('name', j.for(Name.inRoot), n => n.value, '')
        ]));

        const first = await j.fact(new Name(root, 'Bandersnatch', []));
        expect(result.current.name).to.equal('Bandersnatch');

        unmount();
        await j.fact(new Name(root, 'Jabberwocky', [first]));
        expect(result.current.name).to.equal('Bandersnatch');
    });

    it('should reset when model changes', async () => {
        const j = JinagaBrowser.create({});
        const root = await j.fact(new Root('home'));
        const { result, unmount, rerender } = renderHook(({ root }) =>
            useJinaga<Root, ApplicationState>(j, root, [
                collection('items', j.for(Item.inRoot), i => i.key, [
                    field('key', i => j.hash(i))
                ])
            ]),
            { initialProps: { root } });

        expect(result.current.items.length).to.equal(0);

        await j.fact(new Item(root, new Date()));
        expect(result.current.items.length).to.equal(1);

        const newRoot = await j.fact(new Root('away'));
        rerender({ root: newRoot });
        expect(result.current.items.length).to.equal(0);

        await j.fact(new Item(root, new Date()));
        expect(result.current.items.length).to.equal(0);

        await j.fact(new Item(newRoot, new Date()));
        expect(result.current.items.length).to.equal(1);

        unmount();
    });

    it('should sort based on immutable field', async () => {
        const j = JinagaBrowser.create({});
        const root = await j.fact(new Root('home'));
        const { result, unmount } = renderHook(() =>
            useJinaga<Root, ApplicationState>(j, root, [
                collection('items', j.for(Item.inRoot), i => i.key, ascending(i => i.fact.createdAt), [
                    field('key', i => j.hash(i)),
                    field('fact', i => i)
                ])
            ]));

        await j.fact(new Item(root, new Date('2019-02-25T10:35:00.000Z')));
        await j.fact(new Item(root, new Date('2019-02-25T10:30:00.000Z')));

        expect(result.current.items[0].fact.createdAt).to.equal('2019-02-25T10:30:00.000Z');
        expect(result.current.items[1].fact.createdAt).to.equal('2019-02-25T10:35:00.000Z');

        unmount();
    });

    it('should sort based on mutable property', async () => {
        const j = JinagaBrowser.create({});
        const root = await j.fact(new Root('home'));
        const { result, unmount } = renderHook(() =>
            useJinaga<Root, ApplicationState>(j, root, [
                collection('items', j.for(Item.inRoot), i => i.key, ascending(i => i.description), [
                    field('key', i => j.hash(i)),
                    field('fact', i => i),
                    property('description', j.for(ItemDescription.ofItem), d => d.value, '')
                ])
            ]));

        const item1 = await j.fact(new Item(root, new Date('2019-02-25T10:35:00.000Z')));
        await j.fact(new ItemDescription(item1, 'Bravo', []));
        const item2 = await j.fact(new Item(root, new Date('2019-02-25T10:30:00.000Z')));
        const description2 = await j.fact(new ItemDescription(item2, 'Alpha', []));

        expect(result.current.items[0].fact.createdAt).to.equal('2019-02-25T10:30:00.000Z');
        expect(result.current.items[1].fact.createdAt).to.equal('2019-02-25T10:35:00.000Z');

        await j.fact(new ItemDescription(item2, 'Charley', [description2]));

        expect(result.current.items[0].fact.createdAt).to.equal('2019-02-25T10:35:00.000Z');
        expect(result.current.items[1].fact.createdAt).to.equal('2019-02-25T10:30:00.000Z');

        unmount();
    });
});