import { describe, expect, it } from "vitest";
import {
  signPromotionPreview,
  verifyPromotionPreview,
} from "../../src/utils/promotion-preview";

describe("promotion preview signatures", () => {
  const secret = "preview-secret-for-tests";
  const expires = 2_000_000;

  it("accepts the signed document, status, and expiry", () => {
    const signature = signPromotionPreview(
      "document-1",
      "draft",
      expires,
      secret,
    );
    expect(
      verifyPromotionPreview(
        "document-1",
        "draft",
        expires,
        signature,
        secret,
        expires - 1,
      ),
    ).toBe(true);
  });

  it("rejects tampering and expired links", () => {
    const signature = signPromotionPreview(
      "document-1",
      "draft",
      expires,
      secret,
    );
    expect(
      verifyPromotionPreview(
        "document-2",
        "draft",
        expires,
        signature,
        secret,
        expires - 1,
      ),
    ).toBe(false);
    expect(
      verifyPromotionPreview(
        "document-1",
        "published",
        expires,
        signature,
        secret,
        expires - 1,
      ),
    ).toBe(false);
    expect(
      verifyPromotionPreview(
        "document-1",
        "draft",
        expires,
        signature,
        secret,
        expires,
      ),
    ).toBe(false);
  });
});
