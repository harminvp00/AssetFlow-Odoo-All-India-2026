const { prisma } = require('../../config/database');

const getClient = (tx) => tx || prisma;

const createNotification = async (data, tx) => {
  const client = getClient(tx);
  return client.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      message: data.message,
      isRead: data.isRead !== undefined ? data.isRead : false,
      link: data.link || null,
      type: data.type || 'INFO',
    },
  });
};

const findNotificationById = async (id, tx) => {
  const client = getClient(tx);
  return client.notification.findUnique({
    where: { id },
  });
};

const findNotifications = async (filters = {}, tx) => {
  const client = getClient(tx);
  const where = {};
  if (filters.userId) {
    where.userId = filters.userId;
  }
  if (filters.isRead !== undefined) {
    where.isRead = filters.isRead;
  }
  return client.notification.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const findUnreadNotifications = async (userId, tx) => {
  const client = getClient(tx);
  return client.notification.findMany({
    where: {
      userId,
      isRead: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const markNotificationAsRead = async (id, tx) => {
  const client = getClient(tx);
  return client.notification.update({
    where: { id },
    data: {
      isRead: true,
    },
  });
};

const markAllNotificationsAsRead = async (userId, tx) => {
  const client = getClient(tx);
  return client.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
};

const countUnreadNotifications = async (userId, tx) => {
  const client = getClient(tx);
  return client.notification.count({
    where: {
      userId,
      isRead: false,
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
  createNotification,
  findNotificationById,
  findNotifications,
  findUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  countUnreadNotifications,
  findUserById,
  findAssetById,
};
