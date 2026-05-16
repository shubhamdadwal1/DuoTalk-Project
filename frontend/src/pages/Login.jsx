import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser } from 'react-icons/fi'
import { buildApiUrl } from '../services/api'
import './Login.css'

const Login = () => {
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login'
      const payload = isSignUp
        ? {
            username: formData.username,
            email: formData.email,
            password: formData.password
          }
        : {
            email: formData.email,
            password: formData.password
          }

      // Validate form
      if (isSignUp) {
        if (!formData.username || !formData.email || !formData.password) {
          setError('All fields are required')
          setLoading(false)
          return
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters')
          setLoading(false)
          return
        }
      }

      const response = await fetch(buildApiUrl(endpoint.replace('/api', '')), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Authentication failed')
        setLoading(false)
        return
      }

      // Store token in localStorage
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Redirect to home
      navigate('/')
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('Auth error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Header */}
        <div className="login-header">
          <h1>DuoTalk</h1>
          <p>{isSignUp ? 'Create your account' : 'Welcome back'}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          {/* Username Field (Sign Up Only) */}
          {isSignUp && (
            <div className="form-group">
              <label>Username</label>
              <div className="input-wrapper">
                <FiUser className="input-icon" />
                <input
                  type="text"
                  name="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="form-group">
            <label>Email</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field (Sign Up Only) */}
          {isSignUp && (
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Login')}
          </button>
        </form>

        {/* Toggle Sign Up / Login */}
        <div className="toggle-auth">
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              className="toggle-btn"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
                setFormData({ username: '', email: '', password: '', confirmPassword: '' })
              }}
            >
              {isSignUp ? 'Login' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
