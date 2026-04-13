const multer = require('multer');
const { uploadFile, getFileUrl } = require('../services/s3Service');

// Multer config — 10MB max, store in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // Allow images, videos, audio, PDFs, text, common docs
    const allowed = [
      'image/', 'video/', 'audio/',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats',
      'text/',
    ];
    if (allowed.some((t) => file.mimetype.startsWith(t))) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  },
});

// Upload a file → returns the S3 key and presigned URL
const uploadFileHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const key = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
    const url = await getFileUrl(key);

    res.json({
      fileKey: key,
      fileUrl: url,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
    });
  } catch (err) {
    next(err);
  }
};

// Get a fresh presigned URL for an existing file key
const getPresignedUrl = async (req, res, next) => {
  try {
    const { key } = req.query;
    if (!key) {
      return res.status(400).json({ message: 'File key is required' });
    }
    const url = await getFileUrl(key);
    res.json({ url });
  } catch (err) {
    next(err);
  }
};

module.exports = { upload, uploadFileHandler, getPresignedUrl };
