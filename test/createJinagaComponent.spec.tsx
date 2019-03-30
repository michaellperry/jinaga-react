import { Jinaga, JinagaBrowser } from "jinaga";
import { collection, field, mutable, projection, property, specificationFor, createJinagaComponent } from "../src";
import { Item, ItemDeleted, Name, Root, SubItem, SubSubItem } from "./model";
import { ApplicationState } from "./viewModel";
import * as React from "react";
import { applicationMapping } from "./view";
import { render, act, cleanup, configure, Matcher, MatcherOptions } from "react-testing-library";

describe("Application State", () => {
    var j: Jinaga;
    var root: Root;
    var Application: React.ComponentType<{ fact: Root | undefined }>;

    beforeEach(async () => {
        j = JinagaBrowser.create({});
        root = await j.fact(new Root("home"));
        Application = createJinagaComponent(j, applicationMapping);
    });

    afterEach(cleanup);

    it("should initialize the component", async () => {
        const { findByTestId } = render(<Application fact={root} />);
        const identifier = await findByTestId("identifier") as HTMLElement;
        expect(identifier).not.toBe(null);
    });

    it("should resolve fields", async () => {
        const identifier = await whenGetIdentifier();
        expect(identifier).toBe("home");
    })

    it("should resolve properties", async () => {
        await j.fact(new Name(new Root("home"), "Home", []));

        const name = await whenGetName();
        expect(name).toBe("Home");
    });

    it("should replace previous values", async () => {
        const root = await j.fact(new Root("home"));
        const first = await j.fact(new Name(root, "Home", []));
        await j.fact(new Name(root, "Modified", [ first ]));

        const name = await whenGetName();
        expect(name).toBe("Modified");
    });

    it("should take second value in a conflict", async () => {
        const root = await j.fact(new Root("home"));
        await j.fact(new Name(root, "Home", []));
        await j.fact(new Name(root, "Modified", []));

        const name = await whenGetName();
        expect(name).toBe("Modified");
    });
    
    it("should resolve mutable", async () => {
        await j.fact(new Name(new Root("home"), "Home", []));

        const nameWithConflicts = await whenGetNameWithConflicts();
        expect(nameWithConflicts).toBe("Home");
    });

    it("should replace previous value in mutable", async () => {
        const root = await j.fact(new Root("home"));
        const first = await j.fact(new Name(root, "Home", []));
        await j.fact(new Name(root, "Modified", [ first ]));

        const nameWithConflicts = await whenGetNameWithConflicts();
        expect(nameWithConflicts).toBe("Modified");
    });

    it("should apply resolver in a conflict", async () => {
        const root = await j.fact(new Root("home"));
        await j.fact(new Name(root, "Home", []));
        await j.fact(new Name(root, "Modified", []));

        const nameWithConflicts = await whenGetNameWithConflicts();
        expect(nameWithConflicts).toBe("Home, Modified");
    });

    it("should add to a collection", async () => {
        const item = await j.fact(new Item(new Root("home"), new Date()));

        const itemHash = await whenGetTestValue("item_hash");
        expect(itemHash).toBe(j.hash(item));
    });

    it("should remove from a collection", async () => {
        const item = await j.fact(new Item(new Root("home"), new Date()));
        await j.fact(new ItemDeleted(item));

        const { queryByTestId } = render(<Application fact={root} />);
        const element = await queryByTestId("item_hash");
        expect(element).toBe(null);
    });

    async function whenGetIdentifier() {
        return await whenGetTestValue("identifier");
    }

    async function whenGetName() {
        return await whenGetTestValue("name");
    }

    async function whenGetNameWithConflicts() {
        return await whenGetTestValue("nameWithConflicts");
    }

    async function whenGetTestValue(testId: string) {
        const { findByTestId } = render(<Application fact={root} />);
        const identifier = await findByTestId(testId) as HTMLElement;
        return identifier.innerHTML;
    }

    // it("should remove from a collection", async () => {
    //     const item = await j.fact(new Item(new Root("home"), new Date()));
    //     await j.fact(new ItemDeleted(item));
    //     expect(application.state.items.length).to.equal(0);
    // });

    // it("should resolve sub items", async () => {
    //     const item = await j.fact(new Item(new Root("home"), new Date()));
    //     await j.fact(new SubItem(item, new Date()));
    //     expect(application.state.items[0].subItems.length).to.equal(1);
    // });

    // it("should resolve fields of sub items", async () => {
    //     const item = await j.fact(new Item(new Root("home"), new Date()));
    //     const subItem = await j.fact(new SubItem(item, new Date()));
    //     expect(application.state.items[0].subItems[0].createdAt).to.equal(subItem.cretedAt);
    // });

    // it("should resolve sub sub items", async () => {
    //     const item = await j.fact(new Item(new Root("home"), new Date()));
    //     const subItem = await j.fact(new SubItem(item, new Date()));
    //     await j.fact(new SubSubItem(subItem, "reindeer flotilla"));
    //     expect(application.state.items[0].subItems[0].subSubItems[0].id).to.equal("reindeer flotilla");
    // });

    // it("should initialize projection", () => {
    //     expect(application.state.recycleBin).to.not.be.undefined;
    //     expect(application.state.recycleBin.deletedItems.length).to.equal(0);
    // });

    // it("should resolve projection", async () => {
    //     const item = await j.fact(new Item(new Root("home"), new Date()));
    //     await j.fact(new ItemDeleted(item));
    //     expect(application.state.recycleBin.deletedItems.length).to.equal(1);
    //     expect(application.state.recycleBin.deletedItems[0].fact).to.not.be.null;
    // });

    // it("should initialize child projections", async () => {
    //     const item = await j.fact(new Item(new Root("home"), new Date()));
    //     expect(application.state.items[0].madeUp.key).to.equal(j.hash(item));
    // });
});