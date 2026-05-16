import React, { useState, useEffect, useRef } from 'react';
import { getSocket, emitEvent, onEvent, offEvent } from '../../services/socketIO';
import './VideoCall.css';

function isTrustedMediaOrigin() {
  if (typeof window === 'undefined') return true;
  if (window.isSecureContext) return true;

  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function buildMediaSecurityError() {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'this site';
  return `Video calling needs HTTPS or localhost. ${origin} is not a trusted browser origin for camera and microphone access.`;
}

/**
 * VideoCall Component
 * Real-time video calling using WebRTC
 * 
 * Features:
 * - Peer-to-peer video streaming
 * - Audio/video toggle
 * - Screen sharing
 * - Call quality stats
 * - Network fallback
 */
const VideoCall = ({ recipientId, recipientName, onCallEnd }) => {
  const [callState, setCallState] = useState('idle'); // idle, ringing, calling, connected
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [stats, setStats] = useState(null);
  const [callError, setCallError] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const callTimerRef = useRef(null);
  const statsTimerRef = useRef(null);
  const socket = getSocket();

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
  };

  // Initialize WebRTC Peer Connection
  const initializePeerConnection = async () => {
    try {
      if (peerConnectionRef.current) {
        return peerConnectionRef.current;
      }

      const peerConnection = new RTCPeerConnection({
        iceServers: ICE_SERVERS.iceServers,
      });

      // Add local stream tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStreamRef.current);
        });
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          emitEvent('video_ice_candidate', {
            to: recipientId,
            candidate: event.candidate,
          });
        }
      };

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        if (import.meta.env.DEV) {
          console.log('🔌 Connection state:', peerConnection.connectionState);
        }
        
        if (peerConnection.connectionState === 'failed') {
          peerConnection.restartIce();
        } else if (peerConnection.connectionState === 'disconnected') {
          endCall();
        }
      };

      peerConnectionRef.current = peerConnection;
      return peerConnection;
    } catch (err) {
      console.error('❌ Error initializing peer connection:', err);
      throw err;
    }
  };

  // Get local media stream
  const getLocalStream = async () => {
    try {
      if (!isTrustedMediaOrigin()) {
        throw new Error(buildMediaSecurityError());
      }

      if (localStreamRef.current) {
        return localStreamRef.current;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      localStreamRef.current = stream;

      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (err) {
      console.error('❌ Error getting local stream:', err);
      throw err;
    }
  };

  // Start outgoing call
  const startCall = async () => {
    try {
      setCallState('calling');
      
      // Get local media
      await getLocalStream();
      
      // Initialize peer connection
      const peerConnection = await initializePeerConnection();
      
      // Create and send offer
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await peerConnection.setLocalDescription(offer);

      emitEvent('video_call_offer', {
        to: recipientId,
        offer: offer,
      });

      if (import.meta.env.DEV) {
        console.log('📞 Call offer sent to', recipientName);
      }
    } catch (err) {
      console.error('❌ Error starting call:', err);
      setCallState('idle');
    }
  };

  // Handle incoming call
  const handleIncomingCall = async (data) => {
    try {
      if (data.from !== recipientId) return;

      setCallState('ringing');
      
      // Get local media
      await getLocalStream();
      
      // Initialize peer connection
      const peerConnection = await initializePeerConnection();
      
      // Set remote description
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );

      // Create answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      emitEvent('video_call_answer', {
        to: recipientId,
        answer: answer,
      });

      if (import.meta.env.DEV) {
        console.log('📞 Call answer sent to', recipientName);
      }
    } catch (err) {
      console.error('❌ Error handling incoming call:', err);
      rejectCall();
    }
  };

  // Handle call answer
  const handleCallAnswer = async (data) => {
    try {
      if (data.from !== recipientId) return;

      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) return;

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.answer)
      );

      setCallState('connected');
      
      if (import.meta.env.DEV) {
        console.log('📞 Call connected with', recipientName);
      }
    } catch (err) {
      console.error('❌ Error handling call answer:', err);
    }
  };

  // Handle ICE candidates
  const handleIceCandidate = async (data) => {
    try {
      if (data.from !== recipientId) return;

      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) return;

      if (data.candidate) {
        try {
          await peerConnection.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        } catch (err) {
          // Ignore errors for already-added candidates
          if (err.name !== 'TypeError') {
            console.error('❌ Error adding ICE candidate:', err);
          }
        }
      }
    } catch (err) {
      console.error('❌ Error handling ICE candidate:', err);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !isVideoOn;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  // Start screen sharing
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });

      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];

      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) return;

      const sender = peerConnection
        .getSenders()
        .find((s) => s.track?.kind === 'video');

      if (sender) {
        await sender.replaceTrack(screenTrack);
        setIsScreenSharing(true);

        emitEvent('video_screen_share_started', {
          to: recipientId,
        });

        screenTrack.onended = () => {
          stopScreenShare();
        };
      }
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        console.error('❌ Error sharing screen:', err);
      }
    }
  };

  // Stop screen sharing
  const stopScreenShare = async () => {
    try {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }

      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const peerConnection = peerConnectionRef.current;
        
        if (peerConnection && videoTrack) {
          const sender = peerConnection
            .getSenders()
            .find((s) => s.track?.kind === 'video');

          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        }
      }

      setIsScreenSharing(false);

      emitEvent('video_screen_share_stopped', {
        to: recipientId,
      });
    } catch (err) {
      console.error('❌ Error stopping screen share:', err);
    }
  };

  // Get call statistics
  const getCallStats = async () => {
    try {
      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) return;

      const stats = await peerConnection.getStats();
      const statsObj = {};

      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          statsObj.videoBytesReceived = report.bytesReceived;
          statsObj.videoPacketsLost = report.packetsLost;
          statsObj.videoDecoderImplementation = report.decoderImplementation;
        }
        if (report.type === 'outbound-rtp' && report.kind === 'video') {
          statsObj.videoBytesSent = report.bytesSent;
          statsObj.videoFramesEncoded = report.framesEncoded;
        }
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          statsObj.currentRoundTripTime = report.currentRoundTripTime;
          statsObj.availableOutgoingBitrate = report.availableOutgoingBitrate;
        }
      });

      setStats(statsObj);
    } catch (err) {
      console.error('❌ Error getting stats:', err);
    }
  };

  // End call
  const endCall = () => {
    try {
      // Stop all streams
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Clear timers
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (statsTimerRef.current) clearInterval(statsTimerRef.current);

      setCallState('idle');
      setCallDuration(0);
      setIsScreenSharing(false);
      setIsMuted(false);
      setIsVideoOn(true);

      emitEvent('video_call_ended', {
        to: recipientId,
      });

      if (onCallEnd) {
        onCallEnd();
      }
    } catch (err) {
      console.error('❌ Error ending call:', err);
    }
  };

  // Reject call
  const rejectCall = () => {
    emitEvent('video_call_rejected', {
      to: recipientId,
    });
    endCall();
  };

  // Setup socket event listeners
  useEffect(() => {
    if (!socket) return;

    onEvent('video_call_offer', handleIncomingCall);
    onEvent('video_call_answer', handleCallAnswer);
    onEvent('video_ice_candidate', handleIceCandidate);

    return () => {
      offEvent('video_call_offer', handleIncomingCall);
      offEvent('video_call_answer', handleCallAnswer);
      offEvent('video_ice_candidate', handleIceCandidate);
    };
  }, [recipientId, recipientName]);

  // Start call duration timer
  useEffect(() => {
    if (callState === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      // Get stats every 2 seconds
      statsTimerRef.current = setInterval(() => {
        getCallStats();
      }, 2000);

      return () => {
        if (callTimerRef.current) clearInterval(callTimerRef.current);
        if (statsTimerRef.current) clearInterval(statsTimerRef.current);
      };
    }
  }, [callState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callState !== 'idle') {
        endCall();
      }
    };
  }, []);

  // Format duration
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-call-container">
      <div className="video-call-header">
        <h2>{recipientName}</h2>
        <span className="call-status">
          {callState === 'idle' && 'Ready'}
          {callState === 'calling' && 'Calling...'}
          {callState === 'ringing' && 'Incoming call...'}
          {callState === 'connected' && `Connected ${formatDuration(callDuration)}`}
        </span>
      </div>

      <div className="video-container">
        <div className="video-wrapper remote-video">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted={false}
            className="remote-video"
          />
          <div className="video-placeholder">
            {callState === 'connected' ? null : 'Waiting for video...'}
          </div>
        </div>

        <div className="video-wrapper local-video">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="local-video"
          />
          {isScreenSharing && <span className="screen-share-badge">Screen</span>}
        </div>
      </div>

      <div className="call-controls">
        {callState === 'idle' && (
          <button
            className="control-btn btn-call"
            onClick={startCall}
            title="Start call"
          >
            📞
          </button>
        )}

        {(callState === 'calling' || callState === 'connected' || callState === 'ringing') && (
          <>
            <button
              className={`control-btn ${isMuted ? 'btn-disabled' : ''}`}
              onClick={toggleAudio}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🎤'}
            </button>

            <button
              className={`control-btn ${!isVideoOn ? 'btn-disabled' : ''}`}
              onClick={toggleVideo}
              title={isVideoOn ? 'Stop video' : 'Start video'}
            >
              {isVideoOn ? '📹' : '📷'}
            </button>

            <button
              className={`control-btn ${isScreenSharing ? 'btn-active' : ''}`}
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            >
              🖥️
            </button>

            <button
              className="control-btn btn-end"
              onClick={endCall}
              title="End call"
            >
              ❌
            </button>
          </>
        )}

        {callState === 'ringing' && (
          <>
            <button
              className="control-btn btn-accept"
              onClick={startCall}
              title="Accept call"
            >
              ✅
            </button>
            <button
              className="control-btn btn-reject"
              onClick={rejectCall}
              title="Reject call"
            >
              ❌
            </button>
          </>
        )}
      </div>

      {stats && callState === 'connected' && (
        <div className="call-stats">
          <div className="stat-item">
            <span className="stat-label">RTT:</span>
            <span className="stat-value">
              {(stats.currentRoundTripTime * 1000).toFixed(0)}ms
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Bitrate:</span>
            <span className="stat-value">
              {(stats.availableOutgoingBitrate / 1000000).toFixed(2)}Mbps
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Packets Lost:</span>
            <span className="stat-value">{stats.videoPacketsLost || 0}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
