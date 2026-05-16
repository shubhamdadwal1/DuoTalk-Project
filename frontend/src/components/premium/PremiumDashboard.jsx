import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import PremiumNavbar from './PremiumNavbar';
import PremiumFeed from './PremiumFeed';
import PostsUploadFeed from './PostsUploadFeed';
import RightPanel from './RightPanel';
import './PremiumDashboard.css';

export default function PremiumDashboard() {
  const { user, logout, loggedInUsers, currentUserId, switchUser } = useAuth();
  const [activeTab, setActiveTab] = useState('feed');
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const displayName = user.displayName || 'DuoTalk User';
    setUserProfile({
      _id: user.uid,
      firebaseUID: user.uid,
      email: user.email,
      displayName,
      photoURL: user.photoURL,
      username: displayName.toLowerCase().replace(/\s+/g, ''),
      bio: 'Building meaningful conversations with product people, makers, and creative teams.',
      followers: 4200,
      following: 892,
      posts: 128,
    });
    setLoading(false);
  }, [user]);

  const quickStats = useMemo(() => [
    { label: 'Profile views', value: '18.4K', delta: '+12%', tone: 'violet' },
    { label: 'New followers', value: '842', delta: '+28%', tone: 'cyan' },
    { label: 'Replies', value: '3.1K', delta: '+9%', tone: 'rose' },
  ], []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  if (loading) {
    return (
      <div className="duo-shell min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-white/10 border-t-indigo-400" />
          <p className="text-slate-200 text-lg font-semibold">Loading DuoTalk</p>
          <p className="text-slate-400 text-sm mt-2">Preparing your social workspace</p>
        </div>
      </div>
    );
  }

  return (
    <div className="duo-shell min-h-screen text-white">
      <div className="duo-ambient" />
      <div className="duo-grid" />

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1840px] grid-cols-1 gap-5 px-4 py-4 lg:grid-cols-[282px_minmax(0,1fr)] xl:grid-cols-[282px_minmax(0,1fr)_408px] lg:px-5">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="min-w-0">
          <PremiumNavbar
            userProfile={userProfile}
            onLogout={handleLogout}
            loggedInUsers={loggedInUsers}
            switchUser={switchUser}
            currentUserId={currentUserId}
          />

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {quickStats.map((stat) => (
              <section key={stat.label} className={`metric-panel metric-${stat.tone} glass-panel rounded-[18px] p-4 transition duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02]`}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{stat.label}</p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <strong className="text-2xl font-bold text-white">{stat.value}</strong>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">{stat.delta}</span>
                </div>
              </section>
            ))}
          </div>

          <section className="mt-5">
            {activeTab === 'feed' ? (
              <PremiumFeed userProfile={userProfile} />
            ) : activeTab === 'posts' ? (
              <PostsUploadFeed userProfile={userProfile} user={user} />
            ) : (
              <div className="glass-panel rounded-[20px] p-8 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">{activeTab}</p>
                <h2 className="mt-3 text-2xl font-bold text-white">Your {activeTab} workspace is ready.</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
                  The dashboard keeps your messages, profile insights, badges, and activity stats close while you move through DuoTalk.
                </p>
              </div>
            )}
          </section>
        </main>

        <RightPanel userProfile={userProfile} />
      </div>
    </div>
  );
}
