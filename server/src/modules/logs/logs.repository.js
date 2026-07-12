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
        select: { id: true, name: true, email: true },
      },
      asset: {
        select: { id: true, tag: true, name: true },
      },
    },
  });
};

const findActivityLogById = async (id, tx) => {
  const client = getClient(tx);
  return client.activityLog.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      asset: {
        select: { id: true, tag: true, name: true },
      },
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
    include: {
      user: {
        select: { id: true, name: true },
      },
      asset: {
        select: { id: true, tag: true, name: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const findAssetActivityHistory = async (assetId, tx) => {
  const client = getClient(tx);
  return client.activityLog.findMany({
    where: { assetId },
    include: {
      user: {
        select: { id: true, name: true },
      },
      asset: {
        select: { id: true, tag: true, name: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const findUserActivityHistory = async (userId, tx) => {
  const client = getClient(tx);
  return client.activityLog.findMany({
    where: { userId },
    include: {
      user: {
        select: { id: true, name: true },
      },
      asset: {
        select: { id: true, tag: true, name: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
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

module.exports = {
  createActivityLog,
  findActivityLogById,
  findActivityLogs,
  findAssetActivityHistory,
  findUserActivityHistory,
  findUserById,
  findAssetById,
};
