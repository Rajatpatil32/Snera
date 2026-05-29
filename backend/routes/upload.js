/**
 * SNERA Upload Routes
 * Uploads to Hostinger FTP (if configured) or local storage as fallback.
 * All uploads are processed via multer in-memory then pushed to FTP.
 */

const router = require('express').Router();
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const auth   = require('../middleware/auth');
const { smartUpload, deleteFromFTP, isFTPConfigured,toWebP } = require('../services/ftp');

// ─── Local fallback directory ─────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ─── Multer: memory storage (we handle writing ourselves) ─────────────────────
const memStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Only JPEG, PNG, WebP, AVIF images are allowed'), false);
};

const upload = multer({
  storage:  memStorage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB per file
});

// ─── Helper: save buffer locally as fallback ──────────────────────────────────
function saveLocally(buffer, filename) {
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${filename}`;
}

// ─── Generate safe unique filename ───────────────────────────────────────────
function makeFilename(originalname) {
  return `snera_${Date.now()}_${Math.round(Math.random() * 1e6)}.webp`;
}

// ─── Process one uploaded file ────────────────────────────────────────────────
async function processFile(file) {
  const webpBuffer = await toWebP(file.buffer);
  const filename = makeFilename(file.originalname);

  if (isFTPConfigured()) {
    const result = await smartUpload(webpBuffer, filename, null);
    // Also save locally as cache/backup
    try { saveLocally(webpBuffer, filename); } catch {}
    return result;
  }

  // Local only
  const url = saveLocally(webpBuffer, filename);
  return { url, storage: 'local' };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/upload
 * Single image upload. Used by the Design Composer and quick-upload.
 */
router.post('/', auth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  try {
    const result = await processFile(req.file);
    res.json({ url: result.url, storage: result.storage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/upload/multiple
 * Upload 1–20 images at once.
 * Field name: "images"
 */
router.post('/multiple', auth, upload.array('images', 20), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'No images uploaded' });
  try {
    const results = await Promise.all(req.files.map(processFile));
    res.json({
      urls:    results.map(r => r.url),
      storage: results[0].storage,
      count:   results.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/upload/list
 * Admin: list all uploaded images (from local uploads/ directory).
 * Includes FTP URL if FTP is configured.
 */
router.get('/list', auth, (req, res) => {
  try {
    if (!fs.existsSync(uploadDir)) return res.json({ images: [], total: 0 });

    const cdnBase = (process.env.CDN_BASE_URL || '').replace(/\/$/, '');
    const backendUrl = (process.env.BACKEND_URL || '').replace(/\/$/, '');

    const files = fs.readdirSync(uploadDir)
      .filter(f => /\.(jpe?g|png|webp|avif)$/i.test(f))
      .map(filename => {
        const fp   = path.join(uploadDir, filename);
        const stat = fs.statSync(fp);
        // Use FTP CDN URL if configured, else local
        const url  = cdnBase
          ? `${cdnBase}/${filename}`
          : `${backendUrl}/uploads/${filename}`;
        return {
          filename,
          url,
          localUrl: `/uploads/${filename}`,
          size:       stat.size,
          uploadedAt: stat.birthtime,
          onFTP:      !!cdnBase,
        };
      })
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    res.json({ images: files, total: files.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/upload/:filename
 * Admin: delete image from local storage and FTP.
 */
router.delete('/:filename', auth, async (req, res) => {
  try {
    const filename = req.params.filename;
    const safe     = path.basename(filename);

    // Security: block path traversal
    if (safe !== filename || safe.includes('..')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const localPath = path.join(uploadDir, safe);
    let deletedLocal = false;
    let deletedFTP   = false;

    // Delete locally
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
      deletedLocal = true;
    }

    // Delete from FTP if configured
    if (isFTPConfigured()) {
      deletedFTP = await deleteFromFTP(safe);
    }

    if (!deletedLocal && !deletedFTP) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({ success: true, filename: safe, deletedLocal, deletedFTP });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/upload/status
 * Returns FTP configuration status for the admin UI.
 */
router.get('/status', auth, (req, res) => {
  const configured = isFTPConfigured();
  res.json({
    ftp: {
      configured,
      host:       configured ? process.env.FTP_HOST : null,
      remoteDir:  configured ? (process.env.FTP_REMOTE_DIR || '/public_html/snera/images') : null,
      cdnBase:    configured ? (process.env.CDN_BASE_URL || null) : null,
    },
    storage: configured ? 'ftp+local' : 'local',
  });
});

module.exports = router;
