import * as AWS from "aws-sdk";
import {
  TokenServiceClient,
  S3Resource,
  FindAllQuery,
  ResourceTool
} from "@concord-consortium/token-service";
import { IJwtResponse } from "@concord-consortium/lara-plugin-api";
import { getURLParam } from "../../shared/utils/get-url-param";
import ClientOAuth2 from "client-oauth2";
import "whatwg-fetch"; // window.fetch polyfill for older browsers (IE)

// TODO: Probably these shouldn't be Constants
export const DEFAULT_FILENAME = "vortex.json";
export const DEFAULT_CONTENT_TYPE = "application/json";
export const DEFAULT_CACHE_CONTROL = "no-cache";

export interface ISimplifiedS3UploadParams {
  s3Resource: S3Resource;
  body: AWS.S3.Types.Body;
  filename?: string;     // Can be inferred by s3Resource.name
  contentType?: string;  // Defaults to DEFAULT_CONTENT_TYPE
  cacheControl?: string; // Defaults to DEFAULT_CACHE_CONTROL
}

// Portal has to have AuthClient configured with this clientId.
const PORTAL_AUTH_PATH = "/auth/oauth_authorize";

export interface IS3ResourceHelperOpts {
  portalUrl: string;       // eg: https://learn-staging.concord.org/
  tool: ResourceTool;
  oauthClientName: string; // Should match Portal → Admin → Clients
  jwtAppName: string;      // Should match Portal → Admin → Firebase Apps
  extraState?: any;        // For perserving state durring OAuth callback.
}


/**
 * Helper class for working with TokenService S3Reources.
 * TODO: This file should probably be added to the TokenService Client Library.
 *
 * @export
 * @class S3ResourceHelper
 */
export class S3ResourceHelper {

  // The URL for portal are we will be working with:
  public readonly portalUrl: string;

  // Anything in the query or hash params should be saved here:
  public readonly extraState: any;

   // Portal OAuthClient name. (Portal → Admin → Clients)
  public readonly oauthClientName: string;

  // Portal JWT Firebase App name. (Portal → Admin → Firebase Apps)
  public readonly jwtAppName: string = "token-service"; // portal FirebaseApp

  private client: TokenServiceClient;
  private tool: ResourceTool;

  constructor(options: IS3ResourceHelperOpts) {
    this.portalUrl = options.portalUrl;
    this.extraState = options.extraState;
    this.oauthClientName = options.oauthClientName;
    this.tool = options.tool;
  }

  /**
   * Authenticate with portal using OAuth2.
   *
   * @returns {Promise<ClientOAuth2.Token>}
   * @memberof S3ResourceHelper
   */
  authorizeInPortal(): Promise<ClientOAuth2.Token> {
    const { extraState, portalUrl } = this;
    const state = extraState ? JSON.stringify({ extraState  }) : undefined;
    const portalAuth = new ClientOAuth2({
      clientId: this.oauthClientName,
      // Make development easier. Note that if you're using custom Portal using query param,
      // this query param will have to part of the redirect URI registered in Portal. E.g. for local env:
      // "http://localhost:8080/authoring.html?portal=http://app.rigse.docker"
      // Also, note that we remove all the hash parameters, as redirect_uri can't include them.
      // We have to use 'state' property to maintain them.
      redirectUri: window.location.origin + window.location.pathname + window.location.search,
      authorizationUri: `${portalUrl}${PORTAL_AUTH_PATH}`,
      state
    });

    if (getURLParam("access_token") || getURLParam("error")) {
      // We're coming back from Portal with access_token or error.
      return portalAuth.token.getToken(window.location.href)
        .then((token) => {
          // Remove fragment that includes access token and other data coming from
          // server to make leak a bit less likely.
          history.replaceState("", document.title, window.location.pathname + window.location.search);
          return token;
        });
    } else if (getURLParam("code")) {
      // We're coming back from Portal that doesn't support implicit flow.
      // Throw an error to avoid infinite loop of redirects.
      return Promise.reject(
        new Error("Selected Portal does not support OAuth2 implicit flow. Please use another Portal.")
      );
    } else {
      // Initial page load, no info from Portal (either access token or error). Redirect to Portal to get authorization.
      window.location.href = portalAuth.token.getUri();
      return new Promise(() => {
        // just to make TS happy about types return Promise. It doesn't matter as we're redirecting to Portal anyway.
      });
    }
  }

  /**
   * The URL used to fetch a token for our app
   *
   * @readonly
   * @memberof S3ResourceHelper
   */
  get firebaseTokenGettingUrl() {
    const appName = this.jwtAppName;
    return `${this.portalUrl}/api/v1/jwt/firebase?firebase_app=${appName}`;
  }

  /**
   * Get a new Jwt from the portal to speak to the firebase token-service.
   *
   * @param {ClientOAuth2.Token} token
   * @returns Promise<IJwtResponse>
   * @memberof S3ResourceHelper
   */
  getFirebaseJwt(token: ClientOAuth2.Token):Promise<IJwtResponse>  {
    const authHeader = {Authorization: `Bearer ${token.accessToken}`};
    return fetch(this.firebaseTokenGettingUrl, {headers: authHeader})
      .then(response => response.json());
  }

  /**
   * Gets a TokenServiceClient (a connection to firebase token-service app)
   *
   * @returns Promise<TokenServiceClient>
   * @memberof S3ResourceHelper
   */
  async getTokenServiceClient():Promise<TokenServiceClient>  {
    // Remember our last client:
    if (this.client) { return this.client; }

    // get OAuth token from the portal:
    const oauthToken = await this.authorizeInPortal();

    // get our firebase JWT from the portal:
    const firebaseJwt = await this.getFirebaseJwt(oauthToken);

    // return our new TokenServiceClient:
    this.client = new TokenServiceClient({jwt: firebaseJwt.token, env: "staging"});
    return this.client;
  }

  /**
   * Write to an S3Resource (must exist already)
   * @returns {string} publicS3Url
   * @param {ISimplifiedS3UploadParams} {filename, s3Resource, body, contentType = "", cacheControl = ""}
   * @memberof S3ResourceHelper
   */
  async s3Upload({
    s3Resource,
    body,
    filename = s3Resource.name,
    contentType = DEFAULT_CONTENT_TYPE,
    cacheControl = DEFAULT_CACHE_CONTROL}: ISimplifiedS3UploadParams) {

    const {bucket, region} = s3Resource;
    const client = await this.getTokenServiceClient();
    const credentials = await client.getCredentials(s3Resource.id);
    const {accessKeyId, secretAccessKey, sessionToken} = credentials;
    const s3 = new AWS.S3({region, accessKeyId, secretAccessKey, sessionToken});
    const key = this.client.getPublicS3Path(s3Resource, filename);
    const result = await s3.upload({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentEncoding: "UTF-8",
      CacheControl: cacheControl
    }).promise();
    return this.client.getPublicS3Url(s3Resource, filename);
  }

  /**
   * S3Delete() Removes an S3Resource reference from firestore
   * NB: For the moment we don't destroy the underlying S3 object.
   * @param {S3Resource} s3Resource
   * @returns true for successful delete.
   * @memberof S3ResourceHelper
   */
  async s3Delete(s3Resource: S3Resource) {
    const client = await this.getTokenServiceClient();
    await client.getCredentials(s3Resource.id);
    try {
      const {bucket, region, name} = s3Resource;
      const credentials = await client.getCredentials(s3Resource.id);
      const {accessKeyId, secretAccessKey, sessionToken} = credentials;
      const s3 = new AWS.S3({region, accessKeyId, secretAccessKey, sessionToken});
      // TBD: We don't actually get delete permissions from the token service.
      // If we want to enable that we can in future releases.
      // await s3.deleteObject({Bucket: bucket, Key: name}).promise();
      client.deleteResource(s3Resource.id);
      return true;
    }
    catch(error) {
      this.error(error);
    }
    return false;
  }

  /**
   * Save data to a new S3Resource.
   *
   * @param {string} filename
   * @param {string} content
   * @returns Promise<string>
   * @memberof S3ResourceHelper
   */
  async s3New(filename:string, description: string) {
    const client = await this.getTokenServiceClient();
    const resource: S3Resource = await client.createResource(
      {
        tool: this.tool,
        type: "s3Folder",
        name: filename,
        description,
        accessRuleRole: "owner",
        accessRuleType: "user",
        accessRules: []
      }) as S3Resource;
    return resource;
  }

  /**
   * List resources for this tool
   *
   * @param {FindAllQuery} options
   * @returns Resource[]
   * @memberof S3ResourceHelper
   */
  async listResources() {
    const query: FindAllQuery = {
      tool: this.tool,
      amOwner: "true",
      type: "s3Folder"
    };

    const client = await this.getTokenServiceClient();
    return await client.listResources(query);
  }

  error (msg: string) {
    // TODO: something better later.
    // tslint:disable-next-line
    console.error(msg);
  }

  update (state: string, msg: string){
    // TODO: something better later.
    // tslint:disable-next-line
    console.log(msg);
  }

  async updateMetaData (
    s3Resource: S3Resource,
    newName?: string,
    newDescription?: string) {
      let dirty = false;
      if(newName && (newName !== s3Resource.name)) {
        s3Resource.name = newName as string;
        dirty = true;
      }
      if(newDescription && (newDescription !== s3Resource.description)) {
        s3Resource.description = newDescription;
        dirty = true;
      }
      if(dirty) {
        const client = await this.getTokenServiceClient();
        const result = await client.updateResource(s3Resource.id, s3Resource) as S3Resource;
        return result;
      }
      return s3Resource;
  }

  async loadJSONFromS3(s3Resource: S3Resource) {
    const client = await this.getTokenServiceClient();
    if (!client || !s3Resource) {
      this.error("loadJSONFromS3: Missing token service client or s3Resource");
      return;
    }
    this.update("pending", "loadJSONFromS3: S3 fetch operation");

    const s3Url = client.getPublicS3Url(s3Resource, s3Resource.name);
    try {
      const response = await fetch(s3Url as string);
      if (response.status !== 200) {
        this.error("loadJSONFromS3: Fail fetch3");
        return;
      }
      return await response.text();
    } catch (error) {
      this.error(`loadJSONFromS3: ${error}`);
    }
  }

}