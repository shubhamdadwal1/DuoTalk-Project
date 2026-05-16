import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Dashboard.css';
import PostsTab from './tabs/PostsTab';
import ChatTab from './tabs/ChatTab';
import ProfileTab from './tabs/ProfileTab';
import { profileAPI } from '../services/api';

export default function DashboardPage() {
  const { user, logout, loggedInUsers, switchUser, getAllLoggedInUsers } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const savedProfile = await profileAPI.syncGoogleUser(user);
        if (active) setUserProfile(savedProfile);
      } catch (err) {
        if (active) {
          setUserProfile({
            _id: user.uid,
            firebaseUID: user.uid,
            email: user.email,
            displayName: user.displayName || 'User',
            photoURL: user.photoURL,
            bio: 'Welcome to DuoTalk!',
            followers: 0,
            following: 0,
            posts: [],
            createdAt: new Date(),
          });
          toast.error(`Profile database sync failed: ${err.message}`, {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, [user]);

  // Close user switcher when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showUserSwitcher && !e.target.closest('header')) {
        setShowUserSwitcher(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserSwitcher]);

  const handleLogout = async (userUid = null) => {
    try {
      if (userUid) {
        // Remove specific user
        await logout(userUid);
        if (userUid === user?.uid) {
          toast.info('Switched to next user', {
            position: 'top-right',
            autoClose: 1500,
          });
        }
      } else {
        // Full logout
        await logout();
        toast.success('Logged out successfully', {
          position: 'top-right',
          autoClose: 2000,
        });
      }
    } catch (err) {
      toast.error('Error logging out', {
        position: 'top-right',
        autoClose: 2000,
      });
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a19', color: '#fff' }}>
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a19', color: '#fff' }}>
      {/* ===== HEADER ===== */}
      <header style={{ background: 'linear-gradient(135deg, rgba(10, 10, 25, 0.95), rgba(20, 10, 40, 0.95))', borderBottom: '1px solid rgba(100, 200, 255, 0.1)', padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #64c8ff, #a76eff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            🎯 DuoTalk
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {user?.photoURL && (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #64c8ff', cursor: 'pointer' }}
                  onClick={() => setShowUserSwitcher(!showUserSwitcher)}
                  title={`${loggedInUsers.length} user${loggedInUsers.length !== 1 ? 's' : ''} logged in`}
                />
              )}
              <div style={{ cursor: loggedInUsers.length > 1 ? 'pointer' : 'default' }} onClick={() => loggedInUsers.length > 1 && setShowUserSwitcher(!showUserSwitcher)}>
                <div style={{ color: '#64c8ff', fontWeight: '600', fontSize: '0.95rem' }}>{user?.displayName}</div>
                <div style={{ color: '#a0a0d0', fontSize: '0.8rem' }}>
                  {loggedInUsers.length > 1 ? `${loggedInUsers.length} accounts` : user?.email}
                </div>
              </div>
            </div>

            {/* User Switcher Dropdown */}
            {loggedInUsers.length > 1 && showUserSwitcher && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                background: 'rgba(10, 10, 25, 0.95)',
                border: '1px solid rgba(100, 200, 255, 0.3)',
                borderRadius: '12px',
                minWidth: '280px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid rgba(100, 200, 255, 0.1)' }}>
                  <div style={{ color: '#64c8ff', fontWeight: '600', fontSize: '0.9rem' }}>
                    👥 Logged In Accounts ({loggedInUsers.length})
                  </div>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {loggedInUsers.map((u, idx) => (
                    <div
                      key={u.uid}
                      onClick={() => {
                        switchUser(u.uid);
                        setShowUserSwitcher(false);
                      }}
                      style={{
                        padding: '0.8rem 1rem',
                        borderBottom: idx < loggedInUsers.length - 1 ? '1px solid rgba(100, 200, 255, 0.1)' : 'none',
                        cursor: 'pointer',
                        background: u.uid === user?.uid ? 'rgba(100, 200, 255, 0.1)' : 'transparent',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.8rem'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(100, 200, 255, 0.2)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = u.uid === user?.uid ? 'rgba(100, 200, 255, 0.1)' : 'transparent';
                      }}
                    >
                      <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'linear-gradient(135deg, #64c8ff, #a76eff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {u.displayName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: u.uid === user?.uid ? '#64c8ff' : '#e0e0e0', fontWeight: u.uid === user?.uid ? '600' : '500', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {u.displayName} {u.uid === user?.uid && '✓'}
                        </div>
                        <div style={{ color: '#a0a0d0', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {u.email}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLogout(u.uid);
                        }}
                        style={{
                          background: 'rgba(255, 107, 107, 0.2)',
                          border: 'none',
                          color: '#ff6b6b',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}
                        onMouseEnter={e => e.target.style.background = 'rgba(255, 107, 107, 0.4)'}
                        onMouseLeave={e => e.target.style.background = 'rgba(255, 107, 107, 0.2)'}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '0.8rem 1rem', borderTop: '1px solid rgba(100, 200, 255, 0.1)' }}>
                  <button
                    onClick={() => {
                      setShowUserSwitcher(false);
                      handleLogout();
                    }}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #ff6b6b, #ff8787)',
                      border: 'none',
                      color: '#fff',
                      padding: '0.6rem 1rem',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                    onMouseEnter={e => e.target.style.opacity = '0.9'}
                    onMouseLeave={e => e.target.style.opacity = '1'}
                  >
                    Logout All
                  </button>
                </div>
              </div>
            )}
            
            {loggedInUsers.length === 1 && (
              <button 
                onClick={() => handleLogout()}
                style={{ background: 'linear-gradient(135deg, #ff6b6b, #ff8787)', border: 'none', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '50px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}
                onMouseEnter={e => e.target.style.opacity = '0.9'}
                onMouseLeave={e => e.target.style.opacity = '1'}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* TAB NAVIGATION */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(100, 200, 255, 0.2)', paddingBottom: '1rem' }}>
          <button
            onClick={() => setActiveTab('posts')}
            style={{
              background: activeTab === 'posts' ? 'linear-gradient(135deg, #64c8ff, #00ff88)' : 'rgba(20, 20, 50, 0.5)',
              border: activeTab === 'posts' ? 'none' : '1px solid rgba(100, 200, 255, 0.3)',
              color: activeTab === 'posts' ? '#0a0a19' : '#64c8ff',
              padding: '0.8rem 1.5rem',
              borderRadius: '50px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              fontWeight: activeTab === 'posts' ? '700' : '500'
            }}
            onMouseEnter={e => {
              if (activeTab !== 'posts') {
                e.target.style.background = 'rgba(20, 20, 50, 0.7)';
              }
            }}
            onMouseLeave={e => {
              if (activeTab !== 'posts') {
                e.target.style.background = 'rgba(20, 20, 50, 0.5)';
              }
            }}
          >
            📱 Feed
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            style={{
              background: activeTab === 'profile' ? 'linear-gradient(135deg, #a76eff, #64c8ff)' : 'rgba(20, 20, 50, 0.5)',
              border: activeTab === 'profile' ? 'none' : '1px solid rgba(100, 200, 255, 0.3)',
              color: activeTab === 'profile' ? '#fff' : '#64c8ff',
              padding: '0.8rem 1.5rem',
              borderRadius: '50px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              fontWeight: activeTab === 'profile' ? '700' : '500'
            }}
            onMouseEnter={e => {
              if (activeTab !== 'profile') {
                e.target.style.background = 'rgba(20, 20, 50, 0.7)';
              }
            }}
            onMouseLeave={e => {
              if (activeTab !== 'profile') {
                e.target.style.background = 'rgba(20, 20, 50, 0.5)';
              }
            }}
          >
            👤 Profile
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            style={{
              background: activeTab === 'chat' ? 'linear-gradient(135deg, #00ff88, #00d4ff)' : 'rgba(20, 20, 50, 0.5)',
              border: activeTab === 'chat' ? 'none' : '1px solid rgba(100, 200, 255, 0.3)',
              color: activeTab === 'chat' ? '#000' : '#64c8ff',
              padding: '0.8rem 1.5rem',
              borderRadius: '50px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              fontWeight: activeTab === 'chat' ? '700' : '500'
            }}
            onMouseEnter={e => {
              if (activeTab !== 'chat') {
                e.target.style.background = 'rgba(20, 20, 50, 0.7)';
              }
            }}
            onMouseLeave={e => {
              if (activeTab !== 'chat') {
                e.target.style.background = 'rgba(20, 20, 50, 0.5)';
              }
            }}
          >
            💬 Messages
          </button>
        </div>

        {/* TAB CONTENT */}
        <div style={{ background: 'rgba(20, 20, 50, 0.3)', borderRadius: '15px', border: '1px solid rgba(100, 200, 255, 0.1)', padding: '2rem' }}>
          {activeTab === 'posts' && (
            <div>
              <h2 style={{ marginBottom: '1.5rem', color: '#64c8ff' }}>📱 Feed</h2>
              <PostsTab user={user} userProfile={userProfile} />
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h2 style={{ marginBottom: '1.5rem', color: '#a76eff' }}>👤 Your Profile</h2>
              <ProfileTab user={user} userProfile={userProfile} onProfileUpdate={setUserProfile} />
            </div>
          )}

          {activeTab === 'chat' && (
            <div>
              <h2 style={{ marginBottom: '1.5rem', color: '#00ff88' }}>💬 Messages</h2>
              <ChatTab user={user} userProfile={userProfile} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
