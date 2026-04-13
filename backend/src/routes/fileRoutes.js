const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { upload, uploadFileHandler, getPresignedUrl } = require('../controllers/fileController');

// Upload a file (multipart form-data)
router.post('/upload', authenticate, upload.single('file'), uploadFileHandler);

// Get a fresh presigned URL
router.get('/url', authenticate, getPresignedUrl);

module.exports = router;
