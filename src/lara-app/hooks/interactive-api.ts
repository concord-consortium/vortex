import { useState, useEffect, useRef } from "react";
import * as firebase from "firebase/app";
import * as jwt from "jsonwebtoken";
import { Base64 } from "js-base64";

import { IExperiment } from "../../shared/experiment-types";
import { Experiments } from "../../mobile-app/hooks/use-experiments";
import { inIframe } from "../utils/in-iframe";
import { IAuthoredState } from "../../authoring-app/components/lara-authoring";
import * as iframePhone from "iframe-phone";

const experiments = require("../../data/experiments.json") as Experiments;

// NOTE: this is only a partial description of the returned data, containing only the fields we are interested in
type InitInteractiveMode = "authoring" | "runtime" | "report";
export interface IInitInteractiveData {
  mode: InitInteractiveMode;
  authoredState: IAuthoredState | null;
  classInfoUrl: string;
  interactiveStateUrl: string;
  interactiveState: string;
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

interface IInteractiveStateJSON {
  runKey: string;
  experimentId: string;
}

const findExperiment = (experimentId?: string) => {
  return experiments.find(_experiment => _experiment.metadata.uuid === experimentId);
};

export const useInteractiveApi = (options: {setError: (error: any) => void}) => {
  const { setError } = options;
  const [phone, setPhone] = useState<any>();
  const [connectedToLara, setConnectedToLara] = useState(false);
  const [initInteractiveData, setInitInteractiveData] = useState<IInitInteractiveData | undefined>(undefined);
  const [experiment, setExperiment] = useState<IExperiment|undefined>();
  const [firebaseJWT, setFirebaseJWT] = useState<IFirebaseJWT|undefined>();

  // use ref for runKey and experimentId values as they are used in iframe phone callback
  // and the current state value is not available in that closure
  const runKey = useRef<string|undefined>();
  const experimentId = useRef<string|undefined>();

  const setHeight = (height: number) => {
    phone?.post("height", height);
  };

  useEffect(() => {
    if (inIframe()) {
        // create iframephone and wait for initInteractive
      const _phone = iframePhone.getIFrameEndpoint();
      setPhone(_phone);

      _phone.addListener("initInteractive", (data: IInitInteractiveData) => {
        setConnectedToLara(true);

        if (data.authoredState && (data.authoredState.version === "1.0")) {
          experimentId.current = data.authoredState.experimentId;
          setExperiment(findExperiment(data.authoredState.experimentId));
        }

        if (data.mode === "runtime") {
          if (data.classInfoUrl && data.interactiveStateUrl) {
            // learner runtime mode
            runKey.current = Base64.encode(data.interactiveStateUrl);
          } else {
            // activity preview or authoring preview mode
            runKey.current = undefined;
          }
        } else if (data.mode === "report") {
          // report mode
          try {
            const json = JSON.parse(data.interactiveState) as IInteractiveStateJSON | undefined;
            runKey.current = json?.runKey;
            experimentId.current = json?.experimentId;
            setExperiment(findExperiment(experimentId.current));
            // tslint:disable-next-line:no-empty
          } catch (e) {}
        }

        setInitInteractiveData(data);

        // connect to Firebase only if the interactive is being run or reported on
        if (runKey.current) {
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

      _phone.addListener('getInteractiveState', () => {
        _phone.post('interactiveState', {
          runKey: runKey.current,
          experimentId: experimentId.current
        } as IInteractiveStateJSON);
      });

      _phone.initialize();

      _phone.post("supportedFeatures", {
        apiVersion: 1,
        features: {
          interactiveState: true,
          authoredState: true
        }
      });
    }
  }, []);

  return {connectedToLara, initInteractiveData, experiment, firebaseJWT, runKey: runKey.current, phone, setHeight};
};