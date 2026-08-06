

const sharp = require('sharp');
const axios = require('axios');
const path  = require('path');
const fs    = require('fs');

const uploadDir = path.join(__dirname, '../uploads');

// Reference canvas the placement coordinates were saved against
// (must match CANVAS_W / CANVAS_H in ProductDesignComposer.jsx)
const CANVAS_W = 600;
const CANVAS_H = 750;

// ─── Resolve any stored path (local "/uploads/..", or full FTP/CDN URL) to a Buffer ──
async function resolveBuffer(storedPath) {
  if (!storedPath) throw new Error('Missing image path');

  if (storedPath.startsWith('http://') || storedPath.startsWith('https://')) {
    const res = await axios.get(storedPath, { responseType: 'arraybuffer' });
    return Buffer.from(res.data);
  }

  // Local "/uploads/filename.webp"
  const filename = path.basename(storedPath);
  const localPath = path.join(uploadDir, filename);
  if (!fs.existsSync(localPath)) throw new Error(`Local image not found: ${filename}`);
  return fs.readFileSync(localPath);
}

/**
 * Composite a design onto a mockup at the given placement.
 * @param {string} mockupPath   stored path/URL of the garment mockup
 * @param {string} designPath   stored path/URL of the transparent design PNG
 * @param {object} placement    { x, y, w, h, rotation, opacity, blend }
 * @returns {Buffer} composed image buffer (WebP)
 */
async function composeDesign(mockupPath, designPath, placement) {
  const { x, y, w, h, rotation = 0, opacity = 1 } = placement || {};

  const [mockupBuf, designBufRaw] = await Promise.all([
    resolveBuffer(mockupPath),
    resolveBuffer(designPath),
  ]);

  // Normalise mockup to the reference canvas (cover-fit, matches admin preview)
  const base = sharp(mockupBuf).resize(CANVAS_W, CANVAS_H, { fit: 'cover' });

  // Resize + rotate the design to match the saved transform
  let design = sharp(designBufRaw).resize(Math.round(w), Math.round(h), { fit: 'fill' });
  if (rotation) {
    design = design.rotate(rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
  }
  if (opacity < 1) {
    design = design.ensureAlpha().composite([{
      input: Buffer.from([255, 255, 255, Math.round(opacity * 255)]),
      raw: { width: 1, height: 1, channels: 4 },
      tile: true,
      blend: 'dest-in',
    }]);
  }
  const designBuf = await design.toBuffer();
  const designMeta = await sharp(designBuf).metadata();

  // Rotation changes the bounding box — recenter so the design stays anchored
  // on the same center point the admin positioned it at.
  const left = Math.round(x + w / 2 - designMeta.width / 2);
  const top  = Math.round(y + h / 2 - designMeta.height / 2);

  // Rotation/edge placement can push the design's bounding box outside the
  // canvas. sharp's composite() isn't guaranteed to clip that safely, so
  // extract just the visible region ourselves before compositing.
  const srcLeft = Math.max(0, -left);
  const srcTop  = Math.max(0, -top);
  const visW = Math.min(designMeta.width - srcLeft, CANVAS_W - Math.max(0, left));
  const visH = Math.min(designMeta.height - srcTop, CANVAS_H - Math.max(0, top));

  if (visW <= 0 || visH <= 0) {
    // Design placed fully off-canvas — nothing to composite, return the base alone.
    return base.webp({ quality: 88 }).toBuffer();
  }

  const clippedBuf = (srcLeft > 0 || srcTop > 0 || visW < designMeta.width || visH < designMeta.height)
    ? await sharp(designBuf).extract({ left: srcLeft, top: srcTop, width: Math.round(visW), height: Math.round(visH) }).toBuffer()
    : designBuf;

  return base
    .composite([{ input: clippedBuf, left: Math.max(0, left), top: Math.max(0, top) }])
    .webp({ quality: 88 })
    .toBuffer();
}

module.exports = { composeDesign, CANVAS_W, CANVAS_H };