import * as React from "react";
import { Button } from "../shared/components/button";
import { TokenServiceClient, Resource, S3Resource } from "@concord-consortium/token-service";
import * as css from "./resource-selector.scss";

enum UIState {
  Start,
  UserSuppliesJWT,
  PromptForSelectOrCreateResource,
  SelectResource,
  CreateResource,
  SelectedResource
}

export interface IS3Functions {
  list: () => void;
  select: (resource: S3Resource) => void;
  load: (resource: S3Resource) => void;
  save: () => void;
  create: (name:string, description:string) => void;
}

interface IProps {
  resourceResourceId?: string | null;
  functions: IS3Functions;
  resource: S3Resource | null;
  resources: Resource[] | null;
  testClient?: TokenServiceClient;  // for test injection
}

interface IState {
  uiState: UIState;
  error: any;
  status: string | null;
}

export const getTokenServiceEnv = () => {
  return "dev";
};

export default class ResourceSelector extends React.Component<IProps, IState> {
  public state: IState = {
    uiState: UIState.SelectResource,
    error: null,
    status: "Loading...",
  };

  private userSuppliedJWTFieldRef: React.RefObject<HTMLInputElement>;
  private resourceNameFieldRef: React.RefObject<HTMLInputElement>;
  private resourceDescriptionFieldRef: React.RefObject<HTMLInputElement>;
  private resourceSelectFieldRef: React.RefObject<HTMLSelectElement>;
  private client: TokenServiceClient | null = null;

  constructor(props: IProps) {
    super(props);
    this.userSuppliedJWTFieldRef = React.createRef<HTMLInputElement>();
    this.resourceNameFieldRef = React.createRef<HTMLInputElement>();
    this.resourceDescriptionFieldRef = React.createRef<HTMLInputElement>();
    this.resourceSelectFieldRef = React.createRef<HTMLSelectElement>();

    if (props.testClient) {
      this.client = props.testClient;
    }
  }


  public render() {
    const {status, error} = this.state;
    return (
      <div className={css.resourceResourceSelector}>
        {error ? <div className={css.error}>{error.message || error.error || error.toString()}</div> : null}
        {status ? <div className={css.status}>{status.toString()}</div> : null}
        {this.renderUI()}
      </div>
    );
  }

  private renderUI(): JSX.Element {
    switch (this.state.uiState) {
      case UIState.PromptForSelectOrCreateResource:
        return this.renderPromptForSelectOrCreateResource();
      case UIState.SelectResource:
        return this.renderSelectResource();
      case UIState.CreateResource:
        return this.renderCreateResource();
      case UIState.SelectedResource:
        return this.renderSelectedResource();
    }
    // Default:
    return <div/>;
  }

  private listResources() {
    this.props.functions.list();
  }

  private handleSelectExisting = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const saveResources = (resources: Resource[]) => {
      this.setState({
        status: null,
        uiState: resources.length === 0 ? UIState.PromptForSelectOrCreateResource : UIState.SelectResource
      });
    };
    if (this.props.resources) {
      saveResources(this.props.resources);
    }
    else {
      this.listResources();
    }
  }

  private handleCreateNew = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({uiState: UIState.CreateResource});
  }

  private renderPromptForSelectOrCreateResource() {
    const {resources} = this.props;
    const noResources = resources !== null && resources.length === 0;
    return (
      <div className={css.promptForSelectOrCreateResource}>
        {noResources
          ? "No resources found!"
          : <Button
              label="Select Existing Resource"
              data-cy="select-resource"
              onClick={this.handleSelectExisting}
          />
        }
        <Button
          label="Create New Resource"
          data-cy="create-resource"
          onClick={this.handleCreateNew}
        />
      </div>
    );
  }

  private handleSelectResource = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (this.resourceSelectFieldRef.current) {
      const id = this.resourceSelectFieldRef.current.value;
      const resource = (this.props.resources || []).find((r) => r.id === id);
      if (resource) {
        this.setResource(resource);
      }
    }
  }

  private renderSelectResource() {
    const resources = this.props.resources || [];
    return (
      <form className={css.selectResource} onSubmit={this.handleSelectResource}>
        Resource: <select ref={this.resourceSelectFieldRef}>{resources.map((resource) => {
          return <option key={resource.id} value={resource.id}>{resource.name}</option>;
        })}</select>
        <p>
          <Button label="Select Resource" data-cy="select-resource" onClick={this.handleSelectResource} />
          <Button label="Create New Resource" data-cy="create-resource" onClick={this.handleCreateNew}/>
        </p>
      </form>
    );
  }

  private handleCreateResource = () => {
    const nameField = this.resourceNameFieldRef;
    const description = this.resourceDescriptionFieldRef;
    if(nameField.current && description.current) {
      const name = nameField.current.value;
      const desc = description.current.value;
      this.props.functions.create(name, desc);
    }
  }


  private renderCreateResource() {
    return (
      <form className={css.createResource} onSubmit={this.handleCreateResource}>
        <p>
          Name:<br/><input type="text" ref={this.resourceNameFieldRef} />
        </p>
        <p>
          Description:<br/><input type="text" ref={this.resourceDescriptionFieldRef} />
        </p>
        <p>
          <Button
            label="Create Resource"
            data-cy="create-resource"
            onClick={this.handleCreateResource}
          />
          <Button
            label="Select Resiyrce"
            data-cy="select-resource"
            onClick={this.handleSelectExisting}
          />
        </p>
      </form>
    );
  }

  private handleSave = (e: React.MouseEvent<HTMLSpanElement>) => {
    const {functions, resource} = this.props;
    e.preventDefault();
    e.stopPropagation();
    if(resource) {
      functions.save();
    }
  }

  private handleLoad = (e: React.MouseEvent<HTMLSpanElement>) => {
    const {functions, resource} = this.props;
    e.preventDefault();
    e.stopPropagation();
    if(resource) {
      functions.load(resource);
    }
  }

  private renderSelectedResource() {
    const {resource} = this.props;
    return (
      <div className={css.selectedResource}>
        <div>
          <h1>{resource ? resource.name : "No resource selected!"}</h1>
          {resource ? <h2>id: {resource.id}</h2> : null}
        </div>
        <p>
          <Button label="Save" data-cy="save" onClick={this.handleSave}/>
          <Button label="Reload" data-cy="load" onClick={this.handleLoad}/>
          <Button
            label="Select Existing Resource"
            data-cy="select-resource"
            onClick={this.handleSelectExisting}
          />
          <Button label="Create New Resource" data-cy="create-resource" onClick={this.handleCreateNew}/>
        </p>
      </div>
    );
  }

  private setResource = (_resource: Resource) => {
    const resource = _resource as S3Resource;
    this.props.functions.select(resource);
  }

}
