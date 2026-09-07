import { BadRequestException, NotFoundException } from "@nestjs/common";
import { decodeImage, imageReplacement } from "./image-upload.util";
import { storedImageContent } from "../http/image-response";

describe("Image compatibility", () => {
  it("preserves base64 whitespace removal, MIME/name defaults and non-avatar image types", () => {
    expect(decodeImage({ data: " Y W J j \n" }, "fallback")).toEqual({ imageName: "fallback", imageMimeType: "image/jpeg", imageData: Buffer.from("abc") });
    expect(decodeImage({ name: " icon.svg ", mimeType: " image/svg+xml ", data: "YWJj" }, "fallback").imageMimeType).toBe("image/svg+xml");
  });

  it.each([{ data: "" }, { data: "%%%" }, { data: "YWJj", mimeType: "text/plain" }])("preserves rejection of invalid upload %j", (input) => {
    expect(() => decodeImage(input, "fallback")).toThrow(BadRequestException);
  });

  it("accepts exactly 5 MiB and rejects larger data", () => {
    const limit = 5 * 1024 * 1024;
    expect(decodeImage({ data: Buffer.alloc(limit).toString("base64") }, "image").imageData.length).toBe(limit);
    expect(() => decodeImage({ data: Buffer.alloc(limit + 1).toString("base64") }, "image")).toThrow("Image must be smaller than 5 MB");
  });

  it("gives removal precedence over upload and ignores metadata-only category/sauce images", () => {
    expect(imageReplacement({ data: "invalid" }, true, "image")).toEqual({ imageName: null, imageMimeType: null, imageData: null });
    expect(imageReplacement({ name: "metadata-only" }, false, "image")).toEqual({});
    expect(imageReplacement(undefined, undefined, "image")).toEqual({});
  });

  it("preserves image-not-found messages and JPEG fallback for stored bytes", () => {
    expect(() => storedImageContent(null, null, "Avatar not found")).toThrow(new NotFoundException("Avatar not found"));
    const bytes = Buffer.from("abc");
    expect(storedImageContent(bytes, "", "missing")).toEqual({ buffer: bytes, mimeType: "image/jpeg" });
  });
});
