import React from "react";
import { shallow } from "enzyme";
import Demo from "../Demo";

describe("<Demo />", () => {
  it("should render", () => {
    shallow(<Demo />);
  });
});
