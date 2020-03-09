import React from "react";
import css from "./authoring.module.scss";
import { IExperiment } from "../../shared/experiment-types";
import JSONEditor from "./json-editor";
import { Button } from "../../shared/components/button";
import { ResourceListing } from "./resource-listing";
import { MobilePreview } from "./mobile-preview";
import { UseS3, S3Status } from "../hooks/use-s3";
import { GetS3Config  } from "../utils/getS3Config";

interface IProps {
  experiment?: IExperiment;
}

export const AuthoringComponent = (props : IProps) => {
  const {
    stagingDescription, stagingName, setStagingDescription, setStagingName,
    s3Resource, resources, resourceUrl, resourceObject, status, statusMsg,
    refreshList, selectFn, deleteFn, createFn, stageContentFn, saveFn, dirty
  } = UseS3(GetS3Config());
  const disableNavigation = status !== S3Status.Ready ? true : false;
  const disableSave = !dirty;
  const disableNew = dirty;
  const setName = (e: React.FormEvent<HTMLInputElement>) => {
    const _name = e.currentTarget.value;
    const {metadata} = resourceObject;
    setStagingName(_name);
    metadata.name = _name;
    if (s3Resource && s3Resource.id) {
      metadata.uuid = s3Resource.id;
    }
    stageContentFn(resourceObject);
  };

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
          createFn={createFn}
          selectFn={selectFn}
          disabled={disableNavigation}
          refreshListFn={refreshList}
        />

      { s3Resource
        ? <div className={css.selectedDocument}>
            <div className={css.buttons}>
              <Button
                disabled={disableNavigation || disableSave}
                className={css.button}
                onClick={saveFn}>
              Save
              </Button>
              <Button
                disabled={disableNavigation || disableSave}
                className={css.button}
                onClick={saveFn}>
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
                { resourceUrl
                  ? <span className={css.url}>
                      url: <a href={resourceUrl} target="_blank">{resourceUrl}</a>
                    </span>
                  : null
                }
              </div>
            </div>

            <div className={css.editorAndPreview}>
              <div className={css.jsonEditorContainer}>
                <JSONEditor
                  width='50vw'
                  height='70vh'
                  initialValue={resourceObject}
                  onChange={stageContentFn}
                />
              </div>
              <MobilePreview experiment={resourceObject as IExperiment} />
            </div>
          </div>
        : null
      }
    </div>
  </div>

  );
};
