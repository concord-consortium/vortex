import * as React from "react";
import { useState } from "react";
import { Scanner } from "./scanner";
import { Initials } from "../../shared/components/initials";
import { RunInfoComponent } from "./run-info";
import { IRun } from "../hooks/use-runs";
import { IPhotoOrNote } from "../../shared/components/photo-or-note-field";
import { getSaveExperimentRunUrlForCode } from "../../shared/api";
import { IQRCodeContent } from "../../lara-app/components/runtime";

import css from "./uploader.module.scss";

const CODE_LENGTH = 6;

export enum UploadState {
  Scanning,
  EnteringCode,
  RetrievingUrl,
  Uploading,
  UploadFailed,
  Uploaded
}

export enum UploaderMode {
  ScanQR,
  EnterCode
}

interface IProps {
  run: IRun;
  onClose: () => void;
  saveUploadedRun: (run: IRun) => void;
}

export const Uploader = (props: IProps) => {
  const [uploadState, setUploadState] = useState<UploadState>(UploadState.EnteringCode);
  const [uploadError, setUploadError] = useState<any|undefined>();
  const [uploaderMode, setUploaderMode] = useState<UploaderMode>(UploaderMode.EnterCode);
  const [code, setCode] = useState<string>("");

  const changeState = (newState: UploadState, err?: any) => {
    setUploadState(newState);
    setUploadError(err);
  };

  const handleUploadExperiment = (qrData: IQRCodeContent) => {
    changeState(UploadState.Uploading);

    let promise = Promise.resolve();

    const getUrl = new Promise<string>((resolve, reject) => {
      if (qrData.version === "1.0.0") {
        resolve(qrData.url);
      } else {
        setUploadState(UploadState.RetrievingUrl);
        getSaveExperimentRunUrlForCode(qrData.code)
          .then(url => {
            changeState(UploadState.Uploading);
            resolve(url);
          })
          .catch(reject);
      }
    });

    const sendPostRequest = (body: any) => {
      return getUrl
        .then(url => {
          const fetchOptions: RequestInit = {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
          };
          return fetch(url, fetchOptions);
        });
    };

    // save all photos first
    let remotePhotoUrlsChanged = false;
    const photos = props.run.data.photo as IPhotoOrNote[] || [];
    if (photos.length > 0) {
      const uploadPhoto = (localPhotoUrl: string) => {
        return new Promise<string>((resolve, reject) => {
          return sendPostRequest({localPhotoUrl})
            .then((resp) => resp.json())
            .then(json => {
              if (json.success) {
                resolve(json.result);
              } else {
                reject(json.result);
              }
            });
        });
      };

      photos.map(photo => {
        if (photo.localPhotoUrl) {
          if (!photo.remotePhotoUrl) {
            promise = promise.then(() => {
              if (uploadState !== UploadState.UploadFailed) {
                return uploadPhoto(photo.localPhotoUrl)
                  .then((remotePhotoUrl) => {
                    photo.remotePhotoUrl = remotePhotoUrl;
                    remotePhotoUrlsChanged = true;
                  })
                  .catch((err) => {
                    changeState(UploadState.UploadFailed, err);
                  });
                }
            });
          }
        }
      });
    }

    promise = promise.then(() => {
      // clear the localPhoto urls as they are large data uris before uploading
      const savedLocalPhotoUrls = photos.map(photo => {
        const savedUrl = photo.localPhotoUrl;
        photo.localPhotoUrl = "";
        return savedUrl;
      });

      if (uploadState !== UploadState.UploadFailed) {
        return sendPostRequest({experiment: props.run})
          .then((resp) => resp.json())
          .then(json => {
            if (json.success) {
              changeState(UploadState.Uploaded);
            } else {
              changeState(UploadState.UploadFailed, json.result);
            }
          })
          .catch((err) => {
            changeState(UploadState.UploadFailed, err);
          })
          .finally(() => {
            // restore the urls
            photos.forEach((photo, index) => {
              photo.localPhotoUrl = savedLocalPhotoUrls[index];
            });
            // and save the run locally if the remote urls changed
            if (remotePhotoUrlsChanged) {
              props.saveUploadedRun(props.run);
            }
          });
      }
    });
  };

  const handleSelectScanQRMode = () => {
    setUploadState(UploadState.Scanning);
    setUploaderMode(UploaderMode.ScanQR);
  };
  const handleSelectEnterCodeMode = () => {
    setUploadState(UploadState.EnteringCode);
    setUploaderMode(UploaderMode.EnterCode);
  };

  const renderCodeEntry = () => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.trim();
      const numericValue = parseInt(value, 10);
      const isValidNumber = (value.length === 0) || (!isNaN(numericValue) && (numericValue >= 0));
      const isUnderOrAtMax = value.length <= CODE_LENGTH;
      if (isValidNumber && isUnderOrAtMax) {
        setCode(value);
      }
    };
    const isValidCode = () => (code.length === CODE_LENGTH) && !isNaN(parseInt(code, 10));
    const handleUpload = () => {
      if (isValidCode()) {
        handleUploadExperiment({version: "1.1.0", code});
      }
    };
    return (
      <div className={css.codeEntry}>
        <input type="number" value={code} onChange={handleChange} placeholder={`${CODE_LENGTH} digit code ...`}/>
        <button disabled={!isValidCode()} onClick={handleUpload}>Upload Experiment</button>
      </div>
    );
  };

  const renderDataEntry = () => {
    const handleClick = (callback: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      callback();
    };

    const handleTryAgain = handleClick(() => {
      changeState(uploaderMode === UploaderMode.EnterCode ? UploadState.EnteringCode : UploadState.Scanning);
    });
    const button = (label: string) => <button onClick={handleTryAgain} style={{marginTop: 10}}>{label}</button>;

    switch (uploadState) {
      case UploadState.EnteringCode:
        return renderCodeEntry();

      case UploadState.RetrievingUrl:
        return <div>Checking code ...</div>;

      case UploadState.Scanning:
        return <Scanner onScanned={handleUploadExperiment} />;

      case UploadState.Uploading:
        return <div>Uploading experiment ...</div>;

      case UploadState.UploadFailed:
        return (
          <>
            <div className="error">Upload failed!</div>
            <div>{uploadError ? uploadError.toString() : "No error info available!"}</div>
            {button("Try again...")}
          </>
        );

      case UploadState.Uploaded:
        return <div>Your experiment has been uploaded</div>;
    }
  };

  const renderScanQR = () => {
    return <>
      <div className={css.instructions}>
        <ol>
          <li>In the activity, click the Import button.</li>
          <li>Point your camera at the QR code.</li>
          <li>Tap the picture when the QR code is lined up within the green guides.</li>
        </ol>
      </div>
      <div className={css.scanner}>
        <div className={css.scanGuide} />
        <div className={css.camera}>{renderDataEntry()}</div>
      </div>
    </>;
  };

  const renderEnterCode = () => {
    return <>
      <div className={css.instructions}>
        <ol>
          <li>In the activity, click the Import button.</li>
          <li>Type the {CODE_LENGTH} digit code into the form below.</li>
          <li>Click the "Upload Experiment" button.</li>
        </ol>
      </div>
      <div className={css.enterCode}>{renderDataEntry()}</div>
    </>;
  };

  return (
    <div className={css.uploader}>
      <div className={css.background} />
      <div className={css.dialog}>
        <div className={css.header}>
          Upload Experiment
          <div className={css.okClose}>
            <span onClick={props.onClose}>{uploadState === UploadState.Uploaded ? "OK" : "Cancel"}</span>
          </div>
        </div>
        <div className={css.contents}>
          <div className={css.run}>
            <div className={css.initials}><Initials text={props.run.experiment.metadata.initials}/></div>
            <div className={css.text}>
              <RunInfoComponent run={props.run} expanded={true} />
            </div>
          </div>
          <div className={css.modePicker}>
            <div className={css.modeChoice} onClick={handleSelectEnterCodeMode}>{`Enter ${CODE_LENGTH} Digit Code`}</div>
            <div className={css.modeChoice} onClick={handleSelectScanQRMode}>Scan QR Code</div>
          </div>
          {uploaderMode === UploaderMode.ScanQR ? renderScanQR() : renderEnterCode()}
        </div>
      </div>
    </div>
  );
};