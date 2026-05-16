import { useState, useRef, useEffect } from 'react'
import { FaFacebook, FaGoogle, FaPhone, FaSpinner } from 'react-icons/fa'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './App.css'
import Navbar from './components/Navbar'
import BlogSection from './components/BlogSection'
import Blogs from './components/Blogs'
import ProfilePage from './components/profile/ProfilePage'
import { useAuth } from './context/AuthContext'
import { joinSocketUser } from './services/socketIO'

function App() {
  const { user, logout, loading, signInWithGoogle, signInWithFacebook, signInWithEmail, signUpWithEmail, sendPhoneOTP, verifyPhoneOTP, error } = useAuth()
  const normalizePath = (path) => {
    if (!path || path === '/index.html') return '/'
    return path
  }

  const getCurrentRoute = () => {
    const hashRoute = window.location.hash.replace(/^#/, '')
    if (hashRoute) return normalizePath(hashRoute)
    return normalizePath(window.location.pathname)
  }

  const [currentPath, setCurrentPath] = useState(getCurrentRoute())
  const [hoveredCard, setHoveredCard] = useState(null)
  const [selectedInterests, setSelectedInterests] = useState(['Gaming', 'Music'])
  const [activeModal, setActiveModal] = useState(null)
  const [scrollVisibility, setScrollVisibility] = useState({ 
    features: { left: false, right: true }, 
    testimonials: { left: false, right: true }, 
    blogs: { left: false, right: true }, 
    experiences: { left: false, right: true } 
  })
  const featuresScrollRef = useRef(null)
  const testimonialsScrollRef = useRef(null)
  const blogsScrollRef = useRef(null)
  const experiencesScrollRef = useRef(null)

  const toggleInterest = (interest) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const handleScroll = (ref, sectionName) => {
    if (ref.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ref.current
      const canScrollLeft = scrollLeft > 0
      const canScrollRight = scrollLeft + clientWidth < scrollWidth - 10
      setScrollVisibility(prev => ({
        ...prev,
        [sectionName]: { left: canScrollLeft, right: canScrollRight }
      }))
    }
  }

  const scroll = (ref, direction, sectionName) => {
    if (ref.current) {
      const scrollAmount = 400
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
      setTimeout(() => handleScroll(ref, sectionName), 300)
    }
  }

  useEffect(() => {
    handleScroll(featuresScrollRef, 'features')
    handleScroll(testimonialsScrollRef, 'testimonials')
    handleScroll(blogsScrollRef, 'blogs')
    handleScroll(experiencesScrollRef, 'experiences')
  }, [])

  useEffect(() => {
    const syncPath = () => setCurrentPath(getCurrentRoute())
    window.addEventListener('popstate', syncPath)
    window.addEventListener('hashchange', syncPath)
    return () => {
      window.removeEventListener('popstate', syncPath)
      window.removeEventListener('hashchange', syncPath)
    }
  }, [])

  // Initialize socket when user is authenticated
  useEffect(() => {
    if (!user?.uid) return;

    joinSocketUser(user.uid).catch((error) => {
      console.error('Could not join socket room:', error?.message || error);
    });
  }, [user?.uid]);

  const navigateTo = (path) => {
    const nextPath = normalizePath(path)
    window.location.hash = nextPath === '/' ? '/' : nextPath
    setCurrentPath(nextPath)
  }

  const interests = ['Gaming', 'Music', 'Tech', 'Anime', 'Sports', 'Movies', 'Travel', 'Photography', 'Art', 'Fitness', 'Cooking', 'Books']

  if (loading) {
    return (
      <div className="App">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a19', color: '#fff', fontSize: '1.5rem' }}>
          Loading DuoTalk...
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <ProfilePage
        firebaseUser={user}
        onLogout={async () => {
          await logout()
          navigateTo('/')
        }}
      />
    )
  }

  if (currentPath === '/login') {
    return (
      <div className="App">
        <LoginPage
          signInWithEmail={signInWithEmail}
          signUpWithEmail={signUpWithEmail}
          signInWithGoogle={signInWithGoogle}
          signInWithFacebook={signInWithFacebook}
          sendPhoneOTP={sendPhoneOTP}
          verifyPhoneOTP={verifyPhoneOTP}
          error={error}
          onBackHome={() => navigateTo('/')}
          onSuccess={() => navigateTo('/profile')}
        />
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </div>
    )
  }

  return (
    <div className="App">
      <div>
      {/* ===== NAVBAR ===== */}
      <nav style={{ background: 'linear-gradient(135deg, rgba(10, 10, 25, 0.95), rgba(20, 10, 40, 0.95))', borderBottom: '1px solid rgba(100, 200, 255, 0.1)', padding: '1rem 2rem', position: 'fixed', width: '100%', top: 0, zIndex: 1000, backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.8rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #64c8ff, #a76eff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            <img src="/duotalk-logo.svg" alt="DuoTalk" style={{ height: '2rem', width: 'auto', display: 'block' }} />
            <span>DuoTalk</span>
          </div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', overflowX: 'auto' }}>
            <button onClick={() => setActiveModal('features')} style={{ background: 'none', border: 'none', color: '#e0e0e0', textDecoration: 'none', transition: 'color 0.3s', whiteSpace: 'nowrap', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' }} onMouseEnter={e => e.target.style.color = '#64c8ff'} onMouseLeave={e => e.target.style.color = '#e0e0e0'}>Features</button>
            <button onClick={() => setActiveModal('stats')} style={{ background: 'none', border: 'none', color: '#e0e0e0', textDecoration: 'none', transition: 'color 0.3s', whiteSpace: 'nowrap', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' }} onMouseEnter={e => e.target.style.color = '#64c8ff'} onMouseLeave={e => e.target.style.color = '#e0e0e0'}>Stats</button>
            <button onClick={() => setActiveModal('interests')} style={{ background: 'none', border: 'none', color: '#e0e0e0', textDecoration: 'none', transition: 'color 0.3s', whiteSpace: 'nowrap', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' }} onMouseEnter={e => e.target.style.color = '#64c8ff'} onMouseLeave={e => e.target.style.color = '#e0e0e0'}>Interests</button>
            <button onClick={() => setActiveModal('blogs')} style={{ background: 'none', border: 'none', color: '#e0e0e0', textDecoration: 'none', transition: 'color 0.3s', whiteSpace: 'nowrap', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' }} onMouseEnter={e => e.target.style.color = '#64c8ff'} onMouseLeave={e => e.target.style.color = '#e0e0e0'}>Blogs</button>
            <button onClick={() => setActiveModal('reviews')} style={{ background: 'none', border: 'none', color: '#e0e0e0', textDecoration: 'none', transition: 'color 0.3s', whiteSpace: 'nowrap', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' }} onMouseEnter={e => e.target.style.color = '#64c8ff'} onMouseLeave={e => e.target.style.color = '#e0e0e0'}>Reviews</button>
            
            {/* User Profile / Login */}
            {!loading && (
              user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {user.photoURL && (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #64c8ff', cursor: 'pointer' }}
                      title={user.displayName || user.email}
                    />
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.9rem' }}>
                    <span style={{ color: '#64c8ff', fontWeight: '600' }}>{user.displayName || 'User'}</span>
                    <span style={{ color: '#a0a0d0', fontSize: '0.8rem' }}>{user.email}</span>
                  </div>
                  <button 
                    onClick={() => logout()}
                    style={{ background: 'linear-gradient(135deg, #ff6b6b, #ff8787)', border: 'none', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '50px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                    onMouseEnter={e => e.target.style.opacity = '0.9'}
                    onMouseLeave={e => e.target.style.opacity = '1'}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button onClick={() => navigateTo('/login')} style={{ background: 'linear-gradient(135deg, #64c8ff, #00ff88)', border: 'none', color: '#0a0a19', padding: '0.7rem 1.5rem', borderRadius: '50px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 0 20px rgba(100, 200, 255, 0.3)', whiteSpace: 'nowrap' }}>Login</button>
              )
            )}
          </div>
        </div>
      </nav>

      <main style={{ background: '#0a0a19', color: '#fff' }}>
        {/* ===== HERO SECTION ===== */}
        <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', paddingTop: '100px', background: 'linear-gradient(135deg, #0a0a19 0%, #1a0a3b 25%, #0f1a3b 50%, #0a2b3b 75%, #0a0a19 100%)', position: 'relative', overflow: 'hidden' }}>
          {/* Animated Background */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 50%, rgba(100, 200, 255, 0.1), transparent), radial-gradient(circle at 80% 80%, rgba(167, 110, 255, 0.1), transparent)', animation: 'drift 15s ease-in-out infinite' }}></div>

          <div style={{ position: 'relative', zIndex: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', maxWidth: '1400px', width: '100%', alignItems: 'center' }}>
            {/* Left Content */}
            <div>
              <h1 style={{ fontSize: '4.5rem', fontWeight: '800', marginBottom: '1rem', background: 'linear-gradient(135deg, #ffffff, #64c8ff, #a76eff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'slideUp 1s ease-out' }}>
                Talk Smarter, <br /> Connect Deeper
              </h1>
              <p style={{ fontSize: '1.3rem', color: '#b0b0e0', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                Experience the future of meaningful connections. AI-powered matching meets beautiful video conversations.
              </p>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => navigateTo('/login')} style={{ background: 'linear-gradient(135deg, #64c8ff, #00ff88)', border: 'none', color: '#0a0a19', padding: '1rem 2rem', borderRadius: '50px', fontWeight: '600', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 0 30px rgba(100, 200, 255, 0.4)', transition: 'all 0.3s', transform: 'translateY(-3px) scale(1)' }} onMouseEnter={e => e.target.style.transform = 'translateY(-5px) scale(1.05)'} onMouseLeave={e => e.target.style.transform = 'translateY(-3px) scale(1)'}>
                  🚀 Start Chatting
                </button>
                <button onClick={() => navigateTo('/login')} style={{ background: 'rgba(255, 255, 255, 0.1)', border: '2px solid rgba(100, 200, 255, 0.5)', color: '#64c8ff', padding: '1rem 2rem', borderRadius: '50px', fontWeight: '600', cursor: 'pointer', fontSize: '1rem', backdropFilter: 'blur(10px)' }}>
                  📹 Video Chat
                </button>
              </div>
            </div>

            {/* Right 3D Visual */}
            <div style={{ position: 'relative', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* 3D Card Stack */}
              <div style={{ position: 'absolute', width: '300px', height: '350px', background: 'linear-gradient(135deg, rgba(100, 200, 255, 0.1), rgba(167, 110, 255, 0.1))', border: '2px solid rgba(100, 200, 255, 0.3)', borderRadius: '20px', backdropFilter: 'blur(20px)', padding: '2rem', transform: 'translateZ(100px) rotateY(10deg) rotateX(5deg)', boxShadow: '0 20px 60px rgba(100, 200, 255, 0.3)', animation: 'float 6s ease-in-out infinite' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍👩‍👧‍👦</div>
                <h3 style={{ color: '#64c8ff', marginBottom: '0.5rem' }}>Connect Now</h3>
                <p style={{ color: '#a0a0d0', fontSize: '0.9rem' }}>Meet amazing people worldwide</p>
              </div>
              <div style={{ position: 'absolute', width: '300px', height: '350px', background: 'linear-gradient(135deg, rgba(167, 110, 255, 0.1), rgba(0, 255, 136, 0.1))', border: '2px solid rgba(167, 110, 255, 0.3)', borderRadius: '20px', backdropFilter: 'blur(20px)', padding: '2rem', transform: 'translateZ(50px) rotateY(-5deg) rotateX(-3deg) translateX(50px) translateY(-30px)', boxShadow: '0 20px 60px rgba(167, 110, 255, 0.2)', animation: 'float 7s ease-in-out infinite' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                <h3 style={{ color: '#a76eff', marginBottom: '0.5rem' }}>Real Chats</h3>
                <p style={{ color: '#a0a0d0', fontSize: '0.9rem' }}>Instant messaging & HD video</p>
              </div>
              <div style={{ position: 'absolute', width: '300px', height: '350px', background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(255, 0, 110, 0.1))', border: '2px solid rgba(0, 255, 136, 0.3)', borderRadius: '20px', backdropFilter: 'blur(20px)', padding: '2rem', transform: 'translateZ(0) rotateY(0deg) rotateX(0deg) translateX(100px)', boxShadow: '0 20px 60px rgba(0, 255, 136, 0.2)', animation: 'float 5s ease-in-out infinite, shimmer 3s ease-in-out infinite', perspective: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '160px', borderRadius: '15px', overflow: 'hidden', marginBottom: '1rem', transform: 'rotateY(-5deg) rotateX(10deg)', boxShadow: '0 15px 40px rgba(0, 255, 136, 0.4)', animation: 'rotateCard 4s ease-in-out infinite', transition: 'all 0.3s ease' }}>
                  <img src="/gemini-match.png" alt="Smart Match" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h3 style={{ color: '#00ff88', marginBottom: '0.5rem', fontSize: '1.3rem' }}>Smart Match</h3>
                <p style={{ color: '#a0a0d0', fontSize: '0.85rem', textAlign: 'center' }}>AI finds your perfect match</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== STATS SECTION ===== */}
        <section id="stats" style={{ padding: '5rem 2rem', background: 'linear-gradient(135deg, rgba(26, 10, 59, 0.8), rgba(10, 43, 59, 0.8))', borderTop: '1px solid rgba(100, 200, 255, 0.1)', borderBottom: '1px solid rgba(100, 200, 255, 0.1)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
              {[
                { value: '2.5M+', label: 'Active Users', icon: '👥' },
                { value: '50M+', label: 'Conversations', icon: '💬' },
                { value: '95%', label: 'Video Quality', icon: '📹' },
                { value: '24/7', label: 'Safe & Secure', icon: '🔒' },
              ].map((stat, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '2rem', background: 'rgba(20, 20, 50, 0.3)', borderRadius: '15px', border: '1px solid rgba(100, 200, 255, 0.2)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{stat.icon}</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #64c8ff, #a76eff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '0.5rem' }}>
                    {stat.value}
                  </div>
                  <div style={{ color: '#a0a0d0' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FEATURES SECTION ===== */}
        <section id="features" style={{ padding: '5rem 2rem', background: 'linear-gradient(135deg, #0a0a19 0%, #1a0a3b 50%, #0a0a19 100%)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.8rem', textAlign: 'center', marginBottom: '3rem', background: 'linear-gradient(135deg, #ffffff, #64c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Powerful Features
            </h2>
            
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <button onClick={() => scroll(featuresScrollRef, 'left', 'features')} style={{ background: 'linear-gradient(135deg, #64c8ff, #a76eff)', border: 'none', color: '#0a0a19', width: '60px', height: '60px', borderRadius: '50%', fontSize: '1.8rem', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 0 30px rgba(100, 200, 255, 0.6), inset 0 0 20px rgba(255,255,255,0.2)', transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)', flexShrink: 0, opacity: 0, visibility: 'hidden', position: 'sticky', left: 0, zIndex: 100 }} onMouseEnter={e => { e.target.style.transform = 'rotateY(5deg) scale(1.15) rotateX(-10deg)'; e.target.style.boxShadow = '0 0 50px rgba(100, 200, 255, 0.9), inset 0 0 30px rgba(255,255,255,0.3)'; }} onMouseLeave={e => { e.target.style.transform = 'rotateY(0deg) scale(1)'; e.target.style.boxShadow = '0 0 30px rgba(100, 200, 255, 0.6), inset 0 0 20px rgba(255,255,255,0.2)'; }}>
                <span>◀</span>
              </button>

              <div ref={featuresScrollRef} style={{ display: 'flex', gap: '2.5rem', overflowX: 'auto', paddingBottom: '2rem', scrollBehavior: 'smooth', flex: 1, scrollbarWidth: 'none', msOverflowStyle: 'none' }} onScroll={() => handleScroll(featuresScrollRef, 'features')}>
                {[
                  { icon: '🤖', title: 'Smart Matching AI', desc: 'Algorithm-driven matching based on interests, personality & values', image: '🧠' },
                  { icon: '📹', title: 'HD Video Chat', desc: 'Crystal clear 1080p+ video with adaptive bitrate streaming', image: '📺' },
                  { icon: '🎯', title: 'Interest Filters', desc: 'Find people who match your exact interests and hobbies', image: '🎪' },
                  { icon: '👥', title: 'Friends & History', desc: 'Save favorite conversations and reconnect anytime', image: '📚' },
                  { icon: '🔒', title: 'Safety First', desc: '24/7 AI moderation + verification for safe connections', image: '🛡️' },
                  { icon: '🎁', title: 'Rich Features', desc: 'Share GIFs, voice messages, media and more', image: '🎨' },
                ].map((feature, i) => (
                  <div key={i} style={{ background: 'linear-gradient(135deg, rgba(20, 20, 50, 0.6), rgba(30, 10, 60, 0.6))', backdropFilter: 'blur(20px)', border: '1px solid rgba(100, 200, 255, 0.2)', borderRadius: '20px', padding: '3rem 2.5rem', cursor: 'pointer', transition: 'all 0.4s ease', transform: hoveredCard === i ? 'translateY(-15px) scale(1.05)' : 'translateY(0) scale(1)', boxShadow: hoveredCard === i ? '0 30px 60px rgba(100, 200, 255, 0.3)' : '0 10px 30px rgba(0, 0, 0, 0.3)', minWidth: '380px', flexShrink: 0, textAlign: 'center', onMouseEnter: () => setHoveredCard(i), onMouseLeave: () => setHoveredCard(null) }}>
                    <div style={{ fontSize: '5rem', marginBottom: '1rem', opacity: 0.9 }}>{feature.image}</div>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{feature.icon}</div>
                    <h3 style={{ color: '#fff', marginBottom: '0.8rem', fontSize: '1.4rem', fontWeight: '700' }}>{feature.title}</h3>
                    <p style={{ color: '#a0a0d0', lineHeight: '1.6', fontSize: '0.95rem' }}>{feature.desc}</p>
                  </div>
                ))}
              </div>

              <button onClick={() => scroll(featuresScrollRef, 'right', 'features')} style={{ background: 'linear-gradient(135deg, #a76eff, #64c8ff)', border: 'none', color: '#0a0a19', width: '60px', height: '60px', borderRadius: '50%', fontSize: '1.8rem', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 0 30px rgba(167, 110, 255, 0.6), inset 0 0 20px rgba(255,255,255,0.2)', transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)', flexShrink: 0, opacity: 0, visibility: 'hidden', position: 'sticky', right: 0, zIndex: 100 }} onMouseEnter={e => { e.target.style.transform = 'rotateY(-5deg) scale(1.15) rotateX(-10deg)'; e.target.style.boxShadow = '0 0 50px rgba(167, 110, 255, 0.9), inset 0 0 30px rgba(255,255,255,0.3)'; }} onMouseLeave={e => { e.target.style.transform = 'rotateY(0deg) scale(1)'; e.target.style.boxShadow = '0 0 30px rgba(167, 110, 255, 0.6), inset 0 0 20px rgba(255,255,255,0.2)'; }}><span>▶</span></button>
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section style={{ padding: '5rem 2rem', background: 'linear-gradient(135deg, #0f1a3b 0%, #0a2b3b 100%)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.8rem', textAlign: 'center', marginBottom: '1rem', background: 'linear-gradient(135deg, #ffffff, #64c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              How It Works
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
              {[
                { step: '1', title: 'Create Profile', desc: 'Sign up with your interests and preferences', icon: '📝' },
                { step: '2', title: 'Get Matched', desc: 'Our AI finds compatible people for you', icon: '🎯' },
                { step: '3', title: 'Start Chat', desc: 'Instantly connect via text or video', icon: '💬' },
                { step: '4', title: 'Build Friendships', desc: 'Save conversations and stay connected', icon: '🤝' },
              ].map((item, i) => (
                <div key={i} style={{ position: 'relative', padding: '2.5rem', background: 'rgba(20, 20, 50, 0.4)', border: '2px solid rgba(100, 200, 255, 0.2)', borderRadius: '15px', transition: 'all 0.3s ease', cursor: 'pointer' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{item.icon}</div>
                  <div style={{ position: 'absolute', top: '20px', right: '20px', width: '50px', height: '50px', background: 'linear-gradient(135deg, #64c8ff, #a76eff)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a19', fontWeight: 'bold', fontSize: '1.5rem' }}>
                    {item.step}
                  </div>
                  <h3 style={{ color: '#fff', marginBottom: '0.8rem', fontSize: '1.2rem' }}>{item.title}</h3>
                  <p style={{ color: '#a0a0d0' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== INTEREST MATCHING ===== */}
        <section id="interests" style={{ padding: '5rem 2rem', background: 'linear-gradient(135deg, #1a0a3b 0%, #0a0a19 50%, #0f1a3b 100%)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.8rem', textAlign: 'center', marginBottom: '1rem', background: 'linear-gradient(135deg, #ffffff, #64c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Find Your Vibe
            </h2>
            <p style={{ textAlign: 'center', color: '#a0a0d0', marginBottom: '3rem', fontSize: '1.1rem' }}>Select interests to discover your perfect matches</p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
              {interests.map((interest) => (
                <button key={interest} onClick={() => toggleInterest(interest)} style={{ background: selectedInterests.includes(interest) ? 'linear-gradient(135deg, #64c8ff, #a76eff)' : 'linear-gradient(135deg, rgba(20, 20, 50, 0.4), rgba(30, 10, 60, 0.4))', border: selectedInterests.includes(interest) ? 'none' : '2px solid rgba(100, 200, 255, 0.3)', color: selectedInterests.includes(interest) ? '#0a0a19' : '#d0d0e0', padding: '0.8rem 1.5rem', borderRadius: '50px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.3s ease', transform: 'scale(1)' }} onMouseEnter={e => e.target.style.transform = 'scale(1.05)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'}>
                  {interest}{selectedInterests.includes(interest) && ' ✓'}
                </button>
              ))}
            </div>

            <div style={{ textAlign: 'center', padding: '2rem', background: 'linear-gradient(135deg, rgba(100, 200, 255, 0.05), rgba(167, 110, 255, 0.05))', border: '1px solid rgba(100, 200, 255, 0.2)', borderRadius: '20px', backdropFilter: 'blur(10px)' }}>
              <p style={{ color: '#b0b0e0', marginBottom: '1rem', fontSize: '1.1rem' }}>
                Selected: <span style={{ background: 'linear-gradient(135deg, #64c8ff, #a76eff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 'bold' }}>{selectedInterests.length} interests</span>
              </p>
              <button onClick={() => navigateTo('/login')} style={{ background: 'linear-gradient(135deg, #00ff88, #64c8ff)', border: 'none', color: '#0a0a19', padding: '0.9rem 2.5rem', borderRadius: '50px', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 0 20px rgba(100, 200, 255, 0.3)' }}>
                Find Matches Now 🔍
              </button>
            </div>
          </div>
        </section>

        {/* ===== TESTIMONIALS ===== */}
        <section style={{ padding: '5rem 2rem', background: 'linear-gradient(135deg, #0a0a19 0%, #1a0a3b 50%, #0a0a19 100%)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.8rem', textAlign: 'center', marginBottom: '3rem', background: 'linear-gradient(135deg, #ffffff, #64c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              What People Say
            </h2>
            
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <button onClick={() => scroll(testimonialsScrollRef, 'left', 'testimonials')} style={{ background: 'linear-gradient(135deg, #64c8ff, #a76eff)', border: 'none', color: '#0a0a19', width: '60px', height: '60px', borderRadius: '50%', fontSize: '1.8rem', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 0 30px rgba(100, 200, 255, 0.6), inset 0 0 20px rgba(255,255,255,0.2)', transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)', flexShrink: 0, opacity: 0, visibility: 'hidden', position: 'sticky', left: 0, zIndex: 100 }} onMouseEnter={e => { e.target.style.transform = 'rotateY(5deg) scale(1.15) rotateX(-10deg)'; e.target.style.boxShadow = '0 0 50px rgba(100, 200, 255, 0.9), inset 0 0 30px rgba(255,255,255,0.3)'; }} onMouseLeave={e => { e.target.style.transform = 'rotateY(0deg) scale(1)'; e.target.style.boxShadow = '0 0 30px rgba(100, 200, 255, 0.6), inset 0 0 20px rgba(255,255,255,0.2)'; }}><span>◀</span></button>

              <div ref={testimonialsScrollRef} style={{ display: 'flex', gap: '2rem', overflowX: 'auto', paddingBottom: '1rem', scrollBehavior: 'smooth', flex: 1, scrollbarWidth: 'none', msOverflowStyle: 'none' }} onScroll={() => handleScroll(testimonialsScrollRef, 'testimonials')}>
                {[
                  { avatar: '👨‍🎨', name: 'Shubham Dadwal', role: 'Designer', quote: 'Found amazing people to talk to! The AI matching is incredible.', rating: 5, views: '2.5k views' },
                  { avatar: '👨‍💻', name: 'Mayank Sharma', role: 'Developer', quote: 'The video quality is perfect and the platform is so intuitive.', rating: 5, views: '1.8k views' },
                  { avatar: '👨‍🚀', name: 'Arsh Dadwal', role: 'Creator', quote: 'Made so many friends from around the world. Highly recommend!', rating: 5, views: '3.2k views' },
                  { avatar: '👨‍🎸', name: 'Alex', role: 'Musician', quote: 'Love sharing music and connecting with other musicians here.', rating: 5, views: '1.5k views' },
                  { avatar: '👩‍🎓', name: 'Lisa', role: 'Student', quote: 'DuoTalk made finding like-minded people so easy and fun!', rating: 5, views: '2.1k views' },
                  { avatar: '👨‍🏫', name: 'Mark', role: 'Teacher', quote: 'Great platform for meeting people with shared interests.', rating: 5, views: '1.9k views' },
                ].map((testimonial, i) => (
                  <div key={i} style={{ background: 'linear-gradient(135deg, rgba(20, 20, 50, 0.5), rgba(30, 10, 60, 0.5))', border: '1px solid rgba(100, 200, 255, 0.2)', borderRadius: '20px', padding: '2rem', backdropFilter: 'blur(20px)', transition: 'all 0.3s ease', cursor: 'pointer', minWidth: '300px', flexShrink: 0 }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(100, 200, 255, 0.2)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '2.5rem', width: '50px', height: '50px', background: 'linear-gradient(135deg, rgba(100, 200, 255, 0.2), rgba(167, 110, 255, 0.2))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {testimonial.avatar}
                      </div>
                      <div>
                        <h4 style={{ color: '#fff', margin: 0 }}>{testimonial.name}</h4>
                        <p style={{ color: '#64c8ff', margin: 0, fontSize: '0.9rem' }}>{testimonial.role}</p>
                      </div>
                    </div>
                    <p style={{ color: '#d0d0e0', fontStyle: 'italic', margin: 0 }}>"{testimonial.quote}"</p>
                    <div style={{ display: 'flex', gap: '0.3rem', marginTop: '1rem', marginBottom: '0.8rem' }}>
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <span key={j} style={{ color: '#ffa500', fontSize: '1.2rem' }}>★</span>
                      ))}
                    </div>
                    <p style={{ color: '#707090', fontSize: '0.85rem', margin: 0 }}>👁️ {testimonial.views}</p>
                  </div>
                ))}
              </div>

              <button onClick={() => scroll(testimonialsScrollRef, 'right', 'testimonials')} style={{ background: 'linear-gradient(135deg, #a76eff, #64c8ff)', border: 'none', color: '#0a0a19', width: '60px', height: '60px', borderRadius: '50%', fontSize: '1.8rem', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 0 30px rgba(167, 110, 255, 0.6), inset 0 0 20px rgba(255,255,255,0.2)', transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)', flexShrink: 0, opacity: 0, visibility: 'hidden', position: 'sticky', right: 0, zIndex: 100 }} onMouseEnter={e => { e.target.style.transform = 'rotateY(-5deg) scale(1.15) rotateX(-10deg)'; e.target.style.boxShadow = '0 0 50px rgba(167, 110, 255, 0.9), inset 0 0 30px rgba(255,255,255,0.3)'; }} onMouseLeave={e => { e.target.style.transform = 'rotateY(0deg) scale(1)'; e.target.style.boxShadow = '0 0 30px rgba(167, 110, 255, 0.6), inset 0 0 20px rgba(255,255,255,0.2)'; }}><span>▶</span></button>
            </div>
          </div>
        </section>

        <section id="blogs" style={{ padding: '5rem 2rem', background: 'linear-gradient(135deg, #1a0a3b 0%, #0a2b3b 50%, #1a0a3b 100%)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <BlogSection
              onViewAllBlogs={() => setActiveModal('blogs')}
              currentUserFirebaseUID={user?.uid}
            />
          </div>
        </section>

        {/* ===== BLOGS SECTION ===== */}
        <section style={{ display: 'none', padding: '5rem 2rem', background: 'linear-gradient(135deg, #1a0a3b 0%, #0a2b3b 50%, #1a0a3b 100%)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.8rem', textAlign: 'center', marginBottom: '3rem', background: 'linear-gradient(135deg, #ffffff, #00ff88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Latest Blog Posts
            </h2>
            
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <button onClick={() => scroll(blogsScrollRef, 'left', 'blogs')} style={{ background: 'linear-gradient(135deg, #64c8ff, #a76eff)', border: 'none', color: '#0a0a19', width: '60px', height: '60px', borderRadius: '50%', fontSize: '1.8rem', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 0 30px rgba(100, 200, 255, 0.6), inset 0 0 20px rgba(255,255,255,0.2)', transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)', flexShrink: 0, opacity: 0, visibility: 'hidden', position: 'sticky', left: 0, zIndex: 100 }} onMouseEnter={e => { e.target.style.transform = 'rotateY(5deg) scale(1.15) rotateX(-10deg)'; e.target.style.boxShadow = '0 0 50px rgba(100, 200, 255, 0.9), inset 0 0 30px rgba(255,255,255,0.3)'; }} onMouseLeave={e => { e.target.style.transform = 'rotateY(0deg) scale(1)'; e.target.style.boxShadow = '0 0 30px rgba(100, 200, 255, 0.6), inset 0 0 20px rgba(255,255,255,0.2)'; }}><span>◀</span></button>

              <div ref={blogsScrollRef} style={{ display: 'flex', gap: '2rem', overflowX: 'auto', paddingBottom: '1rem', scrollBehavior: 'smooth', flex: 1, scrollbarWidth: 'none', msOverflowStyle: 'none' }} onScroll={() => handleScroll(blogsScrollRef, 'blogs')}>
              {[
                { icon: '💡', title: 'How to Start Meaningful Conversations', category: 'Tips', date: 'Apr 15, 2024', excerpt: 'Learn the best practices for initiating engaging conversations that lead to real connections...', color: '#64c8ff' },
                { icon: '🎯', title: 'Finding Your Niche on DuoTalk', category: 'Guide', date: 'Apr 12, 2024', excerpt: 'Discover how to use interest filters to find your perfect community and build lasting friendships...', color: '#a76eff' },
                { icon: '🚀', title: '5 Success Stories from Our Users', category: 'Stories', date: 'Apr 10, 2024', excerpt: 'Read inspiring stories of how our users met, connected, and changed their lives for the better...', color: '#00ff88' },
                { icon: '🛡️', title: 'Safety Guide: Protecting Your Privacy', category: 'Security', date: 'Apr 8, 2024', excerpt: 'Everything you need to know about staying safe while enjoying meaningful online connections...', color: '#ff6b9d' },
                { icon: '🎮', title: 'Gamer Communities on DuoTalk', category: 'Features', date: 'Apr 5, 2024', excerpt: 'Join thousands of gamers sharing their passion and finding teammates for epic gaming sessions...', color: '#00d4ff' },
                { icon: '🌍', title: 'Global Connections: Stories from Around the World', category: 'Culture', date: 'Apr 1, 2024', excerpt: 'Explore cross-cultural friendships and how language barriers are broken down through shared interests...', color: '#7fff00' },
              ].map((blog, i) => (
                <div key={i} style={{ background: 'linear-gradient(135deg, rgba(20, 20, 50, 0.6), rgba(30, 10, 60, 0.6))', border: '2px solid transparent', borderImage: `linear-gradient(135deg, ${blog.color}40, rgba(100, 200, 255, 0.2))`, borderRadius: '20px', padding: '2rem', cursor: 'pointer', transition: 'all 0.4s ease', transform: 'translateZ(0)', backdropFilter: 'blur(20px)', minWidth: '320px', flexShrink: 0 }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)'; e.currentTarget.style.boxShadow = `0 20px 60px ${blog.color}30`; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin3d 2s linear infinite, pulse 2s ease-in-out infinite', transformStyle: 'preserve-3d' }}>{blog.icon}</div>
                  <span style={{ background: blog.color, color: '#0a0a19', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-block', marginBottom: '0.8rem' }}>
                    {blog.category}
                  </span>
                  <h3 style={{ color: '#fff', marginBottom: '0.8rem', fontSize: '1.4rem', fontWeight: '700' }}>{blog.title}</h3>
                  <p style={{ color: '#a0a0d0', marginBottom: '1rem', lineHeight: '1.6' }}>{blog.excerpt}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(100, 200, 255, 0.1)' }}>
                    <p style={{ color: '#707090', fontSize: '0.85rem', margin: 0 }}>📅 {blog.date}</p>
                    <a href="#" style={{ color: blog.color, fontWeight: '600', textDecoration: 'none', cursor: 'pointer', transition: 'all 0.3s', fontSize: '0.9rem' }} onMouseEnter={e => e.target.style.transform = 'translateX(5px)'} onMouseLeave={e => e.target.style.transform = 'translateX(0)'}>
                      Read More →
                    </a>
                  </div>
                </div>
              ))}
              </div>

              <button onClick={() => scroll(blogsScrollRef, 'right', 'blogs')} style={{ background: 'linear-gradient(135deg, #a76eff, #64c8ff)', border: 'none', color: '#0a0a19', width: '60px', height: '60px', borderRadius: '50%', fontSize: '1.8rem', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 0 30px rgba(167, 110, 255, 0.6), inset 0 0 20px rgba(255,255,255,0.2)', transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)', flexShrink: 0, opacity: 0, visibility: 'hidden', position: 'sticky', right: 0, zIndex: 100 }} onMouseEnter={e => { e.target.style.transform = 'rotateY(-5deg) scale(1.15) rotateX(-10deg)'; e.target.style.boxShadow = '0 0 50px rgba(167, 110, 255, 0.9), inset 0 0 30px rgba(255,255,255,0.3)'; }} onMouseLeave={e => { e.target.style.transform = 'rotateY(0deg) scale(1)'; e.target.style.boxShadow = '0 0 30px rgba(167, 110, 255, 0.6), inset 0 0 20px rgba(255,255,255,0.2)'; }}><span>▶</span></button>
            </div>
          </div>
        </section>

        {/* ===== USER EXPERIENCES ===== */}
        <section id="reviews" style={{ padding: '5rem 2rem', background: 'linear-gradient(135deg, #0a0a19 0%, #1a0a2b 50%, #0a2b3b 100%)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.8rem', textAlign: 'center', marginBottom: '3rem', background: 'linear-gradient(135deg, #ff6b9d, #64c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Real User Experiences
            </h2>
            
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <button onClick={() => scroll(experiencesScrollRef, 'left', 'experiences')} style={{ background: 'linear-gradient(135deg, #64c8ff, #a76eff)', border: 'none', color: '#0a0a19', width: '60px', height: '60px', borderRadius: '50%', fontSize: '1.8rem', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 0 30px rgba(100, 200, 255, 0.6), inset 0 0 20px rgba(255,255,255,0.2)', transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)', flexShrink: 0, opacity: 0, visibility: 'hidden', position: 'sticky', left: 0, zIndex: 100 }} onMouseEnter={e => { e.target.style.transform = 'rotateY(5deg) scale(1.15) rotateX(-10deg)'; e.target.style.boxShadow = '0 0 50px rgba(100, 200, 255, 0.9), inset 0 0 30px rgba(255,255,255,0.3)'; }} onMouseLeave={e => { e.target.style.transform = 'rotateY(0deg) scale(1)'; e.target.style.boxShadow = '0 0 30px rgba(100, 200, 255, 0.6), inset 0 0 20px rgba(255,255,255,0.2)'; }}><span>◀</span></button>

              <div ref={experiencesScrollRef} style={{ display: 'flex', gap: '2rem', overflowX: 'auto', paddingBottom: '1rem', scrollBehavior: 'smooth', flex: 1, scrollbarWidth: 'none', msOverflowStyle: 'none' }} onScroll={() => handleScroll(experiencesScrollRef, 'experiences')}>
                {[
                  { avatar: '👨‍🎤', name: 'Shubham Dadwal', achievement: 'Met her music collaborators', description: 'Connected with 3 musicians globally and started producing music together. Released 2 singles on Spotify!', impact: '500+ streams', badge: '🎵' },
                { avatar: '👨‍💼', name: 'Mayank Sharma', achievement: 'Built a startup network', description: 'Found 5 co-founder prospects and launched a tech startup. Currently raising Series A!', impact: '$500k raised', badge: '🚀' },
                { avatar: '👨‍⚕️', name: 'Arsh Dadwal', achievement: 'Started mentoring program', description: 'Mentoring 10+ aspiring doctors and professionals. Hosted 3 webinars with 1000+ attendees each.', impact: '10 mentees', badge: '🎓' },
                { avatar: '👨‍🎨', name: 'Ishit Atwal', achievement: 'Expanded creative business', description: 'Found design clients from 8 countries. Increased portfolio revenue by 300% in 6 months.', impact: '300% growth', badge: '🎨' },
                { avatar: '👩', name: 'Riya', achievement: 'Found remote team', description: 'Built a remote team of 12 developers and designers. Successfully launched 3 products.', impact: '12 team members', badge: '👥' },
                { avatar: '👨‍🏃', name: 'Rajveer Yadav', achievement: 'Built fitness community', description: 'Created accountability group of 50+ fitness enthusiasts. Members have achieved collective 100+ fitness goals!', impact: '50+ members', badge: '💪' },
              ].map((experience, i) => (
                <div key={i} style={{ background: 'linear-gradient(135deg, rgba(100, 200, 255, 0.08), rgba(167, 110, 255, 0.08))', border: '2px solid rgba(100, 200, 255, 0.15)', borderRadius: '20px', padding: '2.5rem', cursor: 'pointer', transition: 'all 0.35s ease', position: 'relative', overflow: 'hidden', minWidth: '300px', flexShrink: 0 }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-15px)'; e.currentTarget.style.borderColor = 'rgba(100, 200, 255, 0.5)'; e.currentTarget.style.boxShadow = '0 30px 60px rgba(100, 200, 255, 0.2)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(100, 200, 255, 0.15)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ position: 'absolute', top: '10px', right: '15px', fontSize: '2rem' }}>{experience.badge}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '3rem', width: '60px', height: '60px', background: 'linear-gradient(135deg, rgba(100, 200, 255, 0.3), rgba(167, 110, 255, 0.3))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(100, 200, 255, 0.4)' }}>
                      {experience.avatar}
                    </div>
                    <div>
                      <h4 style={{ color: '#fff', margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>{experience.name}</h4>
                      <p style={{ color: '#64c8ff', margin: 0, fontSize: '0.95rem', fontWeight: '600' }}>{experience.achievement}</p>
                    </div>
                  </div>
                  <p style={{ color: '#d0d0e0', marginBottom: '1.5rem', lineHeight: '1.7', fontSize: '0.95rem' }}>{experience.description}</p>
                  <div style={{ background: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                    <p style={{ color: '#00ff88', fontWeight: '700', fontSize: '1.2rem', margin: 0 }}>{experience.impact}</p>
                    <p style={{ color: '#a0d0b0', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>Real Impact Achieved</p>
                  </div>
                </div>
              ))}
              </div>

              <button onClick={() => scroll(experiencesScrollRef, 'right', 'experiences')} style={{ background: 'linear-gradient(135deg, #a76eff, #64c8ff)', border: 'none', color: '#0a0a19', width: '60px', height: '60px', borderRadius: '50%', fontSize: '1.8rem', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 0 30px rgba(167, 110, 255, 0.6), inset 0 0 20px rgba(255,255,255,0.2)', transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)', flexShrink: 0, opacity: 0, visibility: 'hidden', position: 'sticky', right: 0, zIndex: 100 }} onMouseEnter={e => { e.target.style.transform = 'rotateY(-5deg) scale(1.15) rotateX(-10deg)'; e.target.style.boxShadow = '0 0 50px rgba(167, 110, 255, 0.9), inset 0 0 30px rgba(255,255,255,0.3)'; }} onMouseLeave={e => { e.target.style.transform = 'rotateY(0deg) scale(1)'; e.target.style.boxShadow = '0 0 30px rgba(167, 110, 255, 0.6), inset 0 0 20px rgba(255,255,255,0.2)'; }}><span>▶</span></button>
            </div>
          </div>
        </section>

        {/* ===== CTA SECTION ===== */}
        <section style={{ padding: '5rem 2rem', background: 'linear-gradient(135deg, #1a0a3b 0%, #0a2b3b 25%, #0a0a19 50%, #2b0a3b 75%, #0a0a19 100%)', textAlign: 'center' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '3.2rem', fontWeight: '800', marginBottom: '1rem', background: 'linear-gradient(135deg, #ffffff, #64c8ff, #a76eff, #00ff88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Ready to Connect?
            </h2>
            <p style={{ fontSize: '1.3rem', color: '#d0d0e0', marginBottom: '2.5rem', lineHeight: '1.6' }}>
              Join thousands of people making meaningful connections right now. Start your journey today!
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
<button onClick={() => navigateTo('/login')} style={{ background: 'linear-gradient(135deg, #64c8ff, #a76eff, #00ff88)', border: 'none', color: '#0a0a19', padding: '1.2rem 2.5rem', borderRadius: '50px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 0 40px rgba(100, 200, 255, 0.5)', transition: 'all 0.3s ease', transform: 'scale(1)' }} onMouseEnter={e => e.target.style.transform = 'scale(1.05) translateY(-3px)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'}>
                ✨ Join Now - It's Free
              </button>
              <button style={{ background: 'rgba(255, 255, 255, 0.1)', border: '2px solid rgba(100, 200, 255, 0.5)', color: '#64c8ff', padding: '1.2rem 2.5rem', borderRadius: '50px', fontWeight: '600', fontSize: '1.1rem', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'all 0.3s ease' }} onMouseEnter={e => { e.target.style.background = 'rgba(100, 200, 255, 0.2)'; e.target.style.transform = 'translateY(-3px)'; }} onMouseLeave={e => { e.target.style.background = 'rgba(255, 255, 255, 0.1)'; e.target.style.transform = 'translateY(0)'; }}>
                💬 Join Discord Community
              </button>
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer style={{ background: 'linear-gradient(135deg, #0a0a19 0%, #1a0a2b 50%, #0a0a19 100%)', borderTop: '1px solid rgba(100, 200, 255, 0.1)', padding: '3rem 2rem 1rem' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ color: '#64c8ff', marginBottom: '1rem' }}>DuoTalk</h3>
                <p style={{ color: '#a0a0d0' }}>Connect. Communicate. Create meaningful friendships worldwide.</p>
              </div>
              <div>
                <h4 style={{ color: '#fff', marginBottom: '1rem' }}>Product</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li><a href="#" style={{ color: '#a0a0d0', textDecoration: 'none' }}>Features</a></li>
                  <li><a href="#" style={{ color: '#a0a0d0', textDecoration: 'none' }}>Pricing</a></li>
                  <li><a href="#" style={{ color: '#a0a0d0', textDecoration: 'none' }}>Security</a></li>
                </ul>
              </div>
              <div>
                <h4 style={{ color: '#fff', marginBottom: '1rem' }}>Legal</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li><a href="#" style={{ color: '#a0a0d0', textDecoration: 'none' }}>Terms</a></li>
                  <li><a href="#" style={{ color: '#a0a0d0', textDecoration: 'none' }}>Privacy</a></li>
                  <li><a href="#" style={{ color: '#a0a0d0', textDecoration: 'none' }}>Guidelines</a></li>
                </ul>
              </div>
              <div>
                <h4 style={{ color: '#fff', marginBottom: '1rem' }}>Social</h4>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <a href="#" style={{ width: '40px', height: '40px', border: '2px solid rgba(100, 200, 255, 0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64c8ff', textDecoration: 'none', cursor: 'pointer' }}>f</a>
                  <a href="#" style={{ width: '40px', height: '40px', border: '2px solid rgba(100, 200, 255, 0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64c8ff', textDecoration: 'none', cursor: 'pointer' }}>𝕏</a>
                  <a href="#" style={{ width: '40px', height: '40px', border: '2px solid rgba(100, 200, 255, 0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64c8ff', textDecoration: 'none', cursor: 'pointer' }}>▶</a>
                </div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(100, 200, 255, 0.1)', paddingTop: '2rem', textAlign: 'center' }}>
              <p style={{ color: '#707090', margin: 0 }}>&copy; 2024 DuoTalk. All rights reserved. | Made with ❤️ for meaningful connections</p>
            </div>
          </div>
        </footer>
      </main>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-30px);
          }
        }
        
        @keyframes drift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.8;
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 10px rgba(100, 200, 255, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(100, 200, 255, 0.8);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin3d {
          0% {
            transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
          }
          25% {
            transform: rotateX(180deg) rotateY(90deg) rotateZ(45deg);
          }
          50% {
            transform: rotateX(360deg) rotateY(180deg) rotateZ(90deg);
          }
          75% {
            transform: rotateX(180deg) rotateY(270deg) rotateZ(135deg);
          }
          100% {
            transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg);
          }
        }

        @keyframes float3d {
          0%, 100% {
            transform: translateY(0px) rotateX(0deg) rotateZ(0deg);
          }
          25% {
            transform: translateY(-25px) rotateX(15deg) rotateZ(5deg);
          }
          50% {
            transform: translateY(-50px) rotateX(0deg) rotateZ(0deg);
          }
          75% {
            transform: translateY(-25px) rotateX(-15deg) rotateZ(-5deg);
          }
        }
      `}</style>

      {/* ===== MODAL OVERLAY ===== */}
      {activeModal && <div onClick={() => setActiveModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)', zIndex: 1900, animation: 'fadeIn 0.3s ease' }} />}

      {/* ===== FEATURES MODAL ===== */}
      {activeModal === 'features' && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, animation: 'fadeInScale 0.3s ease' }}>
          <div onClick={() => setActiveModal(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(5, 10, 25, 0.72)', backdropFilter: 'blur(12px)' }} />
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', background: 'linear-gradient(135deg, rgba(20, 20, 50, 0.98), rgba(30, 10, 60, 0.98))', border: '2px solid rgba(100, 200, 255, 0.3)', borderRadius: '30px', padding: '1.5rem', backdropFilter: 'blur(20px)', maxWidth: '1100px', width: '92%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 100px rgba(100, 200, 255, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ background: 'linear-gradient(135deg, #ffffff, #64c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0, fontSize: '1.8rem' }}>Powerful Features</h2>
              <button onClick={() => setActiveModal(null)} style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {[
                { icon: '🤖', title: 'Smart Matching AI', desc: 'Algorithm-driven matching based on interests' },
                { icon: '📹', title: 'HD Video Chat', desc: 'Crystal clear 1080p+ video streaming' },
                { icon: '🎯', title: 'Interest Filters', desc: 'Find people who match your interests' },
                { icon: '👥', title: 'Friends & History', desc: 'Save favorite conversations' },
                { icon: '🔒', title: 'Safety First', desc: '24/7 AI moderation + verification' },
                { icon: '🎁', title: 'Rich Features', desc: 'Share media and more' },
              ].map((feature, i) => (
                <div key={i} style={{ padding: '1.5rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '15px', border: '1px solid rgba(100, 200, 255, 0.2)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{feature.icon}</div>
                  <h3 style={{ color: '#64c8ff', margin: '0.5rem 0' }}>{feature.title}</h3>
                  <p style={{ color: '#a0a0d0', margin: 0, fontSize: '0.9rem' }}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== STATS MODAL ===== */}
      {activeModal === 'stats' && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, animation: 'fadeInScale 0.3s ease' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(135deg, rgba(20, 20, 50, 0.9), rgba(30, 10, 60, 0.9))', border: '2px solid rgba(100, 200, 255, 0.3)', borderRadius: '30px', padding: '1.5rem', backdropFilter: 'blur(20px)', maxWidth: '1100px', width: '92%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 100px rgba(100, 200, 255, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ background: 'linear-gradient(135deg, #ffffff, #64c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0, fontSize: '1.8rem' }}>Our Stats</h2>
              <button onClick={() => setActiveModal(null)} style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {[
                { value: '2.5M+', label: 'Active Users', icon: '👥' },
                { value: '50M+', label: 'Conversations', icon: '💬' },
                { value: '95%', label: 'Video Quality', icon: '📹' },
                { value: '24/7', label: 'Safe & Secure', icon: '🔒' },
              ].map((stat, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '2rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '15px', border: '1px solid rgba(100, 200, 255, 0.2)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{stat.icon}</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #64c8ff, #a76eff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '0.5rem' }}>
                    {stat.value}
                  </div>
                  <div style={{ color: '#a0a0d0' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== INTERESTS MODAL ===== */}
      {activeModal === 'interests' && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, animation: 'fadeInScale 0.3s ease' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(135deg, rgba(20, 20, 50, 0.9), rgba(30, 10, 60, 0.9))', border: '2px solid rgba(100, 200, 255, 0.3)', borderRadius: '30px', padding: '3rem', backdropFilter: 'blur(20px)', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 100px rgba(100, 200, 255, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ background: 'linear-gradient(135deg, #ffffff, #64c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0, fontSize: '1.8rem' }}>Find Your Interests</h2>
              <button onClick={() => setActiveModal(null)} style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
              {interests.map((interest) => (
                <button key={interest} onClick={() => toggleInterest(interest)} style={{ background: selectedInterests.includes(interest) ? 'linear-gradient(135deg, #64c8ff, #a76eff)' : 'rgba(50, 50, 100, 0.4)', border: '2px solid rgba(100, 200, 255, 0.3)', color: selectedInterests.includes(interest) ? '#0a0a19' : '#d0d0e0', padding: '0.6rem 1.2rem', borderRadius: '50px', fontWeight: '500', cursor: 'pointer' }}>
                  {interest}
                </button>
              ))}
            </div>
            <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(100, 200, 255, 0.05)', border: '1px solid rgba(100, 200, 255, 0.2)', borderRadius: '15px' }}>
              <button onClick={() => { setActiveModal(null); navigateTo('/login') }} style={{ background: 'linear-gradient(135deg, #00ff88, #64c8ff)', border: 'none', color: '#0a0a19', padding: '0.8rem 2rem', borderRadius: '50px', fontWeight: '600', cursor: 'pointer' }}>
                Find Matches 🔍
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== BLOGS MODAL ===== */}
      {activeModal === 'blogs' && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, animation: 'fadeInScale 0.3s ease' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(135deg, rgba(20, 20, 50, 0.9), rgba(30, 10, 60, 0.9))', border: '2px solid rgba(100, 200, 255, 0.3)', borderRadius: '30px', padding: '3rem', backdropFilter: 'blur(20px)', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 100px rgba(100, 200, 255, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ background: 'linear-gradient(135deg, #ffffff, #64c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0, fontSize: '1.8rem' }}>All Uploaded Blogs</h2>
              <button onClick={() => setActiveModal(null)} style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            <Blogs />
            {false && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {[
                { icon: '💡', title: 'How to Start Meaningful Conversations', category: 'Tips' },
                { icon: '🎯', title: 'Finding Your Niche on DuoTalk', category: 'Guide' },
                { icon: '🚀', title: '5 Success Stories from Our Users', category: 'Stories' },
                { icon: '🛡️', title: 'Safety Guide: Protecting Your Privacy', category: 'Security' },
              ].map((blog, i) => (
                <div key={i} style={{ padding: '1.5rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '15px', border: '1px solid rgba(100, 200, 255, 0.2)', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(100, 200, 255, 0.5)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(100, 200, 255, 0.2)'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem' }}>
                    <div style={{ fontSize: '1.8rem' }}>{blog.icon}</div>
                    <span style={{ background: '#64c8ff', color: '#0a0a19', padding: '0.3rem 0.8rem', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold' }}>{blog.category}</span>
                  </div>
                  <h3 style={{ color: '#fff', margin: '0.5rem 0', fontSize: '1.1rem' }}>{blog.title}</h3>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
      )}

      {/* ===== REVIEWS MODAL ===== */}
      {activeModal === 'reviews' && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, animation: 'fadeInScale 0.3s ease' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(135deg, rgba(20, 20, 50, 0.9), rgba(30, 10, 60, 0.9))', border: '2px solid rgba(100, 200, 255, 0.3)', borderRadius: '30px', padding: '3rem', backdropFilter: 'blur(20px)', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 100px rgba(100, 200, 255, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ background: 'linear-gradient(135deg, #ffffff, #64c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0, fontSize: '1.8rem' }}>User Reviews</h2>
              <button onClick={() => setActiveModal(null)} style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {[
                { avatar: '👨‍🎨', name: 'Shubham Dadwal', role: 'Designer', quote: 'Found amazing people to talk to!', rating: 5 },
                { avatar: '👨‍💻', name: 'Mayank Sharma', role: 'Developer', quote: 'The video quality is perfect!', rating: 5 },
                { avatar: '👨‍🚀', name: 'Arsh Dadwal', role: 'Creator', quote: 'Made so many friends!', rating: 5 },
                { avatar: '👨‍🎸', name: 'Alex', role: 'Musician', quote: 'Love sharing music here!', rating: 5 },
              ].map((review, i) => (
                <div key={i} style={{ padding: '1.5rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '15px', border: '1px solid rgba(100, 200, 255, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem' }}>
                    <div style={{ fontSize: '2rem' }}>{review.avatar}</div>
                    <div>
                      <h4 style={{ color: '#fff', margin: 0 }}>{review.name}</h4>
                      <p style={{ color: '#64c8ff', margin: 0, fontSize: '0.9rem' }}>{review.role}</p>
                    </div>
                  </div>
                  <p style={{ color: '#d0d0e0', fontStyle: 'italic', margin: '0.8rem 0' }}>"{review.quote}"</p>
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    {[...Array(review.rating)].map((_, j) => (
                      <span key={j} style={{ color: '#ffa500' }}>★</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== TOAST NOTIFICATIONS ===== */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        style={{
          fontSize: '0.95rem'
        }}
      />

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
      </div>

      {/* Toast notifications - shown everywhere */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  )
}

function LoginPage({
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithFacebook,
  sendPhoneOTP,
  verifyPhoneOTP,
  error,
  onBackHome,
  onSuccess,
}) {
  const [localLoading, setLocalLoading] = useState(false)
  const [showPhoneForm, setShowPhoneForm] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [emailMode, setEmailMode] = useState('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpCountdown, setOtpCountdown] = useState(0)

  useEffect(() => {
    if (otpCountdown <= 0) return undefined
    const timer = setTimeout(() => setOtpCountdown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [otpCountdown])

  const handleGoogleLogin = async () => {
    try {
      setLocalLoading(true)
      const signedInUser = await signInWithGoogle()
      if (signedInUser) {
        onSuccess?.()
      }
    } finally {
      setLocalLoading(false)
    }
  }

  const handleFacebookLogin = async () => {
    try {
      setLocalLoading(true)
      const signedInUser = await signInWithFacebook()
      if (signedInUser) {
        onSuccess?.()
      }
    } finally {
      setLocalLoading(false)
    }
  }

  const resetEmailForm = () => {
    setShowEmailForm(false)
    setEmailMode('login')
    setUsername('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
  }

  const handleEmailSubmit = async (event) => {
    event.preventDefault()
    if (!email.trim() || !password.trim()) return
    if (emailMode === 'signup') {
      if (!username.trim()) return
      if (password.length < 6 || password !== confirmPassword) return
    }

    try {
      setLocalLoading(true)
      if (emailMode === 'signup') {
        await signUpWithEmail({
          username: username.trim(),
          email: email.trim(),
          password,
        })
      } else {
        await signInWithEmail({
          email: email.trim(),
          password,
        })
      }
      onSuccess?.()
    } finally {
      setLocalLoading(false)
    }
  }

  const handleSendOTP = async (event) => {
    event.preventDefault()
    if (!phoneNumber.trim()) return
    try {
      setLocalLoading(true)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber}`
      await sendPhoneOTP(formattedPhone)
      setOtpSent(true)
      setOtpCountdown(60)
    } finally {
      setLocalLoading(false)
    }
  }

  const handleVerifyOTP = async (event) => {
    event.preventDefault()
    if (!otp.trim() || otp.length < 6) return
    try {
      setLocalLoading(true)
      await verifyPhoneOTP(otp)
      onSuccess?.()
    } finally {
      setLocalLoading(false)
    }
  }

  return (
    <main className="google-login-page">
      <div className="google-login-scene" aria-hidden="true">
        <div className="google-login-cube cube-a">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="google-login-cube cube-b">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="google-login-float-card card-a" />
        <div className="google-login-float-card card-b" />
      </div>

      <section className="google-login-card auth-options-card">
        <button className="google-login-back" onClick={onBackHome} type="button">Back to Home</button>
        <div className="google-login-brand">
          <img src="/duotalk-logo.svg" alt="DuoTalk" />
          <h1>DuoTalk</h1>
          <p>Choose a sign in method to continue.</p>
        </div>

        {!showPhoneForm && !showEmailForm ? (
          <div className="auth-options-stack">
            <button onClick={() => setShowEmailForm(true)} disabled={localLoading} className="auth-option auth-option-phone">
              Continue with Email
            </button>
            <button onClick={handleGoogleLogin} disabled={localLoading} className="auth-option auth-option-google">
              <FaGoogle />
              {localLoading ? 'Connecting...' : 'Continue with Google'}
            </button>
            <button onClick={handleFacebookLogin} disabled={localLoading} className="auth-option auth-option-facebook">
              <FaFacebook />
              Continue with Facebook
            </button>
            <button onClick={() => setShowPhoneForm(true)} disabled={localLoading} className="auth-option auth-option-phone">
              <FaPhone />
              Continue with Phone
            </button>
          </div>
        ) : showEmailForm ? (
          <form onSubmit={handleEmailSubmit} className="auth-phone-form">
            <button type="button" className="auth-inline-back" onClick={resetEmailForm}>
              Back
            </button>

            {emailMode === 'signup' && (
              <label className="auth-field">
                <span>Username</span>
                <input
                  type="text"
                  placeholder="Your username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </label>
            )}

            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {emailMode === 'signup' && (
              <label className="auth-field">
                <span>Confirm Password</span>
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </label>
            )}

            <button type="submit" className="auth-option auth-option-phone" disabled={localLoading}>
              {localLoading ? 'Please wait...' : emailMode === 'signup' ? 'Create Account' : 'Login'}
            </button>

            <button
              type="button"
              className="auth-resend"
              onClick={() => setEmailMode((value) => value === 'login' ? 'signup' : 'login')}
            >
              {emailMode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} className="auth-phone-form">
            <button
              type="button"
              className="auth-inline-back"
              onClick={() => {
                setShowPhoneForm(false)
                setOtpSent(false)
                setPhoneNumber('')
                setOtp('')
                setOtpCountdown(0)
              }}
            >
              Back
            </button>

            {!otpSent ? (
              <>
                <label className="auth-field">
                  <span>Phone Number</span>
                  <input
                    type="tel"
                    placeholder="+1 555 123 4567"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                  />
                </label>
                <div id="recaptcha-container" />
                <button type="submit" className="auth-option auth-option-phone" disabled={localLoading}>
                  {localLoading ? <><FaSpinner className="spin" /> Sending OTP...</> : 'Send OTP'}
                </button>
              </>
            ) : (
              <>
                <label className="auth-field">
                  <span>Enter OTP</span>
                  <input
                    type="text"
                    placeholder="000000"
                    maxLength="6"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                  />
                </label>
                <button type="submit" className="auth-option auth-option-phone" disabled={localLoading || otp.length < 6}>
                  {localLoading ? <><FaSpinner className="spin" /> Verifying...</> : 'Verify OTP'}
                </button>
                <button
                  type="button"
                  className="auth-resend"
                  disabled={otpCountdown > 0}
                  onClick={() => {
                    setOtpSent(false)
                    setOtp('')
                    setOtpCountdown(0)
                  }}
                >
                  {otpCountdown > 0 ? `Resend OTP in ${otpCountdown}s` : 'Resend OTP'}
                </button>
              </>
            )}
          </form>
        )}

        {error && <small>{error}</small>}
      </section>
    </main>
  )
}

export default App

