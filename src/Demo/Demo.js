import React from "react";

import Style from "./Demo.less";
import logo from "./react-logo.png";

export default class Demo extends React.Component {

  render() {
    return (
      <div className={Style.Demo}>
        <img src={logo} alt="React" />
        Welcome to React-on!
      </div>
    )
  }
}
