const repository = require('./employees.repository');

const getAll = async () => {
  return repository.findAll();
};

const update = async (id, data) => {
  const employee = await repository.findById(id);
  if (!employee) {
    const error = new Error('Employee not found.');
    error.statusCode = 404;
    throw error;
  }

  return repository.update(id, data);
};

module.exports = {
  getAll,
  update,
};
