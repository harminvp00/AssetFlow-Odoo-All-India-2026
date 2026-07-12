const repository = require('./bookings.repository');

const getBookings = async (filters = {}) => {
  return repository.findBookings(filters);
};

const getBookingById = async (id) => {
  const booking = await repository.findBookingById(id);
  if (!booking) {
    const error = new Error('Booking not found.');
    error.statusCode = 404;
    throw error;
  }
  return booking;
};

const getBookingsByUser = async (userId) => {
  const user = await repository.findUserById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }
  return repository.findBookingsByUserId(userId);
};

const getBookingsByAsset = async (assetId) => {
  const asset = await repository.findAssetById(assetId);
  if (!asset) {
    const error = new Error('Asset not found.');
    error.statusCode = 404;
    throw error;
  }
  return repository.findBookingsByAssetId(assetId);
};

const getUpcomingBookings = async () => {
  return repository.findBookings({ status: 'UPCOMING' });
};

const getBookingCalendar = async (filters = {}) => {
  return repository.findBookings(filters);
};

const createBooking = async (data, currentUser) => {
  const { assetId, startTime, endTime } = data;

  const start = new Date(startTime);
  const end = new Date(endTime);

  // 1. Time boundary checks
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    const error = new Error('Invalid date formats.');
    error.statusCode = 400;
    throw error;
  }

  if (start <= new Date()) {
    const error = new Error('Booking start time must be in the future.');
    error.statusCode = 400;
    throw error;
  }

  if (end <= start) {
    const error = new Error('Booking end time must be after the start time.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Verify target asset exists
  const asset = await repository.findAssetById(assetId);
  if (!asset) {
    const error = new Error('Asset not found.');
    error.statusCode = 404;
    throw error;
  }

  // 3. Verify asset is bookable
  if (!asset.isSharedBookable) {
    const error = new Error('Asset is not configured as a bookable resource.');
    error.statusCode = 400;
    throw error;
  }

  // 4. Verify user exists and check booking permissions
  const targetUserId = data.userId || currentUser.id;
  const isManager = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';
  if (targetUserId !== currentUser.id && !isManager) {
    const error = new Error('Unauthorized to book resources on behalf of other users.');
    error.statusCode = 403;
    throw error;
  }

  const user = await repository.findUserById(targetUserId);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  // 5. Verify no overlapping reservations exist
  const overlaps = await repository.findOverlappingBookings(assetId, start, end);
  if (overlaps.length > 0) {
    const error = new Error('The requested booking time slot overlaps with an existing reservation.');
    error.statusCode = 409;
    throw error;
  }

  // 6. Create new booking
  return repository.createBooking({
    assetId,
    userId: targetUserId,
    startTime: start,
    endTime: end,
  });
};

const cancelBooking = async (id, currentUser) => {
  // 1. Find booking
  const booking = await repository.findBookingById(id);
  if (!booking) {
    const error = new Error('Booking not found.');
    error.statusCode = 404;
    throw error;
  }

  // 2. Validate current status allows cancellation
  if (booking.status === 'CANCELLED') {
    const error = new Error('Booking is already cancelled.');
    error.statusCode = 400;
    throw error;
  }

  if (booking.status === 'COMPLETED') {
    const error = new Error('Booking is already completed.');
    error.statusCode = 400;
    throw error;
  }

  if (booking.status !== 'UPCOMING' && booking.status !== 'ONGOING') {
    const error = new Error('Booking is already completed or cancelled.');
    error.statusCode = 400;
    throw error;
  }

  // 3. Verify permissions (owner or manager)
  const isManager = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';
  const isOwner = booking.userId === currentUser.id;
  if (!isManager && !isOwner) {
    const error = new Error('Unauthorized to cancel this booking.');
    error.statusCode = 403;
    throw error;
  }

  // 4. Update status to CANCELLED
  return repository.cancelBooking(id);
};

module.exports = {
  getBookings,
  getBookingById,
  getBookingsByUser,
  getBookingsByAsset,
  getUpcomingBookings,
  getBookingCalendar,
  createBooking,
  cancelBooking,
};
