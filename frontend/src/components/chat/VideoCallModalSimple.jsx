import React from 'react';
import './VideoCallModal.css';

const VideoCallModalSimple = ({ isOpen, onClose, initialRecipientName }) => {
  console.log('VideoCallModalSimple rendered with isOpen:', isOpen);

  if (!isOpen) {
    console.log('isOpen is false, returning null');
    return null;
  }

  console.log('Rendering VideoCallModalSimple modal');

  return (
    <div className="video-call-modal-overlay" onClick={onClose}>
      <div className="video-call-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Video Call Test</h3>
          <button
            className="modal-close"
            onClick={onClose}
            title="Close"
            aria-label="Close"
          >
            <span className="modal-close-icon">x</span>
          </button>
        </div>
        <div className="modal-content">
          <div className="call-form">
            <div className="quick-call">
              <p>Calling: {initialRecipientName || 'Unknown'}</p>
              <button className="quick-call-btn">
                Start Call
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModalSimple;
