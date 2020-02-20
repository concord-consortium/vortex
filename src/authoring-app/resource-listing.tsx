import React from "react";
import { S3Resource } from "@concord-consortium/token-service";
import css from "./resource-listing.module.scss";
import Button from "../shared/components/button";


interface IResourceListOpts {
  resources: S3Resource[];
  resource: S3Resource | null;
  selectFn?: (resource: S3Resource) => void;
}

const ResourceList = (opts: IResourceListOpts) => {
  const { resource, resources, selectFn} = opts;
  const resElems = resources.map( (r:S3Resource) => {
    const selectHandler = (e: React.MouseEvent<HTMLElement>) => {
      console.log(`selected ${r.name}`);
      selectFn && selectFn(r);
    };
    const selected = resource ? resource.id == r.id : false;
    const cssName = selected
      ? `${css.resourceItem} ${css.selected}`
      : css.resourceItem;
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
  refreshListFn: () => void;
  selectFn: (resource: S3Resource) => void;
  createFn?: () => void;
}

export const ResourceListing = (props: IResourceListingOpts) => {
  const {createFn, refreshListFn} = props;
  return (
    <div className={css.listings}>
      <div className={css.buttons}>
        { createFn
          ? <Button className={css.button} onClick={createFn}>New</Button>
          : null
        }
        <Button className={css.button} onClick={refreshListFn}>Refresh list</Button>
      </div>
      <div className={css.title}>Experiment Templates:</div>
      <ResourceList {... props} />
    </div>
  );
};
