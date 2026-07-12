const toDTO = (loc) => {
  if (!loc) return null;
  return {
    id: loc.id,
    name: loc.name,
    description: loc.description,
    status: loc.status,
    createdAt: loc.createdAt,
    updatedAt: loc.updatedAt,
  };
};

module.exports = {
  toDTO,
};
