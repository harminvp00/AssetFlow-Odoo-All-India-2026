const toDTO = (asset) => {
  if (!asset) return null;
  return {
    id: asset.id,
    tag: asset.tag,
    name: asset.name,
    serialNumber: asset.serialNumber,
    acquisitionDate: asset.acquisitionDate,
    acquisitionCost: asset.acquisitionCost ? Number(asset.acquisitionCost) : 0,
    condition: asset.condition,
    status: asset.status,
    locationId: asset.locationId,
    location: asset.location ? {
      id: asset.location.id,
      name: asset.location.name,
    } : null,
    categoryId: asset.categoryId,
    category: asset.category ? {
      id: asset.category.id,
      name: asset.category.name,
      schemaConfig: asset.category.schemaConfig,
    } : null,
    departmentId: asset.departmentId,
    department: asset.department ? {
      id: asset.department.id,
      name: asset.department.name,
    } : null,
    isSharedBookable: asset.isSharedBookable,
    photoUrl: asset.photoUrl,
    documentUrls: asset.documentUrls,
    dynamicFields: asset.dynamicFields,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };
};

module.exports = {
  toDTO,
};
