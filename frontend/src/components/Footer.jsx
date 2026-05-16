import React from 'react'
import { FiTwitter, FiInstagram } from 'react-icons/fi'
import { FaDiscord, FaTiktok } from 'react-icons/fa'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="/duotalk-logo.svg" alt="DuoTalk" className="logo-icon" />
              <span>DuoTalk</span>
            </div>
            <p>Connect. Communicate. Create meaningful friendships around the world.</p>
          </div>

          {/* Links */}
          <div className="footer-links">
            <div className="link-column">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#security">Security</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="link-column">
              <h4>Company</h4>
              <a href="#about">About Us</a>
              <a href="#blog">Blog</a>
              <a href="#careers">Careers</a>
              <a href="#press">Press</a>
            </div>
            <div className="link-column">
              <h4>Legal</h4>
              <a href="#terms">Terms of Service</a>
              <a href="#privacy">Privacy Policy</a>
              <a href="#guidelines">Community Guidelines</a>
              <a href="#refund">Refund Policy</a>
            </div>
            <div className="link-column">
              <h4>Support</h4>
              <a href="#help">Help Center</a>
              <a href="#contact">Contact Us</a>
              <a href="#status">Status Page</a>
              <a href="#report">Report Issue</a>
            </div>
          </div>

          {/* Social Icons */}
          <div className="footer-social">
            <h4>Follow Us</h4>
            <div className="social-icons">
              <a href="#discord" className="social-icon" title="Discord">
                <FaDiscord />
              </a>
              <a href="#twitter" className="social-icon" title="Twitter">
                <FiTwitter />
              </a>
              <a href="#instagram" className="social-icon" title="Instagram">
                <FiInstagram />
              </a>
              <a href="#tiktok" className="social-icon" title="TikTok">
                <FaTiktok />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <div className="footer-divider"></div>
          <div className="footer-credits">
            <p>&copy; 2024 DuoTalk. All rights reserved.</p>
            <p className="made-with">Made with <span className="heart">❤</span> for meaningful connections</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
