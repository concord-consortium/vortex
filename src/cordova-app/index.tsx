import React from "react";
import ReactDOM from "react-dom";

import { AppComponent } from "../mobile-app/components/app";

import "./index.scss";

document.addEventListener("deviceready", () => {
  ReactDOM.render(
    <AppComponent />,
    document.getElementById("app")
  );
});
