import { Base64 } from "js-base64";

const getUrl = (suffix: string) => `https://us-central1-vortex-e5d5d.cloudfunctions.net/${suffix}`;
const runDataFromClaims = (claims: any) => Base64.encode(JSON.stringify(claims));

export const getSaveExperimentRunUrl = (runKey: string, claims: any) => {
  const runData = runDataFromClaims(claims);
  return getUrl(`saveExperimentRun?runKey=${runKey}&runData=${runData}`);
};

export const createCodeForExperimentRun = (runKey: string, claims: any) => {
  return new Promise<string>((resolve, reject) => {
    const url = getUrl("createCodeForExperimentRun");
    fetch(url, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ runKey, runData: runDataFromClaims(claims) })
    })
    .then(resp => resp.json())
    .then(json => {
      if (json.success) {
        resolve(json.result.code);
      } else {
        reject(json.result);
      }
    })
    .catch(reject);
  });
};

export const getSaveExperimentRunUrlForCode = (code: string) => {
  return new Promise<string>((resolve, reject) => {
    const url = getUrl(`getUrlForExperimentRunCode?code=${code}`);
    fetch(url, {
      method: "GET",
      mode: "cors",
      cache: "no-cache"
    })
    .then(resp => resp.json())
    .then(json => {
      if (json.success) {
        resolve(json.result.url);
      } else {
        reject(json.result);
      }
    })
    .catch(reject);
  });
};

export const getExperimentPhoto = (src: string) => {
  return new Promise<string>((resolve, reject) => {
    const url = getUrl(`getExperimentPhoto?src=${encodeURIComponent(src)}`);
    fetch(url, {
      method: "GET",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json"
        // TODO: add jwt to request header once we setup React context to know we are in Lara
      }
    })
    .then(resp => resp.json())
    .then(json => {
      if (json.success) {
        resolve(json.result);
      } else {
        reject(json.result);
      }
    });
  });
 };
