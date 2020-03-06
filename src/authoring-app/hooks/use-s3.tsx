import { useState } from "react";
import { S3ResourceHelper, IS3ResourceHelperOpts} from "../utils/s3-resource-helper";
import { S3Resource } from "@concord-consortium/token-service";
import experiments from "../../data/experiments.json";

let helper:S3ResourceHelper = null as unknown as S3ResourceHelper;

export enum S3Status {
  Init = "Initializing",
  CreatePending = "Pending: Create",
  DeletePending = "Pending: Delete",
  SavePending = "Pending: Save",
  LoadPending = "Pending: Load",
  ListPending = "Pending: List",
  Ready = "Ready",
  Error = "Error"
}

// TODO: Maybe use this query hook https://github.com/tannerlinsley/react-query
export const UseS3 = (s3helperOpts: IS3ResourceHelperOpts) => {
  const [ s3Resource, setS3Resource ] = useState(null as S3Resource|null);
  const [ stagingName, setStagingName ] = useState("untitled");
  const [ stagingDescription, setStagingDescription ] = useState("description");
  const [ resources, setResources ] = useState([] as S3Resource[]);
  const [ resourceUrl, setResourceUrl ] = useState(null as string|null);
  const [ resourceContent, setResourceContent ] = useState("");
  const [ status, setStatus ] = useState(S3Status.Init);
  const [ statusMsg, setStatusMsg] = useState("");

  if (!helper) {
    helper = new S3ResourceHelper(s3helperOpts);
  }

  const handleError = (err: Error) => {
    // tslint:disable-next-line
    console.error(err);
    setStatus(S3Status.Error);
    setStatusMsg(err.message);
  };

  const listCallback = (_resources: S3Resource[]) => {
    setResources(_resources.slice());
    setStatus(S3Status.Ready);
  };

  const refreshList = async () => {
    setStatus(S3Status.ListPending);
    const _resources = await helper.listResources();
    listCallback(_resources as S3Resource[]);
  };

  const saveCallback = async (url: string) => {
    setResourceUrl(url);
    setStatus(S3Status.Ready);
    await refreshList();
  };

  const stageContentFn = (jsObject: object) => {
    const json =JSON.stringify(jsObject, null, 2);
    setResourceContent(json);
  };

  const saveFn = async () => {
    setStatus(S3Status.SavePending);
    if(s3Resource) {
      try {
        const newResource = await helper.updateMetaData(s3Resource, stagingName, stagingDescription);
        const url = await helper.s3Upload({
          s3Resource: newResource,
          body: resourceContent,
          filename: stagingName
        });
        saveCallback(url);
      }
      catch(e) {
        handleError(e);
      }
    }
  };


  const loadCallback = (json: string) => {
    setStatus(S3Status.Ready);
    setResourceContent(json);
    setStatus(S3Status.Ready);
  };

  const clearMetaFields = () => {
    setStagingName("untitled");
    setStagingDescription("description");
  };

  const loadFn = async (resource?: S3Resource) => {
    const newResource = resource ? resource : s3Resource;
    if(newResource) {
      setStagingName(newResource.name);
      setStagingDescription(newResource.description);
      setStatus(S3Status.LoadPending);
      setS3Resource(newResource);
      try {
        const json = await helper.loadJSONFromS3(newResource);
        loadCallback(json || "");
      }
      catch(e) {
        handleError(e);
      }

    } else {
      clearMetaFields();
    }
  };

  const createCallback = async ( _resource: S3Resource) => {
    const defaultExperiment= experiments[2];
    const defaultContent = JSON.stringify(defaultExperiment, null, 2);
    const url = await helper.s3Upload({s3Resource: _resource, body: defaultContent});
    setStatus(S3Status.Ready);
    setResourceUrl(url);
    await selectFn(_resource);
    await refreshList();
  };

  const newResourceName = () => {
    const defaultName = "Untitled Experiment";
    let testName = defaultName;
    let count = 0;
    const names = resources.map(i => i.name);
    const exists = (_name:string) => names.includes(_name);
    while(exists(testName)) {
      count++;
      testName = `${defaultName} ${count}`;
    }
    return testName;
  };

  const createFn = async () => {
    const name = newResourceName();
    const description = " ";
    setStatus(S3Status.CreatePending);
    try {
      const _resource: S3Resource = await helper.s3New(name, description);
      await createCallback(_resource);
    }
    catch(e) {
      handleError(e);
    }
  };

  const deleteFn = async () => {
    if(s3Resource) {
      setStatus(S3Status.DeletePending);
      const deleted = await helper.s3Delete(s3Resource);
      try {
        if (deleted) {
          setS3Resource(null);
          setResourceContent("");
          setStatus(S3Status.Ready);
        }
        else {
          setStatus(S3Status.Error);
        }
      }
      catch(e) {
        handleError(e);
      }
    }
    await refreshList();
  };

  const selectFn = async (_resource: S3Resource) => {
    setS3Resource(_resource);
    setResourceUrl(null);
    try {
      await loadFn(_resource);
    }
    catch(e) {
      handleError(e);
    }
  };

  let resourceObject: any = null;
  if(resourceContent) {
    try {
      resourceObject = JSON.parse(resourceContent);
    }
    catch(e) {
      handleError(e);
    }
  }

  // If this is our render, list the resources:
  if(status === S3Status.Init) { refreshList(); }

  return ({
    stagingName, setStagingName, stagingDescription, setStagingDescription,
    s3Resource, setS3Resource, resources, setResources,
    resourceUrl, setResourceUrl, resourceObject, resourceContent,
    setResourceContent, status, setStatus, statusMsg, setStatusMsg,
    refreshList, selectFn, deleteFn, createFn, loadFn, saveFn, stageContentFn
  });
};

