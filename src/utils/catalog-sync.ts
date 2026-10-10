export const PRODUCT_FIELDS = [
  'externalId', 'slug', 'name', 'brand', 'category', 'thumbnailUrl', 'active', 'sourceUpdatedAt',
] as const;
export const SHOP_FIELDS = [
  'externalId', 'slug', 'name', 'logoUrl', 'locationLabel', 'verified', 'active', 'sourceUpdatedAt',
] as const;

type SyncKind = 'product' | 'shop';

export class SyncPayloadError extends Error {
  constructor(public readonly fields: Record<string, string>) {
    super('Invalid catalog sync payload');
  }
}

function optionalUrl(value: unknown, field: string, errors: Record<string, string>) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    errors[field] = 'Must be a URL string';
    return null;
  }
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    return value;
  } catch {
    errors[field] = 'Must be a valid HTTP or HTTPS URL';
    return null;
  }
}

export function parseSyncPayload(kind: SyncKind, input: unknown): Record<string, unknown> {
  const errors: Record<string, string> = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new SyncPayloadError({ body: 'Expected a JSON object' });
  }
  const payload = input as Record<string, unknown>;
  const allowed = kind === 'product' ? PRODUCT_FIELDS : SHOP_FIELDS;
  for (const key of Object.keys(payload)) {
    if (!allowed.includes(key as never)) errors[key] = 'Field is not allowed';
  }

  const result: Record<string, unknown> = {};
  for (const field of ['externalId', 'slug', 'name'] as const) {
    const value = field === 'externalId' && typeof payload[field] === 'number'
      ? String(payload[field])
      : payload[field];
    if (typeof value !== 'string' || !value.trim()) errors[field] = 'Required non-empty string';
    else result[field] = value.trim();
  }
  for (const field of kind === 'product' ? ['brand', 'category'] : ['locationLabel']) {
    const value = payload[field];
    if (value !== undefined && value !== null && typeof value !== 'string') errors[field] = 'Must be a string';
    else if (typeof value === 'string') result[field] = value.trim() || null;
  }

  const urlField = kind === 'product' ? 'thumbnailUrl' : 'logoUrl';
  if (payload[urlField] !== undefined) result[urlField] = optionalUrl(payload[urlField], urlField, errors);

  if (typeof payload.active !== 'boolean') errors.active = 'Required boolean';
  else result.active = payload.active;
  if (kind === 'shop' && payload.verified !== undefined) {
    if (typeof payload.verified !== 'boolean') errors.verified = 'Must be a boolean';
    else result.verified = payload.verified;
  }
  if (payload.sourceUpdatedAt !== undefined && payload.sourceUpdatedAt !== null) {
    if (typeof payload.sourceUpdatedAt !== 'string' || Number.isNaN(Date.parse(payload.sourceUpdatedAt))) {
      errors.sourceUpdatedAt = 'Must be a valid ISO date-time';
    } else {
      result.sourceUpdatedAt = new Date(payload.sourceUpdatedAt).toISOString();
    }
  }

  if (Object.keys(errors).length) throw new SyncPayloadError(errors);
  return result;
}

export function isStaleEvent(current: string | null | undefined, incoming: unknown): boolean {
  return Boolean(current && typeof incoming === 'string' && Date.parse(incoming) < Date.parse(current));
}
