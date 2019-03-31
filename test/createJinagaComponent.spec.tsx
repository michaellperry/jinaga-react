import { Jinaga, JinagaBrowser } from "jinaga";
import * as React from "react";
import { cleanup, render } from "react-testing-library";
import { jinagaContainer } from "../src/specifications/jinagaContainer";
import { Root } from "./model";
import { applicationMapping } from "./components/Application";

describe("Specification For", () => {
    var j: Jinaga;
    var root: Root;
    var Application: React.ComponentType<{ fact: Root | undefined, greeting: string }>;

    beforeEach(async () => {
        j = JinagaBrowser.create({});
        root = await j.fact(new Root("home"));
        Application = jinagaContainer(j, applicationMapping);
    });

    afterEach(cleanup);

    it("should initialize the component", async () => {
        const { findByTestId } = render(<Application fact={root} greeting="Shalom" />);
        const identifier = await findByTestId("identifier") as HTMLElement;
        expect(identifier).not.toBe(null);
    });
});