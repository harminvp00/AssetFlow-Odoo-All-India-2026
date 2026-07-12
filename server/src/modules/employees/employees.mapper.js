const toDTO = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    role: user.role,
    departments: user.departments || [],
    department: user.departments?.[0]?.name || 'N/A',
  };
};

module.exports = {
  toDTO,
};
