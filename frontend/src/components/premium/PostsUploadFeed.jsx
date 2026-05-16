import React, { useEffect, useRef, useState } from 'react';
import {
  Bookmark,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Image,
  Send,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { postAPI } from '../../services/api';
import './PostsUploadFeed.css';

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not process image'));
    image.src = dataUrl;
  });
}

async function shrinkImage(file, maxSize = 1800, quality = 0.84) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not prepare image for upload');
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

export default function PostsUploadFeed({ userProfile, user }) {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [openMenuId, setOpenMenuId] = useState('');
  const [deletingPostId, setDeletingPostId] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadAllPosts();
  }, []);

  const loadAllPosts = async () => {
    try {
      setLoading(true);
      const data = await postAPI.getAll();
      let postsArray = Array.isArray(data) ? data : data.posts || [];

      postsArray = postsArray.filter((post) => post && typeof post === 'object');
      postsArray.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      setPosts(postsArray);

      if (user?.uid) {
        const likedSet = new Set();
        postsArray.forEach((post) => {
          try {
            if (Array.isArray(post.likedBy) && post.likedBy.includes(user.uid)) {
              likedSet.add(post._id);
            } else if (Array.isArray(post.likes) && post.likes.includes(user.uid)) {
              likedSet.add(post._id);
            }
          } catch (e) {
            console.warn('Error checking likes for post:', post._id, e);
          }
        });
        setLikedPosts(likedSet);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
      toast.error(`Could not load posts: ${err.message}`, { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  const clearComposer = () => {
    setNewPostContent('');
    setNewPostImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.', { position: 'top-right' });
      event.target.value = '';
      return;
    }

    try {
      const resized = await shrinkImage(file);
      setNewPostImage(resized);
    } catch (err) {
      toast.error(err.message || 'Could not prepare image for upload.', { position: 'top-right' });
      setNewPostImage('');
    } finally {
      event.target.value = '';
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !newPostImage) {
      toast.warning('Please write something or choose an image first.', { position: 'top-right' });
      return;
    }

    if (!user?.uid) {
      toast.error('Please sign in before posting.', { position: 'top-right' });
      return;
    }

    try {
      setLoading(true);
      const post = await postAPI.create({
        firebaseUID: user.uid,
        content: newPostContent,
        image: newPostImage || undefined,
        author: userProfile?.displayName || user?.displayName || 'Anonymous',
        authorPhoto: userProfile?.photoURL || user?.photoURL || '',
      });

      setPosts((prev) => [post, ...prev]);
      clearComposer();
      toast.success('Post uploaded successfully!', { position: 'top-right' });
    } catch (err) {
      toast.error(`Could not create post: ${err.message}`, { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async (postId) => {
    if (!user?.uid) {
      toast.error('Please sign in to like posts.', { position: 'top-right' });
      return;
    }

    try {
      const updatedPost = await postAPI.like(postId, user.uid);
      setPosts((prev) =>
        prev.map((post) => (post._id === postId ? updatedPost : post))
      );

      const newLikedSet = new Set(likedPosts);
      if (newLikedSet.has(postId)) {
        newLikedSet.delete(postId);
      } else {
        newLikedSet.add(postId);
      }
      setLikedPosts(newLikedSet);
    } catch (err) {
      toast.error(`Could not update like: ${err.message}`, { position: 'top-right' });
    }
  };

  const handleDeletePost = async (postId) => {
    if (!user?.uid || !postId) return;

    const confirmed = window.confirm('Delete this post? This cannot be undone.');
    if (!confirmed) return;

    try {
      setDeletingPostId(postId);
      await postAPI.remove(postId, user.uid);
      setPosts((prev) => prev.filter((post) => post._id !== postId));
      setLikedPosts((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
      setOpenMenuId('');
      toast.success('Post deleted successfully.', { position: 'top-right' });
    } catch (err) {
      toast.error(`Could not delete post: ${err.message}`, { position: 'top-right' });
    } finally {
      setDeletingPostId('');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading && posts.length === 0) {
    return (
      <div className="posts-feed-container">
        <div className="posts-loading">
          <div className="posts-loading-content">
            <div className="posts-loading-spinner" />
            <p className="posts-loading-text">Loading posts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="posts-feed-container">
      <div className="create-post-card glass-panel">
        <div className="create-post-layout">
          {userProfile?.photoURL && (
            <img
              src={userProfile.photoURL}
              alt={userProfile.displayName}
              className="create-post-avatar"
            />
          )}
          {!userProfile?.photoURL && (
            <div className="create-post-avatar create-post-avatar-fallback">
              {(userProfile?.displayName || user?.displayName || 'A').charAt(0).toUpperCase()}
            </div>
          )}
          <form onSubmit={handlePostSubmit} className="create-post-form">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind? Share something amazing..."
              className="create-post-input"
              rows="3"
            />
            {newPostImage && (
              <div className="post-image-preview-wrap">
                <img src={newPostImage} alt="Selected post media" className="post-image-preview" />
                <button
                  type="button"
                  className="post-image-remove"
                  onClick={() => setNewPostImage('')}
                >
                  Remove image
                </button>
              </div>
            )}
            <div className="create-post-actions">
              <div className="create-post-tools">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="post-media-input"
                  onChange={handleSelectImage}
                />
                <button
                  type="button"
                  className="post-media-button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image size={16} />
                  Media
                </button>
              </div>
              <button
                type="submit"
                disabled={(!newPostContent.trim() && !newPostImage) || loading}
                className="post-submit-button duo-gradient-button"
              >
                <Send size={16} />
                Upload Post
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="posts-list">
        {posts.length === 0 ? (
          <div className="posts-empty glass-panel">
            <p className="posts-empty-label">No Posts Yet</p>
            <h3 className="posts-empty-title">Be the first to share!</h3>
            <p className="posts-empty-text">Start uploading posts and engaging with the community.</p>
          </div>
        ) : (
          posts.map((post) => {
            const getLikeCount = () => {
              if (typeof post.likes === 'number') return post.likes;
              return 0;
            };

            const authorName = post.author || 'Anonymous';
            const authorPhoto = post.authorPhoto || null;
            const isOwnPost = post.firebaseUID === user?.uid || post.authorId === user?.uid;
            const isMenuOpen = openMenuId === String(post._id);
            const isDeletingThisPost = deletingPostId === String(post._id);
            const likeCount = getLikeCount();

            return (
              <div key={post._id} className="post-card">
                <div className="post-card-header">
                  <div className="post-card-author">
                    {authorPhoto && (
                      <img
                        src={authorPhoto}
                        alt={authorName}
                        className="post-card-author-photo"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    {!authorPhoto && (
                      <div className="post-card-author-photo post-card-author-fallback">
                        <span>{authorName.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="post-card-author-meta">
                      <p className="post-card-author-name">{authorName}</p>
                      <p className="post-card-author-date">{formatDate(post.createdAt)}</p>
                    </div>
                  </div>
                  <div className="post-card-menu-wrap">
                    <button
                      className="post-card-menu"
                      type="button"
                      onClick={() => setOpenMenuId(isMenuOpen ? '' : String(post._id))}
                      aria-label="Post options"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {isMenuOpen && isOwnPost && (
                      <div className="post-card-dropdown">
                        <button
                          type="button"
                          className="post-card-dropdown-item post-card-dropdown-item-danger"
                          onClick={() => handleDeletePost(String(post._id))}
                          disabled={isDeletingThisPost}
                        >
                          {isDeletingThisPost ? 'Deleting...' : 'Delete post'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {post.image && (
                  <div className="post-media-wrap">
                    <img
                      src={post.image}
                      alt={post.content ? `${authorName}'s post` : 'Uploaded post'}
                      className="post-media-image"
                    />
                  </div>
                )}

                <div className="post-card-actions">
                  <div className="post-card-actions-left">
                    <button
                      onClick={() => handleLikePost(post._id)}
                      className={`post-card-action-icon ${likedPosts.has(post._id) ? 'liked' : ''}`}
                      type="button"
                      aria-label="Like post"
                    >
                      <Heart
                        size={22}
                        fill={likedPosts.has(post._id) ? 'currentColor' : 'none'}
                      />
                    </button>

                    <button className="post-card-action-icon" type="button" aria-label="Comment">
                      <MessageCircle size={22} />
                    </button>

                    <button className="post-card-action-icon" type="button" aria-label="Share">
                      <Share2 size={22} />
                    </button>
                  </div>

                  <button className="post-card-action-icon post-card-save" type="button" aria-label="Save post">
                    <Bookmark size={22} />
                  </button>
                </div>

                <div className="post-card-meta">
                  <p className="post-card-likes">{likeCount} {likeCount === 1 ? 'like' : 'likes'}</p>
                  {post.content && (
                    <p className="post-card-caption">
                      <strong>{authorName}</strong> {post.content}
                    </p>
                  )}
                  {!post.content && <p className="post-card-caption post-card-caption-muted">Shared a photo</p>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
