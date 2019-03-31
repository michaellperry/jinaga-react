import { Jinaga, JinagaBrowser } from "jinaga";
import * as React from "react";
import { cleanup, render } from "react-testing-library";
import { createJinagaComponent } from "../src/specifications/createJinagaComponent";
import { Root } from "./model";
import { applicationMapping } from "./components/Application";

describe("Specification For", () => {
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
});