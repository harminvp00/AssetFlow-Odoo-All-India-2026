const { prisma } = require('../../config/database');

const findAll = async () => {
  return prisma.user.findMany({
    include: {
      departments: true
    }
  });
};

const save = async (data) => {
  return prisma.user.create({
    data
  });
};

module.exports = {
  findAll,
  save,
};
