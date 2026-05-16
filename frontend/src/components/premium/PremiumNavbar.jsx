import React, { useState } from 'react';
import { Bell, ChevronDown, LogOut, Moon, Search, Sun } from 'lucide-react';

export default function PremiumNavbar({
  userProfile,
  onLogout,
  loggedInUsers = [],
  switchUser,
  currentUserId,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const hasSwitcher = loggedInUsers.length > 1;

  return (
    <header className="glass-panel sticky top-4 z-30 rounded-[20px] p-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 transition duration-300 focus-within:border-indigo-300/60 focus-within:shadow-[0_0_30px_rgba(99,102,241,.25)]">
          <Search size={18} className="text-slate-400" />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            placeholder="Search for people, posts, messages..."
          />
        </label>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setDarkMode((value) => !value)}
            className="duo-icon-button"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {darkMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <button className="duo-icon-button relative" title="Notifications" aria-label="Notifications">
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border border-slate-950 bg-rose-400" />
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((value) => !value)}
            className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-left transition duration-300 hover:scale-[1.02] hover:border-indigo-300/30 hover:bg-white/[0.1]"
            >
              <Avatar userProfile={userProfile} size="h-10 w-10" />
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-sm font-bold text-white">{userProfile?.displayName}</span>
                <span className="block truncate text-xs text-slate-400">{userProfile?.email}</span>
              </span>
              <ChevronDown size={16} className="text-slate-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
                {hasSwitcher && (
                  <div className="mb-2 border-b border-white/10 pb-2">
                    {loggedInUsers.map((account) => (
                      <button
                        key={account.uid}
                        onClick={() => {
                          switchUser?.(account.uid);
                          setMenuOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-white/10 ${account.uid === currentUserId ? 'bg-indigo-400/10' : ''}`}
                      >
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-bold text-white">
                          {(account.displayName || 'U').charAt(0)}
                        </div>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-white">{account.displayName}</span>
                          <span className="block truncate text-xs text-slate-400">{account.email}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={onLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/10">
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>

          <button onClick={onLogout} className="duo-danger-button hidden sm:flex">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

function Avatar({ userProfile, size = 'h-11 w-11' }) {
  if (userProfile?.photoURL) {
    return <img src={userProfile.photoURL} alt={userProfile.displayName} className={`${size} rounded-full border border-indigo-200/30 object-cover shadow-lg shadow-indigo-500/20`} />;
  }

  return (
    <span className={`${size} grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-sm font-black text-white shadow-lg shadow-indigo-500/30`}>
      {userProfile?.displayName?.charAt(0).toUpperCase() || 'D'}
    </span>
  );
}
