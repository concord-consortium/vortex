import React from "react";
import css from "./authoring.module.scss";
import { IExperiment } from "../../shared/experiment-types";
import { JSONEditor} from "./json-editor";
import { Button } from "../../shared/components/button";
import { ResourceListing } from "./resource-listing";
import { MobilePreview } from "./mobile-preview";
import { UseS3, S3Status } from "../hooks/use-s3";
import { GetS3Config  } from "../utils/getS3Config";
import { UseValidatingEditor } from"../hooks/use-validating-editor";
import { S3Resource } from "@concord-consortium/token-service";
interface IProps {
  experiment?: IExperiment;
}

export const AuthoringComponent = (props : IProps) => {
  // State related to token service and S3 interactions:
  const {
    stagingDescription, stagingName, setStagingDescription, setStagingName,
    s3Resource, resources, resourceUrl, resourceObject, resourceContent, status, statusMsg,
    refreshList, selectFn, deleteFn, createFn, stageContentFn, setResourceContent, saveFn, dirty
  } = UseS3(GetS3Config());

  // State related to the the editor & validation:
  const {
    updateEditorValue, editorValue, editorDirty, isValid,
    errors, setOriginalValue, originalValue, revert,
  } = UseValidatingEditor(resourceContent);

  // When new content is loaded from S3, we set the editor content:
  if(resourceContent !== originalValue) {
    setOriginalValue(resourceContent);
    updateEditorValue(resourceContent);
  }

  let experimentObject: IExperiment = resourceObject;

  if(isValid) {
    try{
      experimentObject = JSON.parse(editorValue);
    }
    catch(e) {
      // tslint:disable-next-line
      console.error(e);
    }
  }

  const saveAll = () => {
    if(isValid) {
      try {
        stageContentFn(JSON.parse(editorValue));
        saveFn(editorValue, stagingName, stagingDescription);
      } catch (e) {
        // tslint:disable-next-line
        console.error(e);
      }
    }
  };

  const disableNavigation = status !== S3Status.Ready ? true : false;
  const disableSave = !dirty && !editorDirty;
  const requireConfirmation = (status !== S3Status.Ready || dirty || editorDirty);

  // Confirm browser based navigation away from dirty editor:
  if (requireConfirmation) {
    window.onbeforeunload = () => "";
  }
  else {
    window.onbeforeunload = null;
  }

  // Confirm application actons that might cause data loss:
  const confirmDirtyAction = async (msg: string, action: () => void ) => {
    if(requireConfirmation) {
      if(window.confirm(msg)) {
        return await action();
      }
      return;
    }
    return await action();
  };

  // Invoked when a user selects a new resource:
  const select = async (resource: S3Resource) => {
    const warningMessage = `
      Your unsaved work in ${stagingName} will lost if you navigate away.
      Click cancel to avoid loosing your work.
    `;
    confirmDirtyAction(warningMessage, () => selectFn(resource));
  };

  // Invoked when a user clicks on "new"
  const create = async () => {
    const warningMessage = `
    You will loose changes to ${stagingName} if create a new resource now.
    Click cancel to avoid loosing your work.
    `;
    confirmDirtyAction(warningMessage, () => createFn());
  };

  // Invoked when user clicks on "cancel"
  const askRevert = async () => {
    const warningMessage = `
    You are about to revert unsaved work in ${stagingName}.
    Unless you click cancel you will lose changes.`;
    confirmDirtyAction(warningMessage, () => revert());
  };

  // The name field also has to set meta data content if possibe:
  const setName = (e: React.FormEvent<HTMLInputElement>) => {
    const _name = e.currentTarget.value;
    const {metadata} = resourceObject;
    setStagingName(_name);
    if(metadata && metadata) {
      metadata.name = _name;
      if (s3Resource && s3Resource.id) {
        metadata.uuid = s3Resource.id;
      }
    }
    stageContentFn(resourceObject);
  };

  // The description is part of the ResourceObject in Firestore.
  // It doesn't have a corresponding S3 property, or metadata prop.
  const setDescription = (e: React.FormEvent<HTMLInputElement>) => {
    const v = e.currentTarget.value;
    setStagingDescription(v);
  };

  return (
    <div className={css.authoring}>
      <div className={css.header}>
        <div className={status === S3Status.Error
          ? `${css.status} ${css.error}`
          : css.status}>
          Status: {status}
          {statusMsg.length > 0 ? <span>${statusMsg}</span>: null}
        </div>
      </div>

      <div className={css.twoEditorContainer}>
        <ResourceListing
          resources={resources}
          resource={s3Resource}
          createFn={create}
          selectFn={select}
          disabled={disableNavigation}
          refreshListFn={refreshList}
        />

      { s3Resource
        ? <div className={css.selectedDocument}>
            <div className={css.buttons}>
              <Button
                disabled={disableNavigation || disableSave}
                className={css.button}
                onClick={saveAll}>
              Save
              </Button>
              <Button
                disabled={disableNavigation || disableSave}
                className={css.button}
                onClick={askRevert}>
              Cancel
              </Button>
              <Button
                className={css.button}
                onClick={deleteFn}
                disabled={disableNavigation}
              >
              Delete
              </Button>
            </div>
            <div className={css.selectedName}>
              <div className={css.metaFields}>
                <div className={css.formField}>
                    <label>Name:</label>
                    <input
                      name="name"
                      onChange={setName}
                      value={stagingName}
                    />
                </div>
                <div className={css.formField}>
                  <label>Description:</label>
                  <input
                    name="description"
                    onChange={setDescription}
                    value={stagingDescription}
                  />
                </div>

                <div className={css.links}>
                  <span className={css.exampleLink}>
                    <a href="/shared/index.html?mockSensor" target="_blank">
                      Example Templates <span>&#8599;</span>
                    </a>
                  </span>
                  { resourceUrl
                    ? <div>
                      <span className={css.url}>
                            url: <a href={resourceUrl} target="_blank">{resourceUrl}</a>
                          </span>
                        </div>
                    : null
                  }
                </div>
              </div>
            </div>

            <div className={css.editorAndPreview}>
              <div className={css.jsonEditorContainer}>
                <JSONEditor
                  width='50vw'
                  height='70vh'
                  value={editorValue}
                  update={updateEditorValue}
                  errors={errors}
                />
              </div>
              <div>
                { isValid
                  ? null
                  : <div className={css.warning}>
                      Your current JSON is invalid, using last valid version.
                    </div>
                }
                <MobilePreview experiment={experimentObject} />
              </div>
            </div>
          </div>
        : null
      }
    </div>
  </div>

  );
};
