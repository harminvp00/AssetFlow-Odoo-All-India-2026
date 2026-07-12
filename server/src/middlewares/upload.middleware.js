const upload = require('../config/storage');

const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const uploadFn = upload.single(fieldName);
    uploadFn(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  };
};

const uploadArray = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const uploadFn = upload.array(fieldName, maxCount);
    uploadFn(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  };
};

module.exports = {
  uploadSingle,
  uploadArray,
};
