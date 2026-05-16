import React, { useState } from 'react'
import { FiHeart, FiMessageSquare, FiShare2, FiTrash2 } from 'react-icons/fi'
import { FaHeart } from 'react-icons/fa'
import './BlogCard.css'

const BlogCard = ({ blog, onLike, onDelete, currentUserFirebaseUID }) => {
  const [isLiking, setIsLiking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isLikedByUser = blog.likes?.includes(currentUserFirebaseUID)
  const isOwnBlog = blog.authorFirebaseUID === currentUserFirebaseUID
  const authorName = blog.author?.displayName || blog.author?.username || blog.authorName || 'DuoTalk User'
  const authorUsername = blog.author?.username || authorName.toLowerCase().replace(/\s+/g, '')

  const handleLike = async () => {
    if (isLiking || !currentUserFirebaseUID) return
    
    setIsLiking(true)
    try {
      await onLike(blog._id)
    } catch (err) {
      console.error('Error liking blog:', err)
    } finally {
      setIsLiking(false)
    }
  }

  const formatDate = (date) => {
    const d = new Date(date)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const truncateContent = (text, maxLength = 200) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const handleDelete = async () => {
    if (!isOwnBlog || isDeleting) return

    setIsDeleting(true)
    try {
      await onDelete(blog._id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="blog-card">
      <div className="blog-card-header">
        <div className="blog-author-info">
          <img 
            src={blog.author?.photoURL || 'https://via.placeholder.com/40'} 
            alt={authorName}
            className="author-avatar"
          />
          <div className="author-details">
            <h3 className="author-name">{authorName}</h3>
            <p className="author-username">@{authorUsername}</p>
          </div>
        </div>
        <span className="post-time">{formatDate(blog.createdAt)}</span>
      </div>

      <div className="blog-card-content">
        <h2 className="blog-title">{blog.title}</h2>
        <p className="blog-excerpt">{truncateContent(blog.content)}</p>
        
        {blog.tags && blog.tags.length > 0 && (
          <div className="blog-tags">
            {blog.tags.slice(0, 5).map((tag, idx) => (
              <span key={idx} className="blog-tag">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="blog-card-footer">
        <div className="blog-stats">
          <div className="stat">
            <FaHeart size={14} style={{ color: isLikedByUser ? '#ff6464' : 'inherit' }} />
            <span>{blog.likeCount || 0}</span>
          </div>
          <div className="stat">
            <FiMessageSquare size={14} />
            <span>{blog.comments?.length || 0}</span>
          </div>
          <div className="stat">
            <span>👁️</span>
            <span>{blog.views || 0}</span>
          </div>
        </div>

        <div className="blog-actions">
          <button 
            className={`action-btn ${isLikedByUser ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={isLiking || !currentUserFirebaseUID}
            title={currentUserFirebaseUID ? 'Like blog' : 'Login to like'}
          >
            {isLikedByUser ? <FaHeart size={18} /> : <FiHeart size={18} />}
          </button>
          <button className="action-btn" title="Comment">
            <FiMessageSquare size={18} />
          </button>
          <button className="action-btn" title="Share">
            <FiShare2 size={18} />
          </button>
          {isOwnBlog && (
            <button
              className="action-btn action-btn-danger"
              onClick={handleDelete}
              disabled={isDeleting}
              title={isDeleting ? 'Deleting blog...' : 'Delete blog'}
            >
              <FiTrash2 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default BlogCard
