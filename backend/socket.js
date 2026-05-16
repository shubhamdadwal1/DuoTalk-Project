/**
 * Socket.IO Real-Time Messaging Handler
 * Features:
 * - Fast message delivery to connected users only
 * - Real-time presence tracking (online/offline status)
 * - Optimized for low-latency communication
 * - Automatic acknowledgment on delivery
 */

const SOCKET_EVENTS = {
  JOIN: 'join',
  SEND_MESSAGE: 'send_message',
  RECEIVE_MESSAGE: 'receive_message',
  TYPING: 'typing',
  SEEN: 'seen',
  CALL_USER: 'call-user',
  INCOMING_CALL: 'incoming-call',
  ACCEPT_CALL: 'accept-call',
  REJECT_CALL: 'reject-call',
  END_CALL: 'end-call',
  ICE_CANDIDATE: 'ice-candidate',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  GET_ONLINE_USERS: 'get_online_users',
  ONLINE_USERS_UPDATE: 'online_users_update',
  PROFILE_PHOTO_UPDATE: 'profile_photo_update',
  USER_PROFILE_UPDATED: 'user_profile_updated',
}

// Track connected users: Map<userId, {socketId, connectedAt, lastActivity}>
const connectedUsers = new Map()

/**
 * Initialize Socket.IO connection handlers
 * @param {SocketIOServer} io - Socket.IO server instance
 * @param {Database} db - MongoDB database instance
 * @param {Function} saveChatMessage - Function to save messages to DB
 * @param {Function} emitSeenUpdate - Function to handle read receipts
 */
function initializeSocket(io, db, saveChatMessage, emitSeenUpdate) {
  // User room naming convention
  const userRoom = (userId) => `user:${userId}`

  /**
   * Broadcast online users list to all connected clients
   */
  function broadcastOnlineUsers() {
    const onlineUsersList = Array.from(connectedUsers.keys())
    io.emit(SOCKET_EVENTS.ONLINE_USERS_UPDATE, {
      onlineUsers: onlineUsersList,
      count: onlineUsersList.length,
      timestamp: Date.now(),
    })
  }

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`)

    // ============= JOIN EVENT =============
    socket.on(SOCKET_EVENTS.JOIN, async ({ userId }, callback) => {
      if (!userId) {
        console.warn('⚠️  JOIN event missing userId')
        if (typeof callback === 'function') {
          callback({ ok: false, error: 'userId is required' })
        }
        return
      }

      try {
        // Store user connection info
        socket.data.userId = userId
        socket.join(userRoom(userId))

        // Track in memory for fast lookups
        if (!connectedUsers.has(userId)) {
          connectedUsers.set(userId, {
            socketId: socket.id,
            connectedAt: Date.now(),
            lastActivity: Date.now(),
          })
        } else {
          const userData = connectedUsers.get(userId)
          userData.socketId = socket.id
          userData.lastActivity = Date.now()
        }

        // Update database - don't wait for this
        if (db) {
          db.collection('users').updateOne(
            { firebaseUID: userId },
            {
              $set: {
                isOnline: true,
                lastSeen: new Date(),
                updatedAt: new Date(),
              },
            }
          ).catch((err) => {
            console.error('Error updating user online status:', err.message)
          })
        }

        // Notify others that this user is online
        socket.broadcast.emit(SOCKET_EVENTS.USER_ONLINE, {
          userId,
          timestamp: Date.now(),
        })

        // Send current online users to the new connection
        const onlineUsersList = Array.from(connectedUsers.keys())
        socket.emit(SOCKET_EVENTS.ONLINE_USERS_UPDATE, {
          onlineUsers: onlineUsersList,
          count: onlineUsersList.length,
          timestamp: Date.now(),
        })

        console.log(`👤 User ${userId} joined. Total online: ${connectedUsers.size}`)

        // Send acknowledgment immediately
        if (typeof callback === 'function') {
          callback({ ok: true, userId, socketId: socket.id })
        }
      } catch (err) {
        console.error('Error during JOIN:', err.message)
        if (typeof callback === 'function') {
          callback({ ok: false, error: err.message })
        }
      }
    })

    // ============= SEND MESSAGE EVENT =============
    socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (payload, callback) => {
      try {
        const {
          conversationId,
          senderFirebaseUID,
          receiverFirebaseUID,
          text,
          media,
          mediaType,
          fileName,
        } = payload

        console.log(`📨 SEND_MESSAGE received:`, {
          conversationId,
          from: senderFirebaseUID,
          to: receiverFirebaseUID,
          textLength: text?.length || 0,
        })

        // Check if receiver is online
        const isReceiverOnline = connectedUsers.has(receiverFirebaseUID)

        // Save message to database (always)
        const saved = await saveChatMessage({
          conversationId,
          senderFirebaseUID,
          receiverFirebaseUID,
          text,
          media,
          mediaType,
          fileName,
        })

        // Extract the actual message object (saveChatMessage returns {conversationId, sender, message, ...})
        const messageData = saved.message || saved

        console.log(`✅ Message saved with conversationId: ${saved.conversationId}`)

        // Only emit to online users in correct format for frontend
        if (isReceiverOnline) {
          console.log(`📤 Emitting RECEIVE_MESSAGE to user ${receiverFirebaseUID} in room ${userRoom(receiverFirebaseUID)}`)
          io.to(userRoom(receiverFirebaseUID)).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, {
            _id: messageData._id,
            messageId: messageData._id,
            conversationId: saved.conversationId || conversationId,
            senderFirebaseUID: messageData.senderFirebaseUID,
            text: messageData.text,
            media: messageData.media,
            mediaType: messageData.mediaType,
            fileName: messageData.fileName,
            createdAt: messageData.createdAt,
            deliveredAt: Date.now(),
            isOnlineDelivery: true,
          })
          console.log(`✅ RECEIVE_MESSAGE emitted successfully`)
        } else {
          console.log(`⚪ Receiver ${receiverFirebaseUID} is offline - message saved to DB only`)
        }

        // Acknowledge to sender
        if (typeof callback === 'function') {
          callback({
            ok: true,
            payload: saved,
            messageId: messageData._id,
            timestamp: Date.now(),
            deliveredToOnline: isReceiverOnline,
            receiver: {
              firebaseUID: receiverFirebaseUID,
              isOnline: isReceiverOnline,
            },
          })
        }
      } catch (err) {
        console.error('❌ Error sending message:', err.message)
        if (typeof callback === 'function') {
          callback({
            ok: false,
            error: err.message,
          })
        }
      }
    })

    // ============= TYPING EVENT =============
    socket.on(SOCKET_EVENTS.TYPING, ({ conversationId, fromUserId, toUserId, isTyping }) => {
      if (!toUserId) return

      // Only send if recipient is online
      if (connectedUsers.has(toUserId)) {
        io.to(userRoom(toUserId)).emit(SOCKET_EVENTS.TYPING, {
          conversationId,
          fromUserId,
          toUserId,
          isTyping: !!isTyping,
          timestamp: Date.now(),
        })
      }
    })

    // ============= SEEN/READ RECEIPT EVENT =============
    socket.on(SOCKET_EVENTS.SEEN, async ({ conversationId, userId }, callback) => {
      try {
        if (!db) throw new Error('Database not connected')
        if (!conversationId || !userId) {
          throw new Error('conversationId and userId are required')
        }

        const payload = await emitSeenUpdate({
          conversationId,
          readerFirebaseUID: userId,
        })

        if (!payload) throw new Error('Conversation not found')

        if (typeof callback === 'function') {
          callback({
            ok: true,
            payload,
          })
        }
      } catch (err) {
        console.error('Error marking messages as seen:', err.message)
        if (typeof callback === 'function') {
          callback({
            ok: false,
            error: err.message,
          })
        }
      }
    })

    // ============= GET ONLINE USERS EVENT =============
    socket.on(SOCKET_EVENTS.GET_ONLINE_USERS, (callback) => {
      const onlineUsersList = Array.from(connectedUsers.keys())
      if (typeof callback === 'function') {
        callback({
          onlineUsers: onlineUsersList,
          count: onlineUsersList.length,
          timestamp: Date.now(),
        })
      }
    })

    // ============= PROFILE PHOTO UPDATE EVENT =============
    socket.on(SOCKET_EVENTS.PROFILE_PHOTO_UPDATE, async (payload, callback) => {
      try {
        const { firebaseUID, name, profileImage, photoURL, timestamp } = payload

        if (!firebaseUID) {
          throw new Error('firebaseUID is required')
        }

        // Update user in database
        if (db) {
          await db.collection('users').updateOne(
            { firebaseUID },
            {
              $set: {
                profileImage,
                photoURL,
                updatedAt: new Date(),
              },
            }
          )
        }

        // Broadcast to all connected users
        io.emit(SOCKET_EVENTS.USER_PROFILE_UPDATED, {
          firebaseUID,
          name,
          profileImage,
          photoURL,
          timestamp,
        })

        console.log(`📸 User ${name} updated profile photo`)

        // Send acknowledgment
        if (typeof callback === 'function') {
          callback({ ok: true })
        }
      } catch (err) {
        console.error('Error updating profile photo:', err.message)
        if (typeof callback === 'function') {
          callback({ ok: false, error: err.message })
        }
      }
    })

    // ============= USER PROFILE UPDATED EVENT =============
    socket.on(SOCKET_EVENTS.USER_PROFILE_UPDATED, async (payload, callback) => {
      try {
        const {
          firebaseUID,
          name,
          bio,
          location,
          website,
          profileImage,
          photoURL,
          timestamp,
        } = payload

        if (!firebaseUID) {
          throw new Error('firebaseUID is required')
        }

        // Update user in database
        if (db) {
          await db.collection('users').updateOne(
            { firebaseUID },
            {
              $set: {
                name: name || undefined,
                bio: bio || undefined,
                location: location || undefined,
                website: website || undefined,
                profileImage: profileImage || undefined,
                photoURL: photoURL || undefined,
                updatedAt: new Date(),
              },
            }
          )
        }

        // Broadcast to all connected users except sender
        socket.broadcast.emit(SOCKET_EVENTS.USER_PROFILE_UPDATED, {
          firebaseUID,
          name,
          bio,
          location,
          website,
          profileImage,
          photoURL,
          timestamp,
        })

        console.log(`👤 User ${name} updated their profile`)

        // Send acknowledgment
        if (typeof callback === 'function') {
          callback({ ok: true })
        }
      } catch (err) {
        console.error('Error updating user profile:', err.message)
        if (typeof callback === 'function') {
          callback({ ok: false, error: err.message })
        }
      }
    })

    // ============= VIDEO CALL EVENTS =============
    // Forward video call offer to recipient
    socket.on('video_call_offer', (data) => {
      const { to, offer } = data
      if (!to) {
        console.warn('⚠️  video_call_offer: missing recipient ID')
        return
      }

      io.to(userRoom(to)).emit('video_call_offer', {
        from: socket.data.userId,
        offer,
        timestamp: Date.now(),
      })

      if (import.meta.env !== 'production') {
        console.log(`📞 Video call offer from ${socket.data.userId} to ${to}`)
      }
    })

    // Forward video call answer to caller
    socket.on('video_call_answer', (data) => {
      const { to, answer } = data
      if (!to) {
        console.warn('⚠️  video_call_answer: missing recipient ID')
        return
      }

      io.to(userRoom(to)).emit('video_call_answer', {
        from: socket.data.userId,
        answer,
        timestamp: Date.now(),
      })

      if (import.meta.env !== 'production') {
        console.log(`📞 Video call answer from ${socket.data.userId} to ${to}`)
      }
    })

    // Forward ICE candidates for peer connection
    socket.on('video_ice_candidate', (data) => {
      const { to, candidate } = data
      if (!to) {
        console.warn('⚠️  video_ice_candidate: missing recipient ID')
        return
      }

      io.to(userRoom(to)).emit('video_ice_candidate', {
        from: socket.data.userId,
        candidate,
        timestamp: Date.now(),
      })
    })

    // Notify when call ends
    socket.on('video_call_ended', (data) => {
      const { to } = data
      if (!to) return

      io.to(userRoom(to)).emit('video_call_ended', {
        from: socket.data.userId,
        timestamp: Date.now(),
      })

      if (import.meta.env !== 'production') {
        console.log(`📞 Video call ended between ${socket.data.userId} and ${to}`)
      }
    })

    // Handle call rejection
    socket.on('video_call_rejected', (data) => {
      const { to } = data
      if (!to) return

      io.to(userRoom(to)).emit('video_call_rejected', {
        from: socket.data.userId,
        timestamp: Date.now(),
      })

      if (import.meta.env !== 'production') {
        console.log(`📞 Video call rejected by ${socket.data.userId}`)
      }
    })

    // Handle screen share started
    socket.on('video_screen_share_started', (data) => {
      const { to } = data
      if (!to) return

      io.to(userRoom(to)).emit('video_screen_share_started', {
        from: socket.data.userId,
        timestamp: Date.now(),
      })
    })

    // Handle screen share stopped
    socket.on('video_screen_share_stopped', (data) => {
      const { to } = data
      if (!to) return

      io.to(userRoom(to)).emit('video_screen_share_stopped', {
        from: socket.data.userId,
        timestamp: Date.now(),
      })
    })

    // ============= WEBRTC CALL SIGNALING =============
    socket.on(SOCKET_EVENTS.CALL_USER, ({ receiverId, offer, conversationId, caller }, callback) => {
      if (!receiverId || !offer) {
        if (typeof callback === 'function') {
          callback({ ok: false, error: 'receiverId and offer are required' })
        }
        return
      }

      if (!connectedUsers.has(receiverId)) {
        if (typeof callback === 'function') {
          callback({ ok: false, error: 'User is offline' })
        }
        return
      }

      io.to(userRoom(receiverId)).emit(SOCKET_EVENTS.INCOMING_CALL, {
        callerId: socket.data.userId,
        receiverId,
        conversationId: conversationId || '',
        offer,
        caller: caller || { firebaseUID: socket.data.userId },
        timestamp: Date.now(),
      })

      if (typeof callback === 'function') {
        callback({ ok: true, payload: { receiverId } })
      }
    })

    socket.on(SOCKET_EVENTS.ACCEPT_CALL, ({ callerId, answer, conversationId, acceptedBy }, callback) => {
      if (!callerId || !answer) {
        if (typeof callback === 'function') {
          callback({ ok: false, error: 'callerId and answer are required' })
        }
        return
      }

      io.to(userRoom(callerId)).emit(SOCKET_EVENTS.ACCEPT_CALL, {
        callerId,
        receiverId: socket.data.userId,
        conversationId: conversationId || '',
        answer,
        acceptedBy: acceptedBy || { firebaseUID: socket.data.userId },
        timestamp: Date.now(),
      })

      if (typeof callback === 'function') {
        callback({ ok: true })
      }
    })

    socket.on(SOCKET_EVENTS.REJECT_CALL, ({ callerId, reason, rejectedBy }, callback) => {
      if (!callerId) {
        if (typeof callback === 'function') {
          callback({ ok: false, error: 'callerId is required' })
        }
        return
      }

      io.to(userRoom(callerId)).emit(SOCKET_EVENTS.REJECT_CALL, {
        callerId,
        receiverId: socket.data.userId,
        reason: reason || 'rejected',
        rejectedBy: rejectedBy || { firebaseUID: socket.data.userId },
        timestamp: Date.now(),
      })

      if (typeof callback === 'function') {
        callback({ ok: true })
      }
    })

    socket.on(SOCKET_EVENTS.END_CALL, ({ toUserId, reason }, callback) => {
      if (!toUserId) {
        if (typeof callback === 'function') {
          callback({ ok: false, error: 'toUserId is required' })
        }
        return
      }

      io.to(userRoom(toUserId)).emit(SOCKET_EVENTS.END_CALL, {
        fromUserId: socket.data.userId,
        toUserId,
        reason: reason || 'ended',
        timestamp: Date.now(),
      })

      if (typeof callback === 'function') {
        callback({ ok: true })
      }
    })

    socket.on(SOCKET_EVENTS.ICE_CANDIDATE, ({ toUserId, candidate }, callback) => {
      if (!toUserId || !candidate) {
        if (typeof callback === 'function') {
          callback({ ok: false, error: 'toUserId and candidate are required' })
        }
        return
      }

      io.to(userRoom(toUserId)).emit(SOCKET_EVENTS.ICE_CANDIDATE, {
        fromUserId: socket.data.userId,
        candidate,
        timestamp: Date.now(),
      })

      if (typeof callback === 'function') {
        callback({ ok: true })
      }
    })

    // ============= ACTIVITY TRACKING =============
    socket.on('disconnect', async () => {
      const { userId } = socket.data || {}
      if (!userId) return

      // Check if user has other active connections
      const sockets = await io.in(userRoom(userId)).fetchSockets().catch(() => [])

      // Only mark offline if no other connections exist
      if (sockets.length === 0) {
        connectedUsers.delete(userId)

        // Update database
        if (db) {
          try {
            await db.collection('users').updateOne(
              { firebaseUID: userId },
              {
                $set: {
                  isOnline: false,
                  lastSeen: new Date(),
                  updatedAt: new Date(),
                },
              }
            )
          } catch (err) {
            console.error('Error updating user offline status:', err.message)
          }
        }

        // Notify others that this user went offline
        io.emit(SOCKET_EVENTS.USER_OFFLINE, {
          userId,
          timestamp: Date.now(),
        })

        console.log(`👤 User ${userId} disconnected. Total online: ${connectedUsers.size}`)
      } else {
        console.log(
          `👤 User ${userId} disconnected but has ${sockets.length} other connection(s)`
        )
      }
    })

    // ============= ERROR HANDLING =============
    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })
  })

  // NOTE: Removed automatic cleanup timeout - Socket.IO handles disconnections
  // automatically via the 'disconnect' event. Keeping users in connectedUsers
  // until they actually disconnect ensures messages aren't lost.

  return {
    io,
    connectedUsers,
    SOCKET_EVENTS,
    userRoom,
    broadcastOnlineUsers,
  }
}

export { initializeSocket, SOCKET_EVENTS }
