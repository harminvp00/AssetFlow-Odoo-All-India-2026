/* global describe, it, expect, jest, beforeEach */

jest.mock('../../src/modules/notifications/notifications.repository', () => ({
  createNotification: jest.fn(),
  findNotificationById: jest.fn(),
  findNotifications: jest.fn(),
  findUnreadNotifications: jest.fn(),
  markNotificationAsRead: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
  countUnreadNotifications: jest.fn(),
  findUserById: jest.fn(),
  findAssetById: jest.fn(),
}));

jest.mock('../../src/modules/logs/logs.repository', () => ({
  createActivityLog: jest.fn(),
  findActivityLogById: jest.fn(),
  findActivityLogs: jest.fn(),
  findAssetActivityHistory: jest.fn(),
  findUserActivityHistory: jest.fn(),
  findUserById: jest.fn(),
  findAssetById: jest.fn(),
}));

const notificationsService = require('../../src/modules/notifications/notifications.service');
const logsService = require('../../src/modules/logs/logs.service');

const notificationsRepo = require('../../src/modules/notifications/notifications.repository');
const logsRepo = require('../../src/modules/logs/logs.repository');

describe('Notifications & Logs Service Unit Tests', () => {
  const regularUser = { id: 'u-regular-1', name: 'Regular User', role: 'EMPLOYEE' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Notifications Service', () => {
    it('createNotification should throw error if user not found', async () => {
      notificationsRepo.findUserById.mockResolvedValue(null);
      await expect(notificationsService.createNotification({ userId: 'u-invalid', title: 'A', message: 'B' }))
        .rejects
        .toThrow('User not found.');
    });

    it('createNotification should successfully create notification', async () => {
      notificationsRepo.findUserById.mockResolvedValue({ id: 'u-1' });
      notificationsRepo.createNotification.mockResolvedValue({ id: 'n-1', isRead: false });

      const result = await notificationsService.createNotification({ userId: 'u-1', title: 'Hello', message: 'World' });
      expect(result.id).toBe('n-1');
      expect(result.isRead).toBe(false);
    });

    it('markNotificationAsRead should throw error if not found', async () => {
      notificationsRepo.findNotificationById.mockResolvedValue(null);
      await expect(notificationsService.markNotificationAsRead('n-invalid', regularUser))
        .rejects
        .toThrow('Notification not found.');
    });

    it('markNotificationAsRead should throw error if accessed by another non-admin user', async () => {
      notificationsRepo.findNotificationById.mockResolvedValue({ id: 'n-1', userId: 'u-other-1' });
      await expect(notificationsService.markNotificationAsRead('n-1', regularUser))
        .rejects
        .toThrow('Unauthorized notification access.');
    });

    it('markNotificationAsRead should mark read successfully', async () => {
      notificationsRepo.findNotificationById.mockResolvedValue({ id: 'n-1', userId: 'u-regular-1' });
      notificationsRepo.markNotificationAsRead.mockResolvedValue({ id: 'n-1', isRead: true });

      const result = await notificationsService.markNotificationAsRead('n-1', regularUser);
      expect(result.isRead).toBe(true);
    });

    it('getNotifications should enforce user id filter if not admin', async () => {
      notificationsRepo.findNotifications.mockResolvedValue([]);
      await notificationsService.getNotifications({}, regularUser);
      expect(notificationsRepo.findNotifications).toHaveBeenCalledWith({ userId: 'u-regular-1' });
    });
  });

  describe('Logs Service', () => {
    it('createActivityLog should throw error if action missing', async () => {
      await expect(logsService.createActivityLog({ action: '' }))
        .rejects
        .toThrow('Invalid activity log request.');
    });

    it('createActivityLog should throw error if user not found', async () => {
      logsRepo.findUserById.mockResolvedValue(null);
      await expect(logsService.createActivityLog({ action: 'ALLOCATE', userId: 'u-invalid' }))
        .rejects
        .toThrow('User not found.');
    });

    it('createActivityLog should throw error if asset not found', async () => {
      logsRepo.findUserById.mockResolvedValue({ id: 'u-1' });
      logsRepo.findAssetById.mockResolvedValue(null);
      await expect(logsService.createActivityLog({ action: 'ALLOCATE', userId: 'u-1', assetId: 'a-invalid' }))
        .rejects
        .toThrow('Asset not found.');
    });

    it('createActivityLog should create log successfully', async () => {
      logsRepo.findUserById.mockResolvedValue({ id: 'u-1' });
      logsRepo.findAssetById.mockResolvedValue({ id: 'a-1' });
      logsRepo.createActivityLog.mockResolvedValue({ id: 'l-1', action: 'ALLOCATE' });

      const result = await logsService.createActivityLog({ action: 'ALLOCATE', userId: 'u-1', assetId: 'a-1' });
      expect(result.id).toBe('l-1');
    });

    it('getActivityLogs should reject non-admins and non-managers', async () => {
      await expect(logsService.getActivityLogs({}, regularUser))
        .rejects
        .toThrow('Unauthorized action.');
    });

    it('getUserActivity should reject other regular users requesting user logs', async () => {
      await expect(logsService.getUserActivity('u-other-1', regularUser))
        .rejects
        .toThrow('Unauthorized action.');
    });
  });
});
