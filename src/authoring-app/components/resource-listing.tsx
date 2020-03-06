import React from "react";
import { S3Resource } from "@concord-consortium/token-service";
import css from "./resource-listing.module.scss";
import { Button } from "../../shared/components/button";


interface IResourceListOpts {
  resources: S3Resource[];
  resource: S3Resource | null;
  selectFn?: (resource: S3Resource) => void;
}

const ResourceList = (opts: IResourceListOpts) => {
  const { resource, resources, selectFn, disabled} = opts;
  const resElems = resources.map( (r:S3Resource) => {
    const selectHandler = disabled
      ? (e: React.MouseEvent<HTMLElement>) => null
      : (e: React.MouseEvent<HTMLElement>) => { selectFn && selectFn(r); };

      const selected = resource ? resource.id === r.id : false;
    const disabledCSS = disabled ? css.disabled : "";
    const cssName = selected
      ? `${css.resourceItem} ${disabledCSS} ${css.selected}`
      : `${css.resourceItem} ${disabledCSS}`;
    return(
      <div key={r.id} className={cssName} onClick={selectHandler}>
        <a className={css.name}>{r.name}</a>
        <div className={css.description}>{r.description}</div>
      </div>
    );
  });
  return(
    <div className={css.resourceListContainer}>
      <div className={css.resourceList}>{resElems}</div>
    </div>
  );
};

export interface IResourceListingOpts {
  resource: S3Resource|null;
  resources: S3Resource[];
  disabled: boolean;
  refreshListFn: () => void;
  selectFn: (resource: S3Resource) => void;
  createFn?: () => void;
}

export const ResourceListing = (props: IResourceListingOpts) => {
  const {createFn, refreshListFn, disabled} = props;
  return (
    <div className={css.listings}>
      <div className={css.buttons}>
        { createFn
          ? <Button disabled={disabled} className={css.button} onClick={createFn}>
              New
            </Button>
          : null
        }
        <Button disabled={disabled} className={css.button} onClick={refreshListFn}>
          Refresh list
        </Button>
      </div>
      <div className={css.title}>Experiment Templates:</div>
      <ResourceList {... props} />
    </div>
  );
};
