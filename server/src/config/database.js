const { PrismaClient } = require('@prisma/client');
const env = require('./env');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
});

async function connectDB() {
  try {
    await prisma.$connect();
    console.log('🔌 Database connected successfully via Prisma Client');
  } catch (error) {
    console.warn('⚠️ Database connection warning:', error.message);
    console.warn('⚠️ Server is running but database-dependent features will fail.');
  }
}

prisma.$use(async (params, next) => {
  const result = await next(params);

  try {
    const model = params.model;
    const action = params.action;
    
    const logsService = require('../modules/logs/logs.service');
    const notificationsService = require('../modules/notifications/notifications.service');

    if (model === 'Allocation' && action === 'create') {
      const data = result;
      if (data && data.employeeId) {
        await logsService.createActivityLog({
          action: 'ASSET_ALLOCATED',
          userId: data.employeeId,
          assetId: data.assetId,
          details: { allocationId: data.id }
        });
        await notificationsService.createNotification({
          userId: data.employeeId,
          title: 'Asset Allocated',
          message: 'Asset has been allocated to you.'
        });
      }
    }
    
    if (model === 'Allocation' && action === 'update') {
      const data = result;
      if (data && data.status === 'RETURNED') {
        await logsService.createActivityLog({
          action: 'ASSET_RETURNED',
          userId: data.employeeId,
          assetId: data.assetId,
          details: { allocationId: data.id }
        });
      }
    }

    if (model === 'TransferRequest' && action === 'create') {
      const data = result;
      if (data) {
        await logsService.createActivityLog({
          action: 'TRANSFER_REQUESTED',
          userId: data.requestedById,
          assetId: data.assetId,
          details: { transferId: data.id }
        });
      }
    }

    if (model === 'TransferRequest' && action === 'update') {
      const data = result;
      if (data && (data.status === 'APPROVED' || data.status === 'REJECTED')) {
        await logsService.createActivityLog({
          action: `TRANSFER_${data.status}`,
          userId: data.approvedById || data.requestedById,
          assetId: data.assetId,
          details: { transferId: data.id }
        });
        if (data.toEmployeeId) {
          await notificationsService.createNotification({
            userId: data.toEmployeeId,
            title: `Transfer ${data.status}`,
            message: `Asset transfer request has been ${data.status.toLowerCase()}.`
          });
        }
      }
    }

    if (model === 'ResourceBooking' && action === 'create') {
      const data = result;
      if (data) {
        await logsService.createActivityLog({
          action: 'BOOKING_CREATED',
          userId: data.userId,
          assetId: data.assetId,
          details: { bookingId: data.id }
        });
        await notificationsService.createNotification({
          userId: data.userId,
          title: 'Booking Created',
          message: 'Booking has been created.'
        });
      }
    }

    if (model === 'MaintenanceRequest' && action === 'create') {
      const data = result;
      if (data) {
        await logsService.createActivityLog({
          action: 'MAINTENANCE_REQUESTED',
          userId: data.requesterId,
          assetId: data.assetId,
          details: { maintenanceId: data.id }
        });
      }
    }

    if (model === 'AuditCycle' && action === 'update') {
      const data = result;
      if (data && data.status === 'ACTIVE') {
        await logsService.createActivityLog({
          action: 'AUDIT_STARTED',
          details: { cycleId: data.id }
        });
      }
      if (data && data.status === 'COMPLETED') {
        await logsService.createActivityLog({
          action: 'AUDIT_COMPLETED',
          details: { cycleId: data.id }
        });
      }
    }

    if (model === 'AuditRecord' && action === 'create') {
      const data = result;
      if (data) {
        await logsService.createActivityLog({
          action: data.status === 'VERIFIED' ? 'ASSET_VERIFIED' : 'ASSET_MARKED_MISSING',
          assetId: data.assetId,
          details: { recordId: data.id }
        });
      }
    }
  } catch (_err) {
    // Suppress event trigger failure so it doesn't break primary API transactions
  }

  return result;
});

module.exports = {
  prisma,
  connectDB,
};
