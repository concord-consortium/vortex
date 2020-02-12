import * as React from "react";
import { useState } from "react";
import { Scanner } from "./scanner";

import css from "./uploader.module.scss";
import { RunInfoComponent } from "./run-info";
import { IRun } from "../hooks/use-runs";

export enum UploadState {
  Scanning,
  Uploading,
  UploadFailed,
  Uploaded
}

interface IProps {
  run: IRun;
  onClose: () => void;
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
    const fetchOptions: RequestInit = {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(props.run)
    };
    fetch(url, fetchOptions)
      .then((resp) => {
        if (resp.status === 200) {
          changeState(UploadState.Uploaded);
        } else {
          resp.text().then((text) => changeState(UploadState.UploadFailed, text));
        }
      })
      .catch((err) => {
        changeState(UploadState.UploadFailed, err);
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
          <div className={css.floatRight}>
            <span onClick={props.onClose}>{uploadState === UploadState.Uploaded ? "OK" : "Cancel"}</span>
          </div>
        </div>
        <div className={css.contents}>
          <RunInfoComponent run={props.run} />
          <div className={css.scanner}>
            {contents()}
          </div>
        </div>
      </div>
    </div>
  );
};