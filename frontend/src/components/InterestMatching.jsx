import React, { useState } from 'react'
import { motion } from 'framer-motion'
import './InterestMatching.css'

const InterestMatching = () => {
  const interests = [
    'Gaming', 'Music', 'Tech', 'Anime', 'Sports', 'Movies',
    'Travel', 'Photography', 'Art', 'Fitness', 'Cooking', 'Books',
    'Fashion', 'Memes', 'Comedy', 'Science', 'Business', 'Design'
  ]

  const [selectedInterests, setSelectedInterests] = useState(['Gaming', 'Music'])

  const toggleInterest = (interest) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const chipVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4 },
    },
  }

  return (
    <section className="interest-matching">
      <div className="interest-container">
        <motion.div
          className="interest-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2>Find People Who Match Your Vibe</h2>
          <p>Select your interests to find meaningful connections</p>
        </motion.div>

        <motion.div
          className="interests-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {interests.map((interest) => (
            <motion.button
              key={interest}
              className={`interest-chip ${selectedInterests.includes(interest) ? 'active' : ''}`}
              variants={chipVariants}
              onClick={() => toggleInterest(interest)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {interest}
              {selectedInterests.includes(interest) && <span className="checkmark">✓</span>}
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          className="selected-interests"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <p>Selected: <span className="selected-count">{selectedInterests.length}</span> interests</p>
          <button className="find-matches-btn">Find Matches Now</button>
        </motion.div>
      </div>
    </section>
  )
}

export default InterestMatching
