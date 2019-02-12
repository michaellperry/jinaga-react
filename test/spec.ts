import { plus } from "../src/index";

import { expect } from "chai";

describe('Plus', () => {
    it('should add', () => {
        expect(plus(2,4)).to.equal(6);
    });
});