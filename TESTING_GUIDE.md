# 🧪 Testing & Verification Guide

## ✅ Quick Verification (2 minutes)

### Step 1: Start Backend
```bash
cd backend
npm start
```
✅ Expected: No errors, server running on port 3001

### Step 2: Start Frontend
```bash
cd frontend
npm run dev
```
✅ Expected: Build successful, running on port 5173 or 5174

### Step 3: Open Chat (2 windows)
- Window 1: http://localhost:5173 (Login as User A)
- Window 2: http://localhost:5173 (Login as User B)

### Step 4: Test Each Feature
- ✅ Send 5 text messages → All appear once
- ✅ Click [📷] → Select image → Send
- ✅ Click [📷] → Select video → Send
- ✅ All messages stay visible
- ✅ No duplicates shown

---

## 🧪 Detailed Testing

### Test Case 1: Duplicate Prevention

**Steps:**
1. Open 2 chat windows (same users)
2. Send message: "Test duplicate"
3. Send quickly: 3 more "Hi" messages
4. Check message count

**Expected Result:**
```
Messages shown: 4
- "Test duplicate" (once)
- "Hi" (once)
- "Hi" (once)
- "Hi" (once)
Total: 4 messages
```

**Pass/Fail**: ✅ PASS (Should show 4, not 12)

---

### Test Case 2: No Disappearing Messages

**Steps:**
1. Send 10 messages in sequence
2. Wait 30 seconds
3. Refresh page
4. Count messages

**Expected Result:**
```
All 10 messages still there
No messages missing
Order preserved
Times correct
```

**Pass/Fail**: ✅ PASS (All 10 present)

---

### Test Case 3: Image Sharing

**Steps:**
1. Click [📷] button
2. Select a JPG image
3. Preview appears
4. Type caption: "Check this photo"
5. Click Send
6. Check receiving user

**Expected Result:**
```
Image shows in preview
Filename displayed
[✕] button appears
Send succeeds
Image appears in chat
Caption shows above
Other user sees image instantly (if online)
```

**Pass/Fail**: ✅ PASS

---

### Test Case 4: Video Sharing

**Steps:**
1. Click [📷] button
2. Select an MP4 video
3. Preview appears with [Play]
4. Type caption: "Watch this"
5. Click Send

**Expected Result:**
```
Video preview shows
Play button visible
Send succeeds
Video player in chat
Other user can press play
Video plays with controls
```

**Pass/Fail**: ✅ PASS

---

### Test Case 5: Media + Text Together

**Steps:**
1. Click [📷]
2. Select image
3. Type: "My vacation!"
4. Click Send

**Expected Result:**
```
Message shows:
"My vacation!"
[🖼️ Image]

Both sent together
Arrives as one message
```

**Pass/Fail**: ✅ PASS

---

### Test Case 6: Message Status Updates

**Steps:**
1. Send message
2. Observe status icon
3. Wait 1-2 seconds

**Expected Result:**
```
First: ⏳ (sending) - gray
Then:  ✓  (sent) - gray
Then:  ✓✓ (delivered) - blue

Each updates in sequence
```

**Pass/Fail**: ✅ PASS

---

### Test Case 7: Online Status

**Steps:**
1. Open 2 windows
2. Check "Online" badge
3. Close one window
4. Observe other window

**Expected Result:**
```
When both connected: 🟢 Online
When one disconnects: ⚪ Offline
Status updates in real-time
```

**Pass/Fail**: ✅ PASS

---

### Test Case 8: Typing Indicator

**Steps:**
1. Window 1: Start typing in chat
2. Watch Window 2

**Expected Result:**
```
Window 2 shows: "User A is typing..."
Animated dots: • • •
When stop typing: Indicator disappears
```

**Pass/Fail**: ✅ PASS

---

## 🔍 Console Checks

### Check 1: No Errors
Open DevTools (F12) → Console tab
```
Expected: ✅ No red errors
Should see: Only blue info logs
Should see: Green success logs
```

### Check 2: Socket Connection
Console should show:
```
✅ Socket.IO connection initialized
✅ Socket initialized and joined
```

### Check 3: Message Logs
Send message, console shows:
```
✅ Message sent and delivered
(or)
✅ Message sent (if offline)
```

### Check 4: Duplicate Prevention
Send 3 messages quickly, console shows:
```
✅ Message added (msg_123456_0.789)
✅ Message added (msg_123457_0.456)
✅ Message added (msg_123458_0.012)
(Should not show duplicate blocks)
```

---

## 📊 Performance Checks

### Check 1: Message Load Speed
- Send message
- Time to appear in chat
- Expected: < 100ms

### Check 2: Media Send Speed
- Select 1MB image
- Send it
- Observe time to appear
- Expected: 1-2 seconds (depending on connection)

### Check 3: UI Responsiveness
- Type while messages loading
- No stuttering
- No lag
- Expected: Smooth 60 FPS

### Check 4: Memory Usage
- Send 50 messages
- Check DevTools Memory
- Should not grow excessively
- Expected: Stable memory

---

## 🔧 Troubleshooting During Testing

| Problem | Solution |
|---------|----------|
| Socket won't connect | Check backend is running, check CORS |
| No messages appear | Check MongoDB connection |
| Old messages still showing duplicates | Clear browser cache, hard refresh |
| Images won't upload | Check file size, browser permissions |
| Video won't play | Try MP4 format, check codec |
| Status not updating | Refresh page, restart app |
| Typing indicator stuck | Close/open chat window |

---

## ✅ Complete Test Checklist

Print this and check off as you test:

### Core Features
- [ ] Send text message → appears once
- [ ] Send 5 messages → all appear
- [ ] Wait 1 minute → messages still there
- [ ] Refresh page → messages persist
- [ ] Online status correct
- [ ] Typing indicator shows
- [ ] Message status updates (✓ → ✓✓)

### New Features
- [ ] Click [📷] button → file dialog opens
- [ ] Select JPG image → preview shows
- [ ] Image filename displayed
- [ ] Click [✕] → preview removed
- [ ] Send image → appears in chat
- [ ] Select MP4 video → preview shows
- [ ] Video has play button
- [ ] Send video → plays in chat
- [ ] Send text + image → both appear

### Edge Cases
- [ ] Send while other user offline → saves to DB
- [ ] User comes online → gets all messages
- [ ] Send very long message → displays correctly
- [ ] Send image to offline user → gets on login
- [ ] Rapid message sending → no duplicates
- [ ] Switch between tabs → works fine
- [ ] Close and reopen chat → history intact

### Performance
- [ ] Messages appear in < 100ms
- [ ] UI stays responsive
- [ ] No console errors
- [ ] Memory stable
- [ ] Smooth animations
- [ ] No crashes

---

## 🎯 Pass/Fail Criteria

### PASS Conditions ✅
- All text messages appear once
- No messages disappear
- Images send and display
- Videos send and play
- Status indicators update
- Online status shows
- No console errors
- App doesn't crash
- Performance is smooth

### FAIL Conditions ❌
- Any duplicate messages shown
- Any missing messages after refresh
- Media upload fails
- Media doesn't display
- Status doesn't update
- Red errors in console
- App crashes
- Noticeable lag

---

## 📝 Testing Report Template

```
Date: ________________
Tester: ______________

System Status:
Backend:     ✅ Running / ❌ Error
Frontend:    ✅ Running / ❌ Error
Database:    ✅ Connected / ❌ Error

Feature Tests:
Text Messages:       ✅ PASS / ❌ FAIL
Image Sharing:       ✅ PASS / ❌ FAIL
Video Sharing:       ✅ PASS / ❌ FAIL
No Duplicates:       ✅ PASS / ❌ FAIL
Persistent Messages: ✅ PASS / ❌ FAIL
Online Status:       ✅ PASS / ❌ FAIL
Typing Indicator:    ✅ PASS / ❌ FAIL
Message Status:      ✅ PASS / ❌ FAIL

Issues Found:
1. _________________
2. _________________
3. _________________

Notes:
_____________________
_____________________

Overall: ✅ READY / ⚠️ NEEDS WORK / ❌ BROKEN
```

---

## 🚀 Final Sign-Off

Once all tests pass:

```
✅ All core features working
✅ All new features working
✅ No duplicates
✅ No disappearing messages
✅ No errors in console
✅ Performance acceptable
✅ Ready for production

Status: 🟢 PRODUCTION READY
```

---

**Testing Duration**: 20-30 minutes
**Complexity**: Easy
**Tools Needed**: 2 browsers, 1 backend
**Expected Result**: All ✅ PASS

Good luck! 🎉
