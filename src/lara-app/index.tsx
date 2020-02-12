import React from "react";
import ReactDOM from "react-dom";

import { AppComponent } from "./components/app";

import "./index.scss";

ReactDOM.render(
  <AppComponent defaultSectionIndex={1} />,
  document.getElementById("app")
);
