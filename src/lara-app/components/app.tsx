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
}

export const AppComponent:React.FC<IProps> = () => {
  const [error, setError] = useState<any>();
  const {
    connectedToLara, initMessage, experiment, previewMode, firebaseJWT, runKey, setAuthoredState, setHeight, log, saveExperimentData, interactiveState
  } = useInteractiveApi({setError});

  const renderMessage = (message: string) => <div className={css.message}>{message}</div>;

  const renderInIframe = () => {
    if (error) {
      return renderMessage(error.toString());
    }

    if (!connectedToLara || !initMessage) {
      return renderMessage("Waiting to connect to Activity Player ...");
    }

    if (initMessage.mode === "authoring") {
      return <LaraAuthoringComponent
        // TODO: Re-add authored state when S3 Authoring is ready.
        // authoredState={initInteractiveData.authoredState}
        experiment={experiment}
        setAuthoredState={setAuthoredState} />;
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

    let defaultSectionIndex = experiment.schema.sections.findIndex(section => section.icon === "collect");
    if (defaultSectionIndex === -1) {
      // default to the second section (which was the previous default) is the the data collection section can't be found
      defaultSectionIndex = 1;
    }

    return (
      <RuntimeComponent
        experiment={experiment}
        runKey={runKey}
        firebaseJWT={firebaseJWT}
        saveExperimentData={saveExperimentData}
        interactiveState={interactiveState}
        setError={setError}
        defaultSectionIndex={defaultSectionIndex}
        reportMode={initMessage.mode === "report"}
        previewMode={previewMode}
        setHeight={setHeight}
        log={log}
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
