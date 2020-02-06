import { useState, useEffect } from "react";
import * as firebase from "firebase/app";
import * as jwt from "jsonwebtoken";

import { IExperiment } from "../../shared/experiment-types";
import { Experiments } from "../../mobile-app/hooks/use-experiments";
import { inIframe } from "../utils/in-iframe";
import { IAuthoredState } from "../components/authoring";

const iframePhone = require("iframe-phone");
const experiments = require("../../data/experiments.json") as Experiments;

// NOTE: this is only a partial description of the returned data, containing only the fields we are interested in
export interface IInitInteractiveData {
  mode: "authoring" | "runtime";
  authoredState: IAuthoredState | null;
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
export interface IFirebaseJWT {
  claims: {
    platform_id: string;      // "https://app.rigse.docker",
    platform_user_id: number; // 9,
    user_id: string;          // "https://app.rigse.docker/users/9",
    class_hash: string;       // "31f6344410d9e5874e085df0afa048604ee0131912112c7a",
    offering_id: number       // 13
  };
}

export const useInteractiveApi = (options: {setError: (error: any) => void}) => {
  const { setError } = options;
  const [phone, setPhone] = useState<any>();
  const [connectedToLara, setConnectedToLara] = useState(false);
  const [initInteractiveData, setInitInteractiveData] = useState<IInitInteractiveData | undefined>(undefined);
  const [experiment, setExperiment] = useState<IExperiment|undefined>();
  const [firebaseJWT, setFirebaseJWT] = useState<IFirebaseJWT|undefined>();

  useEffect(() => {
    if (inIframe()) {
        // create iframephone and wait for initInteractive
      const _phone = iframePhone.getIFrameEndpoint();
      setPhone(_phone);

      _phone.addListener("initInteractive", (data: IInitInteractiveData) => {
        setConnectedToLara(true);

        if (data.authoredState && (data.authoredState.version === "1.0")) {
          const { experimentId } = data.authoredState;
          setExperiment(experiments.find(_experiment => _experiment.metadata.uuid === experimentId));
        }

        setInitInteractiveData(data);

        // connect to Firebase only if the interactive is being run
        if (data.interactiveStateUrl) {
          _phone.addListener("firebaseJWT", (result: any) => {
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

            const auth = firebase.auth();
            auth.setPersistence(firebase.auth.Auth.Persistence.NONE)
              .then(() => auth.signOut())
              .then(() => auth.signInWithCustomToken(token))
              .then(() => setFirebaseJWT(jwt.decode(token) as IFirebaseJWT))
              .catch((err) => setError(err));
          });
          _phone.post("getFirebaseJWT", {firebase_app: "vortex"});
        }
      });

      _phone.initialize();

      _phone.post("supportedFeatures", {
        apiVersion: 1,
        features: {
          interactiveState: false,
          authoredState: true
        }
      });
    }
  }, []);

  return {connectedToLara, initInteractiveData, experiment, firebaseJWT, phone};
};