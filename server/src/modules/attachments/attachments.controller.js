const service = require('./attachments.service');

const upload = async (req, res, next) => {
  try {
    const fileData = await service.uploadFile(req.file, req);
    res.json({
      success: true,
      message: 'File uploaded successfully.',
      data: fileData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
};
