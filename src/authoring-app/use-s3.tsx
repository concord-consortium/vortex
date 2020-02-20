import React, { useState } from "react";
import { S3ResourceHelper, IS3ResourceHelperOpts} from "../shared/utils/s3-helpers";
import { S3Resource, ResourceTool } from "@concord-consortium/token-service";


// TODO: Maybe these could be arguments to UseS3.
const s3helperOpts: IS3ResourceHelperOpts = {
  portalUrl:"https://app.portal.docker",
  tool: "vortex" as ResourceTool
};
const helper = new S3ResourceHelper(s3helperOpts);

export enum S3Status {
  Init = "Initializing",
  CreatePending = "Pending: Create",
  DeletePending = "Pending: Delete",
  SavePending = "Pending: Save",
  LoadPending = "Pending: Load",
  Complete = "Complete",
  Error = "Error"
}

// TODO: Look at this query hook: https://github.com/tannerlinsley/react-query
export const UseS3 = () => {
  const [ s3Resource, setS3Resource ] = useState(null as S3Resource|null);
  const [ resources, setResources ] = useState([] as S3Resource[]);
  const [ resourceUrl, setResourceUrl ] = useState(null as string|null);
  const [ resourceContent, setResourceContent ] = useState("");
  const [ status, setStatus ] = useState(S3Status.Init);
  const [ statusMsg, setStatusMsg] = useState("");

  const handleError = (err: Error) => {
    console.error(err);
    setStatus(S3Status.Error);
    setStatusMsg(err.message);
  };

  const listCallback = (_resources: S3Resource[]) => {
    // TODO: Q: Is this slice necessary here to set to new array?
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
    console.log('Updating draft resourceContent');
    const json =JSON.stringify(jsObject, null, 2);
    setResourceContent(json);
  };

  const saveFn = () => {
    console.log("save triggered");
    setStatus(S3Status.SavePending);
    if(s3Resource) {
      // TODO: Look at this post-refactor.
      // const nameInput = nameRef.current?.value;
      // const descInput = descRef.current?.value;
      // Helper will check dirty status, so this update can return fast:
      // helper.updateMetaData(s3Resource,nameInput, descInput).then(newResource => {
        helper.s3Upload({
          s3Resource,
          body: resourceContent,
          filename: "newResource.name", // TODO: Fix this ⬅
        }).then(saveCallback);
      // });

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


  // const updateMetaFields = (name: string, description: string) => {
  //   if(nameRef && nameRef.current) {
  //     nameRef.current.value = name;
  //     console.log(`updating name ref ${name}`);
  //   }
  //   if(descRef && descRef.current) {
  //     descRef.current.value = description;
  //     console.log(`updating desc ref ${description}`);
  //   }
  // };
  // const clearMetaFields = () => {
  //   updateMetaFields("","");
  // };

  const loadFn = (resource?: S3Resource) => {
    const newResource = resource ? resource : s3Resource;
    if(newResource) {
      // updateMetaFields(newResource.name, newResource.description);
      setStatus(S3Status.LoadPending);
      setS3Resource(newResource);
      helper.loadJSONFromS3(newResource)
      .then(loadCallback)
      .catch(handleError);
    } else {
      // clearMetaFields();
    }
  };

  const createCallback = ( resource: S3Resource) => {
    console.log("create Complete");
    setS3Resource(resource);
    helper.s3Upload({s3Resource: resource, body: "{}"})
    .then((url) => {
      console.log(url);
      setStatus(S3Status.Complete);
      loadFn(resource);
      refreshList();
    });
  };

  const createFn = () => {
    const name = "untitled";
    const description = "a new document";
    console.log("create triggered");
    setStatus(S3Status.CreatePending);
    helper.s3New(name, description)
    .then(createCallback)
    .catch(handleError);
  };

  const deleteFn = () => {
    console.log("Delete resource");
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
    console.log("Set resource");
    setS3Resource(resource);
    setResourceUrl(null);
    loadFn(resource);
  };


  let resourceObject: any = {};
  if(resourceContent) {
    try {
      resourceObject = JSON.parse(resourceContent);
      console.log(resourceObject);
    }
    catch(e) {
      handleError(e);
    }
  }

  // If this is our render, list the resources:
  if(status === S3Status.Init) { refreshList(); }

  return ({
    s3Resource, setS3Resource, resources, setResources,
    resourceUrl, setResourceUrl, resourceObject, resourceContent,
    setResourceContent, status, setStatus, statusMsg, setStatusMsg,
    refreshList, selectFn, deleteFn, createFn, loadFn, saveFn, stageContentFn
  });
};
