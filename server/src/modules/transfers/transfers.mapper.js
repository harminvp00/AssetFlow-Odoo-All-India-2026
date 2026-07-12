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
    fromEmployeeId: model.fromEmployeeId,
    fromEmployee: model.fromEmployee ? {
      id: model.fromEmployee.id,
      name: model.fromEmployee.name,
      email: model.fromEmployee.email,
    } : null,
    toEmployeeId: model.toEmployeeId,
    toEmployee: model.toEmployee ? {
      id: model.toEmployee.id,
      name: model.toEmployee.name,
      email: model.toEmployee.email,
    } : null,
    fromDepartmentId: model.fromDepartmentId,
    fromDepartment: model.fromDepartment ? {
      id: model.fromDepartment.id,
      name: model.fromDepartment.name,
    } : null,
    toDepartmentId: model.toDepartmentId,
    toDepartment: model.toDepartment ? {
      id: model.toDepartment.id,
      name: model.toDepartment.name,
    } : null,
    requestedById: model.requestedById,
    approvedById: model.approvedById,
    approvedBy: model.approvedBy ? {
      id: model.approvedBy.id,
      name: model.approvedBy.name,
      email: model.approvedBy.email,
    } : null,
    status: model.status,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
};

module.exports = {
  toDTO,
};
