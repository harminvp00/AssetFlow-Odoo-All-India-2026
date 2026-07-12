const repository = require('./notifications.repository');

const createNotification = async (data) => {
  const { userId, title, message } = data;
  if (!userId) {
    const error = new Error('User ID is required.');
    error.statusCode = 400;
    throw error;
  }
  
  const user = await repository.findUserById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!title || !message) {
    const error = new Error('Notification title and message are required.');
    error.statusCode = 400;
    throw error;
  }

  return repository.createNotification({
    userId,
    title,
    message,
    link: data.link || null,
    type: data.type || 'INFO',
    isRead: false,
  });
};

const markNotificationAsRead = async (id, currentUser) => {
  const notification = await repository.findNotificationById(id);
  if (!notification) {
    const error = new Error('Notification not found.');
    error.statusCode = 404;
    throw error;
  }

  if (notification.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
    const error = new Error('Unauthorized notification access.');
    error.statusCode = 403;
    throw error;
  }

  return repository.markNotificationAsRead(id);
};

const markAllNotificationsAsRead = async (currentUser) => {
  const result = await repository.markAllNotificationsAsRead(currentUser.id);
  return { count: result.count };
};

const getNotificationById = async (id, currentUser) => {
  const notification = await repository.findNotificationById(id);
  if (!notification) {
    const error = new Error('Notification not found.');
    error.statusCode = 404;
    throw error;
  }

  if (notification.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
    const error = new Error('Unauthorized notification access.');
    error.statusCode = 403;
    throw error;
  }

  return notification;
};

const getNotifications = async (filters = {}, currentUser) => {
  const queryFilters = { ...filters };
  
  if (currentUser.role !== 'ADMIN') {
    queryFilters.userId = currentUser.id;
  }

  return repository.findNotifications(queryFilters);
};

const getUnreadNotifications = async (currentUser) => {
  return repository.findUnreadNotifications(currentUser.id);
};

const getUnreadCount = async (currentUser) => {
  return repository.countUnreadNotifications(currentUser.id);
};

// Aliases for compatibility
const getAll = async (currentUser) => {
  return getNotifications({}, currentUser);
};
const create = createNotification;

module.exports = {
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationById,
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  // Aliases for compatibility
  getAll,
  create,
};
