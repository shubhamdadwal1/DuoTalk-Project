# 🔧 Developer Reference Card

## Quick File Locations

### Chat Component
```
frontend/src/components/chat/RealTimeChat.jsx
```
Main component for real-time messaging

### Chat Styles
```
frontend/src/components/chat/RealTimeChat.css
```
All styling for chat UI

### Backend Socket
```
backend/socket.js
```
Socket.IO event handlers

### Backend Server
```
backend/server.js
```
Express server setup

### Socket Service
```
frontend/src/services/socketIO.js
```
Socket client wrapper

---

## Key Code Snippets

### 1. Preventing Duplicates
```javascript
const messageIdsRef = useRef(new Set())

// In handleReceiveMessage:
if (messageIdsRef.current.has(messageId)) return
messageIdsRef.current.add(messageId)
```

### 2. Unique Message ID
```javascript
const messageId = `msg_${Date.now()}_${Math.random()}`
```

### 3. Convert File to Base64
```javascript
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
```

### 4. Send Message with Media
```javascript
const mediaBase64 = await fileToBase64(mediaFile)

emitEvent(SocketEvents.SEND_MESSAGE, {
  conversationId,
  senderFirebaseUID: user.uid,
  receiverFirebaseUID: otherUser.firebaseUID,
  text: messageText,
  media: mediaBase64,
  mediaType: mediaFile?.type || '',
  fileName: mediaFile?.name || '',
}, callback)
```

### 5. Display Image in Message
```jsx
{msg.media && msg.mediaType?.startsWith('image/') && (
  <div className="message-media-container">
    <img src={msg.media} alt="Shared media" className="message-image" />
  </div>
)}
```

### 6. Display Video in Message
```jsx
{msg.media && msg.mediaType?.startsWith('video/') && (
  <div className="message-media-container">
    <video src={msg.media} className="message-video" controls />
  </div>
)}
```

---

## Common Modifications

### Add File Size Limit
```javascript
// In handleMediaSelect:
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

if (file.size > MAX_SIZE) {
  alert('File too large. Max 10MB.')
  return
}
```

### Add Image Compression
```javascript
// Install: npm install browser-image-compression
import imageCompression from 'browser-image-compression'

const compressedFile = await imageCompression(file, {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
})
```

### Add Video Duration Check
```javascript
const getVideoDuration = (file) => {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.src = URL.createObjectURL(file)
    video.onloadedmetadata = () => {
      resolve(video.duration)
    }
  })
}
```

### Add Audio Support
```javascript
// Add to file type check:
const isAudio = file.type.startsWith('audio/')

// In message rendering:
{msg.media && msg.mediaType?.startsWith('audio/') && (
  <audio src={msg.media} className="message-audio" controls />
)}
```

---

## Debugging Tips

### Check Console for Messages
```javascript
console.log('✅ Message sent:', messageId)
console.log('⚠️ Duplicate blocked:', messageId)
console.log('📊 Message IDs tracked:', messageIdsRef.current.size)
```

### Monitor State Updates
```javascript
console.log('📝 State update:', messages.length, 'messages')
console.log('🆔 IDs:', messages.map(m => m.id))
```

### Check Socket Events
```javascript
// In socketIO.js:
emitEvent(event, data, (response) => {
  console.log(`✅ ${event} response:`, response)
})

onEvent(event, (data) => {
  console.log(`📨 ${event}:`, data)
})
```

### Monitor Media Upload
```javascript
console.log('📸 Media selected:', mediaFile.name, mediaFile.size)
console.log('📤 Media base64 length:', mediaBase64.length)
console.log('📉 Size increase:', (mediaBase64.length / mediaFile.size).toFixed(2))
```

---

## Testing Commands

### Test Duplicate Prevention
```javascript
// Send 3 messages quickly in console:
for(let i=0; i<3; i++) {
  emitEvent(SocketEvents.SEND_MESSAGE, {text: 'test'})
}
// Check console: Should see 3 unique IDs
```

### Test State Management
```javascript
// Open DevTools
// Send message and watch React component state
// Right-click component → "Inspect"
// Watch "messages" state update
```

### Test Media Conversion
```javascript
// In console:
const file = /* selected file */
const base64 = await fileToBase64(file)
console.log('Size before:', file.size)
console.log('Size after:', base64.length)
```

---

## Performance Optimization

### Current
- Real-time delivery to online users
- Base64 encoding for files
- Optimistic UI updates
- Memory-efficient deduplication

### Possible Improvements
1. **Implement chunking** for large files
   - Send in 1MB chunks
   - Reduce base64 overhead
   
2. **Add caching**
   - Cache recent messages
   - Cache user avatars
   
3. **Implement pagination**
   - Load 50 messages initially
   - Load more on scroll
   
4. **Add compression**
   - Image: JPG optimization
   - Video: H.264 encoding
   
5. **Use CDN**
   - Store media in S3/CloudFront
   - Send URL instead of base64

---

## State Management Reference

### Message Object
```javascript
{
  id: "msg_1234567890_0.456",
  text: "Hello world",
  media: "data:image/jpeg;base64,...",    // Optional
  mediaType: "image/jpeg",                 // Optional
  fileName: "photo.jpg",                   // Optional
  senderId: "user123",
  senderName: "John Doe",
  timestamp: 1234567890,
  status: "delivered",                     // sent, delivered, error
  isOwn: true,
}
```

### Component State
```javascript
const [messages, setMessages] = useState([])
const [messageText, setMessageText] = useState('')
const [isLoading, setIsLoading] = useState(false)
const [mediaFile, setMediaFile] = useState(null)
const [mediaPreview, setMediaPreview] = useState(null)
const messageIdsRef = useRef(new Set())
```

---

## Event Types Reference

### Socket Events Sent
```
SocketEvents.SEND_MESSAGE
SocketEvents.TYPING
SocketEvents.SEEN
```

### Socket Events Received
```
SocketEvents.RECEIVE_MESSAGE
SocketEvents.TYPING
SocketEvents.SEEN
```

### Event Structure
```javascript
// Send:
emitEvent(event, data, (response) => {
  // Handle response
})

// Receive:
onEvent(event, (data) => {
  // Handle event
})
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Cannot read media of undefined" | mediaFile null | Check null before converting |
| "Duplicate messages showing" | messageIdsRef not used | Add to ref before state update |
| "Video won't play" | Wrong codec | Use MP4 with H.264 |
| "Image won't display" | Base64 format wrong | Use `data:image/*;base64,...` |
| "Socket not connected" | Not initialized | Call initSocketConnection() |
| "Media too slow" | Base64 size | Add compression or chunking |

---

## Deployment Checklist

### Before Deploy
- [ ] All features working in dev
- [ ] No console errors
- [ ] All tests passing
- [ ] Performance acceptable
- [ ] Database backed up

### During Deploy
- [ ] Stop old services
- [ ] Pull latest code
- [ ] npm install (if needed)
- [ ] Start backend
- [ ] Start frontend
- [ ] Verify in browser

### After Deploy
- [ ] Check console for errors
- [ ] Test core features
- [ ] Check socket connection
- [ ] Monitor server logs
- [ ] Get user feedback

---

## Git Commit Messages

### Format
```
[type] component: brief description

More detailed explanation if needed
```

### Examples
```
[fix] RealTimeChat: prevent duplicate messages
[feat] RealTimeChat: add image sharing support
[refactor] RealTimeChat: optimize message state updates
[perf] socket.js: improve event handler performance
```

---

## Environment Variables

### Backend
```
MONGODB_URI=mongodb://...
FIREBASE_CREDENTIALS=...
PORT=3001
```

### Frontend
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_SERVER_URL=http://localhost:3001
```

---

## Documentation Files

Location of all docs:
- **COMPLETE_OVERVIEW.md** - This complete guide
- **TESTING_GUIDE.md** - How to test
- **BEFORE_AFTER_COMPARISON.md** - What changed
- **CHAT_FIXES_SUMMARY.md** - Quick summary
- **MEDIA_SUPPORT_COMPLETE.md** - Media details
- **CHAT_UI_GUIDE.md** - UI reference

---

## Quick Commands

### Start Services
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Run Tests
```bash
npm test
```

### Build for Production
```bash
# Backend
npm run build

# Frontend
npm run build
```

### Check Logs
```bash
# Backend logs
cat backend.log

# Frontend logs
# Check browser DevTools Console
```

---

## Useful Links

- Firebase Console: https://console.firebase.google.com
- MongoDB Atlas: https://cloud.mongodb.com
- Socket.IO Docs: https://socket.io/docs
- React Docs: https://react.dev
- Express Docs: https://expressjs.com

---

## Support Resources

1. **Documentation**: Check .md files in project root
2. **Code Comments**: Search for `TODO:` or `FIXME:`
3. **Git History**: `git log --oneline`
4. **Stack Overflow**: Search "[react] socket.io chat"
5. **Community**: Check GitHub discussions

---

**Last Updated**: April 28, 2026
**Version**: 1.1.0
**Maintainer**: Development Team

Good luck! 🚀
