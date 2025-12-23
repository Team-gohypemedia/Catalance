let ioInstance = null;

export const setIo = (io) => {
  ioInstance = io;
  console.log("[SocketManager] IO instance set");
};

export const getIo = () => ioInstance;

export const sendSocketNotification = (userId, notification) => {
  if (!ioInstance || !userId) {
    if (!ioInstance) console.log("[SocketManager] ⚠️ IO not initialized yet");
    return false;
  }
  
  const roomName = `user:${userId}`;
  
  ioInstance.to(roomName).emit("notification:new", {
    id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    ...notification,
    createdAt: new Date().toISOString()
  });
  
  return true;
};
