const toDTO = (model) => {
  if (!model) return null;
  return {
    id: model.id,
    assetId: model.assetId,
    asset: model.asset ? {
      id: model.asset.id,
      tag: model.asset.tag,
      name: model.asset.name,
      status: model.asset.status,
    } : null,
    userId: model.userId,
    user: model.user ? {
      id: model.user.id,
      name: model.user.name,
      email: model.user.email,
    } : null,
    startTime: model.startTime,
    endTime: model.endTime,
    status: model.status,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
};

module.exports = {
  toDTO,
};
