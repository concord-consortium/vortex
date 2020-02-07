import React from "react";
import { useState } from "react";
import { Base64 } from "js-base64";
import "firebase/firestore";
import "firebase/auth";

import { AuthoringComponent } from "./authoring";
import { RuntimeComponent } from "./runtime";
import { inIframe } from "../utils/in-iframe";
import { useInteractiveApi } from "../hooks/interactive-api";

import css from "./app.module.scss";

export const AppComponent = () => {
  const [error, setError] = useState<any>();
  const {connectedToLara, initInteractiveData, experiment, firebaseJWT, phone} = useInteractiveApi({setError});

  const renderInIframe = () => {
    if (error) {
      return <div className={css.error}>{error.toString()}</div>;
    }

    if (!connectedToLara || !initInteractiveData) {
      return <div>Waiting to connect to LARA ...</div>;
    }

    if (initInteractiveData.mode === "authoring") {
      return <AuthoringComponent experiment={experiment} phone={phone} />;
    }

    if (!initInteractiveData.interactiveStateUrl) {
      setError("No preview available ...");
      return;
    }

    if (!experiment) {
      setError("No experiment set yet.  Please select an experiment in the authoring form.");
      return;
    }

    if (!firebaseJWT) {
      return <div>Waiting to connect to Firebase ...</div>;
    }

    return (
      <RuntimeComponent
        experiment={experiment}
        runKey={Base64.encode(initInteractiveData.interactiveStateUrl)}
        firebaseJWT={firebaseJWT}
        setError={setError}
      />
    );
  };

  const renderOutsideIframe = () => {
    return (
      <>
        <div className={css.note}>
          This application must be run within LARA.
        </div>
      </>
    );
  };

  return (
    <div className={css.app}>
      {inIframe() ? renderInIframe() : renderOutsideIframe() }
    </div>
  );
};
