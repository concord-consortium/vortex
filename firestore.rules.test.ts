// adapted from https://github.com/sgr-ksmt/firestore-emulator-rules-test
import * as ftest from "@firebase/testing";
import * as fs from "fs";
import { IFirebaseJWTClaims } from "./src/lara-app/hooks/interactive-api";
import * as uuid from "uuid";

class FirestoreTestProvider {
  private testNumber: number = 0;
  private projectName: string;
  private rules: string;

  constructor(projectName: string, rulesFilePath: string = "firestore.rules") {
    this.projectName = projectName + "-" + Date.now();
    this.rules = fs.readFileSync(rulesFilePath, "utf8");
  }

  increment() {
    this.testNumber++;
  }

  private getProjectID() {
    return `${this.projectName}-${this.testNumber}`;
  }

  async loadRules() {
    return ftest.loadFirestoreRules({
      projectId: this.getProjectID(),
      rules: this.rules
    });
  }

  getFirestoreWithAuth(auth?: { [key in "uid" | "email"]?: string }) {
    return ftest
      .initializeTestApp({
        projectId: this.getProjectID(),
        auth
      })
      .firestore();
  }

  getAdminFirestore() {
    return ftest
      .initializeAdminApp({ projectId: this.getProjectID() })
      .firestore();
  }

  async cleanup() {
    return Promise.all(ftest.apps().map(app => app.delete()));
  }
}

const testName = "firestore-rules-test";
const provider = new FirestoreTestProvider(testName);

interface IAuth extends IFirebaseJWTClaims {
  uid: string;
}

type UserType = "learner" | "teacher";

const singleUserAuth = (userType: UserType, uid: number = 1, classHash: string = "12345"): IAuth => {
  return {
    uid: `${uid}`,
    user_id: `https://example.com/users/${uid}`,
    user_type: userType,
    class_hash: classHash,
    platform_id: "https://example.com",
    platform_user_id: uid,
    offering_id: 2
  };
};

interface IUserTestParams {
  type: UserType;
  classHash?: string;
}
interface IDualUserTestParams {
  user1: IUserTestParams;
  user2: IUserTestParams;
}

const getRunData = (auth: IAuth): IFirebaseJWTClaims => {
  const {user_id, user_type, class_hash, platform_id, platform_user_id, offering_id} = auth;
  return {user_id, user_type, class_hash, platform_id, platform_user_id, offering_id};
};

const singleUserRunTest = (params: IUserTestParams, userId: number = 1) => {
  const {type, classHash} = params;
  const auth = singleUserAuth(type, userId, classHash);
  const db = provider.getFirestoreWithAuth(auth);
  const col = db.collection("runs");
  const runDoc = col.doc("1");
  const experimentDoc = db.collection("runs/1/experiments").doc("1");
  const photoDoc = db.collection("runs/1/photos").doc("1");
  // for semi-fuzzing of the rules
  const randomDoc = db.collection(`runs/1/${uuid.v4()}`).doc("1");
  const runData = getRunData(auth);
  return {auth, db, col, runDoc, experimentDoc, photoDoc, randomDoc, runData};
};

const dualUserRunTest = (params: IDualUserTestParams) => {
  const {auth: auth1, db: db1, col: col1, runDoc: runDoc1, experimentDoc: experimentDoc1, photoDoc: photoDoc1, randomDoc: randomDoc1, runData: runData1} = singleUserRunTest(params.user1, 1);
  const {auth: auth2, db: db2, col: col2, runDoc: runDoc2, experimentDoc: experimentDoc2, photoDoc: photoDoc2, randomDoc: randomDoc2, runData: runData2} = singleUserRunTest(params.user2, 2);
  return {auth1, auth2, db1, db2, runDoc1, runDoc2, experimentDoc1, photoDoc1, randomDoc1, experimentDoc2, photoDoc2, randomDoc2, runData1, runData2};
};

// only run test when TEST_FIRESTORE_RULES is true this test needs to run outside the normal tests along with the emulator
if (!process.env.TEST_FIRESTORE_RULES) {

  describe(testName, () => {
    test("it is skipped in normal test runs", () => {
      expect(true).toBe(true);
    });
  });

} else {
  describe(testName, () => {

    beforeEach(async () => {
      provider.increment();
      await provider.loadRules();
    });

    afterEach(async () => {
      await provider.cleanup();
    });

    describe("non-runs collection", () => {
      test("all access is denied with no auth", async () => {
        const db = provider.getFirestoreWithAuth();
        const col = db.collection("foo");
        const doc = col.doc("bar");
        await ftest.assertFails(doc.get()); // read
        await ftest.assertFails(doc.set({bing: 1})); // create via set
        await ftest.assertFails(col.add({bang: 2})); // create via add
        await ftest.assertFails(doc.update({boom: 3})); // update
        await ftest.assertFails(doc.delete()); // delete
      });

      test("all access is denied with auth", async () => {
        const db = provider.getFirestoreWithAuth(singleUserAuth("learner"));
        const col = db.collection("foo");
        const doc = col.doc("bar");
        await ftest.assertFails(doc.get()); // read
        await ftest.assertFails(doc.set({bing: 1})); // create via set
        await ftest.assertFails(col.add({bang: 2})); // create via add
        await ftest.assertFails(doc.update({boom: 3})); // update
        await ftest.assertFails(doc.delete()); // delete
      });
    });

    describe("runs collection", () => {
      test("all access is denied with no auth", async () => {
        const db = provider.getFirestoreWithAuth();
        const col = db.collection("runs");
        const doc = col.doc("1");
        await ftest.assertFails(doc.get()); // read
        await ftest.assertFails(doc.set({bing: 1})); // create via set
        await ftest.assertFails(col.add({bang: 2})); // create via add
        await ftest.assertFails(doc.update({boom: 3})); // update
        await ftest.assertFails(doc.delete()); // delete
      });

      test("create is allowed to all authed users", async () => {
        const {col, runDoc} = singleUserRunTest({type: "learner"});
        await ftest.assertSucceeds(runDoc.set({bing: 1}));
        await ftest.assertSucceeds(col.add({bang: 2}));
      });

      test("read is allowed to all authed users that own the document", async () => {
        const {runData, runDoc} = singleUserRunTest({type: "learner"});
        await ftest.assertSucceeds(runDoc.set(runData));
        await ftest.assertSucceeds(runDoc.get());
      });

      test("read is not allowed to all authed learners that don't own the document", async () => {
        const {runData1, runDoc1, runDoc2} = dualUserRunTest({
          user1: {type: "learner"},
          user2: {type: "learner"}
        });
        await ftest.assertSucceeds(runDoc1.set(runData1));
        await ftest.assertFails(runDoc2.get());
      });

      test("read is allowed to all authed users that are teachers of the class", async () => {
        const {runData1, runDoc1, runDoc2} = dualUserRunTest({
          user1: {type: "learner"},
          user2: {type: "teacher"}
        });
        await ftest.assertSucceeds(runDoc1.set(runData1));
        await ftest.assertSucceeds(runDoc2.get());
      });

      test("read is not allowed to all authed users that are not teachers of the class", async () => {
        const {runData1, runDoc1, runDoc2} = dualUserRunTest({
          user1: {type: "learner"},
          user2: {type: "teacher", classHash: "otherClass"}
        });
        await ftest.assertSucceeds(runDoc1.set(runData1));
        await ftest.assertFails(runDoc2.get());
      });

      test("update is allowed to all authed users that own the document", async () => {
        const {runData, runDoc} = singleUserRunTest({type: "learner"});
        await ftest.assertSucceeds(runDoc.set(runData));
        await ftest.assertSucceeds(runDoc.update({bing: 2}));
      });

      test("update is not allowed to all authed learners that don't own the document", async () => {
        const {runData1, runDoc1, runDoc2} = dualUserRunTest({
          user1: {type: "learner"},
          user2: {type: "learner"}
        });
        await ftest.assertSucceeds(runDoc1.set(runData1));
        await ftest.assertFails(runDoc2.update({bing: 2}));
      });

      test("update is allowed to all authed users that are teachers of the class", async () => {
        const {runData1, runDoc1, runDoc2} = dualUserRunTest({
          user1: {type: "learner"},
          user2: {type: "teacher"}
        });
        await ftest.assertSucceeds(runDoc1.set(runData1));
        await ftest.assertSucceeds(runDoc2.update({bing: 2}));
      });

      test("update is not allowed to all authed users that are not teachers of the class", async () => {
        const {runData1, runDoc1, runDoc2} = dualUserRunTest({
          user1: {type: "learner"},
          user2: {type: "teacher", classHash: "otherClass"}
        });
        await ftest.assertSucceeds(runDoc1.set(runData1));
        await ftest.assertFails(runDoc2.update({bing: 2}));
      });
    });

    // NOTE: the "randomDoc" testing should ALWAYS fail as the firestore.rules file defines explicit
    // routes with no catch-alls.  The randomDoc collection is a semi-fuzzer as it generates uuids
    // per run.

    describe("runs/<id>/<subcollection> collection", () => {
      test("all access is denied with no auth", async () => {
        const db = provider.getFirestoreWithAuth();
        const col = db.collection("runs/1/experiments");
        const doc = col.doc("1");
        await ftest.assertFails(doc.get()); // read
        await ftest.assertFails(doc.set({bing: 1})); // create via set
        await ftest.assertFails(col.add({bang: 2})); // create via add
        await ftest.assertFails(doc.update({boom: 3})); // update
        await ftest.assertFails(doc.delete()); // delete
      });

      test("create is allowed to all authed users who own the parent run", async () => {
        const {runData, runDoc, experimentDoc, photoDoc, randomDoc} = singleUserRunTest({type: "learner"});
        await ftest.assertSucceeds(runDoc.set(runData));

        await ftest.assertSucceeds(experimentDoc.set({foo: "bar"}));
        await ftest.assertSucceeds(photoDoc.set({foo: "bar"}));
        await ftest.assertFails(randomDoc.set({foo: "bar"}));
      });

      test("create is not allowed to all authed users who do not on the parent run", async () => {
        const {runData1, runDoc1, experimentDoc2, photoDoc2, randomDoc2} = dualUserRunTest({
          user1: {type: "learner"},
          user2: {type: "learner"}
        });
        await ftest.assertSucceeds(runDoc1.set(runData1));

        await ftest.assertFails(experimentDoc2.set({foo: "bar"}));
        await ftest.assertFails(photoDoc2.set({foo: "bar"}));
        await ftest.assertFails(randomDoc2.set({foo: "bar"}));
      });

      test("read is allowed to all authed users that own the parent run", async () => {
        const {runData, runDoc, experimentDoc, photoDoc, randomDoc} = singleUserRunTest({type: "learner"});
        await ftest.assertSucceeds(runDoc.set(runData));

        await ftest.assertSucceeds(experimentDoc.set({foo: "bar"}));
        await ftest.assertSucceeds(photoDoc.set({foo: "bar"}));
        await ftest.assertFails(randomDoc.set({foo: "bar"}));

        await ftest.assertSucceeds(experimentDoc.get());
        await ftest.assertSucceeds(photoDoc.get());
        await ftest.assertFails(randomDoc.get());
      });

      test("read is not allowed to all authed learners that don't own the parent run", async () => {
        const {runData1, runDoc1, experimentDoc1, photoDoc1, randomDoc1, experimentDoc2, photoDoc2, randomDoc2} = dualUserRunTest({
          user1: {type: "learner"},
          user2: {type: "learner"}
        });
        await ftest.assertSucceeds(runDoc1.set(runData1));

        await ftest.assertSucceeds(experimentDoc1.set({foo: "bar"}));
        await ftest.assertSucceeds(photoDoc1.set({foo: "bar"}));
        await ftest.assertFails(randomDoc1.set({foo: "bar"}));

        await ftest.assertFails(experimentDoc2.get());
        await ftest.assertFails(photoDoc2.get());
        await ftest.assertFails(randomDoc2.get());
      });

      test("read is allowed to all authed users that are teachers of the class", async () => {
        const {runData1, runDoc1, experimentDoc1, photoDoc1, randomDoc1, experimentDoc2, photoDoc2, randomDoc2} = dualUserRunTest({
          user1: {type: "learner"},
          user2: {type: "teacher"}
        });
        await ftest.assertSucceeds(runDoc1.set(runData1));

        await ftest.assertSucceeds(experimentDoc1.set({foo: "bar"}));
        await ftest.assertSucceeds(photoDoc1.set({foo: "bar"}));
        await ftest.assertFails(randomDoc1.set({foo: "bar"}));

        await ftest.assertSucceeds(experimentDoc2.get());
        await ftest.assertSucceeds(photoDoc2.get());
        await ftest.assertFails(randomDoc2.get());
      });

      test("read is not allowed to all authed users that are not teachers of the class", async () => {
        const {runData1, runDoc1, experimentDoc1, photoDoc1, randomDoc1, experimentDoc2, photoDoc2, randomDoc2} = dualUserRunTest({
          user1: {type: "learner"},
          user2: {type: "teacher", classHash: "otherClass"}
        });
        await ftest.assertSucceeds(runDoc1.set(runData1));

        await ftest.assertSucceeds(experimentDoc1.set({foo: "bar"}));
        await ftest.assertSucceeds(photoDoc1.set({foo: "bar"}));
        await ftest.assertFails(randomDoc1.set({foo: "bar"}));

        await ftest.assertFails(experimentDoc2.get());
        await ftest.assertFails(photoDoc2.get());
        await ftest.assertFails(randomDoc2.get());
      });

      test("update is allowed to all authed users that own the parent run", async () => {
        const {runData, runDoc, experimentDoc, photoDoc, randomDoc} = singleUserRunTest({type: "learner"});
        await ftest.assertSucceeds(runDoc.set(runData));

        await ftest.assertSucceeds(experimentDoc.set({foo: "bar"}));
        await ftest.assertSucceeds(photoDoc.set({foo: "bar"}));
        await ftest.assertFails(randomDoc.set({foo: "bar"}));

        await ftest.assertSucceeds(experimentDoc.update({foo: "baz"}));
        await ftest.assertSucceeds(photoDoc.update({foo: "baz"}));
        await ftest.assertFails(randomDoc.update({foo: "baz"}));
      });

      test("update is not allowed to all authed learners that don't own the parent run", async () => {
        const {runData1, runDoc1, experimentDoc1, photoDoc1, randomDoc1, experimentDoc2, photoDoc2, randomDoc2} = dualUserRunTest({
          user1: {type: "learner"},
          user2: {type: "learner"}
        });
        await ftest.assertSucceeds(runDoc1.set(runData1));

        await ftest.assertSucceeds(experimentDoc1.set({foo: "bar"}));
        await ftest.assertSucceeds(photoDoc1.set({foo: "bar"}));
        await ftest.assertFails(randomDoc1.set({foo: "bar"}));

        await ftest.assertFails(experimentDoc2.update({foo: "baz"}));
        await ftest.assertFails(photoDoc2.update({foo: "baz"}));
        await ftest.assertFails(randomDoc2.update({foo: "baz"}));
      });

      test("update is allowed to all authed users that are teachers of the class", async () => {
        const {runData1, runDoc1, experimentDoc1, photoDoc1, randomDoc1, experimentDoc2, photoDoc2, randomDoc2} = dualUserRunTest({
          user1: {type: "learner"},
          user2: {type: "teacher"}
        });
        await ftest.assertSucceeds(runDoc1.set(runData1));

        await ftest.assertSucceeds(experimentDoc1.set({foo: "bar"}));
        await ftest.assertSucceeds(photoDoc1.set({foo: "bar"}));
        await ftest.assertFails(randomDoc1.set({foo: "bar"}));

        await ftest.assertSucceeds(experimentDoc2.update({foo: "baz"}));
        await ftest.assertSucceeds(photoDoc2.update({foo: "baz"}));
        await ftest.assertFails(randomDoc2.update({foo: "baz"}));
      });

      test("update is not allowed to all authed users that are not teachers of the class", async () => {
        const {runData1, runDoc1, experimentDoc1, photoDoc1, randomDoc1, experimentDoc2, photoDoc2, randomDoc2} = dualUserRunTest({
          user1: {type: "learner", classHash: "otherClass"},
          user2: {type: "teacher"}
        });
        await ftest.assertSucceeds(runDoc1.set(runData1));

        await ftest.assertSucceeds(experimentDoc1.set({foo: "bar"}));
        await ftest.assertSucceeds(photoDoc1.set({foo: "bar"}));
        await ftest.assertFails(randomDoc1.set({foo: "bar"}));

        await ftest.assertFails(experimentDoc2.update({foo: "baz"}));
        await ftest.assertFails(photoDoc2.update({foo: "baz"}));
        await ftest.assertFails(randomDoc2.update({foo: "baz"}));
      });
    });

  });
}
