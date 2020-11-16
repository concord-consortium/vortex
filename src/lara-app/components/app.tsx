import React from "react";
import { useState } from "react";
import "firebase/firestore";
import "firebase/auth";

// TODO: Discuss how / when to use the S3 authoring selection component.
// import { LaraAuthoringComponent } from "../../authoring-app/components/lara-authoring";
import { AuthoringComponent as LaraAuthoringComponent} from "./authoring";
import { RuntimeComponent } from "./runtime";
import { inIframe } from "../utils/in-iframe";
import { useInteractiveApi } from "../hooks/interactive-api";

import css from "./app.module.scss";

interface IProps {
  defaultSectionIndex?: number;
}

export const AppComponent:React.FC<IProps> = ({defaultSectionIndex}) => {
  const [error, setError] = useState<any>();
  const {
    connectedToLara, initInteractiveData, experiment, previewMode, firebaseJWT, runKey, phone, setHeight, setDataset
  } = useInteractiveApi({setError});

  const renderMessage = (message: string) => <div className={css.message}>{message}</div>;

  const renderInIframe = () => {
    if (error) {
      return renderMessage(error.toString());
    }

    if (!connectedToLara || !initInteractiveData) {
      return renderMessage("Waiting to connect to LARA ...");
    }

    if (initInteractiveData.mode === "authoring") {
      return <LaraAuthoringComponent
        // TODO: Re-add authored state when S3 Authoring is ready.
        // authoredState={initInteractiveData.authoredState}
        experiment={experiment}
        phone={phone} />;
    }

    if (!experiment) {
      setError("No experiment set yet.  Please select an experiment in the authoring form.");
      return;
    }

    if (!previewMode) {
      if (!firebaseJWT) {
        return renderMessage("Waiting to connect to Firebase ...");
      }
    }

    return (
      <RuntimeComponent
        experiment={experiment}
        runKey={runKey}
        firebaseJWT={firebaseJWT}
        setDataset={setDataset}
        setError={setError}
        defaultSectionIndex={defaultSectionIndex}
        reportMode={initInteractiveData.mode === "report"}
        previewMode={previewMode}
        setHeight={setHeight}
      />
    );
  };

  const renderOutsideIframe = () => {
    return renderMessage("This application must be run within LARA.");
  };

  return (
    <div className={css.app}>
      {inIframe() ? renderInIframe() : renderOutsideIframe() }
    </div>
  );
};
