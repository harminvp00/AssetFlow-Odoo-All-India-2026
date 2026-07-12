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
    raisedById: model.raisedById,
    raisedBy: model.raisedBy ? {
      id: model.raisedBy.id,
      name: model.raisedBy.name,
      email: model.raisedBy.email,
    } : null,
    approvedById: model.approvedById,
    approvedBy: model.approvedBy ? {
      id: model.approvedBy.id,
      name: model.approvedBy.name,
      email: model.approvedBy.email,
    } : null,
    technicianId: model.technicianId,
    issueDescription: model.issueDescription,
    priority: model.priority,
    status: model.status,
    photoUrl: model.photoUrl,
    resolutionNotes: model.resolutionNotes,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
};

module.exports = {
  toDTO,
};
