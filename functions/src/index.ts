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
    const {runKey, runData} = request.query;
    if (!runKey) {
      response.status(400).send("Missing runKey in query string!");
    } else if (!runData) {
      response.status(400).send("Missing runData in query string!");
    } else {
      let runDataJSON: any;
      try {
        runDataJSON = JSON.parse(Base64.decode(runData))
      } catch (err){
        response.status(500).send(`Error decoding runData: ${err.toString()}`)
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
            return runDocRef
              .collection("experiments")
              .add(body)
              .then(() => response.status(200).send("Run saved"))
              .catch(err => response.status(500).send(err.toString()))
          })
          .catch(err => response.status(500).send(err.toString()))
      })
      .catch(err => response.status(500).send(err.toString()))
    }
  });
});