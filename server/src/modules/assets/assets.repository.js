const { prisma } = require('../../config/database');

const getClient = (tx) => tx || prisma;

const findAll = async () => {
  return prisma.asset.findMany({
    include: {
      location: true,
      category: true,
      department: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const save = async (data) => {
  return prisma.asset.create({
    data: {
      tag: data.tag,
      name: data.name,
      serialNumber: data.serialNumber,
      acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : new Date(),
      acquisitionCost: data.acquisitionCost ? parseFloat(data.acquisitionCost) : 0,
      condition: data.condition || 'NEW',
      status: data.status || 'AVAILABLE',
      locationId: data.locationId,
      categoryId: data.categoryId,
      departmentId: data.departmentId || null,
      isSharedBookable: data.isSharedBookable || false,
      photoUrl: data.photoUrl || null,
      documentUrls: data.documentUrls || [],
      dynamicFields: data.dynamicFields || null,
    },
    include: {
      location: true,
      category: true,
      department: true,
    },
  });
};

const findById = async (id, tx) => {
  const client = getClient(tx);
  return client.asset.findUnique({
     where: { id },
     include: {
       location: true,
       category: true,
       department: true,
     }
  });
};

const updateStatus = async (id, status, tx) => {
  const client = getClient(tx);
  return client.asset.update({
    where: { id },
    data: { status },
  });
};

module.exports = {
  findAll,
  save,
  findById,
  updateStatus,
};
