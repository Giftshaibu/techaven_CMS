const { Client } = require('pg');

function rewriteUrl(value, base) {
  if (typeof value !== 'string') return value;
  // Only imported local Strapi uploads; preserve already remote media.
  if (!/^\/?uploads\//.test(value)) return value;
  return `${base.replace(/\/$/, '')}/${value.replace(/^\/?uploads\//, '')}`;
}

function rewriteFormats(formats, base) {
  if (!formats || typeof formats !== 'object') return formats;
  return Object.fromEntries(Object.entries(formats).map(([name, format]) => [
    name,
    format && typeof format === 'object'
      ? { ...format, url: rewriteUrl(format.url, base) }
      : format,
  ]));
}

async function main() {
  try { process.loadEnvFile(); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const base = process.env.CMS_MEDIA_BASE_URL || 'https://images.techavenmw.com';
  const parsed = new URL(base);
  if (parsed.protocol !== 'https:' || parsed.search || parsed.hash || parsed.username || parsed.password)
    throw new Error('CMS_MEDIA_BASE_URL must be a public HTTPS URL');
  const apply = process.argv.includes('--apply');
  if (process.argv.slice(2).some(arg => arg !== '--apply')) throw new Error('Use no arguments for dry run, or --apply');
  const client = new Client({
    ...(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {
      host: process.env.DATABASE_HOST || '127.0.0.1',
      port: Number(process.env.DATABASE_PORT || 5432),
      database: process.env.DATABASE_NAME || 'techaven_cms',
      user: process.env.DATABASE_USERNAME || 'techaven',
      password: process.env.DATABASE_PASSWORD,
    }),
    ssl: process.env.DATABASE_SSL === 'true' ? {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
      ...(process.env.DATABASE_SSL_CA ? { ca: process.env.DATABASE_SSL_CA } : {}),
    } : false,
  });
  await client.connect();
  try {
    await client.query('BEGIN');
    const schema = process.env.DATABASE_SCHEMA || 'public';
    const table = `"${schema.replace(/"/g, '""')}"."files"`;
    const { rows } = await client.query(`SELECT id, url, preview_url, formats FROM ${table} FOR UPDATE`);
    const changes = rows.map(row => ({
      id: row.id,
      url: rewriteUrl(row.url, base),
      preview_url: rewriteUrl(row.preview_url, base),
      formats: rewriteFormats(row.formats, base),
      original: row,
    })).filter(row => row.url !== row.original.url || row.preview_url !== row.original.preview_url ||
      JSON.stringify(row.formats) !== JSON.stringify(row.original.formats));
    const urls = new Set();
    for (const row of changes) {
      if (row.url !== row.original.url) urls.add(row.url);
      if (row.preview_url !== row.original.preview_url) urls.add(row.preview_url);
      for (const [name, format] of Object.entries(row.formats || {})) {
        if (format?.url !== row.original.formats?.[name]?.url && format?.url) urls.add(format.url);
      }
    }
    const missing = [];
    for (const url of urls) {
      const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(20000) });
      if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) missing.push(url);
    }
    console.log(`Media records to update: ${changes.length}; destination images checked: ${urls.size}; unavailable: ${missing.length}`);
    if (missing.length) {
      for (const url of missing) console.log(`Unavailable: ${url}`);
      throw new Error('Upload the missing image files before applying. Database unchanged.');
    }
    if (!apply) {
      await client.query('ROLLBACK');
      console.log('Dry run complete. No database changes. Back up PostgreSQL, stop CMS writes, then rerun with --apply.');
      return;
    }
    for (const row of changes) await client.query(
      `UPDATE ${table} SET url=$1, preview_url=$2, formats=$3 WHERE id=$4`,
      [row.url, row.preview_url, row.formats, row.id],
    );
    await client.query('COMMIT');
    console.log(`Updated ${changes.length} media records. Existing external URLs and other file metadata preserved.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { await client.end(); }
}

module.exports = { rewriteUrl, rewriteFormats };
if (require.main === module) main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
