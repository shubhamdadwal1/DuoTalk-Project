import React, { useState, useContext } from 'react';
import VideoCallModal from '../components/chat/VideoCallModal';
import { AuthContext } from '../context/AuthContext';

/**
 * MessagingDashboard Integration Example
 * Shows how to integrate video calling into existing messaging UI
 */

export default function MessagingDashboardExample() {
  const { user } = useContext(AuthContext);
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Example: Your existing messaging content
  const conversations = [
    { id: '1', name: 'John Doe', lastMessage: 'Hey, how are you?' },
    { id: '2', name: 'Jane Smith', lastMessage: 'See you tomorrow!' },
    { id: '3', name: 'Mike Johnson', lastMessage: 'Thanks for the help' },
  ];

  const handleStartVideoCall = (user) => {
    setSelectedUser(user);
    setVideoCallOpen(true);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', gap: '20px', padding: '20px' }}>
      {/* Left: Conversation List */}
      <div style={{ flex: '0 0 300px', borderRight: '1px solid #ccc', paddingRight: '20px' }}>
        <h2>Conversations</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              style={{
                padding: '15px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onClick={() => setSelectedUser(conv)}
            >
              <div>
                <h4 style={{ margin: '0 0 5px 0' }}>{conv.name}</h4>
                <p style={{ margin: 0, fontSize: '0.9em', color: '#666' }}>
                  {conv.lastMessage}
                </p>
              </div>
              {/* Video Call Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartVideoCall(conv);
                }}
                style={{
                  padding: '8px 12px',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1.2em',
                }}
                title="Start video call"
              >
                📞
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Chat Area */}
      <div style={{ flex: 1 }}>
        {selectedUser ? (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                paddingBottom: '10px',
                borderBottom: '1px solid #e0e0e0',
              }}
            >
              <h2>{selectedUser.name}</h2>
              <button
                onClick={() => setVideoCallOpen(true)}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: 'bold',
                }}
              >
                📞 Start Video Call
              </button>
            </div>

            {/* Your existing chat messages would go here */}
            <div style={{ height: '400px', background: '#f5f5f5', borderRadius: '8px', padding: '20px' }}>
              <p style={{ color: '#999' }}>Chat messages would display here...</p>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', paddingTop: '40px' }}>
            <p style={{ color: '#999' }}>Select a conversation to start chatting</p>
          </div>
        )}
      </div>

      {/* Video Call Modal - Always Ready */}
      <VideoCallModal
        userId={user?.uid}
        userName={user?.displayName || 'User'}
        isOpen={videoCallOpen}
        onClose={() => setVideoCallOpen(false)}
        initialRecipientId={selectedUser?.id}
        initialRecipientName={selectedUser?.name}
      />
    </div>
  );
}

/**
 * INTEGRATION CHECKLIST
 * 
 * ✅ Step 1: Import VideoCallModal
 *    import VideoCallModal from '../components/chat/VideoCallModal';
 * 
 * ✅ Step 2: Add state for video call
 *    const [videoCallOpen, setVideoCallOpen] = useState(false);
 *    const [selectedUser, setSelectedUser] = useState(null);
 * 
 * ✅ Step 3: Add video call button to UI
 *    <button onClick={() => setVideoCallOpen(true)}>
 *      📞 Video Call
 *    </button>
 * 
 * ✅ Step 4: Include VideoCallModal at end of render
 *    <VideoCallModal
 *      userId={user.uid}
 *      userName={user.displayName}
 *      isOpen={videoCallOpen}
 *      onClose={() => setVideoCallOpen(false)}
 *      initialRecipientId={selectedUser?.id}
 *      initialRecipientName={selectedUser?.name}
 *    />
 * 
 * ✅ Step 5: Make sure Socket.IO is initialized
 *    Already done in AuthContext via initSocketConnection()
 * 
 * ✅ Step 6: Test with two browser windows
 *    1. Open app in 2 different browsers/tabs
 *    2. Log in as different users
 *    3. Click video call button
 *    4. Test audio/video/screen share
 */
