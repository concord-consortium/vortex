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
import { Icon } from "../../shared/components/icon";

export const CODE_LENGTH = 6;

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
        <input type="number" value={code} onChange={handleChange} placeholder={`Enter ${CODE_LENGTH} digit code here`}/>
        <div className={css.uploadButton} onClick={handleUpload}>
          <div className={css.icon}><Icon name="upload" /></div>
          <div className={css.text}>Upload Experiment</div>
        </div>
      </div>
    );
  };

  const renderDataEntry = () => {
    const handleClick = (callback: () => void) => (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      callback();
    };

    const handleTryAgain = handleClick(() => {
      changeState(uploaderMode === UploaderMode.EnterCode ? UploadState.EnteringCode : UploadState.Scanning);
    });

    switch (uploadState) {
      case UploadState.EnteringCode:
        return renderCodeEntry();

      case UploadState.RetrievingUrl:
        return <div className={css.uploadInfo}>Checking code ...</div>;

      case UploadState.Scanning:
        return <Scanner onScanned={handleUploadExperiment} />;

      case UploadState.Uploading:
        return <div className={css.uploadInfo}>Uploading experiment ...</div>;

      case UploadState.UploadFailed:
        return (
          <div className={css.uploadInfo}>
            <div className={css.error}>Upload failed!</div>
            <div>{uploadError ? uploadError.toString() : "No error info available!"}</div>
            <div className={css.infoButton} onClick={handleTryAgain}>Try Again</div>
          </div>
        );

      case UploadState.Uploaded:
        return (
          <div className={css.uploadInfo}>
            <div>Upload successful!</div>
            <div className={css.infoButton} onClick={props.onClose}>OK</div>
          </div>
        );
    }
  };

  const renderScanQR = () => {
    return <>
      <div className={css.instructions}>
        <ol>
          <li>In the activity, click the Import button.</li>
          <li>Point your camera at the QR code.</li>
          <li><strong>Tap the picture</strong> when the QR code is lined up within the green guides.</li>
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

  const modeChoiceClassName = (mode: UploaderMode) => {
    return `${css.modeChoice} ${mode === uploaderMode ? css.activeModeChoice : ""}`;
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
            <div className={css.initials}><Initials metadata={props.run.experiment.metadata}/></div>
            <div className={css.text}>
              <RunInfoComponent run={props.run} expanded={true} />
            </div>
          </div>
          {/*

          NOPHOTO: Removed the photo element due to iOS build issues

          <div className={css.modePicker}>
            <div className={modeChoiceClassName(UploaderMode.EnterCode)} onClick={handleSelectEnterCodeMode}>{`Enter ${CODE_LENGTH} Digit Code`}</div>
            <div className={modeChoiceClassName(UploaderMode.ScanQR)} onClick={handleSelectScanQRMode}>Or Scan QR Code</div>
          </div>
          */}
          {uploaderMode === UploaderMode.ScanQR ? renderScanQR() : renderEnterCode()}
        </div>
      </div>
    </div>
  );
};