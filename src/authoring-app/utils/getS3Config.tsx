import { IS3ResourceHelperOpts} from "./s3-resource-helper";
import { ResourceTool } from "@concord-consortium/token-service";
import {getURLParam} from "../../shared/utils/get-url-param";

export const PORTAL_URL_PARAM = "portalUrl";
const devPortalUrl = "app.portal.docker";


const guessPortalUrl = ():string => {
  const { host } = window.location;
  if (host.match(/staging\./)) {
    return "learn.staging.concord.org";
  }
  if (host.match(/concord\.org/)) {
    return "learn.concord.org";
  }
  // tslint:disable-next-line
  console.warn(`Unrecognized host: ${host}, using ${devPortalUrl} for portal`);
  // tslint:disable-next-line
  console.log(`Specify the auth portal via query param '${PORTAL_URL_PARAM}'`);
  return devPortalUrl;
};

const fromUrlParam = getURLParam('portalUrl') as string;
const guessedHost = fromUrlParam || guessPortalUrl();
const portalUrl = `//${guessedHost}`;
export const GetS3Config = (): IS3ResourceHelperOpts => ({
  portalUrl,
  oauthClientName: "vortex",
  jwtAppName: "token-service",
  tool: "vortex" as ResourceTool
});
