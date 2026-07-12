/* global describe, it, expect, jest, beforeEach */

jest.mock('../../src/modules/transfers/transfers.repository', () => ({
  createTransferRequest: jest.fn(),
  findTransferById: jest.fn(),
  findPendingTransferByAssetId: jest.fn(),
  findTransfers: jest.fn(),
  updateTransferStatus: jest.fn(),
  findActiveAllocationByAssetId: jest.fn(),
  closeAllocation: jest.fn(),
  createNewAllocation: jest.fn(),
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

const service = require('../../src/modules/transfers/transfers.service');
const repository = require('../../src/modules/transfers/transfers.repository');

describe('Transfers Service Unit Tests', () => {
  const currentUser = { id: 'u-user-1', name: 'Test User', role: 'MANAGER' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTransferRequest', () => {
    it('should throw an error if both employee and department are target assignees', async () => {
      const data = {
        assetId: 'a-asset-1',
        toEmployeeId: 'e-emp-1',
        toDepartmentId: 'd-dept-1',
      };

      await expect(service.createTransferRequest(data, currentUser))
        .rejects
        .toThrow('Invalid transfer target. Must provide either a target employee or a department, but not both.');
    });

    it('should throw an error if neither employee nor department are target assignees', async () => {
      const data = {
        assetId: 'a-asset-1',
      };

      await expect(service.createTransferRequest(data, currentUser))
        .rejects
        .toThrow('Invalid transfer target. Must provide either a target employee or a department, but not both.');
    });

    it('should throw an error if target asset does not exist', async () => {
      const data = {
        assetId: 'a-asset-invalid',
        toEmployeeId: 'e-emp-1',
      };

      repository.findAssetById.mockResolvedValue(null);

      await expect(service.createTransferRequest(data, currentUser))
        .rejects
        .toThrow('Asset not found.');
    });

    it('should throw an error if asset does not have an active allocation', async () => {
      const data = {
        assetId: 'a-asset-1',
        toEmployeeId: 'e-emp-1',
      };

      repository.findAssetById.mockResolvedValue({ id: 'a-asset-1' });
      repository.findActiveAllocationByAssetId.mockResolvedValue(null);

      await expect(service.createTransferRequest(data, currentUser))
        .rejects
        .toThrow('Asset must currently be allocated to request a transfer.');
    });

    it('should throw an error if asset already has a pending transfer request', async () => {
      const data = {
        assetId: 'a-asset-1',
        toEmployeeId: 'e-emp-1',
      };

      repository.findAssetById.mockResolvedValue({ id: 'a-asset-1' });
      repository.findActiveAllocationByAssetId.mockResolvedValue({ id: 'alloc-1', employeeId: 'e-current-1' });
      repository.findPendingTransferByAssetId.mockResolvedValue({ id: 'req-pending' });

      await expect(service.createTransferRequest(data, currentUser))
        .rejects
        .toThrow('Asset already has a pending transfer request.');
    });

    it('should throw an error if requester is not a manager and not the owner of the active allocation', async () => {
      const data = {
        assetId: 'a-asset-1',
        toEmployeeId: 'e-emp-new',
      };
      const employeeUser = { id: 'e-other', role: 'EMPLOYEE' };

      repository.findAssetById.mockResolvedValue({ id: 'a-asset-1' });
      repository.findActiveAllocationByAssetId.mockResolvedValue({ id: 'alloc-1', employeeId: 'e-current-1' });

      await expect(service.createTransferRequest(data, employeeUser))
        .rejects
        .toThrow('Unauthorized to request transfer for this asset.');
    });

    it('should throw an error if destination employee is not found', async () => {
      const data = {
        assetId: 'a-asset-1',
        toEmployeeId: 'e-emp-invalid',
      };

      repository.findAssetById.mockResolvedValue({ id: 'a-asset-1' });
      repository.findActiveAllocationByAssetId.mockResolvedValue({ id: 'alloc-1', employeeId: 'e-current-1' });
      repository.findPendingTransferByAssetId.mockResolvedValue(null);
      repository.findEmployeeById.mockResolvedValue(null);

      await expect(service.createTransferRequest(data, currentUser))
        .rejects
        .toThrow('Destination employee not found.');
    });

    it('should throw an error if target assignee is the current owner', async () => {
      const data = {
        assetId: 'a-asset-1',
        toEmployeeId: 'e-current-1',
      };

      repository.findAssetById.mockResolvedValue({ id: 'a-asset-1' });
      repository.findActiveAllocationByAssetId.mockResolvedValue({ id: 'alloc-1', employeeId: 'e-current-1' });
      repository.findPendingTransferByAssetId.mockResolvedValue(null);
      repository.findEmployeeById.mockResolvedValue({ id: 'e-current-1' });

      await expect(service.createTransferRequest(data, currentUser))
        .rejects
        .toThrow('Invalid destination. Target employee is already the current owner.');
    });

    it('should successfully create a transfer request from current allocation to employee assignee', async () => {
      const data = {
        assetId: 'a-asset-1',
        toEmployeeId: 'e-emp-new',
      };

      repository.findAssetById.mockResolvedValue({ id: 'a-asset-1' });
      repository.findActiveAllocationByAssetId.mockResolvedValue({ id: 'alloc-1', employeeId: 'e-current-1', departmentId: null });
      repository.findPendingTransferByAssetId.mockResolvedValue(null);
      repository.findEmployeeById.mockResolvedValue({ id: 'e-emp-new' });
      repository.createTransferRequest.mockResolvedValue({ id: 'req-1', status: 'PENDING' });

      const result = await service.createTransferRequest(data, currentUser);

      expect(repository.createTransferRequest).toHaveBeenCalledWith({
        assetId: 'a-asset-1',
        fromEmployeeId: 'e-current-1',
        fromDepartmentId: null,
        toEmployeeId: 'e-emp-new',
        toDepartmentId: null,
        requestedById: currentUser.id,
      });
      expect(result).toEqual({ id: 'req-1', status: 'PENDING' });
    });
  });

  describe('approveTransfer', () => {
    it('should throw an error if transfer request is not found', async () => {
      repository.findTransferById.mockResolvedValue(null);

      await expect(service.approveTransfer('req-invalid', currentUser))
        .rejects
        .toThrow('Transfer request not found.');
    });

    it('should throw an error if request is not in PENDING state', async () => {
      repository.findTransferById.mockResolvedValue({ id: 'req-1', status: 'APPROVED' });

      await expect(service.approveTransfer('req-1', currentUser))
        .rejects
        .toThrow('Only pending transfer requests can be approved.');
    });

    it('should throw an error if approver is not a manager or administrator', async () => {
      const employeeUser = { id: 'e-emp-1', role: 'EMPLOYEE' };
      repository.findTransferById.mockResolvedValue({ id: 'req-1', status: 'PENDING' });

      await expect(service.approveTransfer('req-1', employeeUser))
        .rejects
        .toThrow('Unauthorized approval. Only administrators or managers can approve transfer requests.');
    });

    it('should throw an error if active allocation for asset is missing', async () => {
      repository.findTransferById.mockResolvedValue({ id: 'req-1', assetId: 'a-1', status: 'PENDING' });
      repository.findActiveAllocationByAssetId.mockResolvedValue(null);

      await expect(service.approveTransfer('req-1', currentUser))
        .rejects
        .toThrow('No active allocation found for the target asset.');
    });

    it('should successfully approve a pending request and cycle allocations in a transaction', async () => {
      const request = {
        id: 'req-1',
        assetId: 'a-1',
        status: 'PENDING',
        toEmployeeId: 'e-new',
        toDepartmentId: null,
      };

      const activeAlloc = { id: 'alloc-old', assetId: 'a-1', employeeId: 'e-old' };

      repository.findTransferById.mockResolvedValue(request);
      repository.findActiveAllocationByAssetId.mockResolvedValue(activeAlloc);
      repository.updateTransferStatus.mockResolvedValue({ ...request, status: 'APPROVED', approvedById: currentUser.id });

      const result = await service.approveTransfer('req-1', currentUser);

      expect(repository.closeAllocation).toHaveBeenCalledWith('alloc-old', expect.objectContaining({
        status: 'RETURNED',
      }), expect.anything());

      expect(repository.createNewAllocation).toHaveBeenCalledWith({
        assetId: 'a-1',
        employeeId: 'e-new',
        departmentId: null,
        allocatedById: currentUser.id,
        status: 'ACTIVE',
      }, expect.anything());

      expect(repository.updateTransferStatus).toHaveBeenCalledWith('req-1', 'APPROVED', currentUser.id, expect.anything());

      expect(result.status).toBe('APPROVED');
    });
  });

  describe('rejectTransfer', () => {
    it('should throw an error if request is not found', async () => {
      repository.findTransferById.mockResolvedValue(null);

      await expect(service.rejectTransfer('req-invalid', currentUser))
        .rejects
        .toThrow('Transfer request not found.');
    });

    it('should throw an error if approver is not a manager or administrator', async () => {
      const employeeUser = { id: 'e-emp-1', role: 'EMPLOYEE' };
      repository.findTransferById.mockResolvedValue({ id: 'req-1', status: 'PENDING' });

      await expect(service.rejectTransfer('req-1', employeeUser))
        .rejects
        .toThrow('Unauthorized approval. Only administrators or managers can reject transfer requests.');
    });

    it('should successfully reject a pending request', async () => {
      const request = { id: 'req-1', assetId: 'a-1', status: 'PENDING' };
      repository.findTransferById.mockResolvedValue(request);
      repository.updateTransferStatus.mockResolvedValue({ ...request, status: 'REJECTED', approvedById: currentUser.id });

      const result = await service.rejectTransfer('req-1', currentUser);

      expect(repository.updateTransferStatus).toHaveBeenCalledWith('req-1', 'REJECTED', currentUser.id, expect.anything());

      expect(result.status).toBe('REJECTED');
    });
  });

  describe('Read Operations', () => {
    it('getTransferById should return request if found', async () => {
      repository.findTransferById.mockResolvedValue({ id: 'req-1' });
      const result = await service.getTransferById('req-1');
      expect(result).toEqual({ id: 'req-1' });
    });

    it('getTransfers should query repository with filters', async () => {
      repository.findTransfers.mockResolvedValue([]);
      const result = await service.getTransfers({ status: 'PENDING' });
      expect(repository.findTransfers).toHaveBeenCalledWith({ status: 'PENDING' });
      expect(result).toEqual([]);
    });

    it('getPendingTransfers should query repository with PENDING filter', async () => {
      repository.findTransfers.mockResolvedValue([]);
      const result = await service.getPendingTransfers();
      expect(repository.findTransfers).toHaveBeenCalledWith({ status: 'PENDING' });
      expect(result).toEqual([]);
    });
  });
});
