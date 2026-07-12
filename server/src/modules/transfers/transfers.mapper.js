const toDTO = (model) => {
  if (!model) return null;
  return {
    ...model,
    // Add DTO mappings here
  };
};

module.exports = {
  toDTO,
};
