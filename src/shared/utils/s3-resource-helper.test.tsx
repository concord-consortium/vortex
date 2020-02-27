import { S3ResourceHelper } from "./s3-resource-helper";
import * as AWS from "aws-sdk";
import {
  TokenServiceClient, S3Resource, ResourceTool,
  Credentials, S3ResourceTool
} from "@concord-consortium/token-service";

describe("S3 helper", () => {
  const tokenServiceClient = new TokenServiceClient({jwt: "test"});
  describe("s3Upload", () => {
    beforeEach(() => {
      S3ResourceHelper.prototype.getTokenServiceClient = jest.fn(() => {
        return new Promise(resolve => tokenServiceClient);
      });

      AWS.S3.prototype.upload = jest.fn((params) => {
        return {
          promise: () => new Promise(resolve => {
            resolve({ Key: `${params.Key}`});
          })
        };
      }) as any;
    });

    // TODO: We need at least one 😺 happy path test. TBD
    it.skip("should call AWS.S3.upload", async () => {
      const helper = new S3ResourceHelper({
        jwtAppName:"test",
        oauthClientName:"test",
        portalUrl:"https://test.me/",
        tool: S3ResourceTool.Vortex,
        extraState: {one:1, two:2}
      });
      const resource: S3Resource = {
        accessRules: [],
        description: "descsription",
        name: "name",
        tool: S3ResourceTool.Vortex,
        bucket: "non-existing-test-bucket",
        folder: "non-existing-test-folder",
        region: "Middle Earth",
        type: "s3Folder",
        id: "FAKE-UUID"
      };
      const params = {
        s3Resource: resource,
        body: "body"
      };
      const url = await helper.s3Upload(params);
      expect(AWS.S3.prototype.upload).toHaveBeenCalledTimes(1);
      const expectedKey = `test-folder/test/test.txt`;
      expect(AWS.S3.prototype.upload).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: expectedKey,
        Body: params.body,
        ContentEncoding: "UTF-8"
      });
      expect(url).toEqual(`https://test-bucket.s3.amazonaws.com/${expectedKey}`);
    });
  });
});
