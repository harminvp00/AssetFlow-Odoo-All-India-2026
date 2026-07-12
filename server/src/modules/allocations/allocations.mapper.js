const toDTO = (model) => {
  if (!model) return null;
  return {
    id: model.id,
    assetId: model.assetId,
    asset: model.asset ? {
      id: model.asset.id,
      tag: model.asset.tag,
      name: model.asset.name,
      serialNumber: model.asset.serialNumber,
      status: model.asset.status,
      condition: model.asset.condition,
    } : null,
    employeeId: model.employeeId,
    employee: model.employee ? {
      id: model.employee.id,
      name: model.employee.name,
      email: model.employee.email,
    } : null,
    departmentId: model.departmentId,
    department: model.department ? {
      id: model.department.id,
      name: model.department.name,
    } : null,
    allocatedById: model.allocatedById,
    allocatedBy: model.allocatedBy ? {
      id: model.allocatedBy.id,
      name: model.allocatedBy.name,
    } : null,
    expectedReturnDate: model.expectedReturnDate,
    actualReturnDate: model.actualReturnDate,
    status: model.status,
    checkInNotes: model.checkInNotes,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
};

module.exports = {
  toDTO,
};
