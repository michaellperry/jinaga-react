import { expect } from "chai";
import { JinagaBrowser } from "jinaga";
import { property, useJinaga } from "../src/index";
import { Name, Root } from "./model";
import { ApplicationState } from "./viewModel";
import { renderHook } from "react-hooks-testing-library";
import { JSDOM } from "jsdom";

const { window } = new JSDOM('<!doctype html><html><body></body></html>');
// @ts-ignore
global['document'] = window.document;
// @ts-ignore
global['window'] = window;

describe('useJinaga', () => {
    it('should initialize state', async () =>{
        const j = JinagaBrowser.create({});
        const root = await j.fact(new Root('home'));
        const { result } = renderHook(() => useJinaga<Root, ApplicationState>(root,j, [
            property('name', j.for(Name.inRoot), n => n.value, 'initial name')
        ]));

        expect(result.current.name).to.equal('initial name');
    });
});