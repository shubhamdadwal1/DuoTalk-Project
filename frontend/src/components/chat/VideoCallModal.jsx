import React, { useState, useEffect } from 'react';
import { getSocket, onEvent, offEvent } from '../../services/socketIO';
import VideoCall from './VideoCall';
import './VideoCallModal.css';

/**
 * VideoCallModal Component
 * Displays video call interface in a modal
 * Handles incoming and outgoing calls
 */
const VideoCallModal = ({
  userId,
  userName,
  isOpen,
  onClose,
  initialRecipientId = null,
  initialRecipientName = null
}) => {
  console.log('VideoCallModal rendered with isOpen:', isOpen);

  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const socket = getSocket();

  // Debug effect
  useEffect(() => {
    console.log('isOpen changed to:', isOpen);
  }, [isOpen]);

  // Handle incoming call
  const handleIncomingCall = (data) => {
    if (data.from && data.offer) {
      setIncomingCall({
        from: data.from,
        offer: data.offer,
        timestamp: Date.now(),
      });
    }
  };

  // Handle call answer
  const handleCallAnswer = (data) => {
    if (data.from === activeCall?.recipientId) {
      setActiveCall((prev) => ({
        ...prev,
        state: 'connected',
      }));
    }
  };

  // Handle call rejection
  const handleCallRejection = (data) => {
    if (data.from === activeCall?.recipientId || data.from === incomingCall?.from) {
      if (import.meta.env.DEV) {
        console.log('Call was rejected');
      }
      setActiveCall(null);
      setIncomingCall(null);
    }
  };

  // Handle call end
  const handleCallEnd = (data) => {
    if (
      data.from === activeCall?.recipientId ||
      data.from === incomingCall?.from
    ) {
      logCallToHistory(data.from, 'completed');
      setActiveCall(null);
      setIncomingCall(null);
    }
  };

  // Log call to history
  const logCallToHistory = (participantId, status) => {
    const callRecord = {
      id: Date.now(),
      participantId,
      participantName: participantId, // You might want to fetch this
      timestamp: new Date(),
      status, // completed, missed, rejected
      duration: activeCall?.duration || 0,
    };

    setCallHistory((prev) => [callRecord, ...prev.slice(0, 49)]); // Keep last 50
  };

  // Setup socket listeners
  useEffect(() => {
    if (!socket || !isOpen) return;

    onEvent('video_call_offer', handleIncomingCall);
    onEvent('video_call_answer', handleCallAnswer);
    onEvent('video_call_rejected', handleCallRejection);
    onEvent('video_call_ended', handleCallEnd);

    return () => {
      offEvent('video_call_offer', handleIncomingCall);
      offEvent('video_call_answer', handleCallAnswer);
      offEvent('video_call_rejected', handleCallRejection);
      offEvent('video_call_ended', handleCallEnd);
    };
  }, [socket, isOpen, activeCall, incomingCall]);

  // Start new call
  const startCall = (recipientId, recipientName) => {
    setActiveCall({
      recipientId,
      recipientName,
      state: 'initiating',
      startTime: Date.now(),
    });
    setIncomingCall(null);
  };

  // Accept incoming call
  const acceptCall = () => {
    if (incomingCall) {
      setActiveCall({
        recipientId: incomingCall.from,
        recipientName: incomingCall.from, // You might want to fetch this
        state: 'answering',
        startTime: Date.now(),
      });
      setIncomingCall(null);
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    if (incomingCall) {
      logCallToHistory(incomingCall.from, 'rejected');
      setIncomingCall(null);
    }
  };

  // End active call
  const endCall = () => {
    if (activeCall) {
      logCallToHistory(activeCall.recipientId, 'completed');
      setActiveCall(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="video-call-modal-overlay" onClick={onClose}>
      <div className="video-call-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Video Call</h3>
          {!activeCall && !incomingCall && (
            <button
              className="modal-close"
              onClick={onClose}
              title="Close"
              aria-label="Close"
            >
              <span className="modal-close-icon">x</span>
            </button>
          )}
        </div>

        <div className="modal-content">
          {/* Active call */}
          {activeCall && (
            <VideoCall
              recipientId={activeCall.recipientId}
              recipientName={activeCall.recipientName}
              onCallEnd={endCall}
            />
          )}

          {/* Incoming call notification */}
          {incomingCall && !activeCall && (
            <div className="incoming-call-alert">
              <div className="alert-content">
                <div className="alert-icon">Call</div>
                <div className="alert-text">
                  <h4>Incoming Call</h4>
                  <p className="caller-id">{incomingCall.from}</p>
                </div>
              </div>

              <div className="alert-actions">
                <button
                  className="action-btn accept-btn"
                  onClick={acceptCall}
                  title="Accept call"
                >
                  Accept
                </button>
                <button
                  className="action-btn reject-btn"
                  onClick={rejectCall}
                  title="Reject call"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Call history */}
          {!activeCall && !incomingCall && callHistory.length > 0 && (
            <div className="call-history">
              <h4>Recent Calls</h4>
              <div className="history-list">
                {callHistory.map((call) => (
                  <div key={call.id} className="history-item">
                    <div className="history-info">
                      <span className="history-name">
                        {call.participantName}
                      </span>
                      <span className="history-time">
                        {new Date(call.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <button
                      className="history-action"
                      onClick={() =>
                        startCall(
                          call.participantId,
                          call.participantName
                        )
                      }
                      title="Call again"
                    >
                      Call
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call initiation form */}
          {!activeCall && !incomingCall && (
            <div className="call-form">
              {initialRecipientId ? (
                <div className="quick-call">
                  <button
                    className="quick-call-btn"
                    onClick={() =>
                      startCall(initialRecipientId, initialRecipientName)
                    }
                  >
                    Call {initialRecipientName}
                  </button>
                </div>
              ) : (
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Enter recipient ID or name"
                    id="recipientInput"
                    className="form-input"
                  />
                  <button
                    className="form-submit"
                    onClick={() => {
                      const input = document.getElementById('recipientInput');
                      if (input.value.trim()) {
                        startCall(input.value.trim(), input.value.trim());
                      }
                    }}
                  >
                    Start Call
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
