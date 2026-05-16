import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { buildApiUrl } from '../services/api'
import CreateBlogModal from './CreateBlogModal'
import BlogCard from './BlogCard'
import './Blogs.css'

export default function Blogs() {
  const { user } = useAuth()
  const [blogs, setBlogs] = useState([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTag, setFilterTag] = useState('')

  // Fetch all blogs
  const fetchBlogs = async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await fetch(buildApiUrl('/blogs'))
      if (!response.ok) throw new Error('Failed to fetch blogs')
      const data = await response.json()
      setBlogs(data || [])
    } catch (err) {
      setError('Failed to load blogs')
      console.error('Error fetching blogs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch blogs on component mount
  useEffect(() => {
    fetchBlogs()
  }, [])

  // Handle blog creation
  const handleBlogCreated = (newBlog) => {
    setBlogs((prevBlogs) => [newBlog, ...prevBlogs])
    fetchBlogs()
  }

  // Handle like
  const handleLike = async (blogId) => {
    if (!user) {
      alert('Please login to like blogs')
      return
    }

    try {
      const response = await fetch(buildApiUrl(`/blogs/${blogId}/like`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userFirebaseUID: user?.firebaseUID || user?.uid
        })
      })

      if (!response.ok) throw new Error('Failed to like blog')
      
      const result = await response.json()
      
      // Update local blog state
      setBlogs((prevBlogs) => prevBlogs.map(blog => {
        if (blog._id === blogId) {
          const userFirebaseUID = user?.firebaseUID || user?.uid
          const likes = blog.likes || []
          const userLiked = likes.includes(userFirebaseUID)
          
          return {
            ...blog,
            likes: result.liked ? [...likes, userFirebaseUID] : likes.filter(uid => uid !== userFirebaseUID),
            likeCount: result.liked ? (blog.likeCount || 0) + 1 : Math.max(0, (blog.likeCount || 0) - 1)
          }
        }
        return blog
      }))
    } catch (err) {
      console.error('Error liking blog:', err)
      alert('Failed to like blog')
    }
  }

  const handleDelete = async (blogId) => {
    if (!userFirebaseUID) {
      alert('Please login to delete blogs')
      return
    }

    const confirmed = window.confirm('Delete this blog? This cannot be undone.')
    if (!confirmed) return

    try {
      const response = await fetch(buildApiUrl(`/blogs/${blogId}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userFirebaseUID
        })
      })

      const contentType = response.headers.get('content-type') || ''
      let result = null

      if (contentType.includes('application/json')) {
        result = await response.json()
      } else {
        const responseText = await response.text()
        throw new Error(
          response.ok
            ? 'Delete returned an unexpected response from the server.'
            : responseText.includes('<!DOCTYPE')
              ? 'Delete endpoint is not available yet. Restart the backend server and try again.'
              : 'Failed to delete blog'
        )
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete blog')
      }

      setBlogs((prevBlogs) => prevBlogs.filter((blog) => blog._id !== blogId))
    } catch (err) {
      console.error('Error deleting blog:', err)
      alert(err.message || 'Failed to delete blog')
    }
  }

  // Filter blogs based on search and tag
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = 
      (blog.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (blog.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (blog.author?.username || blog.author?.displayName || blog.authorName || '').toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTag = !filterTag || (blog.tags && blog.tags.includes(filterTag))
    
    return matchesSearch && matchesTag
  })

  // Get unique tags from all blogs
  const allTags = [...new Set(blogs.flatMap(blog => blog.tags || []))]

  const userFirebaseUID = user?.firebaseUID || user?.uid

  return (
    <div className="blogs-container">
      {/* Header */}
      <div className="blogs-header">
        <div className="header-content">
          <h1 className="header-title">📚 Blog Community</h1>
          <p className="header-subtitle">Share your thoughts, stories, and insights with the community</p>
        </div>

        {user && (
          <button 
            className="create-blog-btn"
            onClick={() => setIsCreateModalOpen(true)}
          >
            ✍️ Write a Blog
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="search-filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search blogs by title, content, or author..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {allTags.length > 0 && (
          <div className="tag-filter">
            <button 
              className={`tag-btn ${!filterTag ? 'active' : ''}`}
              onClick={() => setFilterTag('')}
            >
              All Tags
            </button>
            {allTags.slice(0, 8).map((tag, idx) => (
              <button 
                key={idx}
                className={`tag-btn ${filterTag === tag ? 'active' : ''}`}
                onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Blogs List */}
      <div className="blogs-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading blogs...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchBlogs} className="retry-btn">Retry</button>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h2>No blogs found</h2>
            <p>
              {searchQuery || filterTag 
                ? 'Try adjusting your search or filters'
                : 'Be the first to share a blog post!'}
            </p>
            {user && !searchQuery && !filterTag && (
              <button 
                className="create-blog-btn"
                onClick={() => setIsCreateModalOpen(true)}
              >
                ✍️ Write Your First Blog
              </button>
            )}
          </div>
        ) : (
          <div className="blogs-list">
            <div className="results-info">
              <p>Showing {filteredBlogs.length} blog{filteredBlogs.length !== 1 ? 's' : ''}</p>
            </div>
            {filteredBlogs.map(blog => (
              <BlogCard 
                key={blog._id} 
                blog={blog}
                onLike={handleLike}
                onDelete={handleDelete}
                currentUserFirebaseUID={userFirebaseUID}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Blog Modal */}
      <CreateBlogModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onBlogCreated={handleBlogCreated}
      />
    </div>
  )
}

