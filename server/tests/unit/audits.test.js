/* global describe, it, expect, jest, beforeEach */

jest.mock('../../src/modules/audits/audits.repository', () => ({
  createAuditCycle: jest.fn(),
  findAuditCycleById: jest.fn(),
  findAuditCycles: jest.fn(),
  updateAuditCycle: jest.fn(),
  assignAuditors: jest.fn(),
  createAuditRecord: jest.fn(),
  findAuditRecordById: jest.fn(),
  updateAuditRecord: jest.fn(),
  findAuditRecords: jest.fn(),
  findRecordByAssetAndCycle: jest.fn(),
  findAuditorById: jest.fn(),
  findAssetById: jest.fn(),
  findAssetsByScope: jest.fn(),
  updateAssetStatus: jest.fn(),
  findAuditHistoryByAssetId: jest.fn(),
  findUserById: jest.fn(),
  findDepartmentById: jest.fn(),
  findLocationById: jest.fn(),
}));

jest.mock('../../src/config/database', () => {
  const mockPrisma = {
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };
  return {
    prisma: mockPrisma,
  };
});

const service = require('../../src/modules/audits/audits.service');
const repository = require('../../src/modules/audits/audits.repository');

describe('Audit Service Unit Tests', () => {
  const adminUser = { id: 'u-admin-1', name: 'Admin User', role: 'ADMIN' };
  const auditorUser = { id: 'u-auditor-1', name: 'Auditor User', role: 'EMPLOYEE' };
  const regularUser = { id: 'u-regular-1', name: 'Regular User', role: 'EMPLOYEE' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAuditCycle', () => {
    it('should throw an error if requester is not an admin', async () => {
      await expect(service.createAuditCycle({}, regularUser))
        .rejects
        .toThrow('Unauthorized action.');
    });

    it('should throw an error if start date is after end date', async () => {
      const data = {
        name: 'Q3 Audit',
        startDate: '2026-07-15T00:00:00.000Z',
        endDate: '2026-07-14T00:00:00.000Z',
        auditors: ['u-auditor-1'],
      };

      await expect(service.createAuditCycle(data, adminUser))
        .rejects
        .toThrow('Start date must be before end date.');
    });

    it('should throw an error if auditors list is empty', async () => {
      const data = {
        name: 'Q3 Audit',
        startDate: '2026-07-14T00:00:00.000Z',
        endDate: '2026-07-15T00:00:00.000Z',
        auditors: [],
      };

      await expect(service.createAuditCycle(data, adminUser))
        .rejects
        .toThrow('At least one auditor must be assigned to the cycle.');
    });

    it('should throw an error if auditor does not exist', async () => {
      const data = {
        name: 'Q3 Audit',
        startDate: '2026-07-14T00:00:00.000Z',
        endDate: '2026-07-15T00:00:00.000Z',
        auditors: ['u-invalid'],
      };
      repository.findUserById.mockResolvedValue(null);

      await expect(service.createAuditCycle(data, adminUser))
        .rejects
        .toThrow('Auditor not found.');
    });

    it('should successfully create cycle with DRAFT status', async () => {
      const data = {
        name: 'Q3 Audit',
        startDate: '2026-07-14T00:00:00.000Z',
        endDate: '2026-07-15T00:00:00.000Z',
        auditors: ['u-auditor-1'],
      };
      repository.findUserById.mockResolvedValue(auditorUser);
      repository.createAuditCycle.mockResolvedValue({ id: 'c-1', status: 'DRAFT' });
      repository.assignAuditors.mockResolvedValue({});
      repository.findAuditCycleById.mockResolvedValue({ id: 'c-1', status: 'DRAFT' });

      const result = await service.createAuditCycle(data, adminUser);
      expect(result.status).toBe('DRAFT');
    });
  });

  describe('startAuditCycle', () => {
    it('should throw an error if status is not DRAFT', async () => {
      repository.findAuditCycleById.mockResolvedValue({ id: 'c-1', status: 'ACTIVE' });

      await expect(service.startAuditCycle('c-1', adminUser))
        .rejects
        .toThrow('Invalid state transition.');
    });

    it('should successfully start draft audit cycle', async () => {
      repository.findAuditCycleById.mockResolvedValue({ id: 'c-1', status: 'DRAFT', auditors: [{ id: 'u-auditor-1' }] });
      repository.updateAuditCycle.mockResolvedValue({ id: 'c-1', status: 'ACTIVE' });

      const result = await service.startAuditCycle('c-1', adminUser);
      expect(repository.updateAuditCycle).toHaveBeenCalledWith('c-1', { status: 'ACTIVE' });
      expect(result.status).toBe('ACTIVE');
    });
  });

  describe('verifyAsset', () => {
    it('should throw an error if cycle status is not ACTIVE', async () => {
      repository.findAuditCycleById.mockResolvedValue({ id: 'c-1', status: 'DRAFT' });

      await expect(service.verifyAsset('c-1', { assetId: 'a-1', status: 'VERIFIED' }, adminUser))
        .rejects
        .toThrow('Invalid state transition.');
    });

    it('should throw an error if user is not an assigned auditor or admin', async () => {
      repository.findAuditCycleById.mockResolvedValue({
        id: 'c-1',
        status: 'ACTIVE',
        auditors: [{ id: 'u-auditor-1' }],
      });

      await expect(service.verifyAsset('c-1', { assetId: 'a-1', status: 'VERIFIED' }, regularUser))
        .rejects
        .toThrow('Auditor not assigned.');
    });

    it('should throw an error if asset already verified in this cycle', async () => {
      repository.findAuditCycleById.mockResolvedValue({
        id: 'c-1',
        status: 'ACTIVE',
        auditors: [{ id: 'u-auditor-1' }],
      });
      repository.findAssetById.mockResolvedValue({ id: 'a-1' });
      repository.findRecordByAssetAndCycle.mockResolvedValue({ id: 'r-1' });

      await expect(service.verifyAsset('c-1', { assetId: 'a-1', status: 'VERIFIED' }, auditorUser))
        .rejects
        .toThrow('Asset already verified.');
    });

    it('should throw an error if asset department scope does not match', async () => {
      repository.findAuditCycleById.mockResolvedValue({
        id: 'c-1',
        status: 'ACTIVE',
        scopeDepartmentId: 'dept-1',
        auditors: [{ id: 'u-auditor-1' }],
      });
      repository.findAssetById.mockResolvedValue({ id: 'a-1', departmentId: 'dept-different' });
      repository.findRecordByAssetAndCycle.mockResolvedValue(null);

      await expect(service.verifyAsset('c-1', { assetId: 'a-1', status: 'VERIFIED' }, auditorUser))
        .rejects
        .toThrow('Asset outside audit scope.');
    });

    it('should successfully log record if within scope', async () => {
      repository.findAuditCycleById.mockResolvedValue({
        id: 'c-1',
        status: 'ACTIVE',
        auditors: [{ id: 'u-auditor-1' }],
      });
      repository.findAssetById.mockResolvedValue({ id: 'a-1' });
      repository.findRecordByAssetAndCycle.mockResolvedValue(null);
      repository.createAuditRecord.mockResolvedValue({ id: 'rec-1', status: 'VERIFIED' });

      const result = await service.verifyAsset('c-1', { assetId: 'a-1', status: 'VERIFIED', notes: 'all good' }, auditorUser);
      expect(repository.createAuditRecord).toHaveBeenCalledWith({
        auditCycleId: 'c-1',
        assetId: 'a-1',
        auditorId: 'u-auditor-1',
        status: 'VERIFIED',
        notes: 'all good',
      });
      expect(result.status).toBe('VERIFIED');
    });
  });

  describe('closeAuditCycle', () => {
    it('should compile discrepancy report and mark missing assets as LOST', async () => {
      const cycle = {
        id: 'c-1',
        status: 'ACTIVE',
        scopeDepartmentId: 'dept-1',
        records: [
          { assetId: 'a-verified', status: 'VERIFIED' },
          { assetId: 'a-missing', status: 'MISSING', notes: 'cannot find' },
        ],
      };
      repository.findAuditCycleById.mockResolvedValue(cycle);

      const scopedAssets = [
        { id: 'a-verified', tag: 'TAG1', name: 'Asset 1', status: 'AVAILABLE' },
        { id: 'a-missing', tag: 'TAG2', name: 'Asset 2', status: 'AVAILABLE' },
        { id: 'a-unaudited', tag: 'TAG3', name: 'Asset 3', status: 'AVAILABLE' },
      ];
      repository.findAssetsByScope.mockResolvedValue(scopedAssets);
      repository.updateAuditCycle.mockResolvedValue({ id: 'c-1', status: 'COMPLETED' });

      const result = await service.closeAuditCycle('c-1', adminUser);

      expect(repository.updateAssetStatus).toHaveBeenCalledWith('a-missing', 'LOST', expect.anything());
      expect(repository.updateAssetStatus).toHaveBeenCalledWith('a-unaudited', 'LOST', expect.anything());

      expect(repository.updateAuditCycle).toHaveBeenCalledWith(
        'c-1',
        {
          status: 'COMPLETED',
          discrepancyReport: {
            totalAssets: 3,
            verifiedCount: 1,
            damagedCount: 0,
            missingCount: 1,
            unauditedCount: 1,
            discrepancies: [
              { assetId: 'a-missing', tag: 'TAG2', name: 'Asset 2', expectedStatus: 'AVAILABLE', actualStatus: 'MISSING', notes: 'cannot find' },
              { assetId: 'a-unaudited', tag: 'TAG3', name: 'Asset 3', expectedStatus: 'AVAILABLE', actualStatus: 'UNAUDITED', notes: 'Asset was not verified during this cycle.' },
            ],
          },
        },
        expect.anything()
      );
      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('Read Operations', () => {
    it('getAuditCycleById should return cycle if found', async () => {
      repository.findAuditCycleById.mockResolvedValue({ id: 'c-1' });
      const result = await service.getAuditCycleById('c-1');
      expect(result).toEqual({ id: 'c-1' });
    });

    it('getAuditCycles should query repository', async () => {
      repository.findAuditCycles.mockResolvedValue([]);
      const result = await service.getAuditCycles({ status: 'ACTIVE' });
      expect(repository.findAuditCycles).toHaveBeenCalledWith({ status: 'ACTIVE' });
      expect(result).toEqual([]);
    });

    it('getAuditHistoryByAsset should query repository history', async () => {
      repository.findAuditHistoryByAssetId.mockResolvedValue([]);
      const result = await service.getAuditHistoryByAsset('a-1');
      expect(repository.findAuditHistoryByAssetId).toHaveBeenCalledWith('a-1');
      expect(result).toEqual([]);
    });
  });
});
