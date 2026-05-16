// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const buildApiUrl = (path = '') => `${API_BASE_URL}${path}`

const cleanErrorMessage = (raw, status) => {
  const text = String(raw || '').trim()
  if (!text) return `Request failed (${status})`
  if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
    return `Request failed (${status})`
  }
  return text
}

const requestJSON = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const raw = await response.text()
  let data = {}
  try {
    data = raw ? JSON.parse(raw) : {}
  } catch {
    data = {}
  }
  if (!response.ok) {
    throw new Error(data.error || data.message || cleanErrorMessage(raw, response.status))
  }
  return data
}

// Authentication API Calls
export const authAPI = {
  register: async (email, password, name) => {
    const response = await fetch(buildApiUrl('/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    })
    return response.json()
  },

  login: async (email, password) => {
    const response = await fetch(buildApiUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await response.json()
    if (data.token) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
    }
    return data
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

// User API Calls
export const userAPI = {
  getAll: async () => {
    return requestJSON(buildApiUrl('/users'))
  },

  getById: async (id) => {
    return requestJSON(buildApiUrl(`/users/${id}`))
  },

  updateInterests: async (id, interests) => {
    const token = localStorage.getItem('token')
    const response = await fetch(buildApiUrl(`/users/${id}/interests`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ interests })
    })
    return response.json()
  }
}

export const profileAPI = {
  syncGoogleUser: async (firebaseUser) => {
    const data = await requestJSON(buildApiUrl('/profile/sync'), {
      method: 'POST',
      body: JSON.stringify({
        firebaseUID: firebaseUser.uid,
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        profileImage: firebaseUser.photoURL,
      }),
    })

    if (data?.token) {
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('token', data.token)
    }

    if (data?.user) {
      localStorage.setItem('user', JSON.stringify(data.user))
    }

    return data?.user || data
  },

  getProfile: async (firebaseUID) => {
    return requestJSON(buildApiUrl(`/profile/${firebaseUID}`))
  },

  updateProfile: async (firebaseUID, profile) => {
    return requestJSON(buildApiUrl(`/profile/${firebaseUID}`), {
      method: 'PUT',
      body: JSON.stringify(profile),
    })
  },

  getPosts: async (firebaseUID) => {
    return requestJSON(buildApiUrl(`/profile/${firebaseUID}/posts`))
  },

  getFollowSuggestions: async (firebaseUID) => {
    return requestJSON(buildApiUrl(`/profile/${firebaseUID}/follow-suggestions`))
  },

  getContacts: async (firebaseUID) => {
    return requestJSON(buildApiUrl(`/profile/${firebaseUID}/contacts`))
  },

  searchUsers: async (firebaseUID, query) => {
    return requestJSON(buildApiUrl(`/profile/${firebaseUID}/search-users?q=${encodeURIComponent(query)}`))
  },

  getRequests: async (firebaseUID) => {
    return requestJSON(buildApiUrl(`/profile/${firebaseUID}/requests`))
  },

  acceptRequest: async (firebaseUID, requesterFirebaseUID) => {
    return requestJSON(buildApiUrl(`/profile/${firebaseUID}/requests/${requesterFirebaseUID}/accept`), {
      method: 'POST',
    })
  },

  follow: async (firebaseUID, targetFirebaseUID) => {
    return requestJSON(buildApiUrl(`/profile/${firebaseUID}/follow`), {
      method: 'POST',
      body: JSON.stringify({ targetFirebaseUID }),
    })
  },

  unfollow: async (firebaseUID, targetFirebaseUID) => {
    return requestJSON(buildApiUrl(`/profile/${firebaseUID}/follow/${targetFirebaseUID}`), {
      method: 'DELETE',
    })
  },
}

export const postAPI = {
  getAll: async () => {
    return requestJSON(buildApiUrl('/posts'))
  },

  create: async ({ firebaseUID, content, image, author, authorPhoto }) => {
    return requestJSON(buildApiUrl('/posts'), {
      method: 'POST',
      body: JSON.stringify({ firebaseUID, content, image, author, authorPhoto }),
    })
  },

  remove: async (postId, firebaseUID) => {
    return requestJSON(buildApiUrl(`/posts/${postId}`), {
      method: 'DELETE',
      body: JSON.stringify({ firebaseUID }),
    })
  },

  like: async (postId, firebaseUID) => {
    return requestJSON(buildApiUrl(`/posts/${postId}/like`), {
      method: 'POST',
      body: JSON.stringify({ firebaseUID }),
    })
  },
}

export const conversationAPI = {
  getAll: async (firebaseUID) => {
    return requestJSON(buildApiUrl(`/conversations/${firebaseUID}`))
  },

  create: async (currentFirebaseUID, targetFirebaseUID) => {
    return requestJSON(buildApiUrl('/conversations'), {
      method: 'POST',
      body: JSON.stringify({ currentFirebaseUID, targetFirebaseUID }),
    })
  },

  getMessages: async (conversationId) => {
    return requestJSON(buildApiUrl(`/conversations/${conversationId}/messages`))
  },

  sendMessage: async (conversationId, senderFirebaseUID, payload) => {
    const body = typeof payload === 'string'
      ? { senderFirebaseUID, text: payload }
      : { senderFirebaseUID, ...payload }
    const data = await requestJSON(buildApiUrl(`/conversations/${conversationId}/messages`), {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return data.message || data
  },

  markRead: async (conversationId, readerFirebaseUID) => {
    return requestJSON(buildApiUrl(`/conversations/${conversationId}/read`), {
      method: 'POST',
      body: JSON.stringify({ readerFirebaseUID }),
    })
  },

  deleteMessage: async (conversationId, messageId, senderFirebaseUID) => {
    return requestJSON(buildApiUrl(`/conversations/${conversationId}/messages/${messageId}`), {
      method: 'DELETE',
      body: JSON.stringify({ senderFirebaseUID }),
    })
  },
}

export const presenceAPI = {
  update: async (firebaseUID, online) => {
    return requestJSON(buildApiUrl(`/presence/${firebaseUID}`), {
      method: 'POST',
      body: JSON.stringify({ online }),
    })
  },
}

export const mediaAPI = {
  uploadChatFile: async (file) => {
    const signature = await requestJSON(buildApiUrl('/uploads/sign'), {
      method: 'POST',
      body: JSON.stringify({
        folder: 'duotalk/chat',
        resourceType: file.type.startsWith('video/') ? 'video' : 'image',
      }),
    })

    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', signature.apiKey)
    formData.append('timestamp', String(signature.timestamp))
    formData.append('signature', signature.signature)
    formData.append('folder', signature.folder)

    const uploadResponse = await fetch(signature.uploadUrl, {
      method: 'POST',
      body: formData,
    })

    const uploadResult = await uploadResponse.json().catch(() => ({}))
    if (!uploadResponse.ok) {
      throw new Error(uploadResult.error?.message || 'Could not upload media to Cloudinary')
    }

    return {
      url: uploadResult.secure_url || uploadResult.url,
      resourceType: uploadResult.resource_type,
      bytes: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height,
      duration: uploadResult.duration,
    }
  },
}

// Messaging API Calls
export const messageAPI = {
  send: async (recipientId, text) => {
    const token = localStorage.getItem('token')
    const response = await fetch(buildApiUrl('/messages/send'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ recipientId, text })
    })
    return response.json()
  },

  getConversation: async (userId) => {
    const token = localStorage.getItem('token')
    const response = await fetch(buildApiUrl(`/messages/conversation/${userId}`), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.json()
  },

  // Get messages for a specific conversation
  getConversationMessages: async (conversationId, limit = 50, skip = 0) => {
    try {
      const response = await fetch(
        buildApiUrl(`/messages/conversation/${conversationId}?limit=${limit}&skip=${skip}`),
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      )
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('Error fetching messages:', error)
      return { messages: [], conversationId }
    }
  },

  // Create or get a conversation between two users
  createConversation: async (userId1, userId2, user1Email, user2Email) => {
    try {
      const response = await fetch(buildApiUrl('/messages/conversation'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId1,
          userId2,
          user1Email,
          user2Email,
        }),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('Error creating conversation:', error)
      return null
    }
  },
}

// Blog API Calls
export const blogAPI = {
  getAll: async () => {
    const response = await fetch(buildApiUrl('/blogs'))
    return response.json()
  },

  create: async (title, content, tags) => {
    const token = localStorage.getItem('token')
    const response = await fetch(buildApiUrl('/blogs'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, content, tags })
    })
    return response.json()
  },

  like: async (blogId) => {
    const token = localStorage.getItem('token')
    const response = await fetch(buildApiUrl(`/blogs/${blogId}/like`), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.json()
  }
}

// Health Check
export const healthCheck = async () => {
  try {
    const response = await fetch(buildApiUrl('/health'))
    return response.json()
  } catch (err) {
    return { error: 'Server not running' }
  }
}
