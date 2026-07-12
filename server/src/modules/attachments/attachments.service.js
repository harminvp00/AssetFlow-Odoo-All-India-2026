const uploadFile = async (file, req) => {
  if (!file) {
    const error = new Error('No file uploaded.');
    error.statusCode = 400;
    throw error;
  }

  const fileUrl = file.path && file.path.startsWith('http')
    ? file.path
    : `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;

  return {
    url: fileUrl,
    filename: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  };
};

module.exports = {
  uploadFile,
};
