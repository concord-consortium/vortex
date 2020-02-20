import {s3Upload, IS3UploadParams, getClient} from "./s3-helpers";
import * as AWS from "aws-sdk";
import { TokenServiceClient, S3Resource, Credentials } from "@concord-consortium/token-service";

describe("S3 helpers", () => {
  describe("s3Upload", () => {
    beforeEach(() => {
      AWS.S3.prototype.upload = jest.fn((params) => {
        return {
          promise: () => new Promise(resolve => {
            resolve({ Key: `${params.Key}`});
          })
        };
      }) as any;
    });

    it("should call AWS.S3.upload with correct arguments and return Cloudfront URL", async () => {
      const client = new TokenServiceClient({jwt: "test"});
      const s3Resource: S3Resource = {
        id: "test",
        name: "vortex",
        description: "test vortex",
        type: "s3Folder",
        tool: "vortex",
        accessRules: [],
        bucket: "test-bucket",
        folder: "test-folder",
        region: "test-region"
      };
      const credentials: Credentials = {
        accessKeyId: "test",
        expiration: new Date(),
        secretAccessKey: "test",
        sessionToken: "test",
        bucket: "test-bucket",
        keyPrefix: "vortex/test/"
      };
      const params: IS3UploadParams = {
        client,
        credentials,
        filename: "test.txt",
        s3Resource,
        body: "test",
        cacheControl: "max-age=123",
        contentType: "application/test"
      };
      const url = await s3Upload(params);
      expect(AWS.S3.prototype.upload).toHaveBeenCalledTimes(1);
      const expectedKey = `test-folder/test/test.txt`;
      expect(AWS.S3.prototype.upload).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: expectedKey,
        Body: params.body,
        ContentEncoding: "UTF-8",
        ContentType: params.contentType,
        CacheControl: params.cacheControl
      });
      expect(url).toEqual(`https://test-bucket.s3.amazonaws.com/${expectedKey}`);
    });
  });
  describe("The whole taco", () => {
    it("is a thing", () => {
      console.log("💀  💀  💀");
      getClient("vortex").then(r => console.log(r));
    });
  });
});
