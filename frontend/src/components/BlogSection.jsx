import React, { useState, useEffect } from 'react'
import { FiArrowRight, FiHeart } from 'react-icons/fi'
import { FaHeart } from 'react-icons/fa'
import { buildApiUrl } from '../services/api'
import './BlogSection.css'

const BlogSection = ({ onViewAllBlogs, currentUserFirebaseUID, onLike }) => {
  const [blogs, setBlogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchLatestBlogs()
  }, [])

  const fetchLatestBlogs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(buildApiUrl('/blogs'))
      if (!response.ok) throw new Error('Failed to fetch blogs')
      const data = await response.json()
      setBlogs(Array.isArray(data) ? data.slice(0, 3) : []) // Show only latest 3 blogs
    } catch (err) {
      console.error('Error fetching blogs:', err)
    } finally {
      setIsLoading(false)
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

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <section className="blog-section">
      <div className="section-header">
        <h2>📚 Latest Blog Posts</h2>
        <button onClick={onViewAllBlogs} className="view-all-btn">
          View All <FiArrowRight size={18} />
        </button>
      </div>

      {isLoading ? (
        <div className="blogs-loading">
          <div className="mini-spinner"></div>
        </div>
      ) : blogs.length === 0 ? (
        <div className="no-blogs">
          <p>No blogs yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="blogs-grid">
          {blogs.map(blog => (
            <div key={blog._id} className="blog-item">
              {(() => {
                const authorName = blog.author?.displayName || blog.author?.username || blog.authorName || 'DuoTalk User'
                return (
                  <>
              <div className="blog-item-header">
                <div className="author-mini">
                  <img src={blog.author?.photoURL || 'https://via.placeholder.com/32'} alt={authorName} />
                  <div>
                    <p className="author-name-mini">{authorName}</p>
                    <p className="blog-date">{formatDate(blog.createdAt)}</p>
                  </div>
                </div>
              </div>
              
              <h3 className="blog-item-title">{blog.title}</h3>
              <p className="blog-item-excerpt">{truncateText(blog.content)}</p>
              
              {blog.tags && blog.tags.length > 0 && (
                <div className="blog-item-tags">
                  {blog.tags.slice(0, 2).map((tag, idx) => (
                    <span key={idx} className="mini-tag">#{tag}</span>
                  ))}
                </div>
              )}

              <div className="blog-item-footer">
                <button
                  className="blog-like-btn"
                  onClick={() => onLike?.(blog._id)}
                  disabled={!currentUserFirebaseUID || !onLike}
                >
                  {blog.likes?.includes(currentUserFirebaseUID) ? (
                    <FaHeart size={16} style={{ color: '#ff6464' }} />
                  ) : (
                    <FiHeart size={16} />
                  )}
                  <span>{blog.likeCount || 0}</span>
                </button>
              </div>
                  </>
                )
              })()}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default BlogSection
