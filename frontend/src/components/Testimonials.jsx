import React from 'react'
import { motion } from 'framer-motion'
import { FiChevronLeft, FiChevronRight, FiStar } from 'react-icons/fi'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import './Testimonials.css'

const Testimonials = () => {
  const [sliderRef, setSliderRef] = React.useState(null)

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Chen',
      role: 'Designer',
      quote: 'DuoTalk completely changed how I make friends online. The AI matching is insane – I\'ve connected with people I never would\'ve met otherwise.',
      avatar: '👩‍🎨',
      rating: 5,
    },
    {
      id: 2,
      name: 'James Wilson',
      role: 'Developer',
      quote: 'The video chat quality is crystal clear, and the safety features make me feel confident every time I connect. Highly recommend!',
      avatar: '👨‍💻',
      rating: 5,
    },
    {
      id: 3,
      name: 'Emma Rodriguez',
      role: 'Content Creator',
      quote: 'Found some amazing friends here! The interest matching is so spot-on. Everyone I\'ve talked to shares my passions.',
      avatar: '👩‍🚀',
      rating: 5,
    },
    {
      id: 4,
      name: 'Alex Kim',
      role: 'Musician',
      quote: 'Love the interface and how easy it is to share music and voice messages. This app is a game-changer for musicians like me!',
      avatar: '👨‍🎸',
      rating: 5,
    },
    {
      id: 5,
      name: 'Lisa Thompson',
      role: 'Student',
      quote: 'Made so many new friends from around the world. DuoTalk is the best platform for meeting people with similar interests.',
      avatar: '👩‍🎓',
      rating: 5,
    },
  ]

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  }

  return (
    <section className="testimonials">
      <div className="testimonials-container">
        <motion.div
          className="testimonials-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2>What People are Saying</h2>
          <p>Join thousands of users making meaningful connections</p>
        </motion.div>

        <div className="testimonials-carousel">
          <Slider ref={setSliderRef} {...settings} className="slider-track">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="testimonial-wrapper">
                <motion.div
                  className="testimonial-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <div className="testimonial-header">
                    <div className="avatar-large">{testimonial.avatar}</div>
                    <div className="user-info">
                      <h4>{testimonial.name}</h4>
                      <p>{testimonial.role}</p>
                    </div>
                  </div>

                  <div className="stars">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FiStar key={i} className="star filled" />
                    ))}
                  </div>

                  <p className="testimonial-quote">"{testimonial.quote}"</p>
                </motion.div>
              </div>
            ))}
          </Slider>

          <div className="carousel-controls">
            <button
              className="carousel-btn prev"
              onClick={() => sliderRef?.slickPrev()}
            >
              <FiChevronLeft />
            </button>
            <button
              className="carousel-btn next"
              onClick={() => sliderRef?.slickNext()}
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
