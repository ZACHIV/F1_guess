import { describe, expect, it } from 'vitest';
import {
  buildAssetStorageUrl,
  getAssetStorageConfig,
  resolveStoredAssetUrl,
  toPublicAssetPath
} from '../server/lib/asset-storage.mjs';

describe('getAssetStorageConfig', () => {
  it('stays disabled when required env vars are missing', () => {
    expect(getAssetStorageConfig({})).toMatchObject({
      enabled: false,
      bucket: '',
      endpoint: ''
    });
  });

  it('builds an enabled config from S3-compatible env vars', () => {
    expect(getAssetStorageConfig({
      ASSET_STORAGE_BUCKET: 'f1-assets',
      ASSET_STORAGE_ENDPOINT: 'https://abc.r2.cloudflarestorage.com',
      ASSET_STORAGE_PUBLIC_BASE_URL: 'https://cdn.example.com/assets/',
      ASSET_STORAGE_PREFIX: '/f1-guess/',
      ASSET_STORAGE_REGION: 'auto',
      ASSET_STORAGE_ACCESS_KEY_ID: 'key',
      ASSET_STORAGE_SECRET_ACCESS_KEY: 'secret',
      ASSET_STORAGE_FORCE_PATH_STYLE: 'true'
    })).toMatchObject({
      enabled: true,
      bucket: 'f1-assets',
      endpoint: 'https://abc.r2.cloudflarestorage.com',
      publicBaseUrl: 'https://cdn.example.com/assets',
      prefix: 'f1-guess',
      region: 'auto',
      forcePathStyle: true,
      credentials: {
        accessKeyId: 'key',
        secretAccessKey: 'secret'
      }
    });
  });
});

describe('buildAssetStorageUrl', () => {
  it('joins the configured base URL and object key', () => {
    expect(buildAssetStorageUrl({
      publicBaseUrl: 'https://cdn.example.com/assets/'
    }, 'audio/spa-2026.mp3')).toBe('https://cdn.example.com/assets/audio/spa-2026.mp3');
  });
});

describe('toPublicAssetPath', () => {
  it('converts a public file path into a runtime URL path', () => {
    expect(toPublicAssetPath('public/audio/spa-2026.mp3')).toBe('/audio/spa-2026.mp3');
  });
});

describe('resolveStoredAssetUrl', () => {
  it('falls back to local public paths when remote storage is disabled', async () => {
    await expect(resolveStoredAssetUrl(null, {
      localPublicPath: 'public/audio/spa-2026.mp3'
    })).resolves.toEqual({
      storage: 'local',
      url: '/audio/spa-2026.mp3'
    });
  });
});
