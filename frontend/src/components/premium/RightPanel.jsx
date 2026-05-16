import React from 'react';
import Chat from './Chat';
import ProfileCard, { ActivityStats, Badges } from './ProfileCard';

export default function RightPanel({ userProfile }) {
  return (
    <aside className="hidden min-w-0 space-y-5 xl:block">
      <section className="glass-panel sticky top-4 max-h-[calc(100vh-2rem)] space-y-5 overflow-y-auto rounded-[20px] p-4">
        <Chat />
        <ProfileCard userProfile={userProfile} />
        <Badges />
        <ActivityStats />
      </section>
    </aside>
  );
}
