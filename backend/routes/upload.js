const router = require('express').Router();
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const auth   = require('../middleware/auth');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `snera_${Date.now()}_${Math.round(Math.random() * 1e5)}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Only JPEG, PNG, WebP, AVIF images allowed'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5 MB

// POST /api/upload — admin only, single image
router.post('/', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

// POST /api/upload/multiple — admin only, multiple images
router.post('/multiple', auth, upload.array('images', 8), (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'No images uploaded' });
  const urls = req.files.map(f => `/uploads/${f.filename}`);
  res.json({ urls });
});

// GET /api/upload/list — admin only, list all uploaded images with metadata
router.get('/list', auth, (req, res) => {
  try {
    if (!fs.existsSync(uploadDir)) return res.json({ images: [] });

    const files = fs.readdirSync(uploadDir)
      .filter(f => /\.(jpe?g|png|webp|avif)$/i.test(f))
      .map(filename => {
        const filePath = path.join(uploadDir, filename);
        const stat     = fs.statSync(filePath);
        return {
          filename,
          url:        `/uploads/${filename}`,
          size:       stat.size,        // bytes
          uploadedAt: stat.birthtime,
        };
      })
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)); // newest first

    res.json({ images: files, total: files.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/upload/:filename — admin only, delete a single image
router.delete('/:filename', auth, (req, res) => {
  try {
    const filename = req.params.filename;

    // Security: strip any path traversal attempts
    const safe = path.basename(filename);
    if (safe !== filename || safe.includes('..')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(uploadDir, safe);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    fs.unlinkSync(filePath);
    res.json({ success: true, filename: safe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
