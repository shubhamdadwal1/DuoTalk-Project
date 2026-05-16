import React, { useMemo, useState, useContext, useEffect } from 'react';
import {
  BarChart3,
  Home,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Phone,
  LogOut,
  Search,
  Send,
  Settings,
  Smile,
  User,
  Users,
} from 'lucide-react';
import VideoCallModal from '../chat/VideoCallModal';
import { AuthContext } from '../../context/AuthContext';
import { getSocket, emitEvent, onEvent, offEvent } from '../../services/socketIO';
import './MessagingDashboard.css';

const chatSeed = [
  {
    id: 1,
    name: 'Maya Chen',
    email: 'maya.chen@acme.io',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
    lastMessage: 'Can you send over the onboarding flow?',
    time: '10:42',
    duration: '24m 18s',
    group: 'Customer Success',
    tags: ['sales', 'support'],
    suggestions: ['Share the onboarding guide', 'Schedule a follow-up', 'Ask about team size'],
    messages: [
      { id: 1, from: 'them', text: 'Hey, we are reviewing DuoTalk for our support team.', time: '10:35' },
      { id: 2, from: 'me', text: 'Great. I can help you map the setup and workflows.', time: '10:37' },
      { id: 3, from: 'them', text: 'Can you send over the onboarding flow?', time: '10:42' },
    ],
  },
  {
    id: 2,
    name: 'Jordan Ellis',
    email: 'jordan@northstar.dev',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
    lastMessage: 'The shared inbox looks perfect.',
    time: '09:28',
    duration: '11m 04s',
    group: 'Product',
    tags: ['support', 'beta'],
    suggestions: ['Invite to beta group', 'Send release notes', 'Ask for feedback'],
    messages: [
      { id: 1, from: 'them', text: 'The shared inbox looks perfect.', time: '09:26' },
      { id: 2, from: 'me', text: 'Love to hear that. Want me to enable beta access?', time: '09:28' },
    ],
  },
  {
    id: 3,
    name: 'Ava Patel',
    email: 'ava@brightdesk.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    lastMessage: 'Could we add two teammates?',
    time: 'Yesterday',
    duration: '36m 51s',
    group: 'Sales',
    tags: ['sales', 'upgrade'],
    suggestions: ['Send invite link', 'Mention pro plan', 'Offer migration help'],
    messages: [
      { id: 1, from: 'them', text: 'Could we add two teammates?', time: '16:11' },
      { id: 2, from: 'me', text: 'Absolutely. I can send an invite link now.', time: '16:12' },
    ],
  },
  {
    id: 4,
    name: 'Noah Reed',
    email: 'noah@orbitlabs.co',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    lastMessage: 'Thanks, that fixed it.',
    time: 'Mon',
    duration: '08m 30s',
    group: 'Technical Support',
    tags: ['support', 'resolved'],
    suggestions: ['Close ticket', 'Send CSAT survey', 'Document fix'],
    messages: [
      { id: 1, from: 'them', text: 'The notification routing was not working.', time: '14:02' },
      { id: 2, from: 'me', text: 'I refreshed the workspace rule. Try again now.', time: '14:06' },
      { id: 3, from: 'them', text: 'Thanks, that fixed it.', time: '14:08' },
    ],
  },
];

const navItems = [
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'chat', icon: MessageCircle, label: 'Chat' },
  { id: 'users', icon: Users, label: 'Users' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

// Component constants
const INITIAL_CHAT_ID = chatSeed[0]?.id;
const PLACEHOLDER_AVATAR = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80';

export default function MessagingDashboard({ user, onLogout }) {
  const { user: authUser } = useContext(AuthContext);
  const [chats, setChats] = useState(chatSeed);
  const [selectedChatId, setSelectedChatId] = useState(INITIAL_CHAT_ID);
  const [message, setMessage] = useState('');
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const socket = getSocket();

  // Listen for real-time message updates
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data) => {
      if (!data?.from || !data?.text) return;
      
      // Find or create the chat with this sender
      setChats((prevChats) => {
        const existingChatIndex = prevChats.findIndex(
          (chat) => chat.email === data.fromEmail || chat.name === data.fromName
        );

        if (existingChatIndex >= 0) {
          // Chat exists, add message
          const updatedChats = [...prevChats];
          updatedChats[existingChatIndex] = {
            ...updatedChats[existingChatIndex],
            lastMessage: data.text,
            time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            messages: [
              ...(updatedChats[existingChatIndex].messages || []),
              { id: data.id || Date.now(), from: 'them', text: data.text, time: data.time },
            ],
          };
          return updatedChats;
        } else {
          // Create new chat
          return [
            ...prevChats,
            {
              id: data.from,
              name: data.fromName || data.from,
              email: data.fromEmail || data.from,
              avatar: data.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
              lastMessage: data.text,
              time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              group: 'Contacts',
              tags: ['message'],
              suggestions: [],
              messages: [{ id: data.id || Date.now(), from: 'them', text: data.text, time: data.time }],
            },
          ];
        }
      });
    };

    // Listen for chat updates
    onEvent('UPDATE_CHAT', (data) => {
      console.log('📨 Chat update received:', data);
      handleReceiveMessage(data);
    });

    onEvent('RECEIVE_MESSAGE', (data) => {
      console.log('📨 New message received:', data);
      handleReceiveMessage(data);
    });

    return () => {
      // Cleanup listeners
      offEvent('UPDATE_CHAT', handleReceiveMessage);
      offEvent('RECEIVE_MESSAGE', handleReceiveMessage);
    };
  }, [socket]);

  const currentUser = useMemo(() => {
    const emailName = user?.email?.split('@')[0];
    return {
      name: user?.displayName || emailName || 'You',
      email: user?.email || 'you@duotalk.app',
      avatar: user?.photoURL || '',
    };
  }, [user]);

  const selectedChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) || chats[0],
    [chats, selectedChatId]
  );

  const handleSend = (event) => {
    event.preventDefault();
    const text = (message || draftSuggestion).trim();
    if (!text) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Find the recipient
    const recipientChat = chats.find(chat => chat.id === selectedChatId);
    if (!recipientChat) return;

    // Emit message to backend via Socket.IO
    if (socket) {
      emitEvent('SEND_MESSAGE', {
        to: recipientChat.email || recipientChat.id,
        text: text,
        from: authUser?.uid || user?.uid,
        fromName: authUser?.displayName || currentUser.name,
        fromEmail: authUser?.email || user?.email,
        timestamp: new Date().toISOString(),
      });
    }

    // Update local UI immediately
    setChats((items) =>
      items.map((chat) =>
        chat.id === selectedChatId
          ? {
              ...chat,
              lastMessage: text,
              time: now,
              messages: [...(chat.messages || []), { id: Date.now(), from: 'me', text, time: now }],
            }
          : chat
      )
    );
    setMessage('');
    setDraftSuggestion('');
  };

  const handleLogout = async () => {
    try {
      await onLogout?.();
    } finally {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  // Debug: Log component state
  console.log('MessagingDashboard rendering - videoCallOpen:', videoCallOpen, 'selectedChat:', selectedChat?.name);

  return (
    <main className="msg-shell">
      {/* Debug log to verify component render */}
      {console.log('🔴 RENDERING MessagingDashboard with videoCallOpen =', videoCallOpen)}
      
      <div className="msg-cube msg-cube-one"><CubeFaces /></div>
      <div className="msg-cube msg-cube-two"><CubeFaces /></div>

      <aside className="msg-iconbar">
        <div className="msg-brand">
          <img src="/duotalk-logo.svg" alt="DuoTalk logo" />
          <strong>DuoTalk</strong>
        </div>
        {navItems.map(({ id, icon: Icon, label }) => (
          <button key={id} className={`msg-nav ${id === 'chat' ? 'active' : ''}`} title={label} aria-label={label}>
            <Icon size={21} />
          </button>
        ))}
        <button className="msg-logout" onClick={handleLogout} title="Logout" aria-label="Logout">
          <LogOut size={18} />
        </button>
      </aside>

      <aside className="msg-list-panel">
        <header className="msg-panel-head">
          <div>
            <h1>Chats</h1>
            <p>Connected people</p>
          </div>
          <button className="msg-round-button" aria-label="Search"><Search size={18} /></button>
        </header>

        <div className="msg-chat-list">
          {chats.map((chat) => (
            <button
              key={chat.id}
              className={`msg-chat-item ${chat.id === selectedChatId ? 'active' : ''}`}
              onClick={() => setSelectedChatId(chat.id)}
            >
              <img src={chat.avatar} alt={chat.name} />
              <span className="msg-chat-copy">
                <span className="msg-chat-row">
                  <strong>{chat.name}</strong>
                  <small>{chat.time}</small>
                </span>
                <span className="msg-last">{chat.lastMessage}</span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className="msg-window">
        <header className="msg-window-head">
          <div className="msg-user-title">
            <img src={selectedChat.avatar} alt={selectedChat.name} />
            <div>
              <h2>{selectedChat.name}</h2>
              <p>Online now</p>
            </div>
          </div>
          <div className="msg-actions">
            <button 
              className="msg-round-button" 
              aria-label="Video Call"
              onClick={() => {
                console.log('🎬 Phone button clicked!');
                setVideoCallOpen(true);
              }}
              title="Start video call"
            >
              <Phone size={18} />
            </button>
            <button className="msg-round-button" aria-label="More"><MoreHorizontal size={18} /></button>
          </div>
        </header>

        <div className="msg-body">
          {selectedChat.messages.map((item) => (
            <MessageBubble
              key={item.id}
              message={item}
              contact={selectedChat}
              currentUser={currentUser}
            />
          ))}
        </div>

        <form className="msg-composer" onSubmit={handleSend}>
          <input
            value={message || draftSuggestion}
            onChange={(event) => {
              setDraftSuggestion('');
              setMessage(event.target.value);
            }}
            placeholder="Write a message..."
          />
          <button type="button" aria-label="Emoji"><Smile size={19} /></button>
          <button type="button" aria-label="Attach"><Paperclip size={19} /></button>
          <button className="msg-send" type="submit" aria-label="Send"><Send size={18} /></button>
        </form>
      </section>

      {/* Video Call Modal */}
      <VideoCallModal
        userId={authUser?.uid || user?.uid}
        userName={authUser?.displayName || currentUser.name}
        isOpen={videoCallOpen}
        onClose={() => setVideoCallOpen(false)}
        initialRecipientId={selectedChat?.id}
        initialRecipientName={selectedChat?.name}
      />
    </main>
  );
}

function CubeFaces() {
  return (
    <>
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </>
  );
}

function MessageBubble({ message, contact, currentUser }) {
  const mine = message.from === 'me';
  const speaker = mine ? currentUser : contact;
  const [showDelete, setShowDelete] = React.useState(false);

  const handleDelete = () => {
    // Emit delete event via Socket.IO
    const socket = getSocket();
    if (socket) {
      emitEvent('DELETE_MESSAGE', { messageId: message.id });
    }
  };

  return (
    <div 
      className={`msg-bubble-row ${mine ? 'mine' : ''}`}
      onMouseEnter={() => mine && setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      {!mine && <Avatar user={contact} className="msg-bubble-avatar" />}
      <div className="msg-bubble-container">
        <article className={`msg-bubble ${mine ? 'mine' : ''}`}>
          {!mine && <strong>{contact.name}</strong>}
          <p>{message.text}</p>
          <time>{message.time}</time>
        </article>
        {showDelete && mine && (
          <button 
            className="msg-bubble-delete"
            onClick={handleDelete}
            title="Delete message"
            aria-label="Delete"
          >
            ✕
          </button>
        )}
      </div>
      {mine && <Avatar user={speaker} className="msg-bubble-avatar" />}
    </div>
  );
}

function Avatar({ user, className = '' }) {
  if (user.avatar) {
    return <img className={className || 'msg-avatar-fallback'} src={user.avatar} alt={user.name} />;
  }

  return (
    <span className={className || 'msg-avatar-fallback'}>
      {(user.name || 'Y').charAt(0).toUpperCase()}
    </span>
  );
}
