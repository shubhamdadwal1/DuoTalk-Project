import React, { useState } from 'react'
import { FiX } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { buildApiUrl } from '../services/api'
import './CreateBlogModal.css'

const SUGGESTED_TAGS = [
  'technology',
  'travel',
  'lifestyle',
  'community',
  'productivity',
  'career',
  'startup',
  'design',
]

const CreateBlogModal = ({ isOpen, onClose, onBlogCreated }) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()

  const selectedTags = tags
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)

  const handleSuggestedTagClick = (tag) => {
    if (isLoading || selectedTags.includes(tag.toLowerCase())) return

    const nextTags = tags
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    nextTags.push(tag)
    setTags(nextTags.join(', '))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    
    if (!content.trim()) {
      setError('Content is required')
      return
    }

    if (!user || !user.uid) {
      setError('User not authenticated. Please log in again.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const requestBody = {
        title: title.trim(),
        content: content.trim(),
        tags: tagArray,
        authorFirebaseUID: user.uid
      }

      console.log('Submitting blog:', requestBody)

      const response = await fetch(buildApiUrl('/blogs'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const responseData = await response.json()
      console.log('Response:', responseData)

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create blog')
      }

      const result = responseData
      
      // Reset form
      setTitle('')
      setContent('')
      setTags('')
      
      // Notify parent
      if (onBlogCreated) {
        onBlogCreated(result.blog)
      }
      
      onClose()
    } catch (err) {
      setError(err.message || 'Error creating blog')
      console.error('Error creating blog:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="create-blog-modal-overlay" onClick={onClose}>
      <div className="create-blog-modal" onClick={e => e.stopPropagation()}>
        <div className="create-blog-modal-header">
          <h2>✍️ Create New Blog</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-blog-form">
          <div className="form-group">
            <label htmlFor="title">Blog Title</label>
            <input
              id="title"
              type="text"
              placeholder="Enter an engaging title for your blog..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={100}
              disabled={isLoading}
            />
            <small>{title.length}/100</small>
          </div>

          <div className="form-group">
            <label htmlFor="content">Blog Content</label>
            <textarea
              id="content"
              placeholder="Write your blog content here. Share your thoughts, experiences, and insights..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={10}
              disabled={isLoading}
            />
            <small>{content.length} characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (comma separated)</label>
            <input
              id="tags"
              type="text"
              placeholder="e.g., technology, travel, lifestyle"
              value={tags}
              onChange={e => setTags(e.target.value)}
              disabled={isLoading}
            />
            <div className="suggested-tags">
              <span className="suggested-tags-label">Suggested tags:</span>
              <div className="suggested-tags-list">
                {SUGGESTED_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag.toLowerCase())

                  return (
                    <button
                      key={tag}
                      type="button"
                      className={`suggested-tag-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSuggestedTagClick(tag)}
                      disabled={isLoading || isSelected}
                    >
                      #{tag}
                    </button>
                  )
                })}
              </div>
            </div>
            <small>Add tags to help others find your blog</small>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={isLoading} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-publish">
              {isLoading ? 'Publishing...' : '🚀 Publish Blog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateBlogModal
