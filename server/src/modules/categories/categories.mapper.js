const toDTO = (category) => {
  if (!category) return null;
  return {
    id: category.id,
    name: category.name,
    schemaConfig: category.schemaConfig,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
};

module.exports = {
  toDTO,
};
