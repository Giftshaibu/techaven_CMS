import { createHmac, timingSafeEqual } from "node:crypto";

export type PreviewStatus = "draft" | "published";

function payload(
  documentId: string,
  status: PreviewStatus,
  expires: number,
): string {
  return JSON.stringify({ documentId, status, expires });
}

export function signPromotionPreview(
  documentId: string,
  status: PreviewStatus,
  expires: number,
  secret: string,
): string {
  return createHmac("sha256", secret)
    .update(payload(documentId, status, expires))
    .digest("hex");
}

export function verifyPromotionPreview(
  documentId: string,
  status: PreviewStatus,
  expires: number,
  signature: string,
  secret: string,
  now = Date.now(),
): boolean {
  if (
    !documentId ||
    !secret ||
    !Number.isSafeInteger(expires) ||
    expires <= now
  )
    return false;
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;

  const expected = Buffer.from(
    signPromotionPreview(documentId, status, expires, secret),
    "hex",
  );
  const supplied = Buffer.from(signature, "hex");
  return (
    expected.length === supplied.length && timingSafeEqual(expected, supplied)
  );
}
