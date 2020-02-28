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
    refreshList, selectFn, deleteFn, createFn, stageContentFn, saveFn
  } = UseS3(GetS3Config());

  const setName = (e: React.FormEvent<HTMLInputElement>) => {
    const v = e.currentTarget.value;
    setStagingName(v);
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
          refreshListFn={refreshList}
        />

      { s3Resource
        ? <div className={css.selectedDocument}>
            <div className={css.buttons}>
              <Button className={css.button} onClick={saveFn}>Save</Button>
              <Button className={css.button} onClick={deleteFn}>Delete</Button>
            </div>

            <div className={css.selectedName}>
              Name:
                <input
                  name="name"
                  onChange={setName}
                  value={stagingName}
                />
              <br/>
              Description:
                <input
                  name="description"
                  onChange={setDescription}
                  value={stagingDescription}
                />
              <br/>
              { resourceUrl
                ? <span className={css.url}>
                    url: <a href={resourceUrl} target="_blank">{resourceUrl}</a>
                  </span>
                : null
              }
            </div>

            <div className={css.jsonEditorContainer}>
              <JSONEditor
                width='100%'
                height='100%'
                initialValue={resourceObject}
                onChange={stageContentFn}
              />
              <MobilePreview experiment={resourceObject as IExperiment} />
            </div>
          </div>
        : null
      }
    </div>
  </div>

  );
};
