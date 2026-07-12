const { prisma } = require('../../config/database');

const getClient = (tx) => tx || prisma;

const createActivityLog = async (data, tx) => {
  const client = getClient(tx);
  return client.activityLog.create({
    data: {
      userId: data.userId || null,
      assetId: data.assetId || null,
      action: data.action,
      details: data.details || {},
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      asset: {
        select: {
          id: true,
          tag: true,
          name: true,
        },
      },
    },
  });
};

const findActivityLogById = async (id, tx) => {
  const client = getClient(tx);
  return client.activityLog.findUnique({
    where: { id },
    include: {
      user: true,
      asset: true,
    },
  });
};

const findActivityLogs = async (filters = {}, tx) => {
  const client = getClient(tx);
  const where = {};
  if (filters.userId) {
    where.userId = filters.userId;
  }
  if (filters.assetId) {
    where.assetId = filters.assetId;
  }
  if (filters.action) {
    where.action = filters.action;
  }
  return client.activityLog.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      asset: {
        select: {
          id: true,
          tag: true,
          name: true,
        },
      },
    },
  });
};

const findAssetActivityHistory = async (assetId, tx) => {
  const client = getClient(tx);
  return client.activityLog.findMany({
    where: { assetId },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: true,
    },
  });
};

const findUserActivityHistory = async (userId, tx) => {
  const client = getClient(tx);
  return client.activityLog.findMany({
    where: { userId },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      asset: true,
    },
  });
};

const findUserById = async (userId, tx) => {
  const client = getClient(tx);
  return client.user.findUnique({
    where: { id: userId },
  });
};

const findAssetById = async (assetId, tx) => {
  const client = getClient(tx);
  return client.asset.findUnique({
    where: { id: assetId },
  });
};

// Keep compatibility
const findAll = findActivityLogs;
const save = createActivityLog;

module.exports = {
  createActivityLog,
  findActivityLogById,
  findActivityLogs,
  findAssetActivityHistory,
  findUserActivityHistory,
  findUserById,
  findAssetById,
  findAll,
  save,
};
