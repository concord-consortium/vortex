import { IS3ResourceHelperOpts} from "../shared/utils/s3-resource-helper";
import { ResourceTool } from "@concord-consortium/token-service";

// TODO: Intellgient choosing of portalURL and oauthClientName
export const GetS3Config = (): IS3ResourceHelperOpts => ({
  portalUrl:"https://app.portal.docker",
  oauthClientName: "vortex",
  jwtAppName: "token-service",
  tool: "vortex" as ResourceTool
});
