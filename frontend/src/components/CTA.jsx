import React from 'react'
import { motion } from 'framer-motion'
import { FiArrowRight } from 'react-icons/fi'
import { FaDiscord } from 'react-icons/fa'
import './CTA.css'

const CTA = () => {
  const floatingShapes = [
    { id: 1, emoji: '💬', top: '10%', left: '5%' },
    { id: 2, emoji: '🎯', top: '80%', left: '10%' },
    { id: 3, emoji: '✨', top: '20%', right: '8%' },
    { id: 4, emoji: '🚀', top: '70%', right: '5%' },
  ]

  return (
    <section className="cta">
      <div className="cta-background">
        <div className="gradient-overlay"></div>
        {floatingShapes.map((shape) => (
          <motion.div
            key={shape.id}
            className="floating-shape"
            animate={{
              y: [0, -30, 0],
              x: [0, 10, -10, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 8 + shape.id,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              top: shape.top,
              left: shape.left,
              right: shape.right,
            }}
          >
            {shape.emoji}
          </motion.div>
        ))}
      </div>

      <div className="cta-container">
        <motion.div
          className="cta-content"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2>Join DuoTalk Today</h2>
          <p>Start making meaningful connections with people around the world</p>

          <motion.div
            className="cta-buttons"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <motion.button
              className="cta-btn primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Join Now
              <FiArrowRight />
            </motion.button>
            <motion.button
              className="cta-btn secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaDiscord />
              Join Discord
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default CTA
