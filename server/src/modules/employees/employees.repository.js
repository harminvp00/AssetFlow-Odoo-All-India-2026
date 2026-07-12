const { prisma } = require('../../config/database');

const findAll = async () => {
  return prisma.user.findMany({
    include: {
      departments: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const save = async (data) => {
  const parts = (data.name || '').trim().split(/\s+/);
  const firstName = parts[0] || 'Unknown';
  const lastName = parts.slice(1).join(' ') || 'User';

  return prisma.user.create({
    data: {
      email: data.email,
      password: data.password || '$2a$10$pvgd9XdiD9SlMXVq4Wj10OgDMcKn6Tv/G8459KnZigXNe1YaeoMla',
      firstName,
      lastName,
      name: data.name || `${firstName} ${lastName}`,
      role: data.role || 'PROCUREMENT_OFFICER',
      departments: data.departmentId ? {
        connect: { id: data.departmentId }
      } : undefined,
    },
    include: {
      departments: true,
    },
  });
};

module.exports = {
  findAll,
  save,
};
