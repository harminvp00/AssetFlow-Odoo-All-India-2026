/* global describe, it, expect, jest, beforeEach */

jest.mock('../../src/modules/reports/reports.repository', () => ({
  getDepartmentUtilization: jest.fn(),
  getMaintenanceStats: jest.fn(),
  getSummaryKPIs: jest.fn(),
  getMostUsedAssets: jest.fn(),
  getIdleAssets: jest.fn(),
}));

const service = require('../../src/modules/reports/reports.service');
const repository = require('../../src/modules/reports/reports.repository');

describe('Reports Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUtilization', () => {
    it('should fetch department utilization rates successfully', async () => {
      const mockUtilization = [
        { id: 'd-1', department: 'Engineering', utilizationRate: 80, totalAssets: 10, allocatedAssets: 8 }
      ];
      repository.getDepartmentUtilization.mockResolvedValue(mockUtilization);

      const result = await service.getUtilization();

      expect(repository.getDepartmentUtilization).toHaveBeenCalled();
      expect(result).toEqual(mockUtilization);
    });
  });

  describe('getMaintenance', () => {
    it('should fetch maintenance frequencies successfully', async () => {
      const mockMaintenance = [
        { month: 'Jan', count: 5 },
        { month: 'Feb', count: 12 }
      ];
      repository.getMaintenanceStats.mockResolvedValue(mockMaintenance);

      const result = await service.getMaintenance();

      expect(repository.getMaintenanceStats).toHaveBeenCalled();
      expect(result).toEqual(mockMaintenance);
    });
  });

  describe('getSummary', () => {
    it('should fetch all dashboard metrics, most active, and idle lists', async () => {
      const mockKPIs = {
        totalAssets: 100,
        allocatedAssets: 70,
        availableAssets: 25,
        maintenanceAssets: 5,
        activeBookings: 8,
        totalDiscrepancies: 2,
        utilizationRate: 70,
      };
      const mockMostUsed = [
        { id: 'a-1', tag: 'AF-001', name: 'Laptop', category: 'IT', allocationCount: 15 }
      ];
      const mockIdle = [
        { id: 'a-2', tag: 'AF-002', name: 'Monitor', category: 'Hardware', acquisitionDate: '2026-06-01T00:00:00Z' }
      ];

      repository.getSummaryKPIs.mockResolvedValue(mockKPIs);
      repository.getMostUsedAssets.mockResolvedValue(mockMostUsed);
      repository.getIdleAssets.mockResolvedValue(mockIdle);

      const result = await service.getSummary();

      expect(repository.getSummaryKPIs).toHaveBeenCalled();
      expect(repository.getMostUsedAssets).toHaveBeenCalled();
      expect(repository.getIdleAssets).toHaveBeenCalled();
      expect(result).toEqual({
        kpis: mockKPIs,
        mostUsed: mockMostUsed,
        idle: mockIdle,
      });
    });
  });
});
