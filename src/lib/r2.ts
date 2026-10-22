import { randomBytes } from 'crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

// Cloudflare R2 is S3-compatible. Without a complete config the menu still works,
// only photo upload is disabled. Two naming styles are accepted:
//   R2_ENDPOINT  or R2_ACCOUNT_ID   (endpoint wins if both are set)
//   R2_BUCKET_NAME or R2_BUCKET
//   R2_REGION (optional, defaults to "auto")
// plus R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_PUBLIC_URL.
interface R2Config {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl: string;
}

function readR2Config(): R2Config | null {
  const env = process.env;
  let endpoint = '';
  if (env.R2_ENDPOINT) {
    try {
      // dashboards sometimes show the endpoint with the bucket appended; the client only needs the origin
      endpoint = new URL(env.R2_ENDPOINT).origin;
    } catch {
      return null;
    }
  } else if (env.R2_ACCOUNT_ID) {
    endpoint = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  }

  const config = {
    endpoint,
    region: env.R2_REGION || 'auto',
    bucket: env.R2_BUCKET_NAME || env.R2_BUCKET || '',
    accessKeyId: env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: env.R2_SECRET_ACCESS_KEY || '',
    publicUrl: (env.R2_PUBLIC_URL || '').replace(/\/+$/, ''),
  };
  return Object.values(config).every(Boolean) ? config : null;
}

export function isR2Configured(): boolean {
  return readR2Config() !== null;
}

let client: S3Client | null = null;

function getClient(config: R2Config): S3Client {
  if (!client) {
    client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return client;
}

/** Detects the image type from the file's first bytes instead of trusting the browser. */
export function sniffImageType(bytes: Uint8Array): { ext: string; contentType: string } | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ext: 'jpg', contentType: 'image/jpeg' };
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { ext: 'png', contentType: 'image/png' };
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return { ext: 'webp', contentType: 'image/webp' };
  return null;
}

/** Uploads an image under menu/ and returns its public URL. */
export async function uploadMenuImage(bytes: Uint8Array, type: { ext: string; contentType: string }): Promise<string> {
  const config = readR2Config();
  if (!config) throw new Error('R2 is not configured');
  const key = `menu/hardware/${Date.now()}-${randomBytes(6).toString('hex')}.${type.ext}`;
  await getClient(config).send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: bytes,
      ContentType: type.contentType,
      // file names are unique, so browsers and Cloudflare can cache them for good
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
  return `${config.publicUrl}/${key}`;
}
