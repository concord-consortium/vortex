import React, { useState, useEffect } from "react";
import * as firebase from "firebase/app";
import "firebase/firestore";
import { Experiment } from "../../shared/components/experiment";
import { IExperiment, IExperimentData } from "../../shared/experiment-types";
import { IFirebaseJWT } from "../hooks/interactive-api";

const QRCode = require("qrcode-svg");

import css from "./runtime.module.scss";

interface IProps {
  experiment: IExperiment;
  runKey: string;
  firebaseJWT: IFirebaseJWT;
  setError: (error: any) => void;
  defaultSectionIndex?: number;
}

export const RuntimeComponent = ({experiment, runKey, firebaseJWT, setError, defaultSectionIndex} : IProps) => {
  const [experimentData, setExperimentData] = useState<IExperimentData|undefined>();
  const [queriedFirestore, setQueriedFirestore] = useState(false);
  const [qrCode, setQRCode] = useState("");
  const [manualEntry, setManualEntry] = useState(false);
  const [splitscreen, setSplitscreen] = useState(true);

  useEffect(() => {
    firebase
      .firestore()
      .collection(`runs/${runKey}/experiments`)
      .orderBy("createdAt", "desc")
      .limit(1)
      .onSnapshot(snapshot => {
        setQueriedFirestore(true);
        setExperimentData(snapshot.docs[0]?.data?.().data as IExperimentData | undefined);

        // generate QR code
        const runData = Base64.encode(JSON.stringify(firebaseJWT.claims));
        const url = `https://us-central1-vortex-e5d5d.cloudfunctions.net/saveExperimentRun?runKey=${runKey}&runData=${runData}`;
        setQRCode(new QRCode({
          content: url,
          width: 400,
          height: 400,
        }).svg());
      }, (err) => {
        setError(err);
      });
  }, []);

  const handleManualEntry = () => setManualEntry(true);
  const handleUploadAgain = () => setExperimentData(undefined);
  const toggleSplitscreen = () => setSplitscreen(!splitscreen);

  const renderNoData = () => {
    if (!queriedFirestore) {
      return <div>Looking for existing experiment data...</div>;
    }
    if (!qrCode) {
      return <div>Generating QR code...</div>;
    }

    return (
      <>
        <div className={css.header}>Upload Your Data</div>
        <div className={css.qrcode}>
          <div dangerouslySetInnerHTML={{__html: qrCode}} />
        </div>
        <div><button onClick={handleManualEntry}>(manually enter data)</button></div>
      </>
    );
  };

  const renderData = (data?: IExperimentData) => {
    return (
      <div className={`${css.experimentContainer} ${splitscreen ? css.left : ""}`}>
        <div className={css.runtimeExperiment}>
          <Experiment
            experiment={experiment}
            data={data}
            config={{hideLabels: false, useSensors: false}}
            defaultSectionIndex={defaultSectionIndex}
          />
          <div><button onClick={handleUploadAgain}>(upload again)</button><button onClick={toggleSplitscreen}>(toggle QR code)</button></div>
        </div>
        <div className={`${css.qrContainer} ${splitscreen ? css.right : ""}`}>
          <div className={css.header}>Scan the code to upload your data</div>
          <div className={css.qrcode}>
            <div dangerouslySetInnerHTML={{__html: qrCode}} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={css.runtime}>
      {experimentData || manualEntry ? renderData(experimentData) : renderNoData()}
    </div>
  );
};
