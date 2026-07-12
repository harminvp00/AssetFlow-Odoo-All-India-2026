const repository = require('./categories.repository');

const getAll = async () => {
  return repository.findAll();
};

const create = async (data) => {
  return repository.save(data);
};

module.exports = {
  getAll,
  create,
};
