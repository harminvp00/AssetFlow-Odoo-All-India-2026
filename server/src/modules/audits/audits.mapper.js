const toDTO = (model) => {
  if (!model) return null;
  return {
    id: model.id,
    name: model.name,
    scopeDepartmentId: model.scopeDepartmentId,
    scopeDepartment: model.scopeDepartment ? {
      id: model.scopeDepartment.id,
      name: model.scopeDepartment.name,
    } : null,
    scopeLocationId: model.scopeLocationId,
    scopeLocation: model.scopeLocation ? {
      id: model.scopeLocation.id,
      name: model.scopeLocation.name,
    } : null,
    startDate: model.startDate,
    endDate: model.endDate,
    status: model.status,
    auditors: model.auditors ? model.auditors.map(a => ({
      id: a.id,
      name: a.name,
      email: a.email,
    })) : [],
    records: model.records ? model.records.map(r => ({
      id: r.id,
      assetId: r.assetId,
      asset: r.asset ? {
        id: r.asset.id,
        tag: r.asset.tag,
        name: r.asset.name,
        status: r.asset.status,
      } : null,
      auditorId: r.auditorId,
      auditor: r.auditor ? {
        id: r.auditor.id,
        name: r.auditor.name,
      } : null,
      status: r.status,
      notes: r.notes,
      createdAt: r.createdAt,
    })) : [],
    discrepancyReport: model.discrepancyReport,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
};

module.exports = {
  toDTO,
};
