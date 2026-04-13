const { PutObjectCommand, GetObjectCommand, CreateBucketCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../utils/s3Client');
const crypto = require('crypto');
const path = require('path');

const BUCKET = process.env.S3_BUCKET || 'chat-uploads';

// Ensure bucket exists on startup
const ensureBucket = async () => {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET }));
      console.log(`Created S3 bucket: ${BUCKET}`);
    } else {
      console.error('S3 bucket check error:', err);
    }
  }
};

// Upload a file buffer to S3
const uploadFile = async (fileBuffer, originalName, mimeType) => {
  const ext = path.extname(originalName);
  const key = `uploads/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    })
  );

  return key;
};

// Get a pre-signed URL for downloading/viewing a file
const getFileUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
};

module.exports = { ensureBucket, uploadFile, getFileUrl };
