import React, { useState, useEffect, useRef } from "react";
import * as firebase from "firebase/app";
import "firebase/firestore";
import { Experiment } from "../../shared/components/experiment";
import { IExperiment, IExperimentData, IExperimentConfig } from "../../shared/experiment-types";
import { IRun } from "../../mobile-app/hooks/use-runs";
import { createCodeForExperimentRun, getSaveExperimentRunUrl } from "../../shared/api";
import { CODE_LENGTH } from "../../mobile-app/components/uploader";
import { getURLParam } from "../../shared/utils/get-url-param";
import ResizeObserver from "resize-observer-polyfill";
import { IDataset } from "@concord-consortium/lara-interactive-api";
const QRCode = require("qrcode-svg");
import { generateDataset } from "../utils/generate-dataset";
import css from "./runtime.module.scss";
import { IJwtClaims } from "@concord-consortium/lara-plugin-api";

const UPDATE_QR_INTERVAL = 1000 * 60 * 60;  // 60 minutes

export interface IQRCodeContentV1 {
  version: "1.0.0";
  url: string;
}
export interface IQRCodeContentV11 {
  version: "1.1.0";
  code: string;
}
export type IQRCodeContent = IQRCodeContentV1 | IQRCodeContentV11;

interface IProps {
  experiment: IExperiment;
  setDataset: (dataset: IDataset | null) => void;
  runKey?: string;
  firebaseJWT?: IJwtClaims;
  setError: (error: any) => void;
  defaultSectionIndex?: number;
  reportMode?: boolean;
  previewMode?: boolean;
  setHeight: (height: number) => void;
}

export const RuntimeComponent = ({
  experiment, runKey, firebaseJWT, setError, defaultSectionIndex, reportMode, previewMode, setHeight, setDataset
} : IProps) => {
  const [experimentData, setExperimentData] = useState<IExperimentData|undefined>();
  const [queriedFirestore, setQueriedFirestore] = useState(false);
  const [qrCode, setQRCode] = useState("");
  const [numericCode, setNumericCode] = useState("");
  const [displayQr, setDisplayQr] = useState(false);
  const experimentRef = useRef<IRun|undefined>();
  const lastCodeGenTime = useRef<number|undefined>();
  const displayingCode = useRef(false);
  const reportOrPreviewMode = reportMode || previewMode;
  const containerRef = useRef<HTMLDivElement|null>(null);

  const generateQRCode = (options: {runKey: string, firebaseJWT: IJwtClaims}) => {
    return createCodeForExperimentRun(options.runKey, options.firebaseJWT.claims).then(code => {
      const content = JSON.stringify({
        version: "1.1.0",
        code
      } as IQRCodeContent);
      setQRCode(new QRCode({
        content,
        ecl: "M", // default error correction level = M. Possible options are L, M, Q, H for low-high correction.
        join: true,
        container: "svg-viewbox",
        padding: 2
      }).svg());
      setNumericCode(code);
    });
  };

  const setDisplayQrAndMaybeRegenerateQR = (value: boolean) => {
    if (value && runKey && firebaseJWT) {
      if ((lastCodeGenTime.current === undefined) || (Date.now() - lastCodeGenTime.current > UPDATE_QR_INTERVAL)) {
        setQRCode("");
        setNumericCode("");
        setDisplayQr(true);
        setTimeout(() => generateQRCode({runKey, firebaseJWT}).then(() => lastCodeGenTime.current = Date.now()), 1);
      } else {
        setDisplayQr(true);
      }
    } else {
      setDisplayQr(false);
    }
    displayingCode.current = value;
  };

  // Get experiment data when loaded.  This is only run once when the component mounts and
  // does not depend on a changing runKey (it will either be set or not set when this component
  // is initially loaded).  However in case the component is loaded in a different way in the
  // future a dependency on runKey was added.
  useEffect(() => {
    if (runKey && !previewMode) {
      firebase
        .firestore()
        .collection(`runs/${runKey}/experiments`)
        .orderBy("createdAt", "desc")
        .limit(1)
        .onSnapshot(snapshot => {
          setQueriedFirestore(true);
          experimentRef.current = snapshot.docs[0]?.data?.().experiment;
          const newData = experimentRef.current?.data as IExperimentData | undefined;
          setExperimentData(newData);
          if (newData) {
            // This will generate dataset and send it to parent window using LARA Interactive API. Dataset is used
            // by the graph interactive. Note that the mobile app import saves data directly in Firestore, so this
            // listener is the only place where we have a chance to catch this data update, generate dataset,
            // and finally send it to ActivityPlayer.
            setDataset(generateDataset(newData, experiment));
          }

          // if there is no data force an upload - DISABLED FOR NOW
          // setDisplayQrAndMaybeRegenerateQR((newData === undefined) && !reportOrPreviewMode);
        }, (err) => {
          setError(err);
        });
    }
  }, [runKey, previewMode]);

  // re-generate QR code if showing
  useEffect(() => {
    const interval = setInterval(() => {
      if (displayingCode.current && !reportOrPreviewMode && runKey && firebaseJWT) {
        generateQRCode({runKey, firebaseJWT});
      }
    }, UPDATE_QR_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let ro: ResizeObserver;

    if (containerRef.current) {
      const checkHeight = () => {
        const {height} = containerRef.current ? containerRef.current.getBoundingClientRect() : { height: 0 };
        if (height > 0) {
          setHeight(height);
        }
      };

      ro = new ResizeObserver(checkHeight);
      ro.observe(containerRef.current);
    }

    return () => ro?.disconnect();
  }, [containerRef.current]);

  const handleUploadAgain = () => {
    setExperimentData(undefined);
    setDisplayQrAndMaybeRegenerateQR(true);
    displayingCode.current = true;
  };

  const toggleDisplayQr = () => setDisplayQrAndMaybeRegenerateQR(!displayQr);

  const handleSaveData = (data: IExperimentData) => {
    // no runKey or firebaseJWT in preview mode - need to check these explicitly to make typescript happy
    if (reportOrPreviewMode || !runKey || !firebaseJWT) {
      // Dataset is usually generated in the Firestore #onSnapshot handler, but the preview mode doesn't use Firestore.
      // Generate it manually, so authors can see the connection between Vortex and the graph interactive.
      setDataset(generateDataset(data, experiment));
      return;
    }

    // use the current run from Firestore or if there isn't one create a new one
    const experimentRun = experimentRef.current ? Object.assign({}, experimentRef.current, {data}) : {
      data,
      experiment,
      experimentIdx: 1,
      key: Date.now().toString()
    };
    fetch(getSaveExperimentRunUrl(runKey, firebaseJWT.claims), {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({experiment: experimentRun})
    })
    .catch(err => alert(err.toString()));
  };

  const renderData = () => {
    if (!previewMode && !queriedFirestore) {
      return <div>Looking for existing experiment data...</div>;
    }
    const enableSensor = (!reportMode && !!getURLParam("enableSensor"));
    const config: IExperimentConfig = {
      hideLabels: false,
      useSensors: enableSensor,
      showShowSensorButton: enableSensor,
      showEditSaveButton: !reportMode,
      showCameraButton: !reportMode,
      minCameraWidth: 300,
      minCameraHeight: 300
    };

    const showQrContainer = displayQr && experimentData === undefined;

    // NOTE: this is a bit of a hack.  The QR container is absolutely positioned so when
    // it is displayed it does not alter the height of its parent element.  I tried adding
    // a ref on the QR container along with a resize observer on that ref but it also did
    // not return the correct height.  The 675 pixel height leaves room at the bottom of the
    // display in case the app name (which is displayed) gets longer and increases the height
    // of the container changes
    const height = showQrContainer ? 675 : "auto";

    return (
      <div style={{height}}>
        {!previewMode ? undefined :
          <div className={css.previewModeNotice}>
            You are viewing a preview of the activity. <strong>NO DATA IS BEING SAVED!</strong>
          </div>}
        {reportOrPreviewMode ? undefined :
          <div className={css.topBar}>
            <div className={css.button} onClick={handleUploadAgain}>Import</div>
          </div>}
        <div className={css.runtimeExperiment}>
          <Experiment
            experiment={experiment}
            data={experimentData}
            config={config}
            defaultSectionIndex={defaultSectionIndex}
            onDataChange={handleSaveData}
          />
        </div>
        {showQrContainer &&
          <div className={css.qrContainer}>
            <div className={css.displayBox}>
              { false && "NOTE TO DEVS: if you change the text in this container you may need to change the height const and check it in the Activity Player / Lara"}
              <div className={css.header}>Import experiment data from your mobile device</div>
              <div className={css.instructions}>
                <ol>
                  <li>Launch the <b>Monitor Your World</b> app on your mobile device to view the <b>My Saved Experiments</b> section.</li>
                  <li>Tap the <b>UPLOAD</b> button on your experiment and follow the directions to upload your experiment from your device.</li>
                </ol>
              </div>
              {numericCode.length > 0 ? <div className={css.numericCode}>{CODE_LENGTH} Digit Code: {numericCode}</div> : undefined}
              <div className={css.qrcode}>
                {qrCode.length > 0 ? <div dangerouslySetInnerHTML={{ __html: qrCode }} /> : <div className={css.generatingCode}>Generating codes...</div>}
              </div>
            <div className={css.footer}><div className={css.closeDialog} onClick={toggleDisplayQr}>Cancel</div></div>
            </div>
          </div>
        }
      </div>
    );
  };

  return (
    <div className={css.runtime} ref={containerRef}>
      {renderData()}
    </div>
  );
};
