import React, { useState } from 'react'
import { FiSearch, FiMenu, FiX, FiLogOut } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import LoginModal from './LoginModal'
import './Navbar.css'

const Navbar = ({ onNavigate, currentPage }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const { user, logout, loading } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      setMobileMenuOpen(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Logo */}
          <div className="navbar-logo">
            <img src="/duotalk-logo.svg" alt="DuoTalk" className="logo-icon" />
            <span>DuoTalk</span>
          </div>

          {/* Menu Items */}
          <div className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
            <button onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 0', color: currentPage === 'home' ? '#64c8ff' : 'inherit' }}>Home</button>
            <button onClick={() => { onNavigate('blogs'); setMobileMenuOpen(false); }} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 0', color: currentPage === 'blogs' ? '#64c8ff' : 'inherit' }}>📚 Blogs</button>
            <button onClick={() => { onNavigate('messaging'); setMobileMenuOpen(false); }} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 0', color: currentPage === 'messaging' ? '#64c8ff' : 'inherit' }}>💬 Messages</button>
            <a href="#features" className="nav-link">Features</a>
            <a href="#about" className="nav-link">About</a>
          </div>

          {/* Right Section */}
          <div className="navbar-right">
            <div className="search-bar">
              <FiSearch className="search-icon" />
              <input type="text" placeholder="Search..." />
            </div>

            {user ? (
              <div className="user-profile">
                <img
                  src={user.photoURL || 'https://via.placeholder.com/40'}
                  alt={user.displayName || 'User'}
                  className="user-avatar"
                  title={user.displayName || user.email}
                />
                <span className="user-name">{user.displayName || 'User'}</span>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="logout-btn"
                  title="Logout"
                >
                  <FiLogOut />
                </button>
              </div>
            ) : (
              <button
                className="login-btn"
                onClick={() => setLoginModalOpen(true)}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Login'}
              </button>
            )}

            <div className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <FiX /> : <FiMenu />}
            </div>
          </div>
        </div>
      </nav>

      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  )
}

export default Navbar
