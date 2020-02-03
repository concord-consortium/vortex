import React from "react";
import { useState, useRef, useEffect } from "react"
import { Base64 } from "js-base64"
import * as firebase from "firebase/app"
import * as jwt from "jsonwebtoken";
import "firebase/firestore"
import "firebase/auth"

const iframePhone = require("iframe-phone")

import { AuthoringComponent, AuthoredState } from "./authoring";
import { RuntimeComponent } from "./runtime";
import { IExperiment } from "../../shared/experiment-types";
import { Experiments } from "../../mobile-app/hooks/use-experiments";

const experiments = require("../../data/experiments.json") as Experiments;

import css from "./app.module.scss";

// NOTE: this is only a partial description of the returned data, containing only the fields we are interested in
interface InitInteractiveData {
  mode: "authoring" | "runtime";
  authoredState: AuthoredState | null;
  classInfoUrl: string;
  interactiveStateUrl: string;
  interactive: {
    id: number
  };
  authInfo: {
    email: string
  };
  pageNumber: number;
  activityName: string;
}

// NOTE: this is only a partial description of the returned data, containing only the fields we are interested in
export interface FirebaseJWT {
  claims: {
    platform_id: string;      // "https://app.rigse.docker",
    platform_user_id: number; // 9,
    user_id: string;          // "https://app.rigse.docker/users/9",
    class_hash: string;       // "31f6344410d9e5874e085df0afa048604ee0131912112c7a",
    offering_id: number       // 13
  }
}

let inIframe = false
try {
  inIframe = window.top !== window.self
} catch (e) {
  inIframe = true
}

let phone: any;

export const AppComponent = () => {
  const [connectedToLara, setConnectedToLara] = useState(false)
  const [initInteractiveData, setInitInteractiveData] = useState<InitInteractiveData | undefined>(undefined)
  const [error, setError] = useState<any>()
  const [experiment, setExperiment] = useState<IExperiment|undefined>();
  const [firebaseJWT, setFirebaseJWT] = useState<FirebaseJWT|undefined>();

  const renderInIframe = () => {
    if (error) {
      return <div className={css.error}>{error.toString()}</div>
    }

    if (!connectedToLara || !initInteractiveData) {
      return <div>Waiting to connect to LARA ...</div>
    }

    if (initInteractiveData.mode === "authoring") {
      return <AuthoringComponent experiment={experiment} phone={phone} />
    }

    if (!initInteractiveData.interactiveStateUrl) {
      setError("No preview available ...")
      return
    }

    if (!experiment) {
      setError("No experiment set yet.  Please select an experiment in the authoring form.")
      return
    }

    if (!firebaseJWT) {
      return <div>Waiting to connect to Firebase ...</div>
    }

    return (
      <RuntimeComponent
        experiment={experiment}
        runKey={Base64.encode(initInteractiveData.interactiveStateUrl)}
        firebaseJWT={firebaseJWT}
        setError={setError}
      />
    );
  }

  const renderOutsideIframe = () => {
    return (
      <>
        <div className={css.note}>
          This application must be run within LARA.
        </div>
      </>
    )
  }

  if (inIframe) {
    useEffect(() => {
      // create iframephone and wait for initInteractive
      phone = iframePhone.getIFrameEndpoint()
      phone.addListener("initInteractive", (data: InitInteractiveData) => {
        setConnectedToLara(true)

        if (data.authoredState && (data.authoredState.version === "1.0")) {
          const { experimentId } = data.authoredState;
          setExperiment(experiments.find(_experiment => _experiment.metadata.uuid === experimentId))
        }

        setInitInteractiveData(data);

        // connect to Firebase only if the interactive is being run
        if (data.interactiveStateUrl) {
          phone.addListener("firebaseJWT", (result: any) => {
            if (result.response_type === "ERROR") {
              setError(`Unable to get Firebase JWT: ${result.message}`);
              return;
            }
            const { token } = result;
            if (!token) {
              setError("No token available for Firebase");
              return;
            }

            if (firebase.apps.length === 0) {
              firebase.initializeApp({
                apiKey: "AIzaSyDySxCrKaGmcqoPf2o6VnEJfB1lVzHf-rI",
                authDomain: "vortex-e5d5d.firebaseapp.com",
                databaseURL: "https://vortex-e5d5d.firebaseio.com",
                projectId: "vortex-e5d5d",
                storageBucket: "vortex-e5d5d.appspot.com",
                messagingSenderId: "850850394401",
                appId: "1:850850394401:web:0286d473a1343877b48e60",
                measurementId: "G-SVQ2GPYWQK"
              });
            }

            const auth = firebase.auth()
            auth.setPersistence(firebase.auth.Auth.Persistence.NONE)
              .then(() => auth.signOut())
              .then(() => auth.signInWithCustomToken(token))
              .then(() => setFirebaseJWT(jwt.decode(token) as FirebaseJWT))
              .catch((err) => setError(err));
          });
          phone.post("getFirebaseJWT", {firebase_app: "vortex"});
        }
      })

      phone.initialize();

      phone.post("supportedFeatures", {
        apiVersion: 1,
        features: {
          interactiveState: false,
          authoredState: true
        }
      });
    }, [])
  }

  return (
    <div className={css.app}>
      {inIframe ? renderInIframe() : renderOutsideIframe() }
    </div>
  )
};
