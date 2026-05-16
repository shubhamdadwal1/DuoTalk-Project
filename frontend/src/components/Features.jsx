import React from 'react'
import { motion } from 'framer-motion'
import { FiBrain, FiVideo, FiFilter, FiUsers, FiShield, FiGift } from 'react-icons/fi'
import './Features.css'

const Features = () => {
  const features = [
    {
      id: 1,
      title: 'Smart Matching AI',
      description: 'Algorithm-driven intelligent matching based on interests and preferences',
      icon: FiBrain,
      color: '#64c8ff',
    },
    {
      id: 2,
      title: 'Video Chat (HD)',
      description: 'Crystal clear HD video calls with multiple connection options',
      icon: FiVideo,
      color: '#a76eff',
    },
    {
      id: 3,
      title: 'Interest-Based Filters',
      description: 'Find people who match your exact interests and hobbies',
      icon: FiFilter,
      color: '#00ff88',
    },
    {
      id: 4,
      title: 'Friends & History',
      description: 'Save favorite conversations and reconnect with friends anytime',
      icon: FiUsers,
      color: '#ff006e',
    },
    {
      id: 5,
      title: 'Safety & Moderation',
      description: 'AI-powered safety system with 24/7 content moderation',
      icon: FiShield,
      color: '#ffa500',
    },
    {
      id: 6,
      title: 'Rich Features',
      description: 'Share GIFs, voice messages, media, and more with ease',
      icon: FiGift,
      color: '#00d4ff',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  return (
    <section className="features" id="features">
      <div className="features-container">
        <motion.div
          className="features-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2>Powerful Features for Better Conversations</h2>
          <p>Everything you need for meaningful connections</p>
        </motion.div>

        <motion.div
          className="features-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature) => (
            <motion.div key={feature.id} className="feature-card" variants={cardVariants}>
              <div className="feature-icon-wrapper">
                <feature.icon className="feature-icon" style={{ color: feature.color }} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="feature-glow" style={{ backgroundColor: feature.color }}></div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Features
