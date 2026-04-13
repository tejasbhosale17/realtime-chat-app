const registerTypingHandlers = (io, socket) => {
  socket.on('typing_start', (data) => {
    const { conversationId } = data;
    if (!conversationId) return;

    socket.to(`conv:${conversationId}`).emit('user_typing', {
      conversationId,
      userId: socket.userId,
    });
  });

  socket.on('typing_stop', (data) => {
    const { conversationId } = data;
    if (!conversationId) return;

    socket.to(`conv:${conversationId}`).emit('user_stopped_typing', {
      conversationId,
      userId: socket.userId,
    });
  });
};

module.exports = { registerTypingHandlers };
