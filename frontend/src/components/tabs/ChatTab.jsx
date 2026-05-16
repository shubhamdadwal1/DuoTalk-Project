import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import '../tabs/ChatTab.css';
import { conversationAPI } from '../../services/api';
import { onEvent, offEvent, SocketEvents } from '../../services/socketIO';

export default function ChatTab({ user }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const conversationRef = useRef(null);
  const messagesRef = useRef([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadConversations = async () => {
      if (!user?.uid) return;
      setLoading(true);
      try {
        const savedConversations = await conversationAPI.getAll(user.uid);
        if (active) setConversations(savedConversations);
      } catch (err) {
        toast.error(`Could not load conversations: ${err.message}`, { position: 'top-right' });
      } finally {
        if (active) setLoading(false);
      }
    };

    loadConversations();
    return () => {
      active = false;
    };
  }, [user?.uid]);

  useEffect(() => {
    let active = true;

    const loadMessages = async () => {
      if (!selectedConversation?._id) return;
      try {
        const savedMessages = await conversationAPI.getMessages(selectedConversation._id);
        if (active) setMessages(savedMessages);
      } catch (err) {
        toast.error(`Could not load messages: ${err.message}`, { position: 'top-right' });
      }
    };

    loadMessages();
    setMessageText('');
    return () => {
      active = false;
    };
  }, [selectedConversation]);

  useEffect(() => {
    conversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Socket listener for receiving messages
  useEffect(() => {
    const handleReceiveMessage = (messageData) => {
      console.log('📩 Received message:', messageData);
      
      // Check if message is for current conversation
      if (!conversationRef.current || messageData.conversationId !== conversationRef.current._id) {
        console.log('⚠️ Message not for current conversation');
        return;
      }

      // Check if already in messages
      if (messagesRef.current.some(msg => msg._id === messageData._id)) {
        console.log('⚠️ Message already in state');
        return;
      }

      // Add to messages
      const newMsg = {
        _id: messageData._id,
        conversationId: messageData.conversationId,
        senderFirebaseUID: messageData.senderFirebaseUID,
        text: messageData.text,
        media: messageData.media,
        createdAt: messageData.createdAt,
      };

      console.log('✅ Adding message to UI');
      setMessages(prev => [...prev, newMsg]);
    };

    onEvent(SocketEvents.RECEIVE_MESSAGE, handleReceiveMessage);
    return () => {
      offEvent(SocketEvents.RECEIVE_MESSAGE, handleReceiveMessage);
    };
  }, []);

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      toast.warning('Please type a message!', { position: 'top-right' });
      return;
    }

    try {
      // Get receiver UID from conversation participants
      const receiverUID = selectedConversation.participants?.find(uid => uid !== user.uid);
      console.log('📤 Sending message to:', receiverUID);
      
      const newMessage = await conversationAPI.sendMessage(
        selectedConversation._id, 
        user.uid, 
        {
          text: messageText,
          receiverFirebaseUID: receiverUID,
        }
      );
      console.log('✅ Message sent:', newMessage);
      setMessages(prev => [...prev, newMessage]);
      setMessageText('');
      setConversations(prev => prev.map(conv =>
        conv._id === selectedConversation._id
          ? { ...conv, lastMessage: newMessage.text, lastMessageTime: newMessage.createdAt }
          : conv
      ));
    } catch (err) {
      console.error('❌ Error sending message:', err);
      toast.error(`Could not send message: ${err.message}`, { position: 'top-right' });
    }
  };

  const displayName = (conversation) =>
    conversation.otherUser?.displayName || conversation.otherUser?.name || 'DuoTalk User';
  const displayAvatar = (conversation) =>
    conversation.otherUser?.photoURL || conversation.otherUser?.profileImage || displayName(conversation).charAt(0).toUpperCase();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1rem', minHeight: '600px' }}>
      <div style={{ background: 'rgba(20, 20, 50, 0.3)', borderRadius: '15px', border: '1px solid rgba(100, 200, 255, 0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(100, 200, 255, 0.1)' }}>
          <h3 style={{ color: '#64c8ff', margin: 0, fontSize: '1rem' }}>Conversations</h3>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#a0a0d0' }}>Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#a0a0d0' }}>
              No conversations yet
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv._id}
                onClick={() => setSelectedConversation(conv)}
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid rgba(100, 200, 255, 0.05)',
                  cursor: 'pointer',
                  background: selectedConversation?._id === conv._id ? 'rgba(100, 200, 255, 0.1)' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #64c8ff, #a76eff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', flexShrink: 0, overflow: 'hidden' }}>
                    {String(displayAvatar(conv)).startsWith('http') ? (
                      <img src={displayAvatar(conv)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : displayAvatar(conv)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#e0e0e0', fontWeight: '600', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {displayName(conv)}
                    </div>
                    <div style={{ color: '#a0a0d0', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.lastMessage || 'Start a conversation'}
                    </div>
                  </div>
                  {conv.unreadBy?.includes(user?.uid) && (
                    <div style={{ background: '#ff6b6b', color: '#fff', borderRadius: '50%', width: '12px', height: '12px', flexShrink: 0 }} />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ background: 'rgba(20, 20, 50, 0.3)', borderRadius: '15px', border: '1px solid rgba(100, 200, 255, 0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {selectedConversation ? (
          <>
            <div style={{ padding: '1rem', borderBottom: '1px solid rgba(100, 200, 255, 0.1)', background: 'rgba(30, 30, 60, 0.5)' }}>
              <div style={{ color: '#64c8ff', fontWeight: '600' }}>{displayName(selectedConversation)}</div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map(msg => (
                <div
                  key={msg._id}
                  style={{ display: 'flex', justifyContent: msg.senderFirebaseUID === user?.uid ? 'flex-end' : 'flex-start' }}
                >
                  <div style={{
                    background: msg.senderFirebaseUID === user?.uid ? 'linear-gradient(135deg, #64c8ff, #00ff88)' : 'rgba(30, 30, 60, 0.5)',
                    color: msg.senderFirebaseUID === user?.uid ? '#0a0a19' : '#e0e0e0',
                    padding: '0.8rem 1.2rem',
                    borderRadius: '15px',
                    maxWidth: '70%',
                    wordWrap: 'break-word',
                    border: msg.senderFirebaseUID === user?.uid ? 'none' : '1px solid rgba(100, 200, 255, 0.2)'
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '1rem', borderTop: '1px solid rgba(100, 200, 255, 0.1)', background: 'rgba(30, 30, 60, 0.3)', display: 'flex', gap: '0.8rem' }}>
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  background: 'rgba(10, 10, 25, 0.5)',
                  border: '1px solid rgba(100, 200, 255, 0.2)',
                  color: '#fff',
                  padding: '0.8rem 1rem',
                  borderRadius: '50px',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit'
                }}
              />
              <button
                onClick={handleSendMessage}
                style={{
                  background: 'linear-gradient(135deg, #64c8ff, #00ff88)',
                  border: 'none',
                  color: '#0a0a19',
                  width: '45px',
                  height: '45px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1.2rem'
                }}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '600px', color: '#a0a0d0', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>Chat</div>
              <p>Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
