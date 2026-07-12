const toDTO = (dept) => {
  if (!dept) return null;
  return {
    id: dept.id,
    name: dept.name,
    status: dept.status,
    parentDepartmentId: dept.parentDepartmentId,
    parentDepartment: dept.parentDepartment ? {
      id: dept.parentDepartment.id,
      name: dept.parentDepartment.name,
    } : null,
    headId: dept.headId,
    head: dept.head ? {
      id: dept.head.id,
      name: dept.head.name,
      email: dept.head.email,
    } : null,
    createdAt: dept.createdAt,
    updatedAt: dept.updatedAt,
  };
};

module.exports = {
  toDTO,
};
