const toDTO = (model) => {
  if (!model) return null;
  return {
    id: model.id,
    userId: model.userId,
    title: model.title,
    message: model.message,
    isRead: model.isRead,
    link: model.link,
    type: model.type,
    createdAt: model.createdAt,
  };
};

module.exports = {
  toDTO,
};
