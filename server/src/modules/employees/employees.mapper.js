const toDTO = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    departmentId: user.departmentId,
    department: user.department ? {
      id: user.department.id,
      name: user.department.name,
    } : null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

module.exports = {
  toDTO,
};
