/**
 * SNERA — Hostinger FTP Upload Service
 * Uploads images to Hostinger via FTP and returns the public URL.
 *
 * Configure in .env:
 *   FTP_HOST      = ftp.yourdomain.com  (or your server IP)
 *   FTP_USER      = your_ftp_username
 *   FTP_PASS      = your_ftp_password
 *   FTP_PORT      = 21 (default)
 *   FTP_REMOTE_DIR = /public_html/snera/images
 *   CDN_BASE_URL  = https://yourdomain.com/snera/images
 *
 * Falls back to local storage if FTP is not configured.
 */

const sharp = require('sharp');
const ftp  = require('basic-ftp');
const path = require('path');
const fs   = require('fs');
const { Readable } = require('stream');

async function toWebP(buffer, quality = 82) {
  return sharp(buffer)
    .webp({ quality })
    .toBuffer();
}

// ─── Check if FTP is configured ───────────────────────────────────────────────
function isFTPConfigured() {
  return !!(
    process.env.FTP_HOST &&
    process.env.FTP_USER &&
    process.env.FTP_PASS
  );
}

// ─── Upload a buffer to Hostinger FTP ────────────────────────────────────────
async function uploadToFTP(buffer, filename) {
  if (!isFTPConfigured()) {
    throw new Error('FTP not configured');
  }

  const client    = new ftp.Client();
  client.ftp.verbose = false; // set to true for debug logging

  try {
    await client.access({
      host:     process.env.FTP_HOST,
      user:     process.env.FTP_USER,
      password: process.env.FTP_PASS,
      port:     parseInt(process.env.FTP_PORT || '21'),
      secure:   process.env.FTP_SECURE === 'true', // explicit TLS
    });

    const remoteDir = process.env.FTP_REMOTE_DIR || '/public_html/snera/images';
    await client.ensureDir(remoteDir);
    await client.uploadFrom(Readable.from(buffer), `${remoteDir}/${filename}`);

    const cdnBase = (process.env.CDN_BASE_URL || '').replace(/\/$/, '');
    return `${cdnBase}/${filename}`;
  } finally {
    client.close();
  }
}

// ─── Upload a local file path to FTP ─────────────────────────────────────────
async function uploadFileToFTP(localPath, filename) {
  const buffer = fs.readFileSync(localPath);
  return uploadToFTP(buffer, filename);
}

// ─── Smart upload: FTP if configured, else local ─────────────────────────────
/**
 * @param {Buffer|string} source  - Buffer or local file path
 * @param {string}        filename - Destination filename (e.g. snera_123.jpg)
 * @param {string}        fallbackLocalPath - Where the file already is locally
 * @returns {{ url: string, storage: 'ftp'|'local' }}
 */
async function smartUpload(source, filename, fallbackLocalPath) {
  if (isFTPConfigured()) {
    try {
      const buffer = Buffer.isBuffer(source) ? source : fs.readFileSync(source);
      const url    = await uploadToFTP(buffer, filename);
      console.log(`✓ FTP upload: ${filename} → ${url}`);
      return { url, storage: 'ftp' };
    } catch (err) {
      console.error(`✗ FTP upload failed for ${filename}:`, err.message);
      console.log('  → Falling back to local storage');
    }
  }

  // Fallback: return local URL
  const localUrl = `/uploads/${filename}`;
  console.log(`✓ Local storage: ${filename} → ${localUrl}`);
  return { url: localUrl, storage: 'local' };
}

// ─── Delete from FTP ──────────────────────────────────────────────────────────
async function deleteFromFTP(filename) {
  if (!isFTPConfigured()) return false;

  const client = new ftp.Client();
  try {
    await client.access({
      host:     process.env.FTP_HOST,
      user:     process.env.FTP_USER,
      password: process.env.FTP_PASS,
      port:     parseInt(process.env.FTP_PORT || '21'),
      secure:   process.env.FTP_SECURE === 'true',
    });
    const remoteDir = process.env.FTP_REMOTE_DIR || '/public_html/snera/images';
    await client.remove(`${remoteDir}/${filename}`);
    return true;
  } catch {
    return false;
  } finally {
    client.close();
  }
}

// ─── Get public URL for a stored path ────────────────────────────────────────
/**
 * Converts any stored path to a displayable URL.
 * - FTP URLs (https://...) → returned as-is
 * - Local paths (/uploads/...) → prefixed with BACKEND_URL
 */
function getPublicUrl(storedPath) {
  if (!storedPath) return null;
  if (storedPath.startsWith('http://') || storedPath.startsWith('https://')) {
    return storedPath; // already a full FTP CDN URL
  }
  // Local fallback
  const backendUrl = (process.env.BACKEND_URL || '').replace(/\/$/, '');
  return `${backendUrl}${storedPath}`;
}

module.exports = {
  uploadToFTP,
  uploadFileToFTP,
  smartUpload,
  deleteFromFTP,
  getPublicUrl,
  isFTPConfigured,
  toWebP,
};
