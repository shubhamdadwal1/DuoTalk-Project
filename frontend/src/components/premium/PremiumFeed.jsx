import React from 'react';
import {
  BarChart3,
  Bookmark,
  Heart,
  Image,
  Laugh,
  MessageCircle,
  MoreHorizontal,
  Share2,
  Video,
} from 'lucide-react';

const postOptions = [
  { label: 'Image', icon: Image, color: 'text-cyan-300' },
  { label: 'Video', icon: Video, color: 'text-violet-300' },
  { label: 'Poll', icon: BarChart3, color: 'text-emerald-300' },
  { label: 'Feeling', icon: Laugh, color: 'text-amber-300' },
];

const posts = [
  {
    id: 1,
    name: 'Maya Chen',
    role: 'Product Designer',
    time: '12 min ago',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
    text: 'Shipped a new collaboration flow today. The smallest interface details really do change how confident a team feels while moving fast.',
    media: [
      'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=900&q=80',
    ],
    likes: '12.8K',
    comments: 486,
    shares: 92,
  },
  {
    id: 2,
    name: 'Jordan Ellis',
    role: 'Frontend Engineer',
    time: '48 min ago',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
    text: 'Dark mode dashboards should feel calm, not sleepy. Contrast, rhythm, and useful density are doing most of the work here.',
    media: [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1100&q=80',
    ],
    likes: '8.4K',
    comments: 212,
    shares: 61,
  },
];

export default function PremiumFeed({ userProfile }) {
  return (
    <div className="space-y-5">
      <CreatePostCard userProfile={userProfile} />
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

function CreatePostCard({ userProfile }) {
  return (
    <section className="glass-panel rounded-[20px] p-4 transition duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-2xl hover:shadow-indigo-950/30">
      <div className="flex items-center gap-3">
        <UserAvatar user={userProfile} />
        <button className="flex min-h-12 flex-1 items-center rounded-2xl border border-white/10 bg-black/20 px-4 text-left text-sm text-slate-400 transition duration-300 hover:border-indigo-300/50 hover:bg-white/[0.06]">
          What's on your mind?
        </button>
        <button className="duo-gradient-button hidden sm:inline-flex">Post</button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
        <div className="flex flex-wrap gap-2">
          {postOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button key={option.label} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition duration-300 hover:bg-white/[0.08] hover:text-white">
                <Icon size={17} className={option.color} />
                {option.label}
              </button>
            );
          })}
        </div>
        <button className="duo-gradient-button sm:hidden">Post</button>
      </div>
    </section>
  );
}

function PostCard({ post }) {
  return (
    <article className="glass-panel rounded-[20px] p-4 transition duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-2xl hover:shadow-indigo-950/40">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <img src={post.avatar} alt={post.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-indigo-300/30" />
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-white">{post.name}</h3>
            <p className="truncate text-xs text-slate-400">{post.role} · {post.time}</p>
          </div>
        </div>
        <button className="duo-icon-button h-9 w-9" title="More options" aria-label="More options">
          <MoreHorizontal size={18} />
        </button>
      </header>

      <p className="mt-4 text-[15px] leading-7 text-slate-200">{post.text}</p>

      <div className={`mt-4 grid gap-3 ${post.media.length > 1 ? 'sm:grid-cols-2' : ''}`}>
        {post.media.map((image) => (
          <img
            key={image}
            src={image}
            alt=""
            className="h-72 w-full rounded-[18px] border border-white/10 object-cover shadow-2xl shadow-black/30"
          />
        ))}
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div className="flex flex-wrap gap-2">
          <Action icon={Heart} label="Like" value={post.likes} />
          <Action icon={MessageCircle} label="Comment" value={post.comments} />
          <Action icon={Share2} label="Share" value={post.shares} />
        </div>
        <button className="duo-icon-button h-10 w-10" title="Save post" aria-label="Save post">
          <Bookmark size={18} />
        </button>
      </footer>
    </article>
  );
}

function Action({ icon: Icon, label, value }) {
  return (
    <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-300 transition duration-300 hover:scale-[1.02] hover:border-indigo-300/50 hover:bg-indigo-400/10 hover:text-white">
      <Icon size={17} />
      <span>{label}</span>
      <span className="text-slate-500">{value}</span>
    </button>
  );
}

function UserAvatar({ user }) {
  if (user?.photoURL) {
    return <img src={user.photoURL} alt={user.displayName} className="h-12 w-12 rounded-full object-cover ring-2 ring-indigo-300/40" />;
  }

  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 font-black text-white ring-2 ring-indigo-300/30">
      {user?.displayName?.charAt(0).toUpperCase() || 'D'}
    </div>
  );
}
