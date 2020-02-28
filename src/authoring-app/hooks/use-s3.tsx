import { useState } from "react";
import { S3ResourceHelper, IS3ResourceHelperOpts} from "../utils/s3-resource-helper";
import { S3Resource } from "@concord-consortium/token-service";

let helper:S3ResourceHelper = null as unknown as S3ResourceHelper;

export enum S3Status {
  Init = "Initializing",
  CreatePending = "Pending: Create",
  DeletePending = "Pending: Delete",
  SavePending = "Pending: Save",
  LoadPending = "Pending: Load",
  Complete = "Complete",
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
    setStatus(S3Status.Complete);
  };

  const refreshList = () => {
    helper.listResources()
    .then(listCallback)
    .catch(handleError);
  };

  const saveCallback = (url: string) => {
    setResourceUrl(url);
    setStatus(S3Status.Complete);
  };

  const stageContentFn = (jsObject: object) => {
    const json =JSON.stringify(jsObject, null, 2);
    setResourceContent(json);
  };

  const saveFn = () => {
    setStatus(S3Status.SavePending);
    if(s3Resource) {
      helper.updateMetaData(s3Resource, stagingName, stagingDescription).then(newResource => {
        helper.s3Upload({
          s3Resource,
          body: resourceContent,
          filename: stagingName
        }).then(saveCallback);
      });

    }
    else {
      setStatus(S3Status.Error);
    }
  };


  const loadCallback = (json: string) => {
    setStatus(S3Status.Complete);
    setResourceContent(json);
    setStatus(S3Status.Complete);
  };

  const clearMetaFields = () => {
    setStagingName("untitled");
    setStagingDescription("description");
  };

  const loadFn = (resource?: S3Resource) => {
    const newResource = resource ? resource : s3Resource;
    if(newResource) {
      setStagingName(newResource.name);
      setStagingDescription(newResource.description);
      setStatus(S3Status.LoadPending);
      setS3Resource(newResource);
      helper.loadJSONFromS3(newResource)
      .then(loadCallback)
      .catch(handleError);
    } else {
      clearMetaFields();
    }
  };

  const createCallback = ( resource: S3Resource) => {
    setS3Resource(resource);
    helper.s3Upload({s3Resource: resource, body: ""})
    .then((url) => {
      setStatus(S3Status.Complete);
      loadFn(resource);
      refreshList();
    });
  };

  const createFn = () => {
    const name = "untitled";
    const description = "a new document";
    setStatus(S3Status.CreatePending);
    helper.s3New(name, description)
    .then(createCallback)
    .catch(handleError);
  };

  const deleteFn = () => {
    if(s3Resource) {
      setStatus(S3Status.DeletePending);
      helper.s3Delete(s3Resource)
      .then((deleted) => {
        if (deleted) {
          setS3Resource(null);
          setResourceContent("");
          setStatus(S3Status.Complete);
        }
        else {
          setStatus(S3Status.Error);
        }
        refreshList();
      });
    }
  };

  const selectFn = (resource: S3Resource) => {
    setS3Resource(resource);
    setResourceUrl(null);
    loadFn(resource);
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
