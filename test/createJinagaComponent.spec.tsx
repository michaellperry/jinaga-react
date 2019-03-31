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

    async function whenGetIdentifier() {
        return await whenGetTestValue("identifier");
    }

    async function whenGetName() {
        return await whenGetTestValue("name");
    }

    async function whenGetTestValue(testId: string) {
        const { findByTestId } = render(<Application fact={root} greeting="Hello" />);
        const identifier = await findByTestId(testId) as HTMLElement;
        return identifier.innerHTML;
    }
});