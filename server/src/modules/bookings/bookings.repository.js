const { prisma } = require('../../config/database');

const getClient = (tx) => tx || prisma;

const createBooking = async (data, tx) => {
  const client = getClient(tx);
  return client.resourceBooking.create({
    data: {
      assetId: data.assetId,
      userId: data.userId,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      status: 'UPCOMING',
    },
  });
};

const findBookingById = async (id, tx) => {
  const client = getClient(tx);
  return client.resourceBooking.findUnique({
    where: { id },
    include: {
      asset: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

const findBookings = async (filters = {}, tx) => {
  const client = getClient(tx);
  const where = {};
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.userId) {
    where.userId = filters.userId;
  }
  if (filters.assetId) {
    where.assetId = filters.assetId;
  }
  if (filters.startRange && filters.endRange) {
    where.startTime = { gte: new Date(filters.startRange) };
    where.endTime = { lte: new Date(filters.endRange) };
  }

  return client.resourceBooking.findMany({
    where,
    include: {
      asset: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  });
};

const findBookingsByAssetId = async (assetId, tx) => {
  const client = getClient(tx);
  return client.resourceBooking.findMany({
    where: { assetId },
    include: {
      asset: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

const findBookingsByUserId = async (userId, tx) => {
  const client = getClient(tx);
  return client.resourceBooking.findMany({
    where: { userId },
    include: {
      asset: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

const findActiveBookingsByAssetId = async (assetId, tx) => {
  const client = getClient(tx);
  return client.resourceBooking.findMany({
    where: {
      assetId,
      status: { in: ['UPCOMING', 'ONGOING'] },
    },
    include: {
      asset: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

const findOverlappingBookings = async (assetId, startTime, endTime, excludeBookingId = null, tx) => {
  const client = getClient(tx);
  const where = {
    assetId,
    status: { in: ['UPCOMING', 'ONGOING'] },
    startTime: { lt: new Date(endTime) },
    endTime: { gt: new Date(startTime) },
  };
  if (excludeBookingId) {
    where.id = { not: excludeBookingId };
  }

  return client.resourceBooking.findMany({
    where,
  });
};

const updateBooking = async (id, data, tx) => {
  const client = getClient(tx);
  return client.resourceBooking.update({
    where: { id },
    data,
    include: {
      asset: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

const cancelBooking = async (id, tx) => {
  const client = getClient(tx);
  return client.resourceBooking.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: {
      asset: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

const findAssetById = async (assetId, tx) => {
  const client = getClient(tx);
  return client.asset.findUnique({
    where: { id: assetId },
  });
};

const findUserById = async (userId, tx) => {
  const client = getClient(tx);
  return client.user.findUnique({
    where: { id: userId },
  });
};

module.exports = {
  createBooking,
  findBookingById,
  findBookings,
  findBookingsByAssetId,
  findBookingsByUserId,
  findActiveBookingsByAssetId,
  findOverlappingBookings,
  updateBooking,
  cancelBooking,
  findAssetById,
  findUserById,
};
