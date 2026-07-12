/* global describe, it, expect, jest, beforeEach */

jest.mock('../../src/modules/bookings/bookings.repository', () => ({
  createBooking: jest.fn(),
  findBookingById: jest.fn(),
  findBookings: jest.fn(),
  findBookingsByAssetId: jest.fn(),
  findBookingsByUserId: jest.fn(),
  findActiveBookingsByAssetId: jest.fn(),
  findOverlappingBookings: jest.fn(),
  updateBooking: jest.fn(),
  cancelBooking: jest.fn(),
  findAssetById: jest.fn(),
  findUserById: jest.fn(),
}));

jest.mock('../../src/config/database', () => {
  const mockPrisma = {
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };
  return {
    prisma: mockPrisma,
  };
});

const service = require('../../src/modules/bookings/bookings.service');
const repository = require('../../src/modules/bookings/bookings.repository');

describe('Resource Booking Service Unit Tests', () => {
  const currentUser = { id: 'u-user-1', name: 'Test User', role: 'EMPLOYEE' };
  const managerUser = { id: 'u-manager-1', name: 'Manager User', role: 'MANAGER' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    it('should throw an error if start time is in the past', async () => {
      const data = {
        assetId: 'a-asset-1',
        startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        endTime: new Date(Date.now() + 3600000).toISOString(),
      };

      await expect(service.createBooking(data, currentUser))
        .rejects
        .toThrow('Booking start time must be in the future.');
    });

    it('should throw an error if end time is before or equal to start time', async () => {
      const start = new Date(Date.now() + 3600000).toISOString();
      const data = {
        assetId: 'a-asset-1',
        startTime: start,
        endTime: start,
      };

      await expect(service.createBooking(data, currentUser))
        .rejects
        .toThrow('Booking end time must be after the start time.');
    });

    it('should throw an error if target asset does not exist', async () => {
      const data = {
        assetId: 'a-invalid-asset',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
      };

      repository.findAssetById.mockResolvedValue(null);

      await expect(service.createBooking(data, currentUser))
        .rejects
        .toThrow('Asset not found.');
    });

    it('should throw an error if asset is not configured as bookable', async () => {
      const data = {
        assetId: 'a-asset-1',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
      };

      repository.findAssetById.mockResolvedValue({ id: 'a-asset-1', isSharedBookable: false });

      await expect(service.createBooking(data, currentUser))
        .rejects
        .toThrow('Asset is not configured as a bookable resource.');
    });

    it('should throw an error if an employee tries to book resources on behalf of another user', async () => {
      const data = {
        assetId: 'a-asset-1',
        userId: 'u-user-other',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
      };
      const employeeUser = { id: 'u-user-1', role: 'EMPLOYEE' };

      repository.findAssetById.mockResolvedValue({ id: 'a-asset-1', isSharedBookable: true });

      await expect(service.createBooking(data, employeeUser))
        .rejects
        .toThrow('Unauthorized to book resources on behalf of other users.');
    });

    it('should throw an error if target user does not exist', async () => {
      const data = {
        assetId: 'a-asset-1',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
      };

      repository.findAssetById.mockResolvedValue({ id: 'a-asset-1', isSharedBookable: true });
      repository.findUserById.mockResolvedValue(null);

      await expect(service.createBooking(data, currentUser))
        .rejects
        .toThrow('User not found.');
    });

    it('should throw an error if requested time slot overlaps with an existing reservation', async () => {
      const data = {
        assetId: 'a-asset-1',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
      };

      repository.findAssetById.mockResolvedValue({ id: 'a-asset-1', isSharedBookable: true });
      repository.findUserById.mockResolvedValue({ id: 'u-user-1' });
      repository.findOverlappingBookings.mockResolvedValue([{ id: 'booking-overlap-1' }]);

      await expect(service.createBooking(data, currentUser))
        .rejects
        .toThrow('The requested booking time slot overlaps with an existing reservation.');
    });

    it('should successfully create a resource booking if validations pass', async () => {
      const start = new Date(Date.now() + 3600000);
      const end = new Date(Date.now() + 7200000);
      const data = {
        assetId: 'a-asset-1',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      };

      repository.findAssetById.mockResolvedValue({ id: 'a-asset-1', isSharedBookable: true });
      repository.findUserById.mockResolvedValue({ id: 'u-user-1' });
      repository.findOverlappingBookings.mockResolvedValue([]);
      repository.createBooking.mockResolvedValue({ id: 'booking-1', status: 'UPCOMING' });

      const result = await service.createBooking(data, currentUser);

      expect(repository.createBooking).toHaveBeenCalledWith({
        assetId: 'a-asset-1',
        userId: currentUser.id,
        startTime: start,
        endTime: end,
      });
      expect(result).toEqual({ id: 'booking-1', status: 'UPCOMING' });
    });
  });

  describe('cancelBooking', () => {
    it('should throw an error if booking is not found', async () => {
      repository.findBookingById.mockResolvedValue(null);

      await expect(service.cancelBooking('b-invalid', currentUser))
        .rejects
        .toThrow('Booking not found.');
    });

    it('should throw an error if booking status is already CANCELLED', async () => {
      repository.findBookingById.mockResolvedValue({ id: 'b-1', status: 'CANCELLED', userId: currentUser.id });

      await expect(service.cancelBooking('b-1', currentUser))
        .rejects
        .toThrow('Booking is already cancelled.');
    });

    it('should throw an error if booking status is already COMPLETED', async () => {
      repository.findBookingById.mockResolvedValue({ id: 'b-1', status: 'COMPLETED', userId: currentUser.id });

      await expect(service.cancelBooking('b-1', currentUser))
        .rejects
        .toThrow('Booking is already completed.');
    });

    it('should throw an error if requester is not a manager and not the owner of the booking', async () => {
      const otherUser = { id: 'u-user-other', role: 'EMPLOYEE' };
      repository.findBookingById.mockResolvedValue({ id: 'b-1', status: 'UPCOMING', userId: 'u-user-1' });

      await expect(service.cancelBooking('b-1', otherUser))
        .rejects
        .toThrow('Unauthorized to cancel this booking.');
    });

    it('should successfully cancel if requester is the booking owner', async () => {
      repository.findBookingById.mockResolvedValue({ id: 'b-1', status: 'UPCOMING', userId: currentUser.id });
      repository.cancelBooking.mockResolvedValue({ id: 'b-1', status: 'CANCELLED' });

      const result = await service.cancelBooking('b-1', currentUser);

      expect(repository.cancelBooking).toHaveBeenCalledWith('b-1');
      expect(result.status).toBe('CANCELLED');
    });

    it('should successfully cancel if requester is a manager (even if not owner)', async () => {
      repository.findBookingById.mockResolvedValue({ id: 'b-1', status: 'UPCOMING', userId: 'u-user-other' });
      repository.cancelBooking.mockResolvedValue({ id: 'b-1', status: 'CANCELLED' });

      const result = await service.cancelBooking('b-1', managerUser);

      expect(repository.cancelBooking).toHaveBeenCalledWith('b-1');
      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('Read Operations', () => {
    it('getBookingById should return request if found', async () => {
      repository.findBookingById.mockResolvedValue({ id: 'b-1' });
      const result = await service.getBookingById('b-1');
      expect(result).toEqual({ id: 'b-1' });
    });

    it('getBookings should query repository with filters', async () => {
      repository.findBookings.mockResolvedValue([]);
      const result = await service.getBookings({ status: 'UPCOMING' });
      expect(repository.findBookings).toHaveBeenCalledWith({ status: 'UPCOMING' });
      expect(result).toEqual([]);
    });

    it('getBookingsByUser should throw an error if user does not exist', async () => {
      repository.findUserById.mockResolvedValue(null);
      await expect(service.getBookingsByUser('u-invalid'))
        .rejects
        .toThrow('User not found.');
    });

    it('getBookingsByUser should return user bookings list', async () => {
      repository.findUserById.mockResolvedValue({ id: 'u-user-1' });
      repository.findBookingsByUserId.mockResolvedValue([]);
      const result = await service.getBookingsByUser('u-user-1');
      expect(repository.findBookingsByUserId).toHaveBeenCalledWith('u-user-1');
      expect(result).toEqual([]);
    });

    it('getBookingsByAsset should throw an error if asset does not exist', async () => {
      repository.findAssetById.mockResolvedValue(null);
      await expect(service.getBookingsByAsset('a-invalid'))
        .rejects
        .toThrow('Asset not found.');
    });

    it('getBookingsByAsset should return asset bookings list', async () => {
      repository.findAssetById.mockResolvedValue({ id: 'a-asset-1' });
      repository.findBookingsByAssetId.mockResolvedValue([]);
      const result = await service.getBookingsByAsset('a-asset-1');
      expect(repository.findBookingsByAssetId).toHaveBeenCalledWith('a-asset-1');
      expect(result).toEqual([]);
    });

    it('getUpcomingBookings should filter by UPCOMING status', async () => {
      repository.findBookings.mockResolvedValue([]);
      const result = await service.getUpcomingBookings();
      expect(repository.findBookings).toHaveBeenCalledWith({ status: 'UPCOMING' });
      expect(result).toEqual([]);
    });

    it('getBookingCalendar should query repository with calendar ranges', async () => {
      repository.findBookings.mockResolvedValue([]);
      const result = await service.getBookingCalendar({ startRange: '2026-07-12', endRange: '2026-07-13' });
      expect(repository.findBookings).toHaveBeenCalledWith({ startRange: '2026-07-12', endRange: '2026-07-13' });
      expect(result).toEqual([]);
    });
  });
});
