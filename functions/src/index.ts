import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as cors from "cors";
import { Base64 } from "js-base64"

admin.initializeApp(functions.config().firebase);
admin.firestore().settings({
  timestampsInSnapshots: true   // this removes a deprecation warning
});

const corsHandler = cors({origin: true});

export const saveExperimentRun = functions.https.onRequest((request, response) => {
  corsHandler(request, response, () => {
    const sendError = (code: number, result: any) => response.status(code).send({success: false, result});
    const sendSuccess = (result: any) => response.status(200).send({success: true, result});

    const {runKey, runData} = request.query;
    if (!runKey) {
      sendError(400, "Missing runKey in query string!");
    } else if (!runData) {
      sendError(400, "Missing runData in query string!");
    } else {
      let runDataJSON: any;
      try {
        runDataJSON = JSON.parse(Base64.decode(runData))
      } catch (err){
        sendError(500, `Error decoding runData: ${err.toString()}`)
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
                .then(() => sendSuccess("Run saved"))
                .catch(err => sendError(500, err.toString()))
            } else if (body.localPhotoUrl)  {
              return runDocRef
                .collection("photos")
                .add(body)
                .then((doc) => sendSuccess(`photo://${runKey}/${doc.id}`))
                .catch(err => sendError(500, err.toString()))
            } else {
              sendError(500, "Missing experiment or localPhotoUrl in upload")
              return;
            }
          })
          .catch(err => sendError(500, err.toString()))
      })
      .catch(err => sendError(500, err.toString()))
    }
  });
});

export const getExperimentPhoto = functions.https.onRequest((request, response) => {
  corsHandler(request, response, () => {
    const sendError = (code: number, result: any) => response.status(code).send({success: false, result});
    const sendSuccess = (result: any) => response.status(200).send({success: true, result});

    const {src} = request.query;
    if (!src) {
      sendError(400, "Missing src in query string!");
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
                sendSuccess(data.localPhotoUrl)
              } else {
                sendError(500, "No photo data found!");
              }
            } else {
              sendError(500, "Photo does not exist!");
            }
          })
          .catch(err => sendError(500, err.toString()));
      } else {
        sendError(500, `Invalid src photo url: ${src}`);
      }
    }
  });
});
