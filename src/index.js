import "babel-polyfill";
import React from "react";
import ReactDOM from "react-dom";
import TVGuide from "./EPG/components/TVGuide";


ReactDOM.render(<TVGuide />, document.getElementById("react-app"));

if(module.hot) {
  module.hot.accept();
}
