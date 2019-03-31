import { Jinaga, JinagaBrowser } from "jinaga";
import * as React from "react";
import { cleanup, render } from "react-testing-library";
import { jinagaContainer } from "../src/specifications/jinagaContainer";
import { Root, Name } from "./model";
import { applicationMapping } from "./components/Application";

describe("Specification For", () => {
    var j: Jinaga;
    var root: Root;
    var Application: React.ComponentType<{ fact: Root | null, greeting: string }>;

    beforeEach(async () => {
        j = JinagaBrowser.create({});
        root = await j.fact(new Root("home"));
        Application = jinagaContainer(j, applicationMapping);
    });

    afterEach(cleanup);

    it("should pass through properties", async () => {
        const { findByTestId } = render(<Application fact={root} greeting="Shalom" />);
        const identifier = await findByTestId("greeting") as HTMLElement;
        expect(identifier.innerHTML).toBe("Shalom");
    });

    it("should resolve fields", async () => {
        const identifier = await whenGetIdentifier();
        expect(identifier).toBe("home");
    });

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
        const { findByTestId } = render(<Application fact={root} greeting="Hello" />);
        const identifier = await findByTestId(testId) as HTMLElement;
        return identifier.innerHTML;
    }
});