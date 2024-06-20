import { useState, useEffect, useRef } from "react";
import * as firebase from "firebase/app";
import * as jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { IExperiment } from "../../shared/experiment-types";
import { Experiments } from "../../mobile-app/hooks/use-experiments";
import { inIframe } from "../utils/in-iframe";
import { IAuthoredState } from "../../authoring-app/components/lara-authoring";
import * as iframePhone from "iframe-phone";
import { IDataset, IInitInteractive, IInteractiveStateWithDataset } from "@concord-consortium/lara-interactive-api";
import { generateDataset } from "../utils/generate-dataset";
import { IJwtClaims, IJwtResponse } from "@concord-consortium/lara-plugin-api";
const experiments = require("../../data/experiments.json") as Experiments;

export type IInitInteractiveData = IInitInteractive<IInteractiveStateJSON, IAuthoredState>;

interface IInteractiveStateJSON extends IInteractiveStateWithDataset {
  runKey: string | undefined;
  experimentId: string | undefined;
}

const findExperiment = (experimentId?: string) => {
  return experiments.find(_experiment => _experiment.metadata.uuid === experimentId);
};

export const isGetFirebaseJwtSupported = (data: IInitInteractive) =>
  data.mode === "runtime" && !!data.hostFeatures.getFirebaseJwt && data.hostFeatures.getFirebaseJwt.version.startsWith("1.");

export const useInteractiveApi = (options: {setError: (error: any) => void}) => {
  const { setError } = options;
  const phone = useRef<any>();
  const [connectedToLara, setConnectedToLara] = useState(false);
  const [initInteractiveData, setInitInteractiveData] = useState<IInitInteractiveData | undefined>(undefined);
  const [experiment, setExperiment] = useState<IExperiment|undefined>();
  const [firebaseJWT, setFirebaseJWT] = useState<IJwtClaims|undefined>();
  // previewMode is disabled by default. It'll be turned on when firebaseJWT cannot be obtained.
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const dataset = useRef<IDataset | null>(null);

  // use ref for runKey and experimentId values as they are used in iframe phone callback
  // and the current state value is not available in that closure
  const runKey = useRef<string|undefined>();
  const experimentId = useRef<string|undefined>();

  const setHeight = (height: number) => {
    phone.current?.post("height", height);
  };

  const sendCurrentInteractiveState = () => {
    const intState: IInteractiveStateJSON = {
      runKey: runKey.current,
      experimentId: experimentId.current,
      dataset: dataset.current
    };
    phone.current?.post('interactiveState', intState);
  };

  const setDataset = (newDataset: IDataset | null) => {
    dataset.current = newDataset;
    sendCurrentInteractiveState();
  };

  useEffect(() => {
    if (inIframe()) {
        // create iframephone and wait for initInteractive
      const _phone = iframePhone.getIFrameEndpoint();
      phone.current = _phone;

      _phone.addListener("initInteractive", (data: IInitInteractiveData) => {
        setConnectedToLara(true);

        let _experiment;
        let authoredState = data.authoredState;
        // In authoring mode the authored state comes in as a string
        // which causes the authoring preview to show an error
        if (typeof authoredState === "string") {
          try {
            authoredState = JSON.parse(authoredState);
          } catch (e) {
            // noop
          }
        }
        if (authoredState?.version === "1.0") {
          experimentId.current = authoredState.experimentId;
          _experiment = findExperiment(authoredState.experimentId);
          setExperiment(_experiment);
        }

        let interactiveState: IInteractiveStateJSON | undefined;

        if (data.mode === "runtime" || data.mode === "report") {
          try {
            // as any is necessary, as IInitInteractive apparently doesn't assume that interactiveState can be a string.
            // It might be here for historical reasons, or report environments might pass interactive state as string.
            const rawInteractiveState: IInteractiveStateJSON | string | undefined = data.interactiveState as any;
            interactiveState = typeof rawInteractiveState === "string" ?
              JSON.parse(rawInteractiveState) : rawInteractiveState;
          } catch (e) {
            // JSON.parse has failed. That's fine, just empty or malformed interactive state.
          }
        }

        if (data.mode === "runtime") {
          const existingRunKey = interactiveState?.runKey;
          // Generate new run key if it's not available in the interactive state (when vortex is run for the first time).
          runKey.current = existingRunKey || uuidv4();
          // If there's no data available yet, generate an empty dataset.
          // It should include properties list and will let graph interactive render empty graphs.
          if (_experiment) {
            dataset.current = interactiveState?.dataset || generateDataset({ experimentData: [] }, _experiment);
          }
          if (!existingRunKey) {
            // Once runKey, experimentId and dataset are set for the **first time**, make sure they're saved back
            // in LARA or ActivityPlayer. This is especially important in ActivityPlayer which is not polling
            // interactive state, so this data would lost without this call.
            sendCurrentInteractiveState();
          }
        } else if (data.mode === "report") {
          runKey.current = interactiveState?.runKey;
          // Restore experiment from interactive state instead of the authored state. That ensures that
          // report is still valid even if the author changes experiment after student's run.
          experimentId.current = interactiveState?.experimentId;
          if (experimentId.current) {
            setExperiment(findExperiment(experimentId.current));
          }
        }

        setInitInteractiveData(data);

        if (data.mode === "runtime" && isGetFirebaseJwtSupported(data)) {
          _phone.addListener("firebaseJWT", (result: any) => {
            if (result.response_type === "ERROR") {
              // Switch to preview mode. Most likely it means that user is not logged in (anonymous), a teacher,
              // or a student running the activity not from the Portal. In all that cases API will return
              // an error saying that runRemoteEndpoint is not available.
              setPreviewMode(true);
              return;
            }

            const { token } = result as IJwtResponse;
            if (!token) {
              setError("No token available for Firebase");
              return;
            }

            if (firebase.apps.length === 0) {
              firebase.initializeApp({
                apiKey: atob("QUl6YVN5RHlTeENyS2FHbWNxb1BmMm82Vm5FSmZCMWxWekhmLXJJ"),
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
            .then(() => setFirebaseJWT(jwt.decode(token) as IJwtClaims))
            .catch((err) => setError(err));
          });
          _phone.post("getFirebaseJWT", {firebase_app: "vortex"});
        } else {
          // Set preview mode. The host environment doesn't support getFirebaseJWT message, so it's impossible to
          // connect to Firestore. Most likely it's LARA authoring preview.
          setPreviewMode(true);
        }
      });

      _phone.addListener('getInteractiveState', sendCurrentInteractiveState);

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

  return {
    connectedToLara, initInteractiveData, experiment, previewMode, firebaseJWT, runKey: runKey.current,
    phone: phone.current, setHeight, setDataset
  };
};
