import { timingSafeEqual } from 'node:crypto';
import { errors } from '@strapi/utils';

export default (policyContext: any, _config: unknown, { strapi }: { strapi: any }) => {
  const configured = process.env.STRAPI_SYNC_TOKEN || '';
  const header = policyContext.request.headers.authorization;
  const supplied = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : '';
  const configuredBuffer = Buffer.from(configured);
  const suppliedBuffer = Buffer.from(supplied);
  const valid = configuredBuffer.length > 0
    && configuredBuffer.length === suppliedBuffer.length
    && timingSafeEqual(configuredBuffer, suppliedBuffer);

  if (!valid) {
    strapi.log.warn(JSON.stringify({ event: 'catalog_sync_auth_failure', path: policyContext.request.path }));
    throw new errors.UnauthorizedError('Invalid catalog sync token');
  }
  return true;
};
