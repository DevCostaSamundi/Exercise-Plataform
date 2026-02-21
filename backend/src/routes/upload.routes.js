/**
 * Upload Routes
 * Handles file upload endpoints
 */

import express from 'express';
import { uploadImage } from '../middleware/upload.middleware.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

/**
 * POST /api/v1/upload/image
 * Upload a single image (token logo, profile picture, etc.)
 * Returns the URL of the uploaded file
 */
router.post('/image', optionalAuth, (req, res) => {
  const upload = uploadImage.single('image');
  
  upload(req, res, (err) => {
    if (err) {
      // Multer error (file too large, wrong type, etc.)
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          error: 'File too large. Maximum size is 5MB.' 
        });
      }
      return res.status(400).json({ 
        error: err.message || 'Upload failed' 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file provided. Send a file with field name "image".' 
      });
    }
    
    // Build the public URL - return relative path for flexibility
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.status(201).json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  });
});

/**
 * DELETE /api/v1/upload/:filename
 * Delete an uploaded file
 */
router.delete('/:filename', optionalAuth, (req, res) => {
  const { filename } = req.params;
  
  // Sanitize filename to prevent directory traversal
  const safeName = path.basename(filename);
  const filePath = path.join('uploads', safeName);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  try {
    fs.unlinkSync(filePath);
    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
