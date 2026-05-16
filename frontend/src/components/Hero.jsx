import React from 'react'
import { motion } from 'framer-motion'
import { FiVideo, FiMessageCircle } from 'react-icons/fi'
import './Hero.css'

const Hero = () => {
  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  }

  return (
    <section className="hero" id="home">
      <div className="hero-background">
        <div className="gradient-bg"></div>
        <div className="animated-particles"></div>
      </div>

      <div className="hero-container">
        <div className="hero-content">
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Talk Smarter, <span>Connect Deeper</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Meet new people worldwide through intelligent matching and immersive video chats.
          </motion.p>

          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <button className="btn btn-primary">
              <FiMessageCircle />
              Start Chatting
            </button>
            <button className="btn btn-secondary">
              <FiVideo />
              Try Video Chat
            </button>
          </motion.div>
        </div>

        {/* Floating Chat Cards */}
        <div className="hero-visual">
          <motion.div
            className="chat-card card-1"
            variants={floatingVariants}
            animate="animate"
          >
            <div className="card-header">
              <div className="avatar avatar-blue">👤</div>
              <div className="card-info">
                <p className="card-name">Alex</p>
                <p className="card-status">Online</p>
              </div>
            </div>
            <p className="card-message">Hey! How's it going?</p>
            <div className="notification-bubble">1</div>
          </motion.div>

          <motion.div
            className="chat-card card-2"
            variants={floatingVariants}
            animate="animate"
            transition={{
              duration: 6,
              repeat: Infinity,
              delay: 1,
              ease: 'easeInOut',
            }}
          >
            <div className="video-preview">
              <div className="video-placeholder">📹</div>
              <div className="call-status">HD Video Call</div>
            </div>
          </motion.div>

          <motion.div
            className="chat-card card-3"
            variants={floatingVariants}
            animate="animate"
            transition={{
              duration: 6,
              repeat: Infinity,
              delay: 2,
              ease: 'easeInOut',
            }}
          >
            <div className="card-header">
              <div className="avatar avatar-purple">👤</div>
              <div className="card-info">
                <p className="card-name">Jordan</p>
                <p className="card-status">Chatting</p>
              </div>
            </div>
            <p className="card-message">That sounds amazing! 😊</p>
          </motion.div>

          {/* Globe Animation */}
          <motion.div
            className="globe-container"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, linear: true }}
          >
            <div className="globe">🌐</div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="scroll-indicator"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="scroll-dot"></div>
      </motion.div>
    </section>
  )
}

export default Hero
