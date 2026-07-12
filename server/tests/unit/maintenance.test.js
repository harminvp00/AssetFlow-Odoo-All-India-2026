/* global describe, it, expect, jest, beforeEach */

jest.mock('../../src/modules/maintenance/maintenance.repository', () => ({
  createMaintenanceRequest: jest.fn(),
  findMaintenanceRequestById: jest.fn(),
  findMaintenanceRequests: jest.fn(),
  findPendingRequests: jest.fn(),
  findActiveMaintenanceByAssetId: jest.fn(),
  findMaintenanceHistoryByAssetId: jest.fn(),
  updateMaintenanceRequest: jest.fn(),
  updateMaintenanceStatus: jest.fn(),
  assignTechnician: jest.fn(),
  findAssetById: jest.fn(),
  findUserById: jest.fn(),
  updateAssetStatus: jest.fn(),
}));

jest.mock('../../src/config/database', () => {
  const mockPrisma = {
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };
  return {
    prisma: mockPrisma,
  };
});

const service = require('../../src/modules/maintenance/maintenance.service');
const repository = require('../../src/modules/maintenance/maintenance.repository');

describe('Maintenance Service Unit Tests', () => {
  const currentUser = { id: 'u-user-1', name: 'Test User', role: 'EMPLOYEE' };
  const managerUser = { id: 'u-manager-1', name: 'Manager User', role: 'MANAGER' };
  const technicianUser = { id: 'u-tech-1', name: 'Tech User', role: 'EMPLOYEE' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('raiseMaintenanceRequest', () => {
    it('should throw an error if target asset does not exist', async () => {
      repository.findAssetById.mockResolvedValue(null);

      await expect(service.raiseMaintenanceRequest({ assetId: 'a-invalid', issueDescription: 'Broken screen' }, currentUser))
        .rejects
        .toThrow('Asset not found.');
    });

    it('should throw an error if requester does not exist', async () => {
      repository.findAssetById.mockResolvedValue({ id: 'a-1' });
      repository.findUserById.mockResolvedValue(null);

      await expect(service.raiseMaintenanceRequest({ assetId: 'a-1', issueDescription: 'Broken screen' }, currentUser))
        .rejects
        .toThrow('User not found.');
    });

    it('should throw an error if asset already has an active request', async () => {
      repository.findAssetById.mockResolvedValue({ id: 'a-1' });
      repository.findUserById.mockResolvedValue(currentUser);
      repository.findActiveMaintenanceByAssetId.mockResolvedValue({ id: 'r-1', status: 'PENDING' });

      await expect(service.raiseMaintenanceRequest({ assetId: 'a-1', issueDescription: 'Broken screen' }, currentUser))
        .rejects
        .toThrow('Asset already has an active maintenance request.');
    });

    it('should successfully create request in PENDING state', async () => {
      repository.findAssetById.mockResolvedValue({ id: 'a-1' });
      repository.findUserById.mockResolvedValue(currentUser);
      repository.findActiveMaintenanceByAssetId.mockResolvedValue(null);
      repository.createMaintenanceRequest.mockResolvedValue({ id: 'r-1', status: 'PENDING' });

      const result = await service.raiseMaintenanceRequest({ assetId: 'a-1', issueDescription: 'Broken screen', priority: 'HIGH' }, currentUser);

      expect(repository.createMaintenanceRequest).toHaveBeenCalledWith({
        assetId: 'a-1',
        raisedById: currentUser.id,
        issueDescription: 'Broken screen',
        priority: 'HIGH',
        photoUrl: null,
      });
      expect(result.status).toBe('PENDING');
    });
  });

  describe('approveMaintenanceRequest', () => {
    it('should throw an error if request does not exist', async () => {
      repository.findMaintenanceRequestById.mockResolvedValue(null);

      await expect(service.approveMaintenanceRequest('r-invalid', managerUser))
        .rejects
        .toThrow('Maintenance request not found.');
    });

    it('should throw an error if status is not PENDING', async () => {
      repository.findMaintenanceRequestById.mockResolvedValue({ id: 'r-1', status: 'APPROVED' });

      await expect(service.approveMaintenanceRequest('r-1', managerUser))
        .rejects
        .toThrow('Only pending requests can be approved.');
    });

    it('should throw an error if approver is not a manager or admin', async () => {
      repository.findMaintenanceRequestById.mockResolvedValue({ id: 'r-1', status: 'PENDING' });

      await expect(service.approveMaintenanceRequest('r-1', currentUser))
        .rejects
        .toThrow('Unauthorized to approve maintenance requests.');
    });

    it('should successfully approve and update asset to UNDER_MAINTENANCE', async () => {
      const request = { id: 'r-1', assetId: 'a-1', status: 'PENDING' };
      repository.findMaintenanceRequestById.mockResolvedValue(request);
      repository.updateMaintenanceStatus.mockResolvedValue({ ...request, status: 'APPROVED', approvedById: managerUser.id });

      const result = await service.approveMaintenanceRequest('r-1', managerUser);

      expect(repository.updateAssetStatus).toHaveBeenCalledWith('a-1', 'UNDER_MAINTENANCE', expect.anything());
      expect(repository.updateMaintenanceStatus).toHaveBeenCalledWith('r-1', 'APPROVED', managerUser.id, expect.anything());
      expect(result.status).toBe('APPROVED');
    });
  });

  describe('rejectMaintenanceRequest', () => {
    it('should throw an error if requester/request is not found', async () => {
      repository.findMaintenanceRequestById.mockResolvedValue(null);

      await expect(service.rejectMaintenanceRequest('r-invalid', managerUser))
        .rejects
        .toThrow('Maintenance request not found.');
    });

    it('should throw an error if status is not PENDING', async () => {
      repository.findMaintenanceRequestById.mockResolvedValue({ id: 'r-1', status: 'APPROVED' });

      await expect(service.rejectMaintenanceRequest('r-1', managerUser))
        .rejects
        .toThrow('Only pending requests can be rejected.');
    });

    it('should throw an error if reviewer is not authorized', async () => {
      repository.findMaintenanceRequestById.mockResolvedValue({ id: 'r-1', status: 'PENDING' });

      await expect(service.rejectMaintenanceRequest('r-1', currentUser))
        .rejects
        .toThrow('Unauthorized to reject maintenance requests.');
    });

    it('should successfully reject a pending request', async () => {
      const request = { id: 'r-1', assetId: 'a-1', status: 'PENDING' };
      repository.findMaintenanceRequestById.mockResolvedValue(request);
      repository.updateMaintenanceStatus.mockResolvedValue({ ...request, status: 'REJECTED', approvedById: managerUser.id });

      const result = await service.rejectMaintenanceRequest('r-1', managerUser);

      expect(repository.updateMaintenanceStatus).toHaveBeenCalledWith('r-1', 'REJECTED', managerUser.id, expect.anything());
      expect(result.status).toBe('REJECTED');
    });
  });

  describe('assignTechnician', () => {
    it('should throw an error if request is not approved', async () => {
      repository.findMaintenanceRequestById.mockResolvedValue({ id: 'r-1', status: 'PENDING' });

      await expect(service.assignTechnician('r-1', 'u-tech-1', managerUser))
        .rejects
        .toThrow('Only approved requests can have technicians assigned.');
    });

    it('should throw an error if technician is not found', async () => {
      repository.findMaintenanceRequestById.mockResolvedValue({ id: 'r-1', status: 'APPROVED' });
      repository.findUserById.mockResolvedValue(null);

      await expect(service.assignTechnician('r-1', 'u-tech-invalid', managerUser))
        .rejects
        .toThrow('Technician not found.');
    });

    it('should successfully assign technician and transition status', async () => {
      repository.findMaintenanceRequestById.mockResolvedValue({ id: 'r-1', status: 'APPROVED' });
      repository.findUserById.mockResolvedValue({ id: 'u-tech-1' });
      repository.assignTechnician.mockResolvedValue({ id: 'r-1', status: 'TECHNICIAN_ASSIGNED', technicianId: 'u-tech-1' });

      const result = await service.assignTechnician('r-1', 'u-tech-1', managerUser);

      expect(repository.assignTechnician).toHaveBeenCalledWith('r-1', 'u-tech-1');
      expect(result.status).toBe('TECHNICIAN_ASSIGNED');
    });
  });

  describe('startMaintenance', () => {
    it('should throw an error if status is not TECHNICIAN_ASSIGNED', async () => {
      repository.findMaintenanceRequestById.mockResolvedValue({ id: 'r-1', status: 'APPROVED' });

      await expect(service.startMaintenance('r-1', technicianUser))
        .rejects
        .toThrow('Repairs can only start once a technician is assigned.');
    });

    it('should throw an error if user is not the assigned technician', async () => {
      repository.findMaintenanceRequestById.mockResolvedValue({ id: 'r-1', status: 'TECHNICIAN_ASSIGNED', technicianId: 'u-tech-1' });

      await expect(service.startMaintenance('r-1', currentUser))
        .rejects
        .toThrow('Only the assigned technician can start the repair process.');
    });

    it('should successfully start repair if user is the assigned technician', async () => {
      repository.findMaintenanceRequestById.mockResolvedValue({ id: 'r-1', status: 'TECHNICIAN_ASSIGNED', technicianId: 'u-tech-1' });
      repository.updateMaintenanceStatus.mockResolvedValue({ id: 'r-1', status: 'IN_PROGRESS' });

      const result = await service.startMaintenance('r-1', technicianUser);

      expect(repository.updateMaintenanceStatus).toHaveBeenCalledWith('r-1', 'IN_PROGRESS');
      expect(result.status).toBe('IN_PROGRESS');
    });
  });

  describe('resolveMaintenance', () => {
    it('should throw an error if status is not IN_PROGRESS', async () => {
      repository.findMaintenanceRequestById.mockResolvedValue({ id: 'r-1', status: 'TECHNICIAN_ASSIGNED' });

      await expect(service.resolveMaintenance('r-1', 'Replaced battery', technicianUser))
        .rejects
        .toThrow('Only repairs in progress can be resolved.');
    });

    it('should throw an error if resolver is not the assigned technician', async () => {
      repository.findMaintenanceRequestById.mockResolvedValue({ id: 'r-1', status: 'IN_PROGRESS', technicianId: 'u-tech-1' });

      await expect(service.resolveMaintenance('r-1', 'Replaced battery', currentUser))
        .rejects
        .toThrow('Only the assigned technician can resolve the request.');
    });

    it('should successfully resolve and restore asset to AVAILABLE', async () => {
      const request = { id: 'r-1', assetId: 'a-1', status: 'IN_PROGRESS', technicianId: 'u-tech-1' };
      repository.findMaintenanceRequestById.mockResolvedValue(request);
      repository.updateMaintenanceRequest.mockResolvedValue({ ...request, status: 'RESOLVED', resolutionNotes: 'Replaced battery' });

      const result = await service.resolveMaintenance('r-1', 'Replaced battery', technicianUser);

      expect(repository.updateAssetStatus).toHaveBeenCalledWith('a-1', 'AVAILABLE', expect.anything());
      expect(repository.updateMaintenanceRequest).toHaveBeenCalledWith('r-1', { status: 'RESOLVED', resolutionNotes: 'Replaced battery' }, expect.anything());
      expect(result.status).toBe('RESOLVED');
    });
  });

  describe('Read Operations', () => {
    it('getMaintenanceRequestById should return request if found', async () => {
      repository.findMaintenanceRequestById.mockResolvedValue({ id: 'r-1' });
      const result = await service.getMaintenanceRequestById('r-1');
      expect(result).toEqual({ id: 'r-1' });
    });

    it('getMaintenanceRequests should query repository with filters', async () => {
      repository.findMaintenanceRequests.mockResolvedValue([]);
      const result = await service.getMaintenanceRequests({ status: 'PENDING' });
      expect(repository.findMaintenanceRequests).toHaveBeenCalledWith({ status: 'PENDING' });
      expect(result).toEqual([]);
    });

    it('getPendingRequests should query repository pending', async () => {
      repository.findPendingRequests.mockResolvedValue([]);
      const result = await service.getPendingRequests();
      expect(repository.findPendingRequests).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('getMaintenanceHistoryByAsset should query repository history', async () => {
      repository.findMaintenanceHistoryByAssetId.mockResolvedValue([]);
      const result = await service.getMaintenanceHistoryByAsset('a-1');
      expect(repository.findMaintenanceHistoryByAssetId).toHaveBeenCalledWith('a-1');
      expect(result).toEqual([]);
    });
  });
});
