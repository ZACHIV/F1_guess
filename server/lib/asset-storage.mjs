import { readFile } from 'node:fs/promises';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

function normalizeBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
}

function trimSlash(value, { leading = true, trailing = true } = {}) {
  let nextValue = String(value ?? '').trim();

  if (leading) {
    nextValue = nextValue.replace(/^\/+/u, '');
  }

  if (trailing) {
    nextValue = nextValue.replace(/\/+$/u, '');
  }

  return nextValue;
}

function joinKeyParts(...parts) {
  return parts
    .map((part) => trimSlash(part))
    .filter(Boolean)
    .join('/');
}

function getContentType(key) {
  if (key.endsWith('.mp3')) {
    return 'audio/mpeg';
  }

  if (key.endsWith('.wav')) {
    return 'audio/wav';
  }

  if (key.endsWith('.svg')) {
    return 'image/svg+xml';
  }

  if (key.endsWith('.json')) {
    return 'application/json';
  }

  if (key.endsWith('.jpg') || key.endsWith('.jpeg')) {
    return 'image/jpeg';
  }

  if (key.endsWith('.webp')) {
    return 'image/webp';
  }

  return 'application/octet-stream';
}

export function getAssetStorageConfig(env = process.env) {
  const bucket = String(env.ASSET_STORAGE_BUCKET ?? '').trim();
  const endpoint = String(env.ASSET_STORAGE_ENDPOINT ?? '').trim();
  const publicBaseUrl = trimSlash(env.ASSET_STORAGE_PUBLIC_BASE_URL ?? endpoint, { leading: false });
  const prefix = trimSlash(env.ASSET_STORAGE_PREFIX ?? '');
  const accessKeyId = String(env.ASSET_STORAGE_ACCESS_KEY_ID ?? '').trim();
  const secretAccessKey = String(env.ASSET_STORAGE_SECRET_ACCESS_KEY ?? '').trim();
  const region = String(env.ASSET_STORAGE_REGION ?? 'auto').trim();
  const forcePathStyle = normalizeBoolean(env.ASSET_STORAGE_FORCE_PATH_STYLE, false);

  const enabled = Boolean(bucket && endpoint && accessKeyId && secretAccessKey);

  return {
    enabled,
    bucket,
    endpoint,
    publicBaseUrl,
    prefix,
    region,
    forcePathStyle,
    credentials: enabled
      ? {
          accessKeyId,
          secretAccessKey
        }
      : null
  };
}

export function createAssetStorage(config = getAssetStorageConfig()) {
  if (!config.enabled) {
    return null;
  }

  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials: config.credentials
  });

  return {
    async uploadFile({ localPath, key, cacheControl = 'public, max-age=31536000, immutable' }) {
      const objectKey = joinKeyParts(config.prefix, key);
      const body = await readFile(localPath);

      await client.send(new PutObjectCommand({
        Bucket: config.bucket,
        Key: objectKey,
        Body: body,
        ContentType: getContentType(objectKey),
        CacheControl: cacheControl
      }));

      return {
        key: objectKey,
        url: buildAssetStorageUrl(config, objectKey)
      };
    }
  };
}

export function buildAssetStorageUrl(config, key) {
  const normalizedBaseUrl = trimSlash(config.publicBaseUrl, { leading: false });
  const normalizedKey = trimSlash(key);
  return `${normalizedBaseUrl}/${normalizedKey}`;
}

export function toPublicAssetPath(pathname) {
  const normalized = String(pathname ?? '').replace(/^public\//u, '');
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

export async function resolveStoredAssetUrl(storage, options) {
  if (!storage) {
    return {
      storage: 'local',
      url: toPublicAssetPath(options.localPublicPath)
    };
  }

  const uploaded = await storage.uploadFile(options);
  return {
    storage: 'remote',
    url: uploaded.url,
    key: uploaded.key
  };
}
