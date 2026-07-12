const { prisma } = require('../../config/database');

const findAll = async () => {
  return prisma.location.findMany({
    orderBy: {
      name: 'asc',
    },
  });
};

const findById = async (id) => {
  return prisma.location.findUnique({
    where: { id },
  });
};

const findByName = async (name) => {
  return prisma.location.findUnique({
    where: { name },
  });
};

const save = async (data) => {
  return prisma.location.create({
    data: {
      name: data.name,
      description: data.description || null,
      status: true,
    },
  });
};

const update = async (id, data) => {
  return prisma.location.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      status: data.status,
    },
  });
};

const deleteById = async (id) => {
  return prisma.location.update({
    where: { id },
    data: { status: false },
  });
};

module.exports = {
  findAll,
  findById,
  findByName,
  save,
  update,
  deleteById,
};
