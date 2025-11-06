// controllers/UploadController.js
const { uploadtocloudinary } = require('../middleware/cloudinary');
const ResponseUtil = require('../utils/response');

class UploadController {
  // Upload single image
  static async uploadImage(req, res) {
    try {
      if (!req.file) {
        return ResponseUtil.error(res, 'No file provided', 400);
      }

      const result = await uploadtocloudinary(req.file.buffer);

      if (result.message === 'success') {
        return ResponseUtil.success(res, { url: result.url }, 'Image uploaded successfully');
      } else {
        return ResponseUtil.error(res, 'Failed to upload image', 500);
      }
    } catch (error) {
      console.error('Upload image error:', error);
      return ResponseUtil.error(res, 'Failed to upload image', 500);
    }
  }

  // Upload multiple images
  static async uploadMultipleImages(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return ResponseUtil.error(res, 'No files provided', 400);
      }

      const uploadPromises = req.files.map(file => uploadtocloudinary(file.buffer));
      const results = await Promise.all(uploadPromises);

      const urls = results
        .filter(result => result.message === 'success')
        .map(result => result.url);

      if (urls.length === 0) {
        return ResponseUtil.error(res, 'Failed to upload images', 500);
      }

      return ResponseUtil.success(res, { urls }, `Successfully uploaded ${urls.length} image(s)`);
    } catch (error) {
      console.error('Upload multiple images error:', error);
      return ResponseUtil.error(res, 'Failed to upload images', 500);
    }
  }
}

module.exports = UploadController;
