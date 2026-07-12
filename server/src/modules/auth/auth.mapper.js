const toDTO = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    role: user.role,
    status: true,
    departmentId: null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

module.exports = {
  toDTO,
};
