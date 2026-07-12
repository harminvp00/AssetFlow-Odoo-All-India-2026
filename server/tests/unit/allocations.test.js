/* global describe, it, expect, jest, beforeEach */

jest.mock('../../src/modules/allocations/allocations.repository', () => ({
  createAllocation: jest.fn(),
  findAllocationById: jest.fn(),
  findActiveAllocationByAssetId: jest.fn(),
  findAllocations: jest.fn(),
  updateAllocation: jest.fn(),
  updateAssetStatus: jest.fn(),
  findAssetById: jest.fn(),
  findEmployeeById: jest.fn(),
  findDepartmentById: jest.fn(),
}));
jest.mock('../../src/config/database', () => {
  const mockPrisma = {
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };
  return {
    prisma: mockPrisma,
  };
});

const service = require('../../src/modules/allocations/allocations.service');
const repository = require('../../src/modules/allocations/allocations.repository');
require('../../src/config/database');

describe('Allocations Service Unit Tests', () => {
  const currentUser = { id: 'u-user-1', name: 'Test User', role: 'MANAGER' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAllocations', () => {
    it('should call repository.findAllocations with filters', async () => {
      const filters = { status: 'ACTIVE' };
      repository.findAllocations.mockResolvedValue([]);

      const result = await service.getAllAllocations(filters);

      expect(repository.findAllocations).toHaveBeenCalledWith(filters);
      expect(result).toEqual([]);
    });
  });

  describe('allocateAsset', () => {
    it('should throw 400 if target validation fails', async () => {
      await expect(
        service.allocateAsset({ assetId: 'asset-id-1', employeeId: 'emp-1', departmentId: 'dept-1' }, currentUser)
      ).rejects.toThrow('Invalid allocation target. Must provide either an employee or a department, but not both.');
    });

    it('should throw 404 if asset not found', async () => {
      repository.findAssetById.mockResolvedValue(null);

      await expect(
        service.allocateAsset({ assetId: 'asset-id-1', employeeId: 'emp-1' }, currentUser)
      ).rejects.toThrow('Asset not found.');
    });

    it('should throw 400 if asset is not AVAILABLE', async () => {
      repository.findAssetById.mockResolvedValue({ id: 'asset-id-1', status: 'ALLOCATED' });

      await expect(
        service.allocateAsset({ assetId: 'asset-id-1', employeeId: 'emp-1' }, currentUser)
      ).rejects.toThrow('Asset is currently unavailable for allocation.');
    });

    it('should throw 409 if asset has active allocation', async () => {
      repository.findAssetById.mockResolvedValue({ id: 'asset-id-1', status: 'AVAILABLE' });
      repository.findActiveAllocationByAssetId.mockResolvedValue({
        employee: { name: 'Priya Shah', department: { name: 'Engineering' } },
      });

      await expect(
        service.allocateAsset({ assetId: 'asset-id-1', employeeId: 'emp-1' }, currentUser)
      ).rejects.toThrow('Already Allocated to Priya Shah (Engineering). Direct re-allocation is blocked.');
    });

    it('should throw 404 if employee not found', async () => {
      repository.findAssetById.mockResolvedValue({ id: 'asset-id-1', status: 'AVAILABLE' });
      repository.findActiveAllocationByAssetId.mockResolvedValue(null);
      repository.findEmployeeById.mockResolvedValue(null);

      await expect(
        service.allocateAsset({ assetId: 'asset-id-1', employeeId: 'emp-1' }, currentUser)
      ).rejects.toThrow('Employee not found.');
    });

    it('should allocate asset successfully if AVAILABLE', async () => {
      const asset = { id: 'asset-id-1', name: 'MacBook', tag: 'AF-001', status: 'AVAILABLE' };
      const allocation = { id: 'alloc-1', assetId: 'asset-id-1', employeeId: 'emp-1', status: 'ACTIVE' };

      repository.findAssetById.mockResolvedValue(asset);
      repository.findActiveAllocationByAssetId.mockResolvedValue(null);
      repository.findEmployeeById.mockResolvedValue({ id: 'emp-1' });
      repository.createAllocation.mockResolvedValue(allocation);

      const result = await service.allocateAsset({ assetId: 'asset-id-1', employeeId: 'emp-1' }, currentUser);

      expect(repository.findAssetById).toHaveBeenCalledWith('asset-id-1', expect.anything());
      expect(repository.createAllocation).toHaveBeenCalledWith(
        {
          assetId: 'asset-id-1',
          employeeId: 'emp-1',
          departmentId: undefined,
          allocatedById: currentUser.id,
          expectedReturnDate: undefined,
          status: 'ACTIVE',
        },
        expect.anything()
      );
      expect(repository.updateAssetStatus).toHaveBeenCalledWith('asset-id-1', 'ALLOCATED', expect.anything());
      expect(result).toEqual(allocation);
    });
  });
});
