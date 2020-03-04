import * as React from "react";
import { useState } from "react";
import { Scanner } from "./scanner";
import { Initials } from "../../shared/components/initials";
import { RunInfoComponent } from "./run-info";
import { IRun } from "../hooks/use-runs";
import { IPhotoOrNote } from "../../shared/components/photo-or-note-field";

import css from "./uploader.module.scss";

export enum UploadState {
  Scanning,
  Uploading,
  UploadFailed,
  Uploaded
}

interface IProps {
  run: IRun;
  onClose: () => void;
  saveUploadedRun: (run: IRun) => void;
}

export const Uploader = (props: IProps) => {
  const [uploadState, setUploadState] = useState<UploadState>(UploadState.Scanning);
  const [uploadError, setUploadError] = useState();

  const changeState = (newState: UploadState, err?: any) => {
    setUploadState(newState);
    setUploadError(err);
  };

  const handleOnScanned = (url: string) => {
    changeState(UploadState.Uploading);

    let promise = Promise.resolve();

    const sendPostRequest = (body: any) => {
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

  const contents = () => {
    const handleClick = (callback: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      callback();
    };

    const handleScanning = handleClick(() => changeState(UploadState.Scanning));
    const button = (label: string) => <button onClick={handleScanning} style={{marginTop: 10}}>{label}</button>;

    switch (uploadState) {
      case UploadState.Scanning:
        return <Scanner onScanned={handleOnScanned} />;

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
  return (
    <div className={css.uploader}>
      <div className={css.background} />
      <div className={css.dialog}>
        <div className={css.header}>
          Upload Experiment

        </div>
        <div className={css.contents}>
          <div className={css.run}>
            <div className={css.initials}><Initials text={props.run.experiment.metadata.initials}/></div>
            <div className={css.text}>
              <RunInfoComponent run={props.run} />
            </div>
          </div>
          <div className={css.instructions}>
            <ol>
              <li>In the activity, click the Import button to display a QR code.</li>
              <li>Point your camera at the QR code to begin uploading this experiment.</li>
              <li>Tap the picture when the code is lined up within the green guides to upload the experiment</li>
            </ol>
          </div>
          <div className={css.resultText}>
            <div className={css.scanInfo}>
              Position QR code within guides, tap screen to scan
            </div>

            <div className={css.okClose}>
              <span onClick={props.onClose}>{uploadState === UploadState.Uploaded ? "OK" : "Cancel"}</span>
            </div>
          </div>
          <div className={css.scanner}>
            <div className={css.scanGuide} />
            <div className={css.camera}>{contents()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};