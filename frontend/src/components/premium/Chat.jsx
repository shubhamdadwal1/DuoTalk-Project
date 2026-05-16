import React, { useState } from 'react';
import { Paperclip, Plus, Search, Send, Smile } from 'lucide-react';

const conversations = [
  {
    id: 1,
    name: 'Alex Johnson',
    role: 'Design lead',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80',
    online: true,
    unread: 2,
    messages: [
      { id: 1, sender: 'Alex', text: 'The new feed layout feels premium.', timestamp: '10:30 AM' },
      { id: 2, sender: 'You', text: 'Exactly. More signal, less noise.', timestamp: '10:32 AM' },
      { id: 3, sender: 'Alex', text: 'Can you send the profile card idea?', timestamp: '10:33 AM' },
    ],
  },
  {
    id: 2,
    name: 'Sarah Chen',
    role: 'Creator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    online: true,
    unread: 1,
    messages: [
      { id: 1, sender: 'Sarah', text: 'Loved your post on quiet dashboards.', timestamp: '9:15 AM' },
      { id: 2, sender: 'You', text: 'Thank you. I am refining the spacing now.', timestamp: '9:18 AM' },
    ],
  },
  {
    id: 3,
    name: 'Nolan Reed',
    role: 'Founder',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    online: false,
    unread: 0,
    messages: [
      { id: 1, sender: 'Nolan', text: 'Joining the founders group later.', timestamp: '8:22 AM' },
      { id: 2, sender: 'You', text: 'Nice, I will see you there.', timestamp: '8:25 AM' },
    ],
  },
];

export default function Chat() {
  const [activeConversation, setActiveConversation] = useState(0);
  const [messageInput, setMessageInput] = useState('');
  const conversation = conversations[activeConversation];

  const handleSend = () => {
    if (messageInput.trim()) setMessageInput('');
  };

  return (
    <section className="right-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="section-kicker">Inbox</p>
          <h2 className="text-lg font-bold text-white">Messages</h2>
        </div>
        <button className="duo-icon-button h-10 w-10" title="New conversation" aria-label="New conversation">
          <Plus size={18} />
        </button>
      </div>

      <label className="mt-4 flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3">
        <Search size={16} className="text-slate-500" />
        <input className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" placeholder="Search conversations" />
      </label>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {conversations.map((conv, idx) => (
          <button
            key={conv.id}
            onClick={() => setActiveConversation(idx)}
            className={`conversation-chip ${activeConversation === idx ? 'is-active' : ''}`}
            title={conv.name}
            aria-label={conv.name}
          >
            <span className="relative">
              <img src={conv.avatar} alt={conv.name} className="h-11 w-11 rounded-full object-cover" />
              {conv.online && <span className="online-dot" />}
            </span>
            {conv.unread > 0 && <span className="unread-badge">{conv.unread}</span>}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-[18px] border border-white/10 bg-black/20">
        <div className="flex items-center gap-3 border-b border-white/10 p-3">
          <span className="relative">
            <img src={conversation.avatar} alt={conversation.name} className="h-11 w-11 rounded-full object-cover" />
            {conversation.online && <span className="online-dot" />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{conversation.name}</p>
            <p className="text-xs text-slate-400">{conversation.online ? 'Online now' : conversation.role}</p>
          </div>
        </div>

        <div className="max-h-72 space-y-3 overflow-y-auto p-3">
          {conversation.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
              <div className={`chat-bubble ${msg.sender === 'You' ? 'is-mine' : ''}`}>
                <p>{msg.text}</p>
                <span>{msg.timestamp}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
            <button className="chat-tool" title="Attach" aria-label="Attach"><Paperclip size={16} /></button>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="chat-tool" title="Emoji" aria-label="Emoji"><Smile size={16} /></button>
            <button onClick={handleSend} className="send-button" title="Send" aria-label="Send"><Send size={16} /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
