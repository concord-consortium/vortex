import React, { useState, useEffect } from "react";
import * as firebase from "firebase/app";
import "firebase/firestore";
import { Experiment } from "../../shared/components/experiment";
import { IExperiment, IExperimentData, IExperimentConfig } from "../../shared/experiment-types";
import { IFirebaseJWT } from "../hooks/interactive-api";

const QRCode = require("qrcode-svg");

import css from "./runtime.module.scss";

export interface IQRCodeContentV1 {
  version: "1.0.0";
  url: string;
}
export type IQRCodeContent = IQRCodeContentV1;

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
  const [displayQr, setDisplayQr] = useState(true);

  useEffect(() => {
    firebase
      .firestore()
      .collection(`runs/${runKey}/experiments`)
      .orderBy("createdAt", "desc")
      .limit(1)
      .onSnapshot(snapshot => {
        setQueriedFirestore(true);
        const newData = snapshot.docs[0]?.data?.().experiment?.data as IExperimentData | undefined;
        setExperimentData(newData);
        setDisplayQr(newData === undefined);
        // generate QR code
        const runData = Base64.encode(JSON.stringify(firebaseJWT.claims));
        const content = JSON.stringify({
          version: "1.0.0",
          url: `https://us-central1-vortex-e5d5d.cloudfunctions.net/saveExperimentRun?runKey=${runKey}&runData=${runData}`
        });
        setQRCode(new QRCode({
          content,
          ecl: "M", // default error correction level = M. Possible options are L, M, Q, H for low-high correction.
          join: true,
          container: "svg-viewbox"
        }).svg());
      }, (err) => {
        setError(err);
      });
  }, []);

  const handleUploadAgain = () => {
    setExperimentData(undefined);
    setDisplayQr(true);
  };

  const toggleDisplayQr = () => setDisplayQr(!displayQr);

  const renderData = () => {
    if (!queriedFirestore) {
      return <div>Looking for existing experiment data...</div>;
    }
    if (!qrCode) {
      return <div>Generating QR code...</div>;
    }
    const config: IExperimentConfig = {
      hideLabels: false,
      useSensors: false,
      showEditSaveButton: true,
      callbacks: {
        onImport: handleUploadAgain,
      }
    };

    return (
      <div className={`${css.experimentContainer}`}>
        <div className={css.runtimeExperiment}>
          <Experiment
            experiment={experiment}
            data={experimentData}
            config={config}
            defaultSectionIndex={defaultSectionIndex}
          />
        </div>
        {(displayQr && experimentData === undefined) &&
          <div className={css.qrContainer}>
            <div className={css.displayBox}>
              <div className={css.header}>Import experiment data from your mobile device</div>
              <div className={css.instructions}>
                <ol>
                  <li>Launch the <b>Concord Data Collector</b> app on your mobile device to view the <b>My Saved Experiments</b> section</li>
                  <li>Tap the <b>UPLOAD</b> button on your experiment. A camera view will open on your mobile device</li>
                  <li>Point your camera at the QR code below to begin importing. Once completed, your data will be displayed in this activity.</li>
                </ol>
              </div>
              <div className={css.qrcode}>
                <div dangerouslySetInnerHTML={{ __html: qrCode }} />
              </div>
              <div className={css.uploadResult}>[confirmation / error messaging]</div>
            <div className={css.footer}><div className={css.closeDialog} onClick={toggleDisplayQr}>Cancel</div></div>
            </div>
          </div>
        }
      </div>
    );
  };

  return (
    <div className={css.runtime}>
      {renderData()}
    </div>
  );
};
