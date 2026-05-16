import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Send, Check, CheckCheck, Loader, Image, X, Play } from 'lucide-react'
import {
  initSocketConnection,
  getSocket,
  emitEvent,
  onEvent,
  offEvent,
  SocketEvents,
} from '../../services/socketIO'
import { useAuth } from '../../context/AuthContext'
import './RealTimeChat.css'

/**
 * Real-Time Chat Component with Media Support
 * Features:
 * - Real-time message delivery to only connected users
 * - Image and video sharing
 * - Fast send/receive with automatic acknowledgment
 * - Online status indicators
 * - Typing indicators
 * - Message delivery status (sent, delivered, read)
 */
export default function RealTimeChat({ conversationId, otherUser, onClose }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [sendingStates, setSendingStates] = useState({})
  const [mediaPreview, setMediaPreview] = useState(null)
  const [mediaFile, setMediaFile] = useState(null)
  const [currentUserPhoto, setCurrentUserPhoto] = useState(user?.photoURL || null)
  const [otherUserPhoto, setOtherUserPhoto] = useState(otherUser?.profileImage || otherUser?.photoURL || null)
  
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)
  const socket = useRef(null)
  const messageIdsRef = useRef(new Set()) // Track processed message IDs to prevent duplicates

  // Initialize socket connection
  useEffect(() => {
    if (!user?.uid) return

    try {
      socket.current = initSocketConnection()

      // Join conversation room
      emitEvent(SocketEvents.JOIN, {
        userId: user.uid,
      })

      console.log('✅ Socket initialized and joined')
    } catch (err) {
      console.error('Socket initialization error:', err)
    }

    return () => {
      // Cleanup on unmount
      offEvent(SocketEvents.RECEIVE_MESSAGE, handleReceiveMessage)
      offEvent(SocketEvents.USER_ONLINE, handleUserOnline)
      offEvent(SocketEvents.USER_OFFLINE, handleUserOffline)
      offEvent(SocketEvents.TYPING, handleTypingIndicator)
    }
  }, [user?.uid])

  // Handle incoming messages - prevent duplicates
  const handleReceiveMessage = useCallback((messageData) => {
    console.log(`📩 RECEIVE_MESSAGE event fired:`, {
      messageConvId: messageData.conversationId,
      currentConvId: conversationId,
      from: messageData.senderFirebaseUID,
      text: messageData.text?.substring(0, 50),
    })

    // Filter by conversationId - allow if not set as fallback
    if (messageData.conversationId && messageData.conversationId !== conversationId) {
      console.log(`⚠️  Message ignored - conversationId mismatch`)
      return
    }

    const messageId = messageData._id || messageData.messageId
    
    // Prevent duplicate message processing
    if (messageIdsRef.current.has(messageId)) {
      console.log('⚠️  Duplicate message blocked:', messageId)
      return
    }

    messageIdsRef.current.add(messageId)

    const newMessage = {
      id: messageId,
      conversationId: messageData.conversationId || conversationId,
      senderFirebaseUID: messageData.senderFirebaseUID,
      text: messageData.text || '',
      media: messageData.media,
      mediaType: messageData.mediaType,
      fileName: messageData.fileName,
      createdAt: messageData.createdAt || Date.now(),
      status: 'received',
      isOnlineDelivery: messageData.isOnlineDelivery,
    }

    console.log(`✅ Adding message to state: ${messageId}`)

    setMessages((prev) => {
      // Double-check for duplicate in state
      const exists = prev.some((msg) => msg.id === messageId)
      if (exists) {
        console.log('⚠️  Message already in state:', messageId)
        return prev
      }
      return [...prev, newMessage]
    })

    // Auto-scroll to latest message
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 0)

    // Mark as seen automatically
    emitEvent(SocketEvents.SEEN, {
      conversationId,
      userId: user.uid,
    })
  }, [conversationId, user?.uid])

  // Handle user online status
  const handleUserOnline = useCallback((data) => {
    if (data.userId === otherUser?.firebaseUID) {
      setIsOtherUserOnline(true)
      console.log(`✅ ${otherUser?.name} is now online`)
    }
  }, [otherUser?.firebaseUID, otherUser?.name])

  // Handle user offline status
  const handleUserOffline = useCallback((data) => {
    if (data.userId === otherUser?.firebaseUID) {
      setIsOtherUserOnline(false)
      console.log(`👤 ${otherUser?.name} went offline`)
    }
  }, [otherUser?.firebaseUID, otherUser?.name])

  // Handle typing indicator
  const handleTypingIndicator = useCallback((data) => {
    if (data.toUserId !== user?.uid || data.fromUserId !== otherUser?.firebaseUID) return

    setIsTyping(!!data.isTyping)
  }, [user?.uid, otherUser?.firebaseUID])

  // Register socket event listeners
  useEffect(() => {
    onEvent(SocketEvents.RECEIVE_MESSAGE, handleReceiveMessage)
    onEvent(SocketEvents.USER_ONLINE, handleUserOnline)
    onEvent(SocketEvents.USER_OFFLINE, handleUserOffline)
    onEvent(SocketEvents.TYPING, handleTypingIndicator)

    return () => {
      offEvent(SocketEvents.RECEIVE_MESSAGE, handleReceiveMessage)
      offEvent(SocketEvents.USER_ONLINE, handleUserOnline)
      offEvent(SocketEvents.USER_OFFLINE, handleUserOffline)
      offEvent(SocketEvents.TYPING, handleTypingIndicator)
    }
  }, [handleReceiveMessage, handleUserOnline, handleUserOffline, handleTypingIndicator])

  // Listen for profile photo updates
  useEffect(() => {
    const handleProfilePhotoUpdate = (data) => {
      if (data.firebaseUID === user?.uid) {
        // Update current user's photo
        setCurrentUserPhoto(data.profileImage || data.photoURL)
      } else if (data.firebaseUID === otherUser?.firebaseUID) {
        // Update other user's photo in header
        setOtherUserPhoto(data.profileImage || data.photoURL)
      }
    }

    const handleUserProfileUpdate = (data) => {
      if (data.firebaseUID === user?.uid) {
        setCurrentUserPhoto(data.profileImage || data.photoURL)
      } else if (data.firebaseUID === otherUser?.firebaseUID) {
        setOtherUserPhoto(data.profileImage || data.photoURL)
      }
    }

    onEvent(SocketEvents.PROFILE_PHOTO_UPDATE, handleProfilePhotoUpdate)
    onEvent(SocketEvents.USER_PROFILE_UPDATED, handleUserProfileUpdate)

    return () => {
      offEvent(SocketEvents.PROFILE_PHOTO_UPDATE, handleProfilePhotoUpdate)
      offEvent(SocketEvents.USER_PROFILE_UPDATED, handleUserProfileUpdate)
    }
  }, [user?.uid, otherUser?.firebaseUID])

  // Handle message sending with optional media
  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault()
      
      const hasText = messageText.trim()
      const hasMedia = !!mediaFile

      if (!hasText && !hasMedia) return
      if (isLoading) return

      const messageId = `msg_${Date.now()}_${Math.random()}`
      const trimmedText = messageText.trim()

      // Add message to UI immediately (optimistic update)
      const optimisticMessage = {
        id: messageId,
        conversationId,
        senderFirebaseUID: user.uid,
        text: trimmedText,
        media: mediaPreview?.src || null,
        mediaType: mediaFile?.type || null,
        fileName: mediaFile?.name || null,
        createdAt: Date.now(),
        status: 'sending',
      }

      setMessages((prev) => [...prev, optimisticMessage])
      messageIdsRef.current.add(messageId)
      setSendingStates((prev) => ({ ...prev, [messageId]: 'sending' }))
      setMessageText('')
      setMediaPreview(null)
      setMediaFile(null)
      setIsLoading(true)

      try {
        let mediaBase64 = null
        if (mediaFile) {
          mediaBase64 = await fileToBase64(mediaFile)
        }

        console.log(`📤 Sending message:`, {
          conversationId,
          to: otherUser.firebaseUID,
          from: user.uid,
          textLength: trimmedText.length,
          hasMedia: !!mediaBase64,
        })

        // Send message via socket with callback
        emitEvent(
          SocketEvents.SEND_MESSAGE,
          {
            conversationId,
            senderFirebaseUID: user.uid,
            receiverFirebaseUID: otherUser.firebaseUID,
            text: trimmedText,
            media: mediaBase64,
            mediaType: mediaFile?.type || '',
            fileName: mediaFile?.name || '',
          },
          (response) => {
            if (response?.ok) {
              // Use response messageId if available, otherwise keep optimistic messageId
              const finalMessageId = response.messageId || messageId
              
              setSendingStates((prev) => ({
                ...prev,
                [messageId]: response.deliveredToOnline ? 'delivered' : 'sent',
              }))

              // Update message status only (keep local ID for stability)
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === messageId
                    ? {
                        ...msg,
                        status: response.deliveredToOnline ? 'delivered' : 'sent',
                      }
                    : msg
                )
              )

              console.log(
                `✅ Message${mediaFile ? ' with media' : ''} sent${
                  response.deliveredToOnline ? ' and delivered' : ''
                } to ${otherUser.name}`
              )
            } else {
              // Keep message in UI even on error
              setSendingStates((prev) => ({ ...prev, [messageId]: 'error' }))
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === messageId
                    ? { ...msg, status: 'error' }
                    : msg
                )
              )
              console.error('Failed to send message:', response?.error)
            }
            setIsLoading(false)
          }
        )
      } catch (err) {
        setSendingStates((prev) => ({ ...prev, [messageId]: 'error' }))
        console.error('Error sending message:', err)
        setIsLoading(false)
      }
    },
    [conversationId, user?.uid, otherUser?.firebaseUID]
  )

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Handle media selection
  const handleMediaSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      alert('Please select an image or video file')
      return
    }

    setMediaFile(file)

    // Create preview
    if (isImage) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setMediaPreview({
          type: 'image',
          src: event.target?.result,
          fileName: file.name,
        })
      }
      reader.readAsDataURL(file)
    } else {
      setMediaPreview({
        type: 'video',
        src: URL.createObjectURL(file),
        fileName: file.name,
      })
    }
  }

  // Handle typing indicator
  const handleInputChange = (e) => {
    setMessageText(e.target.value)

    // Send typing indicator
    if (!isOtherUserOnline) return

    emitEvent(SocketEvents.TYPING, {
      conversationId,
      fromUserId: user.uid,
      toUserId: otherUser.firebaseUID,
      isTyping: true,
    })

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      emitEvent(SocketEvents.TYPING, {
        conversationId,
        fromUserId: user.uid,
        toUserId: otherUser.firebaseUID,
        isTyping: false,
      })
    }, 1000)
  }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="real-time-chat">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <h3>{otherUser?.name}</h3>
          <span className={`status-badge ${isOtherUserOnline ? 'online' : 'offline'}`}>
            {isOtherUserOnline ? '🟢 Online' : '⚪ Offline'}
          </span>
        </div>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Messages Container */}
      <div className="messages-container">
        {messages.length === 0 && (
          <div className="empty-state">
            <p>Start your conversation with {otherUser?.name}</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message-bubble ${msg.senderFirebaseUID === user.uid ? 'sent' : 'received'}`}
          >
            <div className="message-content">
              {msg.text && <p>{msg.text}</p>}
              
              {msg.media && msg.mediaType?.startsWith('image/') && (
                <div className="message-media-container">
                  <img
                    src={msg.media}
                    alt="Shared media"
                    className="message-media message-image"
                  />
                </div>
              )}
              
              {msg.media && msg.mediaType?.startsWith('video/') && (
                <div className="message-media-container">
                  <div className="video-thumbnail">
                    <video
                      src={msg.media}
                      className="message-media message-video"
                      controls
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="message-meta">
              <span className="time">
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {msg.senderFirebaseUID === user.uid && (
                <span className="status-icon">
                  {sendingStates[msg.id] === 'sending' && (
                    <Loader size={14} className="loading" />
                  )}
                  {sendingStates[msg.id] === 'sent' && <Check size={14} />}
                  {sendingStates[msg.id] === 'delivered' && (
                    <CheckCheck size={14} className="delivered" />
                  )}
                  {sendingStates[msg.id] === 'read' && (
                    <CheckCheck size={14} className="read" />
                  )}
                  {sendingStates[msg.id] === 'error' && (
                    <span className="error-icon" title="Failed to send">❌</span>
                  )}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="message-bubble received">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Media Preview */}
      {mediaPreview && (
        <div className="media-preview">
          <div className="preview-content">
            {mediaPreview.type === 'image' && (
              <img src={mediaPreview.src} alt="Preview" className="preview-image" />
            )}
            {mediaPreview.type === 'video' && (
              <video src={mediaPreview.src} className="preview-video" controls />
            )}
            <button
              className="preview-remove"
              onClick={() => {
                setMediaPreview(null)
                setMediaFile(null)
              }}
              title="Remove media"
            >
              <X size={16} />
            </button>
          </div>
          <p className="preview-filename">{mediaPreview.fileName}</p>
        </div>
      )}

      {/* Input Area */}
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleMediaSelect}
          accept="image/*,video/*"
          style={{ display: 'none' }}
        />

        {/* User Avatar */}
        <div className="input-avatar">
          {currentUserPhoto ? (
            <img src={currentUserPhoto} alt={user?.displayName || 'You'} className="avatar-image" />
          ) : (
            <div className="avatar-placeholder">{user?.displayName?.[0] || 'U'}</div>
          )}
        </div>

        <button
          type="button"
          className="media-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Attach image or video"
          disabled={isLoading}
        >
          <Image size={20} />
        </button>

        <input
          type="text"
          value={messageText}
          onChange={handleInputChange}
          placeholder={
            isOtherUserOnline
              ? 'Type a message...'
              : 'User is offline. Message will be delivered when online.'
          }
          disabled={isLoading}
          className="message-input"
        />

        <button
          type="submit"
          disabled={(!messageText.trim() && !mediaFile) || isLoading}
          className="send-btn"
          title={isOtherUserOnline ? 'Send message' : 'User is offline'}
        >
          {isLoading ? <Loader size={20} className="spinner" /> : <Send size={20} />}
        </button>
      </form>
    </div>
  )
}
