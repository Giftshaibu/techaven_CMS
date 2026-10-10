import type { Core } from '@strapi/strapi';

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: { contentSecurityPolicy: { useDefaults: true } },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: (process.env.FRONTEND_URL || 'http://localhost:3001')
        .split(',')
        .map((origin) => origin.trim()),
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      jsonLimit: process.env.JSON_BODY_LIMIT || '1mb',
      formLimit: process.env.FORM_BODY_LIMIT || '1mb',
      textLimit: process.env.TEXT_BODY_LIMIT || '1mb',
      formidable: { maxFileSize: Number(process.env.UPLOAD_MAX_FILE_SIZE || 10485760) },
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
