import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCheck,
  Download,
  MessageCircle,
  Mic,
  MicOff,
  Paperclip,
  Phone,
  PhoneOff,
  Search,
  Send,
  Trash2,
  Video,
  VideoOff,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { conversationAPI, mediaAPI, presenceAPI, profileAPI } from '../../services/api';
import { SocketEvents, initSocketConnection, joinSocketUser, waitForSocketConnection } from '../../services/socketIO';

const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_UPLOAD_BYTES = 25 * 1024 * 1024;
const MESSAGE_CACHE_PREFIX = 'duotalk-message-cache:';
const WEBRTC_CONFIG = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
};

function buildInitials(name = '') {
  const trimmed = String(name || '').trim();
  if (!trimmed) return 'U';
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatPresence(person) {
  if (person?.typing) return 'Typing...';
  if (person?.isOnline) return 'Active now';
  if (person?.lastSeen) return `Last seen ${formatTime(person.lastSeen)}`;
  return 'Offline';
}

function buildConversationKey(a, b) {
  return [a, b].filter(Boolean).sort().join(':');
}

function messagePreview(message) {
  if (!message) return '';
  if (message.deletedForEveryone) return 'This message was deleted.';
  if (message.text) return message.text;
  if (message.mediaType?.startsWith('video/')) return 'Video';
  if (message.media) return 'Image';
  return '';
}

function upsertConversation(items, nextConversation) {
  const conversationId = nextConversation._id || nextConversation.conversationId || nextConversation.key;
  const filtered = items.filter((item) => (item._id || item.conversationId || item.key) !== conversationId);
  return [nextConversation, ...filtered];
}

function upsertMessage(items, nextMessage) {
  const nextId = String(nextMessage._id || nextMessage.id);
  const existingIndex = items.findIndex((item) => String(item._id || item.id) === nextId);
  if (existingIndex >= 0) {
    return items.map((item, index) => (index === existingIndex ? { ...item, ...nextMessage } : item));
  }
  return [...items, nextMessage].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
}

function replaceMessage(items, previousId, nextMessage) {
  const seenIds = new Set();
  return items
    .map((item) => (String(item._id || item.id) === String(previousId) ? nextMessage : item))
    .filter((item) => {
      const messageId = String(item._id || item.id);
      if (seenIds.has(messageId)) {
        return false;
      }
      seenIds.add(messageId);
      return true;
    })
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
}

function mergeByFirebaseUID(items, person) {
  if (!person?.firebaseUID) return items;
  const exists = items.some((item) => item.firebaseUID === person.firebaseUID);
  if (!exists) return [person, ...items];
  return items.map((item) => (item.firebaseUID === person.firebaseUID ? { ...item, ...person } : item));
}

function mergePeopleLists(...lists) {
  return lists
    .flat()
    .filter(Boolean)
    .reduce((accumulator, person) => mergeByFirebaseUID(accumulator, person), []);
}

function excludeCurrentUser(items, currentFirebaseUID) {
  return items.filter((item) => item?.firebaseUID && item.firebaseUID !== currentFirebaseUID);
}

function resolveOtherUser(candidate, fallback, currentFirebaseUID) {
  if (candidate?.firebaseUID && candidate.firebaseUID !== currentFirebaseUID) {
    return fallback?.firebaseUID === candidate.firebaseUID ? { ...candidate, ...fallback } : candidate;
  }
  if (fallback?.firebaseUID && fallback.firebaseUID !== currentFirebaseUID) {
    return fallback;
  }
  return candidate?.firebaseUID === currentFirebaseUID ? null : candidate || fallback || null;
}

function mergeMessagesPreservingPending(currentItems = [], nextItems = []) {
  const nextById = new Map(nextItems.map((item) => [String(item._id || item.id), item]));
  const pendingItems = currentItems.filter((item) => {
    const messageId = String(item._id || item.id);
    return messageId.startsWith('temp:') && !nextById.has(messageId);
  });

  return [...nextItems, ...pendingItems].sort(
    (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
  );
}

function withTimeout(promise, fallbackValue, timeoutMs = 2500) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      window.setTimeout(() => resolve(fallbackValue), timeoutMs);
    }),
  ]);
}

function emitWithAck(socket, eventName, payload, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket is not connected.'));
      return;
    }

    let settled = false;
    const timerId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('Socket send timed out.'));
    }, timeoutMs);

    socket.emit(eventName, payload, (response) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timerId);
      if (response?.ok) {
        resolve(response.payload);
        return;
      }
      reject(new Error(response?.error || 'Could not send the message.'));
    });
  });
}

function readMessageCache(conversationId) {
  if (typeof window === 'undefined' || !conversationId) return [];
  try {
    const raw = window.localStorage.getItem(`${MESSAGE_CACHE_PREFIX}${conversationId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeMessageCache(conversationId, messages) {
  if (typeof window === 'undefined' || !conversationId) return;
  try {
    window.localStorage.setItem(
      `${MESSAGE_CACHE_PREFIX}${conversationId}`,
      JSON.stringify(Array.isArray(messages) ? messages.slice(-200) : [])
    );
  } catch {
    // Ignore storage errors so live chat still works.
  }
}

function removePreviewMessages(items = []) {
  return items.filter((message) => !String(message._id || message.id).startsWith('preview:'));
}

function buildPreviewMessage(conversation, currentFirebaseUID, selectedContactId) {
  if (!conversation?._id || !conversation?.lastMessage) return null;

  const unreadBy = Array.isArray(conversation.unreadBy) ? conversation.unreadBy : [];
  const senderFirebaseUID = unreadBy.includes(currentFirebaseUID)
    ? selectedContactId
    : currentFirebaseUID;

  return {
    _id: `preview:${conversation._id}`,
    id: `preview:${conversation._id}`,
    conversationId: conversation._id,
    senderFirebaseUID,
    text: conversation.lastMessage,
    media: '',
    mediaType: '',
    fileName: '',
    readBy: senderFirebaseUID === currentFirebaseUID ? [currentFirebaseUID] : [],
    deletedForEveryone: false,
    createdAt: conversation.lastMessageTime || conversation.updatedAt || conversation.createdAt || new Date().toISOString(),
    pending: false,
    preview: true,
  };
}

export default function ProfileMessagesView({ firebaseUser, profile, availableUsers = [], onOpenProfile }) {
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(null);
  const [typingByUserId, setTypingByUserId] = useState({});
  const [incomingCall, setIncomingCall] = useState(null);
  const [callState, setCallState] = useState('idle');
  const [callPeerProfile, setCallPeerProfile] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const socketRef = useRef(null);
  const sendingRef = useRef(false);
  const threadEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const selectedContactIdRef = useRef('');
  const hydratedConversationIdRef = useRef('');
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const callPeerIdRef = useRef('');
  const activeCallConversationIdRef = useRef('');
  const callStateRef = useRef('idle');
  const incomingCallRef = useRef(null);
  const currentUserContactRef = useRef(null);
  const peopleDirectoryRef = useRef([]);
  const contactsRef = useRef([]);
  const conversationsRef = useRef([]);
  const messagesRef = useRef([]);

  const currentUserContact = useMemo(() => ({
    firebaseUID: firebaseUser?.uid,
    name: profile?.name || firebaseUser?.displayName || 'You',
    username: profile?.username || (firebaseUser?.email ? firebaseUser.email.split('@')[0] : 'you'),
    profileImage: profile?.profileImage || firebaseUser?.photoURL || '',
    photoURL: profile?.profileImage || firebaseUser?.photoURL || '',
    bio: profile?.bio || '',
    isOnline: true,
    lastSeen: new Date().toISOString(),
  }), [firebaseUser?.displayName, firebaseUser?.email, firebaseUser?.photoURL, firebaseUser?.uid, profile]);

  const directoryContacts = useMemo(() => {
    const seededUsers = Array.isArray(availableUsers)
      ? availableUsers.filter((person) => person?.firebaseUID && person.firebaseUID !== firebaseUser?.uid)
      : [];
    const conversationUsers = conversations.map((conversation) => conversation.otherUser).filter(Boolean);
    return excludeCurrentUser(
      mergePeopleLists(contacts, seededUsers, conversationUsers),
      firebaseUser?.uid
    );
  }, [availableUsers, contacts, conversations, firebaseUser?.uid]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  useEffect(() => {
    currentUserContactRef.current = currentUserContact;
  }, [currentUserContact]);

  useEffect(() => {
    peopleDirectoryRef.current = directoryContacts;
  }, [directoryContacts]);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const findPersonByFirebaseUID = (firebaseUID) => {
    if (!firebaseUID) return null;

    return (
      peopleDirectoryRef.current.find((person) => person.firebaseUID === firebaseUID) ||
      contactsRef.current.find((person) => person.firebaseUID === firebaseUID) ||
      conversationsRef.current.find((conversation) => conversation.otherUser?.firebaseUID === firebaseUID)?.otherUser ||
      (Array.isArray(availableUsers) ? availableUsers.find((person) => person?.firebaseUID === firebaseUID) : null) ||
      null
    );
  };

  const stopMediaStream = (stream) => {
    stream?.getTracks?.().forEach((track) => track.stop());
  };

  const attachVideoElements = () => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current || null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current || null;
    }
  };

  const flushPendingIceCandidates = async () => {
    const peer = peerConnectionRef.current;
    if (!peer || !peer.remoteDescription) return;

    const queuedCandidates = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];
    for (const candidate of queuedCandidates) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Ignore invalid late ICE candidates.
      }
    }
  };

  const syncLocalTrackState = () => {
    const stream = localStreamRef.current;
    stream?.getAudioTracks?.().forEach((track) => {
      track.enabled = !isMuted;
    });
    stream?.getVideoTracks?.().forEach((track) => {
      track.enabled = !isCameraOff;
    });
  };

  const teardownCall = ({ preserveIncoming = false } = {}) => {
    peerConnectionRef.current?.close?.();
    peerConnectionRef.current = null;

    stopMediaStream(localStreamRef.current);
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    pendingIceCandidatesRef.current = [];
    callPeerIdRef.current = '';
    activeCallConversationIdRef.current = '';

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setCallState(preserveIncoming ? 'incoming' : 'idle');
    setCallPeerProfile(null);
    setIsMuted(false);
    setIsCameraOff(false);
    if (!preserveIncoming) {
      setIncomingCall(null);
    }
  };

  const ensureLocalStream = async () => {
    if (localStreamRef.current) {
      syncLocalTrackState();
      attachVideoElements();
      return localStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    localStreamRef.current = stream;
    syncLocalTrackState();
    attachVideoElements();
    return stream;
  };

  const createPeerConnection = (peerId) => {
    peerConnectionRef.current?.close?.();

    const peer = new RTCPeerConnection(WEBRTC_CONFIG);
    peerConnectionRef.current = peer;
    callPeerIdRef.current = peerId;
    remoteStreamRef.current = new MediaStream();
    attachVideoElements();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current);
      });
    }

    peer.onicecandidate = (event) => {
      if (!event.candidate || !socketRef.current || !callPeerIdRef.current) return;
      socketRef.current.emit(SocketEvents.ICE_CANDIDATE, {
        toUserId: callPeerIdRef.current,
        candidate: event.candidate.toJSON(),
      });
    };

    peer.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        remoteStreamRef.current = stream;
      } else {
        event.track && remoteStreamRef.current?.addTrack(event.track);
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
      setCallState('in-call');
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') {
        setCallState('in-call');
        return;
      }

      if (['disconnected', 'failed', 'closed'].includes(peer.connectionState)) {
        teardownCall();
      }
    };

    return peer;
  };

  const refreshMessaging = async (nextFirebaseUID = firebaseUser?.uid) => {
    if (!nextFirebaseUID) return;

    setLoading(true);
    try {
      const [contactsResult, conversationsResult] = await Promise.all([
        withTimeout(profileAPI.getContacts(nextFirebaseUID).catch(() => []), []),
        withTimeout(conversationAPI.getAll(nextFirebaseUID).catch(() => []), []),
      ]);

      const normalizedConversations = Array.isArray(conversationsResult) ? conversationsResult : [];
      const conversationUsers = normalizedConversations
        .map((conversation) => conversation.otherUser)
        .filter(Boolean);
      const seededUsers = Array.isArray(availableUsers)
        ? availableUsers.filter((person) => person?.firebaseUID && person.firebaseUID !== nextFirebaseUID)
        : [];
      const mergedContacts = excludeCurrentUser(
        mergePeopleLists(Array.isArray(contactsResult) ? contactsResult : [], conversationUsers, seededUsers),
        nextFirebaseUID
      );

      setContacts(mergedContacts);
      setConversations(normalizedConversations);
      setSelectedContactId((current) =>
        current ||
        normalizedConversations?.[0]?.otherUser?.firebaseUID ||
        mergedContacts?.[0]?.firebaseUID ||
        ''
      );
    } catch (error) {
      toast.error(error.message || 'Could not load chats.', { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = useMemo(() => {
    if (!searchValue.trim()) return directoryContacts;
    const needle = searchValue.toLowerCase();
    return directoryContacts.filter((person) =>
      [person.name, person.username]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [directoryContacts, searchValue]);

  const selectedContact = useMemo(
    () => directoryContacts.find((person) => person.firebaseUID === selectedContactId) || null,
    [directoryContacts, selectedContactId]
  );

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.otherUser?.firebaseUID === selectedContactId) || null,
    [conversations, selectedContactId]
  );

  useEffect(() => {
    if (!activeConversation?._id) return;
    writeMessageCache(activeConversation._id, messages);
  }, [activeConversation?._id, messages]);

  useEffect(() => {
    if (!activeConversation?._id) return;
    if (hydratedConversationIdRef.current === activeConversation._id) return;

    hydratedConversationIdRef.current = activeConversation._id;
    if (!Array.isArray(activeConversation.recentMessages) || activeConversation.recentMessages.length === 0) return;
    setMessages(removePreviewMessages(activeConversation.recentMessages));
  }, [activeConversation?._id]);

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setLoading(false);
    }
  }, [firebaseUser?.uid]);

  useEffect(() => {
    if (!firebaseUser?.uid || !Array.isArray(availableUsers) || availableUsers.length === 0) {
      if (firebaseUser?.uid) {
        setLoading(false);
      }
      return;
    }

    const seededUsers = availableUsers
      .filter((person) => person?.firebaseUID && person.firebaseUID !== firebaseUser.uid)
      .reduce((accumulator, person) => mergeByFirebaseUID(accumulator, person), []);

    if (seededUsers.length === 0) return;

    setContacts((current) => {
      const merged = [...current];
      return seededUsers.reduce((accumulator, person) => mergeByFirebaseUID(accumulator, person), merged);
    });
    setSelectedContactId((current) => current || seededUsers[0]?.firebaseUID || '');
    setLoading(false);
  }, [availableUsers, firebaseUser?.uid]);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    if (selectedContactId && selectedContactId !== firebaseUser.uid && directoryContacts.some((person) => person.firebaseUID === selectedContactId)) {
      return;
    }
    const firstValidContact = directoryContacts.find((person) => person.firebaseUID && person.firebaseUID !== firebaseUser.uid);
    setSelectedContactId(firstValidContact?.firebaseUID || '');
  }, [directoryContacts, firebaseUser?.uid, selectedContactId]);

  useEffect(() => {
    selectedContactIdRef.current = selectedContactId;
  }, [selectedContactId]);

  useEffect(() => {
    syncLocalTrackState();
    attachVideoElements();
  }, [isMuted, isCameraOff, callState]);

  useEffect(() => {
    if (!activeConversation?._id) {
      hydratedConversationIdRef.current = '';
    }
  }, [activeConversation?._id]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, selectedContactId]);

  useEffect(() => {
    if (!firebaseUser?.uid) return undefined;
    refreshMessaging(firebaseUser.uid);

    const handleFocus = () => {
      refreshMessaging(firebaseUser.uid);
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [firebaseUser?.uid]);

  useEffect(() => {
    if (!firebaseUser?.uid) {
      console.warn('⚠️  ProfileMessagesView: firebaseUser.uid not available');
      return undefined;
    }

    // Initialize socket connection
    const socket = initSocketConnection();
    socketRef.current = socket;

    if (import.meta.env.DEV) {
      console.log('🔌 ProfileMessagesView initializing socket...');
    }

    // Join socket room - non-blocking, don't fail if it times out
    joinSocketUser(firebaseUser.uid)
      .then(() => {
        if (import.meta.env.DEV) {
          console.log('✅ ProfileMessagesView joined socket as user:', firebaseUser.uid);
        }
      })
      .catch((error) => {
        // Don't fail completely - socket will still receive messages via polling
        if (import.meta.env.DEV) {
          console.warn('⚠️  Socket join warning (will use HTTP fallback):', error?.message);
        }
      });

    presenceAPI.update(firebaseUser.uid, true).catch(() => {});

    const handleReceiveMessage = (payload = {}) => {
      const normalizedMessage = payload.message || {
        _id: payload._id || payload.messageId,
        id: payload._id || payload.messageId,
        conversationId: payload.conversationId,
        senderFirebaseUID: payload.senderFirebaseUID || payload.sender?.firebaseUID,
        text: payload.text || '',
        media: payload.media || '',
        mediaType: payload.mediaType || '',
        fileName: payload.fileName || '',
        readBy: Array.isArray(payload.readBy)
          ? payload.readBy
          : (payload.senderFirebaseUID || payload.sender?.firebaseUID) === firebaseUser.uid
            ? [firebaseUser.uid]
            : [],
        deletedForEveryone: !!payload.deletedForEveryone,
        createdAt: payload.createdAt || new Date().toISOString(),
      };
      const messagePeer = payload.otherUser || payload.sender || {
        firebaseUID:
          normalizedMessage.senderFirebaseUID === firebaseUser.uid
            ? selectedContactIdRef.current
            : normalizedMessage.senderFirebaseUID,
      };
      const directoryMatch = findPersonByFirebaseUID(messagePeer?.firebaseUID);
      const otherUser = resolveOtherUser(messagePeer, directoryMatch, firebaseUser.uid);
      if (otherUser?.firebaseUID && otherUser.firebaseUID !== firebaseUser.uid) {
        setContacts((current) => mergeByFirebaseUID(current, { ...otherUser, typing: false }));
      }

      setConversations((current) =>
        upsertConversation(current, {
          _id: payload.conversationId || normalizedMessage.conversationId,
          key: payload.conversationKey || buildConversationKey(firebaseUser.uid, otherUser?.firebaseUID),
          participants: payload.participants || [firebaseUser.uid, otherUser?.firebaseUID].filter(Boolean),
          otherUser,
          recentMessages: normalizedMessage?._id
            ? upsertMessage(
                Array.isArray(current.find((item) => (item._id || item.conversationId || item.key) === (payload.conversationId || normalizedMessage.conversationId))?.recentMessages)
                  ? current.find((item) => (item._id || item.conversationId || item.key) === (payload.conversationId || normalizedMessage.conversationId)).recentMessages
                  : [],
                normalizedMessage
              )
            : [],
          lastMessage: messagePreview(normalizedMessage),
          lastMessageTime: normalizedMessage?.createdAt,
          unreadBy: normalizedMessage?.senderFirebaseUID === firebaseUser.uid ? [] : [firebaseUser.uid],
        })
      );

      if (normalizedMessage?._id) {
        const otherId = otherUser?.firebaseUID;
        const activeSelectedContactId = selectedContactIdRef.current;
        if (!activeSelectedContactId && otherId) {
          setSelectedContactId(otherId);
        }
        if (otherId === activeSelectedContactId || normalizedMessage.senderFirebaseUID === firebaseUser.uid) {
          setMessages((current) => upsertMessage(removePreviewMessages(current), normalizedMessage));
        }
      }
    };

    const handleTyping = ({ fromUserId, isTyping }) => {
      if (!fromUserId) return;
      setTypingByUserId((current) => ({ ...current, [fromUserId]: !!isTyping }));
      setContacts((current) =>
        current.map((person) =>
          person.firebaseUID === fromUserId ? { ...person, typing: !!isTyping } : person
        )
      );
    };

    const handleSeen = ({ readerFirebaseUID, messageIds = [] }) => {
      if (!readerFirebaseUID || messageIds.length === 0) return;
      setMessages((current) =>
        current.map((message) =>
          messageIds.includes(String(message._id || message.id))
            ? {
                ...message,
                readBy: Array.from(new Set([...(message.readBy || []), readerFirebaseUID])),
              }
            : message
        )
      );
    };

    const handleIncomingCall = (payload = {}) => {
      const callerId = payload.callerId || payload.caller?.firebaseUID;
      if (!callerId) return;

      if (callStateRef.current !== 'idle' || callPeerIdRef.current || incomingCallRef.current) {
        socket.emit(SocketEvents.REJECT_CALL, {
          callerId,
          reason: 'busy',
          rejectedBy: currentUserContactRef.current,
        });
        return;
      }

      const callerProfile = payload.caller || findPersonByFirebaseUID(callerId) || { firebaseUID: callerId, name: 'Incoming caller' };
      activeCallConversationIdRef.current = payload.conversationId || '';
      setCallPeerProfile(callerProfile);
      setIncomingCall({
        callerId,
        offer: payload.offer,
        conversationId: payload.conversationId || '',
        caller: callerProfile,
      });
      setCallState('incoming');
    };

    const handleAcceptCall = async (payload = {}) => {
      if (!payload.answer || !peerConnectionRef.current) return;

      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
        await flushPendingIceCandidates();
        const acceptedBy = payload.acceptedBy || findPersonByFirebaseUID(payload.receiverId) || { firebaseUID: payload.receiverId };
        setCallPeerProfile(acceptedBy);
        setCallState('in-call');
      } catch (error) {
        teardownCall();
        toast.error(error.message || 'Could not start the call.', { position: 'top-right' });
      }
    };

    const handleRejectCall = (payload = {}) => {
      teardownCall();
      toast.info(payload.reason === 'busy' ? 'User is busy right now.' : 'Call rejected.', { position: 'top-right' });
    };

    const handleEndCall = () => {
      const hadActiveCall = callState !== 'idle' || incomingCall;
      teardownCall();
      if (hadActiveCall) {
        toast.info('Call ended.', { position: 'top-right' });
      }
    };

    const handleIceCandidate = async ({ candidate } = {}) => {
      if (!candidate) return;

      if (!peerConnectionRef.current || !peerConnectionRef.current.remoteDescription) {
        pendingIceCandidatesRef.current.push(candidate);
        return;
      }

      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Ignore transient ICE failures.
      }
    };

    socket.on(SocketEvents.RECEIVE_MESSAGE, handleReceiveMessage);
    socket.on(SocketEvents.TYPING, handleTyping);
    socket.on(SocketEvents.SEEN, handleSeen);
    socket.on(SocketEvents.INCOMING_CALL, handleIncomingCall);
    socket.on(SocketEvents.ACCEPT_CALL, handleAcceptCall);
    socket.on(SocketEvents.REJECT_CALL, handleRejectCall);
    socket.on(SocketEvents.END_CALL, handleEndCall);
    socket.on(SocketEvents.ICE_CANDIDATE, handleIceCandidate);

    return () => {
      socket.off(SocketEvents.RECEIVE_MESSAGE, handleReceiveMessage);
      socket.off(SocketEvents.TYPING, handleTyping);
      socket.off(SocketEvents.SEEN, handleSeen);
      socket.off(SocketEvents.INCOMING_CALL, handleIncomingCall);
      socket.off(SocketEvents.ACCEPT_CALL, handleAcceptCall);
      socket.off(SocketEvents.REJECT_CALL, handleRejectCall);
      socket.off(SocketEvents.END_CALL, handleEndCall);
      socket.off(SocketEvents.ICE_CANDIDATE, handleIceCandidate);
    };
  }, [firebaseUser?.uid]);

  useEffect(() => {
    if (!firebaseUser?.uid || !selectedContactId) {
      return undefined;
    }

    let cancelled = false;

    const loadConversation = async () => {
      try {
        const conversation = activeConversation || null;
        if (!conversation?._id) {
          return;
        }

        const cachedMessages = readMessageCache(conversation._id);
        if (!cancelled && cachedMessages.length > 0 && messagesRef.current.length === 0) {
          setMessages(removePreviewMessages(cachedMessages));
        }

        const nextMessages = await withTimeout(
          conversationAPI.getMessages(conversation._id),
          cachedMessages,
          2500
        );
        if (cancelled) return;
        const normalizedMessages = Array.isArray(nextMessages) ? nextMessages : cachedMessages;
        if (normalizedMessages.length > 0) {
          setMessages((current) =>
            mergeMessagesPreservingPending(
              removePreviewMessages(current),
              removePreviewMessages(normalizedMessages)
            )
          );
        } else {
          const previewMessage = buildPreviewMessage(conversation, firebaseUser.uid, selectedContactId);
          if (previewMessage) {
            setMessages((current) => {
              const currentWithoutPreview = removePreviewMessages(current);
              return currentWithoutPreview.length > 0 ? currentWithoutPreview : [previewMessage];
            });
          }
        }

        socketRef.current?.emit(SocketEvents.SEEN, {
          conversationId: conversation._id,
          userId: firebaseUser.uid,
        });
      } catch (error) {
        if (!cancelled) {
          // Keep current thread on screen if refresh is slow.
        }
      }
    };

    loadConversation();
    return () => {
      cancelled = true;
    };
  }, [activeConversation, firebaseUser?.uid, selectedContactId]);

  useEffect(() => {
    if (!firebaseUser?.uid || !activeConversation?._id || !selectedContactId) return;

    const unreadIncoming = messages.filter(
      (message) =>
        message.senderFirebaseUID !== firebaseUser.uid &&
        !message.deletedForEveryone &&
        !(message.readBy || []).includes(firebaseUser.uid)
    );

    if (unreadIncoming.length === 0) return;

    socketRef.current?.emit(SocketEvents.SEEN, {
      conversationId: activeConversation._id,
      userId: firebaseUser.uid,
    });
  }, [activeConversation?._id, firebaseUser?.uid, messages, selectedContactId]);

  const handleTypingChange = (value) => {
    setMessageText(value);
    if (!socketRef.current || !firebaseUser?.uid || !selectedContactId) return;

    socketRef.current.emit(SocketEvents.TYPING, {
      conversationId: activeConversation?._id || '',
      fromUserId: firebaseUser.uid,
      toUserId: selectedContactId,
      isTyping: true,
    });

    window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      socketRef.current?.emit(SocketEvents.TYPING, {
        conversationId: activeConversation?._id || '',
        fromUserId: firebaseUser.uid,
        toUserId: selectedContactId,
        isTyping: false,
      });
    }, 1200);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (file.type.startsWith('image/') && file.size > MAX_IMAGE_UPLOAD_BYTES) {
        throw new Error('Image is too large. Use an image under 10 MB.');
      }
      if (file.type.startsWith('video/') && file.size > MAX_VIDEO_UPLOAD_BYTES) {
        throw new Error('Video is too large. Use a video under 25 MB.');
      }
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        throw new Error('Only image and video files are supported.');
      }

      setUploadingMedia(file);
    } catch (error) {
      toast.error(error.message || 'Could not prepare this file.', { position: 'top-right' });
    } finally {
      event.target.value = '';
    }
  };

  const startVideoCall = async () => {
    if (!selectedContactId) return;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera and microphone are not available in this browser.');
      }

      await joinSocketUser(firebaseUser.uid);
      const activeSocket = await waitForSocketConnection();
      socketRef.current = activeSocket;

      setCallPeerProfile(selectedContact || findPersonByFirebaseUID(selectedContactId) || { firebaseUID: selectedContactId });
      setCallState('calling');
      activeCallConversationIdRef.current = activeConversation?._id || '';

      await ensureLocalStream();
      const peer = createPeerConnection(selectedContactId);
      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await peer.setLocalDescription(offer);

      await emitWithAck(activeSocket, SocketEvents.CALL_USER, {
        receiverId: selectedContactId,
        conversationId: activeConversation?._id || '',
        caller: currentUserContact,
        offer,
      });

      setCallState('calling');
    } catch (error) {
      teardownCall();
      toast.error(error.message || 'Could not start the call.', { position: 'top-right' });
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall) return;

    try {
      await joinSocketUser(firebaseUser.uid);
      const activeSocket = await waitForSocketConnection();
      socketRef.current = activeSocket;

      const callerId = incomingCall.callerId;
      setSelectedContactId(callerId);
      setCallPeerProfile(incomingCall.caller || findPersonByFirebaseUID(callerId) || { firebaseUID: callerId });
      setCallState('connecting');

      await ensureLocalStream();
      const peer = createPeerConnection(callerId);
      await peer.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      await flushPendingIceCandidates();

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      await emitWithAck(activeSocket, SocketEvents.ACCEPT_CALL, {
        callerId,
        conversationId: incomingCall.conversationId || activeCallConversationIdRef.current || '',
        answer,
        acceptedBy: currentUserContact,
      });

      setIncomingCall(null);
      setCallState('connecting');
    } catch (error) {
      teardownCall();
      toast.error(error.message || 'Could not accept the call.', { position: 'top-right' });
    }
  };

  const rejectIncomingCall = async () => {
    if (!incomingCall) return;

    try {
      await joinSocketUser(firebaseUser.uid);
      const activeSocket = await waitForSocketConnection();
      socketRef.current = activeSocket;
      await emitWithAck(activeSocket, SocketEvents.REJECT_CALL, {
        callerId: incomingCall.callerId,
        reason: 'rejected',
        rejectedBy: currentUserContact,
      });
    } catch {
      // Ignore signaling errors while rejecting.
    } finally {
      teardownCall();
    }
  };

  const endActiveCall = async () => {
    const peerId = callPeerIdRef.current || incomingCall?.callerId;

    try {
      if (peerId) {
        await joinSocketUser(firebaseUser.uid);
        const activeSocket = await waitForSocketConnection();
        socketRef.current = activeSocket;
        await emitWithAck(activeSocket, SocketEvents.END_CALL, {
          toUserId: peerId,
          reason: 'ended',
        });
      }
    } catch {
      // Ignore signaling errors during teardown.
    } finally {
      teardownCall();
    }
  };

  const toggleMute = () => {
    setIsMuted((current) => !current);
  };

  const toggleCamera = () => {
    setIsCameraOff((current) => !current);
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const text = messageText.trim();
    if (sendingRef.current || sending || (!text && !uploadingMedia) || !firebaseUser?.uid || !selectedContactId) return;

    try {
      sendingRef.current = true;
      setSending(true);

      let conversation = activeConversation;
      if (!conversation?._id) {
        conversation = await conversationAPI.create(firebaseUser.uid, selectedContactId);
        setConversations((current) =>
          upsertConversation(current, {
            ...conversation,
            otherUser: selectedContact,
            key: conversation.key || buildConversationKey(firebaseUser.uid, selectedContactId),
          })
        );
      }

      let mediaUrl = '';
      let mediaType = '';
      let fileName = '';

      if (uploadingMedia) {
        const uploaded = await mediaAPI.uploadChatFile(uploadingMedia);
        mediaUrl = uploaded.url || '';
        mediaType = uploadingMedia.type || '';
        fileName = uploadingMedia.name || '';
      }

      const messagePayload = {
        conversationId: conversation?._id || '',
        senderFirebaseUID: firebaseUser.uid,
        receiverFirebaseUID: selectedContactId,
        text,
        media: mediaUrl,
        mediaType,
        fileName,
      };

      const optimisticId = `temp:${Date.now()}`;
      const optimisticMessage = {
        _id: optimisticId,
        id: optimisticId,
        conversationId: conversation._id,
        senderFirebaseUID: firebaseUser.uid,
        text,
        media: mediaUrl,
        mediaType,
        fileName,
        readBy: [firebaseUser.uid],
        deletedForEveryone: false,
        createdAt: new Date().toISOString(),
        pending: true,
      };

      setMessages((current) => upsertMessage(removePreviewMessages(current), optimisticMessage));
      setConversations((current) => {
        const currentConversation = current.find((item) => (item._id || item.conversationId || item.key) === conversation._id);
        return upsertConversation(current, {
          ...conversation,
          _id: conversation._id,
          key: conversation.key || buildConversationKey(firebaseUser.uid, selectedContactId),
          participants: conversation.participants || [firebaseUser.uid, selectedContactId],
          otherUser: selectedContact,
          recentMessages: upsertMessage(Array.isArray(currentConversation?.recentMessages) ? currentConversation.recentMessages : [], optimisticMessage),
          lastMessage: messagePreview(optimisticMessage),
          lastMessageTime: optimisticMessage.createdAt,
          unreadBy: [],
        });
      });

      let sentPayload = null;
      try {
        // Try Socket.IO if connected, but don't wait too long
        if (socketRef.current?.connected) {
          try {
            if (import.meta.env.DEV) {
              console.log('📤 Trying Socket.IO send...');
            }
            sentPayload = await emitWithAck(socketRef.current, SocketEvents.SEND_MESSAGE, messagePayload, 3000);
            
            if (import.meta.env.DEV) {
              console.log('✅ Message sent via Socket.IO:', sentPayload?.messageId);
            }
          } catch (socketError) {
            if (import.meta.env.DEV) {
              console.warn('⚠️  Socket.IO send failed, trying HTTP API:', socketError?.message);
            }
            sentPayload = null; // Fall through to HTTP
          }
        } else {
          if (import.meta.env.DEV) {
            console.log('📡 Socket not connected, using HTTP API');
          }
        }

        // If socket failed or not connected, use HTTP API
        if (!sentPayload) {
          try {
            if (import.meta.env.DEV) {
              console.log('📡 Sending via HTTP API...');
            }
            
            const restMessage = await conversationAPI.sendMessage(conversation._id, firebaseUser.uid, {
              text,
              receiverFirebaseUID: selectedContactId,
              media: mediaUrl,
              mediaType,
              fileName,
            });
            
            sentPayload = {
              conversationId: conversation._id,
              conversationKey: conversation.key || buildConversationKey(firebaseUser.uid, selectedContactId),
              participants: conversation.participants || [firebaseUser.uid, selectedContactId],
              otherUser: selectedContact,
              sender: currentUserContact,
              message: restMessage,
            };
            
            if (import.meta.env.DEV) {
              console.log('✅ Message sent via HTTP API:', restMessage._id);
            }
          } catch (apiError) {
            console.error('❌ Both Socket.IO and HTTP API failed:', apiError);
            toast.error('Failed to send message. Please check your connection and try again.', {
              position: 'top-right',
              autoClose: 3000,
            });
            throw apiError;
          }
        }
      } catch (error) {
        console.error('❌ Message send error:', error);
        throw error;
      }

      if (sentPayload?.message) {
        const ackOtherUser = resolveOtherUser(sentPayload.otherUser, selectedContact, firebaseUser.uid);
        setConversations((current) => {
          const nextConversationId = sentPayload.conversationId || conversation._id;
          const currentConversation = current.find((item) => (item._id || item.conversationId || item.key) === nextConversationId);
          return upsertConversation(current, {
            _id: nextConversationId,
            key: sentPayload.conversationKey || conversation.key || buildConversationKey(firebaseUser.uid, selectedContactId),
            participants: sentPayload.participants || conversation.participants || [firebaseUser.uid, selectedContactId],
            otherUser: ackOtherUser || selectedContact,
            recentMessages: replaceMessage(
              Array.isArray(currentConversation?.recentMessages) ? currentConversation.recentMessages : [],
              optimisticId,
              sentPayload.message
            ),
            lastMessage: messagePreview(sentPayload.message),
            lastMessageTime: sentPayload.message.createdAt,
            unreadBy: [],
          });
        });
        setMessages((current) => replaceMessage(removePreviewMessages(current), optimisticId, sentPayload.message));
      }

      socketRef.current.emit(SocketEvents.TYPING, {
        conversationId: conversation?._id || '',
        fromUserId: firebaseUser.uid,
        toUserId: selectedContactId,
        isTyping: false,
      });

      setMessageText('');
      setUploadingMedia(null);
    } catch (error) {
      setMessages((current) => current.filter((message) => !String(message._id || message.id).startsWith('temp:')));
      toast.error(error.message || 'Could not send the message.', { position: 'top-right' });
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!activeConversation?._id || !firebaseUser?.uid) return;

    try {
      const deletedMessage = await conversationAPI.deleteMessage(activeConversation._id, messageId, firebaseUser.uid);
      setMessages((current) =>
        current.map((message) =>
          String(message._id || message.id) === String(messageId)
            ? { ...message, ...deletedMessage }
            : message
        )
      );
    } catch (error) {
      toast.error(error.message || 'Could not delete the message.', { position: 'top-right' });
    }
  };

  useEffect(() => () => {
    window.clearTimeout(typingTimeoutRef.current);
    if (callPeerIdRef.current && socketRef.current) {
      socketRef.current.emit(SocketEvents.END_CALL, {
        toUserId: callPeerIdRef.current,
        reason: 'ended',
      });
    }
    teardownCall();
  }, []);

  return (
    <section className="pm-shell">
      <aside className="pm-sidebar">
        <div className="pm-sidebar-head">
          <div>
            <h2>Messages</h2>
            <p>Only added people can chat</p>
          </div>
        </div>

        <label className="pm-search">
          <Search size={16} />
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search contacts"
          />
        </label>

        <div className="pm-contact-list">
          {filteredContacts.length > 0 ? (
            filteredContacts.map((person) => {
              const conversation = conversations.find((item) => item.otherUser?.firebaseUID === person.firebaseUID);
              return (
                <button
                  key={person.firebaseUID}
                  type="button"
                  className={`pm-contact ${selectedContactId === person.firebaseUID ? 'active' : ''}`}
                  onClick={() => setSelectedContactId(person.firebaseUID)}
                >
                  <PresenceAvatar person={person} />
                  <span className="pm-contact-copy">
                    <span className="pm-contact-row">
                      <strong>{person.name}</strong>
                      <small>{formatTime(conversation?.lastMessageTime || person.lastSeen)}</small>
                    </span>
                    <span className="pm-contact-status">
                      {person.typing ? 'Typing...' : (conversation?.lastMessage || formatPresence(person))}
                    </span>
                  </span>
                </button>
              );
            })
          ) : (
            <div className="pm-empty-inline">{loading ? 'Loading contacts...' : 'No added contacts yet.'}</div>
          )}
        </div>
      </aside>

      <div className="pm-chat">
        {selectedContact ? (
          <>
            <header className="pm-chat-head">
              <button type="button" className="pm-chat-user" onClick={() => onOpenProfile?.(selectedContact)}>
                <PresenceAvatar person={selectedContact} />
                <span>
                  <strong>{selectedContact.name}</strong>
                  <small>{typingByUserId[selectedContact.firebaseUID] ? 'Typing...' : formatPresence(selectedContact)}</small>
                </span>
              </button>

              <div className="pm-head-actions">
                <button type="button"><Phone size={17} /></button>
                <button
                  type="button"
                  onClick={startVideoCall}
                  disabled={!selectedContactId || callState !== 'idle'}
                  aria-label="Start video call"
                  title="Start video call"
                >
                  <Video size={17} />
                </button>
              </div>
            </header>

            {incomingCall && (
              <div className="pm-call-popup">
                <div className="pm-call-popup-copy">
                  <strong>Incoming Call</strong>
                  <span>{incomingCall.caller?.name || 'Someone is calling you'}</span>
                </div>
                <div className="pm-call-popup-actions">
                  <button type="button" className="pm-call-accept" onClick={acceptIncomingCall}>
                    Accept
                  </button>
                  <button type="button" className="pm-call-reject" onClick={rejectIncomingCall}>
                    Reject
                  </button>
                </div>
              </div>
            )}

            {callState !== 'idle' && !incomingCall && (
              <div className="pm-call-stage">
                <div className="pm-call-stage-head">
                  <div>
                    <strong>{callPeerProfile?.name || selectedContact?.name || 'Video call'}</strong>
                    <span>
                      {callState === 'calling'
                        ? 'Calling...'
                        : callState === 'connecting'
                          ? 'Connecting...'
                          : 'Live now'}
                    </span>
                  </div>
                  <button type="button" className="pm-call-end-top" onClick={endActiveCall}>
                    <PhoneOff size={16} />
                    End Call
                  </button>
                </div>

                <div className="pm-call-videos">
                  <div className="pm-call-video-card pm-call-remote">
                    <video ref={remoteVideoRef} autoPlay playsInline />
                    <span>{callPeerProfile?.name || selectedContact?.name || 'Remote user'}</span>
                  </div>
                  <div className="pm-call-video-card pm-call-local">
                    <video ref={localVideoRef} autoPlay playsInline muted />
                    <span>You</span>
                  </div>
                </div>

                <div className="pm-call-controls">
                  <button type="button" onClick={toggleMute} className={isMuted ? 'active' : ''}>
                    {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                  <button type="button" onClick={toggleCamera} className={isCameraOff ? 'active' : ''}>
                    {isCameraOff ? <VideoOff size={16} /> : <Video size={16} />}
                    {isCameraOff ? 'Camera Off' : 'Camera On'}
                  </button>
                  <button type="button" className="pm-call-end" onClick={endActiveCall}>
                    <PhoneOff size={16} />
                    End Call
                  </button>
                </div>
              </div>
            )}

            <div className="pm-thread">
              {messages.length > 0 ? (
                <>
                  {messages.map((message) => {
                    const mine = message.senderFirebaseUID === firebaseUser.uid;
                    return (
                      <article key={message._id || message.id} className={`pm-bubble ${mine ? 'mine' : ''}`}>
                        {message.deletedForEveryone ? (
                          <p className="pm-deleted-copy">This message was deleted.</p>
                        ) : (
                          <>
                            {message.text && <p>{message.text}</p>}
                            {message.media && <MediaAttachment message={message} />}
                          </>
                        )}
                        <span>
                          {formatTime(message.deletedAt || message.createdAt)}
                          {mine && <MessageStateIcon readBy={message.readBy} senderFirebaseUID={firebaseUser.uid} />}
                          {mine && !message.deletedForEveryone && (
                            <button
                              type="button"
                              className="pm-inline-action"
                              onClick={() => handleDeleteMessage(message._id || message.id)}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </span>
                      </article>
                    );
                  })}
                  <div ref={threadEndRef} className="pm-thread-end" aria-hidden="true" />
                </>
              ) : (
                <div className="pm-empty-state">
                  <MessageCircle size={32} />
                  <h2>Start the conversation</h2>
                  <p>Messages here are only for accepted contacts.</p>
                </div>
              )}
            </div>

            <form className="pm-composer" onSubmit={handleSend}>
              <label className="pm-upload-trigger">
                <Paperclip size={18} />
                <input type="file" accept="image/*,video/*" onChange={handleFileChange} />
              </label>
              <input
                value={messageText}
                onChange={(event) => handleTypingChange(event.target.value)}
                placeholder={`Message ${selectedContact.name}`}
              />
              <button className="pm-send" type="submit" disabled={sending}>
                <Send size={18} />
              </button>
            </form>

            {uploadingMedia && (
              <div className="pm-upload-preview">
                <span>{uploadingMedia.name}</span>
                <button type="button" onClick={() => setUploadingMedia(null)}>
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="pm-empty-state">
            <MessageCircle size={32} />
            <h2>{loading ? 'Loading chats' : 'No chats yet'}</h2>
            <p>{loading ? 'Fetching your conversations...' : 'Add people first, then start messaging from this page.'}</p>
          </div>
        )}
      </div>

      <aside className="pm-detail">
        <div className="pm-detail-card">
          <PresenceAvatar person={selectedContact || profile} large />
          <h3>{selectedContact?.name || profile?.name || 'You'}</h3>
          <p>{selectedContact?.bio || 'Dark theme private chat room'}</p>
          <div className="pm-detail-grid">
            <span><strong>{directoryContacts.length}</strong> Contacts</span>
            <span><strong>{messages.length}</strong> Messages</span>
          </div>
        </div>
      </aside>
    </section>
  );
}

function PresenceAvatar({ person, large = false }) {
  const sizeClass = large ? 'pm-avatar pm-avatar-large' : 'pm-avatar';
  if (person?.profileImage || person?.photoURL) {
    return (
      <span className="pm-avatar-wrap">
        <img className={sizeClass} src={person.profileImage || person.photoURL} alt={person.name} />
        <i className={`pm-presence-dot ${person?.isOnline ? 'online' : ''}`} />
      </span>
    );
  }

  return (
    <span className="pm-avatar-wrap">
      <span className={`${sizeClass} pm-avatar-fallback`}>{buildInitials(person?.name)}</span>
      <i className={`pm-presence-dot ${person?.isOnline ? 'online' : ''}`} />
    </span>
  );
}

function MessageStateIcon({ readBy = [], senderFirebaseUID }) {
  const readByOthers = Array.isArray(readBy)
    ? readBy.filter((id) => id && id !== senderFirebaseUID)
    : [];

  if (readByOthers.length > 0) {
    return <CheckCheck size={14} className="pm-status-read" />;
  }
  return <Check size={14} className="pm-status-sent" />;
}

function MediaAttachment({ message }) {
  const isVideo = message.mediaType?.startsWith('video/');
  return (
    <div className="pm-media-block">
      {isVideo ? (
        <video className="pm-media" controls src={message.media} />
      ) : (
        <img className="pm-media" src={message.media} alt={message.fileName || 'Attachment'} />
      )}
      <a className="pm-media-download" href={message.media} download={message.fileName || 'attachment'}>
        <Download size={14} /> Download
      </a>
    </div>
  );
}
