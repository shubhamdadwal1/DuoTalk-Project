import React from 'react';
import {
  Bell,
  Bookmark,
  Crown,
  FileUp,
  MessageCircle,
  Newspaper,
  Settings,
  Sparkles,
  User,
  Users,
} from 'lucide-react';

const menuItems = [
  { id: 'feed', label: 'Feed', icon: Newspaper },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'posts', label: 'Posts', icon: FileUp },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'groups', label: 'Groups', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const shortcuts = ['Developers', 'Designers', 'Founders', 'AI Makers', 'Remote Teams'];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="glass-panel sticky top-4 hidden h-[calc(100vh-2rem)] rounded-[20px] p-4 lg:flex lg:flex-col">
      <div className="flex items-center gap-3 px-2 py-2">
        <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 shadow-lg shadow-indigo-500/30">
          <Sparkles size={22} className="text-white" />
        </div>
        <div>
          <p className="text-xl font-black tracking-tight text-white">DuoTalk</p>
          <p className="text-xs font-semibold text-slate-400">Social command center</p>
        </div>
      </div>

      <nav className="mt-8 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`duo-nav-item ${active ? 'is-active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.id === 'notifications' && <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.9)]" />}
            </button>
          );
        })}
      </nav>

      <section className="mt-8">
        <p className="px-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Shortcuts</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {shortcuts.map((shortcut) => (
            <button key={shortcut} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-slate-300 transition duration-300 hover:border-indigo-300/50 hover:bg-indigo-400/10 hover:text-white">
              {shortcut}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-auto rounded-2xl border border-indigo-300/20 bg-gradient-to-br from-indigo-500/20 via-violet-500/15 to-cyan-400/10 p-4 shadow-2xl shadow-indigo-950/30">
        <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-white/10">
          <Crown size={20} className="text-amber-200" />
        </div>
        <h3 className="text-base font-bold text-white">Upgrade to Pro</h3>
        <p className="mt-1 text-sm leading-5 text-slate-300">Unlock analytics, creator badges, and priority matching.</p>
        <button className="duo-gradient-button mt-4 w-full">Upgrade</button>
      </section>
    </aside>
  );
}
