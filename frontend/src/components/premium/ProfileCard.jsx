import React from 'react';
import { Activity, Award, BadgeCheck, Flame, Heart, MessageCircle, Send, ShieldCheck, Star, Users } from 'lucide-react';

export default function ProfileCard({ userProfile }) {
  return (
    <section className="right-card overflow-hidden p-0">
      <div className="profile-cover" />
      <div className="-mt-11 px-4 pb-4 text-center">
        {userProfile?.photoURL ? (
          <img src={userProfile.photoURL} alt={userProfile.displayName} className="profile-avatar mx-auto object-cover" />
        ) : (
          <div className="profile-avatar mx-auto grid place-items-center bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-2xl font-black text-white">
            {userProfile?.displayName?.charAt(0).toUpperCase() || 'D'}
          </div>
        )}
        <h3 className="mt-3 text-lg font-black text-white">{userProfile?.displayName}</h3>
        <p className="text-xs font-semibold text-cyan-200">@{userProfile?.username}</p>
        <p className="mx-auto mt-3 max-w-[320px] text-sm leading-6 text-slate-300">{userProfile?.bio}</p>

        <div className="mt-4 grid grid-cols-3 gap-2 border-y border-white/10 py-3">
          <Metric label="Posts" value={userProfile?.posts} />
          <Metric label="Followers" value="4.2K" />
          <Metric label="Following" value={userProfile?.following} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="duo-gradient-button">Edit Profile</button>
          <button className="quiet-button">View Activity</button>
        </div>
      </div>
    </section>
  );
}

export function Badges() {
  const badges = [
    { icon: BadgeCheck, label: 'Verified', color: 'text-cyan-300' },
    { icon: ShieldCheck, label: 'Trusted', color: 'text-emerald-300' },
    { icon: Award, label: 'Creator', color: 'text-violet-300' },
    { icon: Star, label: 'Top 1%', color: 'text-amber-300' },
  ];

  return (
    <section className="right-card">
      <p className="section-kicker">Reputation</p>
      <h3 className="text-sm font-bold text-white">Badges</h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {badges.map(({ icon: Icon, label, color }) => (
          <div key={label} className="badge-tile">
            <Icon size={18} className={`${color} drop-shadow-[0_0_10px_currentColor]`} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ActivityStats() {
  const stats = [
    { icon: Heart, label: 'Likes', value: '28.6K' },
    { icon: MessageCircle, label: 'Comments', value: '6.2K' },
    { icon: Send, label: 'Shares', value: '1.9K' },
    { icon: Users, label: 'Groups', value: '24' },
    { icon: Activity, label: 'Reach', value: '91K' },
    { icon: Flame, label: 'Streak', value: '38d' },
  ];

  return (
    <section className="right-card">
      <p className="section-kicker">Performance</p>
      <h3 className="text-sm font-bold text-white">Activity</h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="activity-tile">
            <Icon size={17} className="text-indigo-300" />
            <p className="mt-2 text-base font-black text-white">{value}</p>
            <p className="text-[11px] font-medium text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-base font-black text-white">{value}</p>
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
    </div>
  );
}
