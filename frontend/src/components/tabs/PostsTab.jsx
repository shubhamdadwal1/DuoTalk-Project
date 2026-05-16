import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import '../tabs/PostsTab.css';
import { postAPI } from '../../services/api';

export default function PostsTab({ user, userProfile }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadPosts = async () => {
      setLoading(true);
      try {
        const savedPosts = await postAPI.getAll();
        if (active) setPosts(savedPosts);
      } catch (err) {
        toast.error(`Could not load posts: ${err.message}`, { position: 'top-right' });
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPosts();
    return () => {
      active = false;
    };
  }, []);

  const handlePostSubmit = async () => {
    if (!newPost.trim()) {
      toast.warning('Please write something first!', { position: 'top-right' });
      return;
    }
    if (!user?.uid) {
      toast.error('Please sign in before posting.', { position: 'top-right' });
      return;
    }

    setLoading(true);
    try {
      const post = await postAPI.create({
        firebaseUID: user.uid,
        content: newPost,
        author: userProfile?.displayName || user?.displayName || 'Anonymous',
        authorPhoto: userProfile?.photoURL || user?.photoURL || '',
      });
      setPosts(prev => [post, ...prev]);
      setNewPost('');
      toast.success('Post created successfully!', { position: 'top-right' });
    } catch (err) {
      toast.error(`Could not create post: ${err.message}`, { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const updatedPost = await postAPI.like(postId, user.uid);
      setPosts(prev => prev.map(post => post._id === postId ? updatedPost : post));
    } catch (err) {
      toast.error(`Could not update like: ${err.message}`, { position: 'top-right' });
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Create Post Section */}
      <div style={{ background: 'rgba(30, 30, 60, 0.5)', borderRadius: '15px', border: '1px solid rgba(100, 200, 255, 0.2)', padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          {userProfile?.photoURL && (
            <img 
              src={userProfile.photoURL} 
              alt={userProfile.displayName} 
              style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }}
            />
          )}
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's on your mind?"
            style={{
              flex: 1,
              background: 'rgba(10, 10, 25, 0.5)',
              border: '1px solid rgba(100, 200, 255, 0.2)',
              color: '#fff',
              padding: '1rem',
              borderRadius: '10px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              minHeight: '100px'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={handlePostSubmit}
            style={{
              background: 'linear-gradient(135deg, #64c8ff, #00ff88)',
              border: 'none',
              color: '#0a0a19',
              padding: '0.7rem 1.5rem',
              borderRadius: '50px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.95rem'
            }}
            onMouseEnter={e => e.target.style.opacity = '0.9'}
            onMouseLeave={e => e.target.style.opacity = '1'}
            disabled={loading}
          >
            {loading ? 'Posting...' : '📤 Post'}
          </button>
        </div>
      </div>

      {/* Posts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#a0a0d0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <p>No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div 
              key={post._id} 
              style={{ 
                background: 'rgba(30, 30, 60, 0.5)', 
                borderRadius: '15px', 
                border: '1px solid rgba(100, 200, 255, 0.2)', 
                padding: '1.5rem',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(40, 40, 70, 0.6)';
                e.currentTarget.style.borderColor = 'rgba(100, 200, 255, 0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(30, 30, 60, 0.5)';
                e.currentTarget.style.borderColor = 'rgba(100, 200, 255, 0.2)';
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'linear-gradient(135deg, #64c8ff, #a76eff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  {post.author.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#64c8ff', fontWeight: '600' }}>{post.author}</div>
                  <div style={{ color: '#a0a0d0', fontSize: '0.8rem' }}>
                    {new Date(post.createdAt || post.timestamp).toLocaleDateString()} {new Date(post.createdAt || post.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div style={{ color: '#e0e0e0', marginBottom: '1rem', lineHeight: '1.6' }}>
                {post.content}
              </div>

              <div style={{ display: 'flex', gap: '2rem', color: '#a0a0d0', borderTop: '1px solid rgba(100, 200, 255, 0.1)', paddingTop: '1rem' }}>
                <button onClick={() => handleLike(post._id)} style={{ background: 'none', border: 'none', color: '#a0a0d0', cursor: 'pointer', fontSize: '0.9rem' }} onMouseEnter={e => e.target.style.color = '#64c8ff'} onMouseLeave={e => e.target.style.color = '#a0a0d0'}>
                  👍 Like {post.likes}
                </button>
                <button style={{ background: 'none', border: 'none', color: '#a0a0d0', cursor: 'pointer', fontSize: '0.9rem' }} onMouseEnter={e => e.target.style.color = '#64c8ff'} onMouseLeave={e => e.target.style.color = '#a0a0d0'}>
                  💬 Comment {post.comments?.length || 0}
                </button>
                <button style={{ background: 'none', border: 'none', color: '#a0a0d0', cursor: 'pointer', fontSize: '0.9rem' }} onMouseEnter={e => e.target.style.color = '#64c8ff'} onMouseLeave={e => e.target.style.color = '#a0a0d0'}>
                  ↗️ Share
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
