import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as cors from "cors";
import { Base64 } from "js-base64"

admin.initializeApp(functions.config().firebase);
admin.firestore().settings({
  timestampsInSnapshots: true   // this removes a deprecation warning
});

const corsHandler = cors({origin: true});

const sendError = (response: functions.Response, code: number, result: any) => response.status(code).send({success: false, result});
const sendSuccess = (response: functions.Response, result: any) => response.status(200).send({success: true, result});

export const saveExperimentRun = functions.https.onRequest((request, response) => {
  corsHandler(request, response, () => {
    const {runKey, runData} = request.query;
    if (!runKey) {
      sendError(response, 400, "Missing runKey in query string!");
    } else if (!runData) {
      sendError(response, 400, "Missing runData in query string!");
    } else {
      let runDataJSON: any;
      try {
        runDataJSON = JSON.parse(Base64.decode(runData))
      } catch (err){
        sendError(response, 500, `Error decoding runData: ${err.toString()}`)
        return
      }
      runDataJSON = runDataJSON || {}
      const body = request.body || {}

      // set timestamps on the data
      const now = admin.firestore.FieldValue.serverTimestamp();

      const firestore = admin.firestore();
      const runDocRef = firestore.collection("runs").doc(runKey);
      firestore.runTransaction(transaction => {
        return transaction
          .get(runDocRef)
          .then(runDoc => {
            if (runDoc.exists) {
              transaction.update(runDocRef, {updatedAt: now})
            } else {
              runDataJSON.createdAt = now
              runDataJSON.updatedAt = now
              transaction.set(runDocRef, runDataJSON);
            }
          })
          .then(() => {
            body.createdAt = now
            body.updatedAt = now
            if (body.experiment) {
              return runDocRef
                .collection("experiments")
                .add(body)
                .then(() => sendSuccess(response, "Run saved"))
                .catch(err => sendError(response, 500, err.toString()))
            } else if (body.localPhotoUrl)  {
              return runDocRef
                .collection("photos")
                .add(body)
                .then((doc) => sendSuccess(response, `photo://${runKey}/${doc.id}`))
                .catch(err => sendError(response, 500, err.toString()))
            } else {
              sendError(response, 500, "Missing experiment or localPhotoUrl in upload")
              return;
            }
          })
          .catch(err => sendError(response, 500, err.toString()))
      })
      .catch(err => sendError(response, 500, err.toString()))
    }
  });
});

export const getExperimentPhoto = functions.https.onRequest((request, response) => {
  corsHandler(request, response, () => {
    const {src} = request.query;
    if (!src) {
      sendError(response, 400, "Missing src in query string!");
    } else {
      const match = src.match(/^photo\:\/\/([^/]+)\/(.+)$/);
      if (match) {
        const runKey = match[1];
        const docId = match[2];
        const firestore = admin.firestore();
        firestore.collection(`runs/${runKey}/photos`).doc(docId).get()
          .then((doc) => {
            if (doc.exists) {
              const data = doc.data();
              if (data && data.localPhotoUrl) {
                sendSuccess(response, data.localPhotoUrl)
              } else {
                sendError(response, 500, "No photo data found!");
              }
            } else {
              sendError(response, 500, "Photo does not exist!");
            }
          })
          .catch(err => sendError(response, 500, err.toString()));
      } else {
        sendError(response, 500, `Invalid src photo url: ${src}`);
      }
    }
  });
});

interface CodeDocument {
  runKey: any;
  runData: any;
  createdAt: FirebaseFirestore.FieldValue;
}

export const createCodeForExperimentRun = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    const generateCode = () => {
      const numbers = [];
      for (let i = 0; i < 6; i++) {
        numbers.push(String(Math.random() * 100)[0])
      }
      return numbers.join("").substr(0, 9);
    }

    const {runKey, runData} = request.body;
    if (!runKey) {
      sendError(response, 400, "Missing runKey in request body!");
    } else if (!runData) {
      sendError(response, 400, "Missing runData in request body!");
    } else {
      const now = admin.firestore.FieldValue.serverTimestamp();
      const firestore = admin.firestore();

      // clear out old data
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const oldCodes = await firestore.collection("codes").where("createdAt", "<=", yesterday).get()
      const oldCodeIds: string[] = [];
      oldCodes.forEach(oldCode => oldCodeIds.push(oldCode.id))
      await oldCodeIds.map(oldCodeId => firestore.collection("codes").doc(oldCodeId).delete())

      // keep trying to generate a new doc with a random 9 digit number
      let attempt = 0;
      while (true) {
        const code = generateCode();
        const codeRef = firestore.collection("codes").doc(code);

        try {
          const result = await firestore.runTransaction(transaction => {
            return transaction
              .get(codeRef)
              .then(codeDoc => {
                if (codeDoc.exists) {
                  throw new Error("Code already exists!")
                } else {
                  transaction.set(codeRef, {
                    runKey,
                    runData,
                    createdAt: now,
                  } as CodeDocument);
                  return code;
                }
              })
          });
          console.log("result", result);
          if (result === code) {
            sendSuccess(response, {code});
            break;
          }
        } catch (e) {
          // keep looping...
        }
        if (attempt++ > 100) {
          sendError(response, 500, "Ran out of attempts creating code!");
          break;
        }
      }
    }
  });
});

export const getUrlForExperimentRunCode = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    const {code} = request.query;
    if (!code) {
      sendError(response, 400, "Missing code in query string!");
    } else {
      const data = (await admin.firestore().collection("codes").doc(code).get()).data() as CodeDocument | undefined;
      if (data) {
        const {runKey, runData} = data;
        if (runKey && runData) {
          const url = `https://us-central1-vortex-e5d5d.cloudfunctions.net/saveExperimentRun?runKey=${runKey}&runData=${runData}`;
          sendSuccess(response, { url });
        } else {
          sendError(response, 400, "Missing runKey or runData");
        }
      } else {
        sendError(response, 400, "Invalid code!");
      }
    }
  });
});
