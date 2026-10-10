import type { Core } from "@strapi/strapi";
import {
  signPromotionPreview,
  type PreviewStatus,
} from "../src/utils/promotion-preview";

const config = ({
  env,
}: Core.Config.Shared.ConfigParams): Core.Config.Admin => {
  const frontendOrigins = env.array("FRONTEND_URL", []);
  const previewFrontendUrl = env(
    "PREVIEW_FRONTEND_URL",
    frontendOrigins[0] || "",
  );
  const previewSecret = env("PREVIEW_SECRET", env("ADMIN_JWT_SECRET"))!;

  return {
    autoOpen: false,
    auth: {
      secret: env("ADMIN_JWT_SECRET")!,
    },
    apiToken: {
      salt: env("API_TOKEN_SALT")!,
    },
    transfer: {
      token: {
        salt: env("TRANSFER_TOKEN_SALT")!,
      },
    },
    secrets: {
      encryptionKey: env("ENCRYPTION_KEY")!,
    },
    flags: {
      nps: env.bool("FLAG_NPS", true),
      promoteEE: env.bool("FLAG_PROMOTE_EE", true),
      docLinks: env.bool("FLAG_DOC_LINKS", true),
    },
    preview: {
      enabled: Boolean(previewFrontendUrl),
      config: {
        allowedOrigins: frontendOrigins.length
          ? frontendOrigins
          : [previewFrontendUrl],
        async handler(uid, { documentId, status }) {
          if (uid !== "api::promotion.promotion") return null;
          const previewStatus: PreviewStatus =
            status === "published" ? "published" : "draft";
          const expires = Date.now() + 10 * 60 * 1000;
          const signature = signPromotionPreview(
            documentId,
            previewStatus,
            expires,
            previewSecret,
          );
          const url = new URL("/promotions/preview", previewFrontendUrl);
          url.searchParams.set("documentId", documentId);
          url.searchParams.set("status", previewStatus);
          url.searchParams.set("expires", String(expires));
          url.searchParams.set("signature", signature);
          return url.toString();
        },
      },
    },
  };
};

export default config;
