const path = require('path');
const fs = require('fs');
const { BASE_URL } = require('../config/env');
const { sendSuccess, sendError } = require('../utils/responseEnvelope');

// 7.1 POST /media/upload
const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file && (!req.files || req.files.length === 0)) {
      return sendError(res, 'No file uploaded. Key must be named "file"', 400, 'BAD_REQUEST', req.originalUrl);
    }

    const file = req.file || (req.files && req.files[0]);
    const fileUrl = `${BASE_URL}/uploads/${file.filename}`;

    const data = {
      url: fileUrl,
      thumbnailUrl: fileUrl,
      width: 1200,
      height: 900,
      format: path.extname(file.originalname).replace('.', '') || 'webp',
      bytes: file.size
    };

    return sendSuccess(res, data, 'Image uploaded successfully', 201);
  } catch (error) {
    next(error);
  }
};

// 7.2 DELETE /media
const deleteMedia = async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return sendError(res, 'Media URL is required', 400, 'BAD_REQUEST', req.originalUrl);
    }

    // If local file, delete from uploads
    if (url.includes('/uploads/')) {
      const filename = url.split('/uploads/').pop();
      const filePath = path.join(__dirname, '../../uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return sendSuccess(res, null, 'File deleted', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadMedia,
  deleteMedia
};
