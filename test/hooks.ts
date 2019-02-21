import { expect } from "chai";
import { JinagaBrowser } from "jinaga";
import { JSDOM } from "jsdom";
import { renderHook } from "react-hooks-testing-library";
import { collection, field, property, useJinaga } from "../src/index";
import { Item, Name, Root } from "./model";
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
        const { result } = renderHook(() => useJinaga<Root, ApplicationState>(root,j, [
            property('name', j.for(Name.inRoot), n => n.value, 'initial name')
        ]));

        expect(result.current.name).to.equal('initial name');
    });

    it('should initialize children', async () => {
        const j = JinagaBrowser.create({});
        const root = await j.fact(new Root('home'));
        const { result } = renderHook(() => useJinaga<Root, ApplicationState>(root,j, [
            collection('items', j.for(Item.inRoot), i => i.key, [
                field('key', i => j.hash(i))
            ])
        ]));
        await j.fact(new Item(root, new Date()));

        expect(result.current.items.length).to.equal(1);
        expect(result.current.items[0].key).to.not.be.null;
        expect(result.current.items[0].key).to.not.equal('');
    });
});