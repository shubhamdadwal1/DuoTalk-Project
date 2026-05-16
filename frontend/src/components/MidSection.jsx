import React from 'react'
import { motion } from 'framer-motion'
import { FiCheck } from 'react-icons/fi'
import './MidSection.css'

const MidSection = () => {
  const features = [
    'Seamless peer-to-peer connections',
    'Real-time HD video and audio',
    'Secure end-to-end encrypted chats',
    'Instant message delivery',
  ]

  return (
    <section className="mid-section">
      <div className="mid-container">
        {/* Left - 3D Illustration */}
        <motion.div
          className="mid-left"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="illustration-card">
            <div className="video-chat-illustration">
              <div className="avatar avatar-1">👨</div>
              <div className="connection-line"></div>
              <div className="avatar avatar-2">👩</div>
            </div>
            <div className="floating-element floating-1">💬</div>
            <div className="floating-element floating-2">😊</div>
            <div className="floating-element floating-3">👍</div>
          </div>
        </motion.div>

        {/* Right - Content */}
        <motion.div
          className="mid-right"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2>Simple, Fun & Secure Conversations</h2>
          <p className="mid-description">
            Experience the future of online communication. Our platform combines cutting-edge technology 
            with intuitive design to make meeting new people effortless and enjoyable. Whether you're looking 
            for casual chat, meaningful conversations, or just to make new friends, DuoTalk has you covered.
          </p>

          <div className="features-list">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="feature-item"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <FiCheck className="check-icon" />
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>

          <motion.button
            className="mid-cta-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Explore More Features
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

export default MidSection
