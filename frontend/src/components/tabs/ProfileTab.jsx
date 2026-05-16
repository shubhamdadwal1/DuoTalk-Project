import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import '../tabs/ProfileTab.css';
import { profileAPI } from '../../services/api';

export default function ProfileTab({ user, userProfile, onProfileUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    displayName: userProfile?.displayName || '',
    bio: userProfile?.bio || '',
    location: userProfile?.location || '',
    phone: userProfile?.phone || '',
  });

  useEffect(() => {
    setProfile({
      displayName: userProfile?.displayName || userProfile?.name || user?.displayName || '',
      bio: userProfile?.bio || '',
      location: userProfile?.location || '',
      phone: userProfile?.phone || '',
    });
  }, [userProfile, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!profile.displayName.trim()) {
      toast.warning('Display name is required!', { position: 'top-right' });
      return;
    }

    try {
      const updatedProfile = await profileAPI.updateProfile(user.uid, {
        displayName: profile.displayName,
        bio: profile.bio,
        location: profile.location,
        phone: profile.phone,
      });
      onProfileUpdate?.(updatedProfile);
      setIsEditing(false);
      toast.success('Profile updated successfully!', { position: 'top-right' });
    } catch (err) {
      toast.error(`Could not update profile: ${err.message}`, { position: 'top-right' });
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* Profile Header */}
      <div style={{ background: 'rgba(30, 30, 60, 0.5)', borderRadius: '15px', border: '1px solid rgba(100, 200, 255, 0.2)', padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
        {user?.photoURL && (
          <img 
            src={user.photoURL} 
            alt={user.displayName} 
            style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem', border: '3px solid #64c8ff' }}
          />
        )}
        <h2 style={{ color: '#64c8ff', marginBottom: '0.5rem', fontSize: '1.8rem' }}>{profile.displayName}</h2>
        <p style={{ color: '#a0a0d0', marginBottom: '1rem' }}>{user?.email}</p>
        <button
          onClick={() => setIsEditing(!isEditing)}
          style={{
            background: isEditing ? 'linear-gradient(135deg, #ff6b6b, #ff8787)' : 'linear-gradient(135deg, #64c8ff, #00ff88)',
            border: 'none',
            color: isEditing ? '#fff' : '#0a0a19',
            padding: '0.7rem 1.5rem',
            borderRadius: '50px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
          onMouseEnter={e => e.target.style.opacity = '0.9'}
          onMouseLeave={e => e.target.style.opacity = '1'}
        >
          {isEditing ? '❌ Cancel' : '✏️ Edit Profile'}
        </button>
      </div>

      {/* Profile Form */}
      <div style={{ background: 'rgba(30, 30, 60, 0.5)', borderRadius: '15px', border: '1px solid rgba(100, 200, 255, 0.2)', padding: '2rem' }}>
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', color: '#64c8ff', marginBottom: '0.5rem', fontWeight: '600' }}>Display Name *</label>
              <input
                type="text"
                name="displayName"
                value={profile.displayName}
                onChange={handleChange}
                style={{
                  width: '100%',
                  background: 'rgba(10, 10, 25, 0.5)',
                  border: '1px solid rgba(100, 200, 255, 0.2)',
                  color: '#fff',
                  padding: '0.8rem 1rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#64c8ff', marginBottom: '0.5rem', fontWeight: '600' }}>Bio</label>
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                style={{
                  width: '100%',
                  background: 'rgba(10, 10, 25, 0.5)',
                  border: '1px solid rgba(100, 200, 255, 0.2)',
                  color: '#fff',
                  padding: '0.8rem 1rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  minHeight: '100px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#64c8ff', marginBottom: '0.5rem', fontWeight: '600' }}>Location</label>
              <input
                type="text"
                name="location"
                value={profile.location}
                onChange={handleChange}
                placeholder="City, Country"
                style={{
                  width: '100%',
                  background: 'rgba(10, 10, 25, 0.5)',
                  border: '1px solid rgba(100, 200, 255, 0.2)',
                  color: '#fff',
                  padding: '0.8rem 1rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#64c8ff', marginBottom: '0.5rem', fontWeight: '600' }}>Phone (Optional)</label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                style={{
                  width: '100%',
                  background: 'rgba(10, 10, 25, 0.5)',
                  border: '1px solid rgba(100, 200, 255, 0.2)',
                  color: '#fff',
                  padding: '0.8rem 1rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={handleSave}
                style={{
                  background: 'linear-gradient(135deg, #00ff88, #64c8ff)',
                  border: 'none',
                  color: '#0a0a19',
                  padding: '0.8rem 1.8rem',
                  borderRadius: '50px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
                onMouseEnter={e => e.target.style.opacity = '0.9'}
                onMouseLeave={e => e.target.style.opacity = '1'}
              >
                💾 Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ color: '#a0a0d0', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Display Name</div>
              <div style={{ color: '#e0e0e0', fontSize: '1.1rem' }}>{profile.displayName}</div>
            </div>

            {profile.bio && (
              <div>
                <div style={{ color: '#a0a0d0', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Bio</div>
                <div style={{ color: '#e0e0e0', fontSize: '1rem', lineHeight: '1.5' }}>{profile.bio}</div>
              </div>
            )}

            {profile.location && (
              <div>
                <div style={{ color: '#a0a0d0', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Location</div>
                <div style={{ color: '#e0e0e0', fontSize: '1rem' }}>📍 {profile.location}</div>
              </div>
            )}

            {profile.phone && (
              <div>
                <div style={{ color: '#a0a0d0', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Phone</div>
                <div style={{ color: '#e0e0e0', fontSize: '1rem' }}>📱 {profile.phone}</div>
              </div>
            )}

            <div style={{ borderTop: '1px solid rgba(100, 200, 255, 0.1)', paddingTop: '1rem', marginTop: '1rem' }}>
              <div style={{ color: '#a0a0d0', fontSize: '0.85rem' }}>
                Email verified: ✅ {user?.email}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
