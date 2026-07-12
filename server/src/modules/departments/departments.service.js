const repository = require('./departments.repository');
const { prisma } = require('../../config/database');

const getAll = async () => {
  return repository.findAll();
};

const create = async (data) => {
  const existing = await repository.findByName(data.name);
  if (existing) {
    const error = new Error('Department name already exists.');
    error.statusCode = 409;
    throw error;
  }

  if (data.parentDepartmentId) {
    const parent = await repository.findById(data.parentDepartmentId);
    if (!parent) {
      const error = new Error('Parent department not found.');
      error.statusCode = 404;
      throw error;
    }
  }

  // Create department and auto-promote head if assigned
  const dept = await repository.save(data);
  
  if (data.headId) {
    await prisma.user.update({
      where: { id: data.headId },
      data: {
        role: 'DEPARTMENT_HEAD',
        departmentId: dept.id,
      },
    });
  }
  
  return repository.findById(dept.id);
};

const update = async (id, data) => {
  const dept = await repository.findById(id);
  if (!dept) {
    const error = new Error('Department not found.');
    error.statusCode = 404;
    throw error;
  }

  if (data.name && data.name !== dept.name) {
    const existing = await repository.findByName(data.name);
    if (existing) {
      const error = new Error('Department name already exists.');
      error.statusCode = 409;
      throw error;
    }
  }

  if (data.parentDepartmentId) {
    if (data.parentDepartmentId === id) {
      const error = new Error('Circular department dependency is not allowed.');
      error.statusCode = 400;
      throw error;
    }

    let parentId = data.parentDepartmentId;
    while (parentId) {
      if (parentId === id) {
        const error = new Error('Circular department dependency is not allowed.');
        error.statusCode = 400;
        throw error;
      }
      const parent = await repository.findById(parentId);
      parentId = parent ? parent.parentDepartmentId : null;
    }
  }

  const updated = await repository.update(id, data);

  if (data.headId && data.headId !== dept.headId) {
    await prisma.user.update({
      where: { id: data.headId },
      data: {
        role: 'DEPARTMENT_HEAD',
        departmentId: id,
      },
    });
  }

  return repository.findById(id);
};

const remove = async (id) => {
  const dept = await repository.findById(id);
  if (!dept) {
    const error = new Error('Department not found.');
    error.statusCode = 404;
    throw error;
  }

  return repository.deleteById(id);
};

module.exports = {
  getAll,
  create,
  update,
  remove,
};
