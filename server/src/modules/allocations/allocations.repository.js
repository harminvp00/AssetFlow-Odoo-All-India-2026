const { prisma } = require('../../config/database');

const getClient = (tx) => tx || prisma;

const createAllocation = async (data, tx) => {
  const client = getClient(tx);
  return client.allocation.create({
    data: {
      assetId: data.assetId,
      employeeId: data.employeeId || null,
      departmentId: data.departmentId || null,
      allocatedById: data.allocatedById,
      expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : null,
      status: data.status || 'ACTIVE',
    },
    include: {
      asset: true,
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      department: true,
    },
  });
};

const findAllocationById = async (id, tx) => {
  const client = getClient(tx);
  return client.allocation.findUnique({
    where: { id },
    include: {
      asset: true,
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
          department: {
            select: {
              name: true,
            },
          },
        },
      },
      department: true,
      allocatedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

const findActiveAllocationByAssetId = async (assetId, tx) => {
  const client = getClient(tx);
  return client.allocation.findFirst({
    where: {
      assetId,
      status: 'ACTIVE',
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
          department: {
            select: {
              name: true,
            },
          },
        },
      },
      department: true,
    },
  });
};

const findAllocations = async (filters = {}, tx) => {
  const client = getClient(tx);
  const where = {};
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.employeeId) {
    where.employeeId = filters.employeeId;
  }
  if (filters.departmentId) {
    where.departmentId = filters.departmentId;
  }
  if (filters.assetId) {
    where.assetId = filters.assetId;
  }

  return client.allocation.findMany({
    where,
    include: {
      asset: true,
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      department: true,
      allocatedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const updateAllocation = async (id, data, tx) => {
  const client = getClient(tx);
  return client.allocation.update({
    where: { id },
    data: {
      actualReturnDate: data.actualReturnDate ? new Date(data.actualReturnDate) : undefined,
      status: data.status,
      checkInNotes: data.checkInNotes,
    },
    include: {
      asset: true,
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      department: true,
    },
  });
};

const updateAssetStatus = async (assetId, status, tx) => {
  const client = getClient(tx);
  return client.asset.update({
    where: { id: assetId },
    data: { status },
  });
};

const findAssetById = async (assetId, tx) => {
  const client = getClient(tx);
  return client.asset.findUnique({
    where: { id: assetId },
  });
};

const findEmployeeById = async (employeeId, tx) => {
  const client = getClient(tx);
  return client.user.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
};

const findDepartmentById = async (departmentId, tx) => {
  const client = getClient(tx);
  return client.department.findUnique({
    where: { id: departmentId },
  });
};

module.exports = {
  createAllocation,
  findAllocationById,
  findActiveAllocationByAssetId,
  findAllocations,
  updateAllocation,
  updateAssetStatus,
  findAssetById,
  findEmployeeById,
  findDepartmentById,
};
