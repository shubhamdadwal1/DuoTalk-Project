import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Camera,
  Check,
  FileUp,
  ImagePlus,
  Globe,
  Heart,
  Home,
  Image,
  Info,
  Link as LinkIcon,
  LogOut,
  MapPin,
  MessageCircle,
  Pencil,
  RefreshCcw,
  Search,
  Settings,
  Trash2,
  UserCheck,
  User,
  UserPlus,
  Users,
  X,
  BookOpen,
} from 'lucide-react';
import { profileAPI, postAPI, userAPI } from '../../services/api';
import { emitEvent, onEvent, offEvent, SocketEvents } from '../../services/socketIO';
import ProfileMessagesView from './ProfileMessagesView';
import PostsUploadFeed from '../premium/PostsUploadFeed';
import Blogs from '../Blogs';
import './ProfilePage.css';

const PROFILE_CACHE_PREFIX = 'duotalk-profile-cache:';

function normalizeImageSource(value) {
  if (typeof value === 'string' && value.trim()) return value;
  return '';
}

function buildOptimisticProfile(firebaseUser) {
  if (!firebaseUser) return null;
  const fallbackName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'DuoTalk User';
  return {
    firebaseUID: firebaseUser.uid,
    name: fallbackName,
    displayName: fallbackName,
    username: makeUsernamePreview(fallbackName, firebaseUser.email),
    email: firebaseUser.email || '',
    profileImage: firebaseUser.photoURL || '',
    photoURL: firebaseUser.photoURL || '',
    bio: '',
    location: '',
    website: '',
    coverImage: '',
    followers: 0,
    following: 0,
    followersList: [],
    followingList: [],
    incomingRequests: [],
    outgoingRequests: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeUsernamePreview(name = '', email = '') {
  const base = (name || email.split('@')[0] || 'duotalk-user')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 22);
  return base || 'duotalkuser';
}

function buildInitials(name = '') {
  const trimmed = name.trim();
  if (!trimmed) return 'U';
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function uniqueUsers(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item?.firebaseUID;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function readProfileCache(firebaseUID) {
  if (typeof window === 'undefined' || !firebaseUID) return null;
  try {
    const raw = window.localStorage.getItem(`${PROFILE_CACHE_PREFIX}${firebaseUID}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeProfileCache(firebaseUID, snapshot) {
  if (typeof window === 'undefined' || !firebaseUID) return;
  try {
    window.localStorage.setItem(`${PROFILE_CACHE_PREFIX}${firebaseUID}`, JSON.stringify(snapshot));
  } catch {
    // Ignore storage quota issues so the page still works without cache.
  }
}

function filterUsersByQuery(items = [], query = '') {
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) return uniqueUsers(items);

  return uniqueUsers(items).filter((person) => {
    const haystacks = [
      person.name,
      person.displayName,
      person.username,
      person.email,
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());

    return haystacks.some((value) => value.includes(needle));
  });
}

function excludeCurrentFirebaseUID(items = [], currentFirebaseUID = '') {
  return uniqueUsers(items).filter((person) => person?.firebaseUID && person.firebaseUID !== currentFirebaseUID);
}

function withTimeout(promise, fallbackValue, timeoutMs = 2500) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      window.setTimeout(() => resolve(fallbackValue), timeoutMs);
    }),
  ]);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not process image'));
    image.src = dataUrl;
  });
}

async function shrinkImage(file, maxSize = 1600, quality = 0.82) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not prepare image for upload');
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

export default function ProfilePage({ firebaseUser, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState('');
  const [processingRequestId, setProcessingRequestId] = useState('');
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [personModal, setPersonModal] = useState(null);
  const [activeView, setActiveView] = useState('profile');
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [directoryUsers, setDirectoryUsers] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [postDraft, setPostDraft] = useState('');
  const [postImage, setPostImage] = useState('');

  const searchInputRef = useRef(null);
  const postImageInputRef = useRef(null);
  const headerRef = useRef(null);
  const postsRef = useRef(null);
  const aboutRef = useRef(null);
  const peopleRef = useRef(null);
  const requestsRef = useRef(null);
  const activityRef = useRef(null);
  const activeProfileLoadRef = useRef(0);
  const directoryRequestInFlightRef = useRef(false);

  const hydrateFromCache = (cache, nextFirebaseUser) => {
    if (!cache) return false;

    setProfile(cache.profile || buildOptimisticProfile(nextFirebaseUser));
    setPosts(Array.isArray(cache.posts) ? cache.posts : []);
    setSuggestions(uniqueUsers(Array.isArray(cache.suggestions) ? cache.suggestions : []));
    setRequests({
      incoming: Array.isArray(cache.requests?.incoming) ? cache.requests.incoming : [],
      outgoing: Array.isArray(cache.requests?.outgoing) ? cache.requests.outgoing : [],
    });
    setAllUsers(uniqueUsers(Array.isArray(cache.allUsers) ? cache.allUsers : []));
    setDirectoryUsers(uniqueUsers(Array.isArray(cache.allUsers) ? cache.allUsers : []));
    return true;
  };

  const optionalRequest = async (loader, fallbackValue) => {
    try {
      return await loader();
    } catch {
      return fallbackValue;
    }
  };

  const loadRequests = async (firebaseUID, { silent = false } = {}) => {
    const requestLists = await optionalRequest(
      () => profileAPI.getRequests(firebaseUID),
      { incoming: [], outgoing: [] }
    );

    setRequests({
      incoming: Array.isArray(requestLists?.incoming) ? requestLists.incoming : [],
      outgoing: Array.isArray(requestLists?.outgoing) ? requestLists.outgoing : [],
    });

    if (!silent) {
      const latestProfile = await optionalRequest(() => profileAPI.getProfile(firebaseUID), null);
      if (latestProfile) {
        setProfile(latestProfile);
      }
    }
  };

  const refreshDirectory = async (currentFirebaseUID = firebaseUser?.uid) => {
    if (!currentFirebaseUID || directoryRequestInFlightRef.current) return;
    directoryRequestInFlightRef.current = true;
    try {
      setDirectoryLoading(true);
      const users = await userAPI.getAll();
      const nextUsers = excludeCurrentFirebaseUID(Array.isArray(users) ? users : [], currentFirebaseUID);
      setDirectoryUsers(nextUsers);
      setAllUsers((current) => uniqueUsers([...(Array.isArray(current) ? current : []), ...nextUsers]));
    } catch {
      // Keep the current directory if refresh fails.
    } finally {
      directoryRequestInFlightRef.current = false;
      setDirectoryLoading(false);
    }
  };

  const loadProfileData = async (currentFirebaseUser = firebaseUser, requestId = null) => {
    if (!currentFirebaseUser?.uid) return;
    const nextRequestId = requestId || Date.now();
    activeProfileLoadRef.current = nextRequestId;

    try {
      setError('');
      if (!profile) {
        setLoading(true);
      }

      const synced = await profileAPI.syncGoogleUser(currentFirebaseUser);
      if (activeProfileLoadRef.current !== nextRequestId) return;

      setProfile(synced);
      setLoading(false);

      const [savedPosts, followSuggestions, dbUsers, requestLists] = await Promise.allSettled([
        optionalRequest(() => profileAPI.getPosts(currentFirebaseUser.uid), []),
        optionalRequest(() => profileAPI.getFollowSuggestions(currentFirebaseUser.uid), []),
        optionalRequest(() => userAPI.getAll(), []),
        optionalRequest(() => profileAPI.getRequests(currentFirebaseUser.uid), { incoming: [], outgoing: [] }),
      ]);
      if (activeProfileLoadRef.current !== nextRequestId) return;

      const normalizedUserPosts = savedPosts.status === 'fulfilled' && Array.isArray(savedPosts.value)
        ? savedPosts.value
        : [];

      setPosts(Array.isArray(normalizedUserPosts) ? normalizedUserPosts : []);
      setSuggestions(uniqueUsers(
        followSuggestions.status === 'fulfilled' && Array.isArray(followSuggestions.value)
          ? followSuggestions.value
          : []
      ));
      setRequests({
        incoming: requestLists.status === 'fulfilled' && Array.isArray(requestLists.value?.incoming) ? requestLists.value.incoming : [],
        outgoing: requestLists.status === 'fulfilled' && Array.isArray(requestLists.value?.outgoing) ? requestLists.value.outgoing : [],
      });
      const nextUsers = uniqueUsers(
        dbUsers.status === 'fulfilled' && Array.isArray(dbUsers.value)
          ? dbUsers.value.filter((person) => person.firebaseUID && person.firebaseUID !== currentFirebaseUser.uid)
          : []
      );
      setDirectoryUsers(nextUsers);
      setAllUsers(nextUsers);
    } catch (err) {
      if (activeProfileLoadRef.current !== nextRequestId) return;
      setError(err.message || 'Could not load profile');
    } finally {
      if (activeProfileLoadRef.current === nextRequestId) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    window.history.replaceState({}, '', '/profile');
    const requestId = Date.now();
    activeProfileLoadRef.current = requestId;
    setLoading(true);
    setError('');
    setSearchValue('');
    setSearchResults([]);
    setSearchingUsers(false);

    const cache = readProfileCache(firebaseUser.uid);
    const hydrated = hydrateFromCache(cache, firebaseUser);
    if (!hydrated) {
      setProfile(buildOptimisticProfile(firebaseUser));
      setLoading(true);
      setPosts([]);
      setSuggestions([]);
      setRequests({ incoming: [], outgoing: [] });
      setAllUsers([]);
      setDirectoryUsers([]);
      setDirectoryLoading(true);
    } else {
      setLoading(false);
    }
    loadProfileData(firebaseUser, requestId);
  }, [firebaseUser]);

  // Listen for profile photo updates from other users
  useEffect(() => {
    if (!firebaseUser?.uid) return;

    const handleProfilePhotoUpdate = (data) => {
      const { firebaseUID, profileImage, name } = data;
      
      // Update current user's profile if they changed their photo
      if (firebaseUID === firebaseUser.uid) {
        setProfile((prev) => ({
          ...prev,
          profileImage,
          photoURL: profileImage,
        }));
        console.log('✅ Your profile photo updated');
      }

      // Update suggestions list with new profile photo
      setSuggestions((prev) =>
        prev.map((user) =>
          user.firebaseUID === firebaseUID
            ? { ...user, profileImage, photoURL: profileImage }
            : user
        )
      );

      // Update directory users with new profile photo
      setDirectoryUsers((prev) =>
        prev.map((user) =>
          user.firebaseUID === firebaseUID
            ? { ...user, profileImage, photoURL: profileImage }
            : user
        )
      );

      // Update all users list
      setAllUsers((prev) =>
        prev.map((user) =>
          user.firebaseUID === firebaseUID
            ? { ...user, profileImage, photoURL: profileImage }
            : user
        )
      );

      // Broadcast notification
      console.log(`📸 ${name} updated their profile photo`);
    };

    onEvent(SocketEvents.USER_PROFILE_UPDATED, handleProfilePhotoUpdate);

    return () => {
      offEvent(SocketEvents.USER_PROFILE_UPDATED, handleProfilePhotoUpdate);
    };
  }, [firebaseUser?.uid]);

  // Listen for hash-based route changes (e.g., #/blogs)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the '#'
      if (hash === '/blogs') {
        setActiveView('blogs');
      } else if (hash === '/profile' || hash === '' || hash === '/') {
        setActiveView('profile');
      }
    };

    // Handle initial hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Handle profile photo upload and broadcast
  const uploadProfilePhoto = async (file) => {
    if (!file || !firebaseUser?.uid) {
      alert('Please select a valid image');
      return;
    }

    try {
      setSaving(true);
      setError('');

      // Resize and compress image
      const base64Image = await shrinkImage(file, 500, 0.8);

      // Call API to save profile photo
      const updatedProfile = await profileAPI.updateProfile(firebaseUser.uid, {
        profileImage: base64Image,
        photoURL: base64Image,
      });

      // Update local state
      setProfile(updatedProfile);

      // Broadcast to all connected users
      emitEvent(SocketEvents.PROFILE_PHOTO_UPDATE, {
        firebaseUID: firebaseUser.uid,
        name: firebaseUser.displayName || profile?.name || 'User',
        profileImage: base64Image,
        photoURL: base64Image,
        timestamp: Date.now(),
      });

      // Update cache
      writeProfileCache(firebaseUser.uid, {
        profile: updatedProfile,
        posts,
        suggestions,
        requests,
        allUsers: directoryUsers,
        savedAt: new Date().toISOString(),
      });

      console.log('✅ Profile photo uploaded and broadcasted');
    } catch (err) {
      console.error('Error uploading profile photo:', err);
      setError('Failed to upload profile photo. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const triggerProfilePhotoChange = () => {
    if (typeof window !== 'undefined' && window.fileInput) {
      window.fileInput.click();
    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
          await uploadProfilePhoto(file);
        }
      };
      input.click();
    }
  };

  const refreshOnProfileUpdate = useMemo(
    () => ({
      profile,
      posts,
      suggestions,
      requests,
      directoryUsers,
    }),
    [profile, posts, suggestions, requests, directoryUsers]
  );
  useEffect(() => {
    if (!firebaseUser?.uid) return undefined;

    refreshDirectory(firebaseUser.uid);
    const handleFocus = () => refreshDirectory(firebaseUser.uid);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [firebaseUser?.uid]);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    writeProfileCache(firebaseUser.uid, {
      profile,
      posts,
      suggestions,
      requests,
      allUsers: directoryUsers,
      savedAt: new Date().toISOString(),
    });
  }, [directoryUsers, firebaseUser?.uid, posts, profile, requests, suggestions]);

  useEffect(() => {
    if (!firebaseUser?.uid) return;

    const refresh = () => {
      loadRequests(firebaseUser.uid, { silent: true });
    };

    const intervalId = window.setInterval(refresh, 5000);
    window.addEventListener('focus', refresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refresh);
    };
  }, [firebaseUser?.uid]);

  const joinedDate = useMemo(() => {
    if (!profile?.createdAt) return 'Today';
    return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(profile.createdAt));
  }, [profile]);

  useEffect(() => {
    if (!firebaseUser?.uid) return;

    const query = searchValue.trim();
    if (!query) {
      setSearchResults([]);
      setSearchingUsers(false);
      return;
    }

    let cancelled = false;
    const localResults = excludeCurrentFirebaseUID(
      filterUsersByQuery([...(suggestions || []), ...(directoryUsers || []), ...(allUsers || [])], query),
      firebaseUser.uid
    );
    setSearchResults(localResults);
    setSearchingUsers(true);

    const timer = window.setTimeout(async () => {
      try {
        const results = await profileAPI.searchUsers(firebaseUser.uid, query);
        if (!cancelled) {
          setError('');
          const mergedResults = excludeCurrentFirebaseUID(
            uniqueUsers([...(Array.isArray(results) ? results : []), ...localResults]),
            firebaseUser.uid
          );
          setSearchResults(mergedResults);
        }
      } catch (err) {
        if (!cancelled) {
          setError('');
          setSearchResults(localResults);
        }
      } finally {
        if (!cancelled) {
          setSearchingUsers(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [allUsers, directoryUsers, firebaseUser, searchValue]);

  const visibleUsers = useMemo(() => {
    if (searchValue.trim()) return searchResults;
    return excludeCurrentFirebaseUID([...(suggestions || []), ...(directoryUsers || []), ...(allUsers || [])], firebaseUser?.uid);
  }, [allUsers, directoryUsers, firebaseUser?.uid, searchResults, searchValue, suggestions]);

  const incomingRequestIds = useMemo(
    () => new Set((profile?.incomingRequests || []).map(String)),
    [profile]
  );

  const outgoingRequestIds = useMemo(
    () => new Set((profile?.outgoingRequests || []).map(String)),
    [profile]
  );

  const followingIds = useMemo(
    () => new Set((profile?.followingList || []).map(String)),
    [profile]
  );

  const handleSave = async (updates) => {
    try {
      setSaving(true);
      setError('');
      const updated = await profileAPI.updateProfile(firebaseUser.uid, updates);
      setProfile(updated);

      // Broadcast profile photo update to all connected users
      if (updates.profileImage) {
        emitEvent(SocketEvents.PROFILE_PHOTO_UPDATE, {
          firebaseUID: firebaseUser.uid,
          name: firebaseUser.displayName || updated.name || 'User',
          profileImage: updates.profileImage,
          photoURL: updates.profileImage,
          timestamp: Date.now(),
        });
      }

      // Broadcast profile bio/name updates
      if (updates.bio || updates.name || updates.location || updates.website) {
        emitEvent(SocketEvents.USER_PROFILE_UPDATED, {
          firebaseUID: firebaseUser.uid,
          name: updated.name,
          bio: updated.bio,
          location: updated.location,
          website: updated.website,
          profileImage: updated.profileImage,
          photoURL: updated.photoURL,
          timestamp: Date.now(),
        });
      }

      setModalOpen(false);
    } catch (err) {
      setError(err.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFollowToggle = async (target) => {
    if (!profile) return;
    const targetId = target.firebaseUID;
    if (!targetId || targetId === profile.firebaseUID) return;
    if (incomingRequestIds.has(targetId)) {
      scrollToRef(requestsRef);
      return;
    }
    const following = followingIds.has(targetId);
    const requested = outgoingRequestIds.has(targetId);
    const result = following || requested
      ? await profileAPI.unfollow(profile.firebaseUID, targetId)
      : await profileAPI.follow(profile.firebaseUID, targetId);

    setProfile(result.currentUser);
    setSuggestions((items) =>
      items.map((item) => (item.firebaseUID === targetId ? result.targetUser : item))
    );
    setSearchResults((items) =>
      items.map((item) => (item.firebaseUID === targetId ? result.targetUser : item))
    );
    setAllUsers((items) =>
      items.map((item) => (item.firebaseUID === targetId ? result.targetUser : item))
    );
    setRequests((current) => ({
      incoming: current.incoming,
      outgoing: result.currentUser?.outgoingRequests?.includes(targetId)
        ? mergeUserById(current.outgoing, result.targetUser)
        : current.outgoing.filter((item) => item.firebaseUID !== targetId),
    }));
  };

  const handleAcceptRequest = async (requester) => {
    if (!profile) return;
    try {
      setProcessingRequestId(requester.firebaseUID);
      const result = await profileAPI.acceptRequest(profile.firebaseUID, requester.firebaseUID);
      setProfile(result.currentUser);
      setRequests((current) => ({
        incoming: current.incoming.filter((item) => item.firebaseUID !== requester.firebaseUID),
        outgoing: current.outgoing,
      }));
      setSuggestions((items) => mergeUserById(items, result.requester));
      setSearchResults((items) => mergeUserById(items, result.requester));
      setAllUsers((items) => mergeUserById(items, result.requester));
    } catch (err) {
      setError(err.message || 'Could not accept request');
    } finally {
      setProcessingRequestId('');
    }
  };

  const handleLogout = async () => {
    await onLogout?.();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handlePostImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const resized = await shrinkImage(file, 1800, 0.84);
      setPostImage(resized);
    } catch (err) {
      setError(err.message || 'Could not prepare image for upload');
      setPostImage('');
    } finally {
      event.target.value = '';
    }
  };

  const clearPostComposer = () => {
    setPostDraft('');
    setPostImage('');
    if (postImageInputRef.current) {
      postImageInputRef.current.value = '';
    }
  };

  const handleCreatePost = async () => {
    if (!firebaseUser?.uid) return;
    if (!postDraft.trim() && !postImage) {
      setError('Write something or choose an image before posting.');
      return;
    }

    try {
      setPosting(true);
      setError('');

      const createdPost = await postAPI.create({
        firebaseUID: firebaseUser.uid,
        content: postDraft.trim(),
        image: postImage || undefined,
        author: profile?.name || firebaseUser.displayName || 'Anonymous',
        authorPhoto: profile?.profileImage || firebaseUser.photoURL || '',
      });

      setPosts((current) => [createdPost, ...current]);
      clearPostComposer();
      scrollToRef(postsRef);
    } catch (err) {
      setError(err.message || 'Could not publish post');
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!firebaseUser?.uid || !postId) return;

    const confirmed = window.confirm('Delete this post? This cannot be undone.');
    if (!confirmed) return;

    try {
      setDeletingPostId(String(postId));
      setError('');
      await postAPI.remove(String(postId), firebaseUser.uid);
      setPosts((current) => current.filter((post) => String(post._id) !== String(postId)));
    } catch (err) {
      setError(err.message || 'Could not delete post');
    } finally {
      setDeletingPostId('');
    }
  };

  const scrollToRef = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const handleBack = () => {
    if (activeView === 'requests') {
      setActiveView('profile');
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    scrollToRef(headerRef);
  };

  if (loading && !profile) {
    return (
      <main className="profile-shell">
        <div className="profile-loader" />
        <p className="profile-loading-text">Building your profile from Google...</p>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main className="profile-shell">
        <section className="profile-error-card">
          <h1>Profile could not load</h1>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try again</button>
        </section>
      </main>
    );
  }

  return (
    <main className={`profile-shell ${activeView === 'messages' ? 'profile-shell-chat' : ''}`}>
      <div className="profile-ambient" />

      <div className="profile-app">
        <aside className="profile-rail">
          <div className="profile-rail-brand">
            <img src="/duotalk-logo.svg" alt="DuoTalk" />
            <span>DuoTalk</span>
          </div>

          <button
            className={`profile-rail-button ${activeView === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveView('profile')}
            title="Profile"
            aria-label="Profile"
          >
            <User size={20} />
          </button>
          <button className="profile-rail-button" onClick={() => searchInputRef.current?.focus()} title="Search" aria-label="Search">
            <Search size={20} />
          </button>
          <button className="profile-rail-button" onClick={() => setActiveView('profile')} title="Home" aria-label="Home">
            <Home size={20} />
          </button>
          <button className="profile-rail-button" onClick={() => scrollToRef(peopleRef)} title="People" aria-label="People">
            <Users size={20} />
          </button>
          <button
            className={`profile-rail-button ${activeView === 'requests' ? 'active' : ''}`}
            onClick={() => {
              setActiveView('requests');
              if (firebaseUser?.uid) {
                loadRequests(firebaseUser.uid);
              }
            }}
            title="Requests"
            aria-label="Requests"
          >
            <UserCheck size={20} />
            {requests.incoming.length > 0 && <span className="profile-rail-badge">{requests.incoming.length}</span>}
          </button>
          <button
            className={`profile-rail-button ${activeView === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveView('messages')}
            title="Messages"
            aria-label="Messages"
          >
            <MessageCircle size={20} />
          </button>
          <button
            className={`profile-rail-button ${activeView === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveView('posts')}
            title="Posts"
            aria-label="Posts"
          >
            <FileUp size={20} />
          </button>
          <button 
            className={`profile-rail-button ${activeView === 'blogs' ? 'active' : ''}`}
            onClick={() => window.location.hash = '/blogs'}
            title="Blogs"
            aria-label="Blogs"
          >
            <BookOpen size={20} />
          </button>
          <button className="profile-rail-button" onClick={() => setModalOpen(true)} title="Settings" aria-label="Settings">
            <Settings size={20} />
          </button>
          <button className="profile-rail-button profile-rail-logout" onClick={handleLogout} title="Logout" aria-label="Logout">
            <LogOut size={20} />
          </button>
        </aside>

        <section className="profile-stage">
          <nav className="profile-topbar">
            <div className="profile-bar-actions">
              <button className="profile-toolbar-button" onClick={handleBack} title="Back" aria-label="Back">
                <ArrowLeft size={18} />
              </button>
              <button className="profile-toolbar-button" onClick={() => loadProfileData(firebaseUser)} title="Refresh" aria-label="Refresh">
                <RefreshCcw size={18} />
              </button>
              <button className="profile-toolbar-button" onClick={() => scrollToRef(aboutRef)} title="About" aria-label="About">
                <Info size={18} />
              </button>
            </div>

            <label className="profile-searchbar">
              <Search size={17} />
                <input
                  ref={searchInputRef}
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search users by name"
                />
            </label>

            <div className="profile-brand">
              <img src="/duotalk-logo.svg" alt="DuoTalk" />
              <span>DuoTalk</span>
            </div>

            <button className="profile-logout" onClick={handleLogout}>
              <LogOut size={18} /> Logout
            </button>
          </nav>

          {error && <div className="profile-toast">{error}</div>}

          {activeView === 'messages' ? (
            <ProfileMessagesView
              firebaseUser={firebaseUser}
              profile={profile}
              availableUsers={allUsers}
              onOpenProfile={(person) => setPersonModal(person)}
            />
          ) : activeView === 'requests' ? (
            <div className="profile-requests-view">
              <section className="profile-glass-card profile-requests-main">
                <div className="profile-section-head">
                  <div>
                    <h2>Requests</h2>
                    <p>Incoming and sent connection requests</p>
                  </div>
                  <UserCheck size={20} />
                </div>

                <div className="profile-requests-grid">
                  <section className="profile-request-panel">
                    <div className="profile-request-panel-head">
                      <h3>Received</h3>
                      <span>{requests.incoming.length}</span>
                    </div>
                    {requests.incoming.length > 0 ? (
                      requests.incoming.map((person) => (
                        <div className="profile-person profile-request-row" key={person.firebaseUID}>
                          <button type="button" className="profile-person-card" onClick={() => setPersonModal(person)}>
                            {normalizeImageSource(person.profileImage || person.photoURL) ? (
                              <img src={person.profileImage || person.photoURL} alt={person.name} />
                            ) : (
                              <div className="profile-person-avatar profile-person-avatar-fallback">
                                {buildInitials(person.name)}
                              </div>
                            )}
                            <div>
                              <strong>{person.name}</strong>
                              <span>@{person.username}</span>
                              {(person.bio || person.location) && <small>{person.bio || person.location}</small>}
                            </div>
                          </button>
                          <button onClick={() => handleAcceptRequest(person)} disabled={processingRequestId === person.firebaseUID}>
                            <Check size={15} />
                            {processingRequestId === person.firebaseUID ? 'Accepting' : 'Accept'}
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="profile-muted">No received requests right now.</p>
                    )}
                  </section>

                  <section className="profile-request-panel">
                    <div className="profile-request-panel-head">
                      <h3>Sent</h3>
                      <span>{requests.outgoing.length}</span>
                    </div>
                    {requests.outgoing.length > 0 ? (
                      requests.outgoing.map((person) => (
                        <div className="profile-person profile-request-row" key={person.firebaseUID}>
                          <button type="button" className="profile-person-card" onClick={() => setPersonModal(person)}>
                            {normalizeImageSource(person.profileImage || person.photoURL) ? (
                              <img src={person.profileImage || person.photoURL} alt={person.name} />
                            ) : (
                              <div className="profile-person-avatar profile-person-avatar-fallback">
                                {buildInitials(person.name)}
                              </div>
                            )}
                            <div>
                              <strong>{person.name}</strong>
                              <span>@{person.username}</span>
                              {(person.bio || person.location) && <small>{person.bio || person.location}</small>}
                            </div>
                          </button>
                          <button onClick={() => handleFollowToggle(person)}>
                            <UserPlus size={15} /> Requested
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="profile-muted">No sent requests yet.</p>
                    )}
                  </section>
                </div>
              </section>
            </div>
          ) : activeView === 'posts' ? (
            <div className="profile-posts-view" style={{ padding: '2rem 1rem' }}>
              <PostsUploadFeed userProfile={profile} user={firebaseUser} />
            </div>
          ) : activeView === 'blogs' ? (
            <Blogs />
          ) : (
          <div className="profile-content">
            <div className="profile-layout">
              <section className="profile-main-card" ref={headerRef}>
                <div
                  className="profile-cover"
                  style={{
                    backgroundImage: profile.coverImage
                      ? `linear-gradient(135deg, rgba(15,23,42,.25), rgba(30,27,75,.25)), url(${profile.coverImage})`
                      : undefined,
                  }}
                >
                  <button className="profile-cover-button" onClick={() => setModalOpen(true)}>
                    <Camera size={17} /> Edit cover
                  </button>
                </div>

                <div className="profile-header">
                  <div className="profile-photo-wrap">
                    {normalizeImageSource(profile.profileImage || firebaseUser.photoURL) ? (
                      <img src={profile.profileImage || firebaseUser.photoURL} alt={profile.name} />
                    ) : (
                      <div className="profile-person-avatar profile-person-avatar-fallback">
                        {buildInitials(profile.name)}
                      </div>
                    )}
                    <button onClick={() => setModalOpen(true)} aria-label="Change profile picture">
                      <Camera size={16} />
                    </button>
                  </div>

                  <div className="profile-title">
                    <div className="profile-name-row">
                      <h1>{profile.name}</h1>
                      <BadgeCheck size={22} />
                    </div>
                    <p>@{profile.username}</p>
                    <span>{profile.bio || 'Add a short bio so people know what you are building.'}</span>
                    <div className="profile-meta-row">
                      {profile.location && <small><MapPin size={15} /> {profile.location}</small>}
                      {profile.website && (
                        <a href={profile.website} target="_blank" rel="noreferrer">
                          <Globe size={15} /> {profile.website}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="profile-actions">
                    <button className="profile-primary" onClick={() => setModalOpen(true)}>
                      <Pencil size={17} /> Edit Profile
                    </button>
                  </div>
                </div>

                <div className="profile-stats">
                  <Stat label="Posts" value={posts.length} />
                  <Stat label="Followers" value={profile.followers} />
                  <Stat label="Following" value={profile.following} />
                </div>
              </section>

              <section className="profile-posts-card" ref={postsRef}>
                <div className="profile-section-head">
                  <div>
                    <h2>Posts</h2>
                    <p>Fetched from MongoDB</p>
                  </div>
                  <Image size={20} />
                </div>

                <div className="profile-create-post">
                  <div className="profile-create-post-header">
                    {normalizeImageSource(profile?.profileImage || firebaseUser.photoURL) ? (
                      <img
                        className="profile-create-avatar"
                        src={profile?.profileImage || firebaseUser.photoURL}
                        alt={profile?.name || firebaseUser.displayName || 'You'}
                      />
                    ) : (
                      <div className="profile-person-avatar profile-person-avatar-fallback profile-create-avatar">
                        {buildInitials(profile?.name || firebaseUser.displayName || 'You')}
                      </div>
                    )}

                    <textarea
                      className="profile-create-textarea"
                      value={postDraft}
                      onChange={(event) => setPostDraft(event.target.value)}
                      placeholder="Share an update with a photo"
                      rows={4}
                    />
                  </div>

                  {postImage && (
                    <div className="profile-create-preview-wrap">
                      <img className="profile-create-preview" src={postImage} alt="Post preview" />
                      <button
                        type="button"
                        className="profile-create-remove"
                        onClick={() => setPostImage('')}
                      >
                        Remove image
                      </button>
                    </div>
                  )}

                  <div className="profile-create-actions">
                    <input
                      ref={postImageInputRef}
                      type="file"
                      accept="image/*"
                      className="profile-create-file-input"
                      onChange={handlePostImageChange}
                    />
                    <button
                      type="button"
                      className="profile-create-upload"
                      onClick={() => postImageInputRef.current?.click()}
                    >
                      <ImagePlus size={16} /> Upload image
                    </button>
                    <button
                      type="button"
                      className="profile-primary"
                      onClick={handleCreatePost}
                      disabled={posting}
                    >
                      {posting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>

                {posts.length > 0 ? (
                  <div className="profile-post-list">
                    {posts.map((post) => (
                      <article key={post._id} className="profile-post">
                        <div className="profile-post-header">
                          <div className="profile-post-author">
                            {normalizeImageSource(post.authorPhoto) ? (
                              <img src={post.authorPhoto} alt={post.author || profile.name} />
                            ) : (
                              <div className="profile-person-avatar profile-person-avatar-fallback">
                                {buildInitials(post.author || profile.name)}
                              </div>
                            )}
                            <div>
                              <strong>{post.author || profile.name}</strong>
                              <span>{new Date(post.createdAt || post.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="profile-post-delete"
                            onClick={() => handleDeletePost(post._id)}
                            disabled={deletingPostId === String(post._id)}
                            aria-label="Delete post"
                            title={deletingPostId === String(post._id) ? 'Deleting post...' : 'Delete post'}
                          >
                            <Trash2 size={16} />
                            <span>{deletingPostId === String(post._id) ? 'Deleting...' : 'Delete'}</span>
                          </button>
                        </div>

                        {post.content && <p className="profile-post-content">{post.content}</p>}

                        {normalizeImageSource(post.image) && (
                          <img className="profile-post-image" src={post.image} alt={post.caption || 'Post'} />
                        )}

                        <div className="profile-post-footer">
                          <span><Heart size={16} /> {post.likes || 0}</span>
                          <span><MessageCircle size={16} /> {Array.isArray(post.comments) ? post.comments.length : post.comments || 0}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="profile-empty-posts">
                    <Image size={36} />
                    <h3>No posts yet</h3>
                    <p>Your MongoDB posts collection has no posts for this Google user yet.</p>
                  </div>
                )}
              </section>
            </div>

            <aside className="profile-side">
              <section className="profile-glass-card" ref={aboutRef}>
                <h3>About</h3>
                <p>{profile.email}</p>
                <p>Joined {joinedDate}</p>
                {profile.website && <p><LinkIcon size={14} /> {profile.website}</p>}
              </section>

              <section className="profile-glass-card" ref={activityRef}>
                <h3>Activity</h3>
                <div className="profile-mini-stats">
                  <span><strong>{posts.reduce((sum, post) => sum + (post.likes || 0), 0)}</strong> Likes</span>
                  <span><strong>{posts.reduce((sum, post) => sum + (post.comments || 0), 0)}</strong> Comments</span>
                </div>
              </section>

              <section className="profile-glass-card" ref={requestsRef}>
                <h3>Requests</h3>
                {requests.incoming.length > 0 ? (
                  requests.incoming.map((person) => (
                    <div className="profile-person" key={person.firebaseUID}>
                      <button type="button" className="profile-person-card" onClick={() => setPersonModal(person)}>
                        {normalizeImageSource(person.profileImage || person.photoURL) ? (
                          <img src={person.profileImage || person.photoURL} alt={person.name} />
                        ) : (
                          <div className="profile-person-avatar profile-person-avatar-fallback">
                            {buildInitials(person.name)}
                          </div>
                        )}
                        <div>
                          <strong>{person.name}</strong>
                          <span>@{person.username}</span>
                        </div>
                      </button>
                      <button onClick={() => handleAcceptRequest(person)} disabled={processingRequestId === person.firebaseUID}>
                        <Check size={15} />
                        {processingRequestId === person.firebaseUID ? 'Accepting' : 'Accept'}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="profile-muted">No received requests right now.</p>
                )}
              </section>

              <section className="profile-glass-card" ref={peopleRef}>
                <h3>Real Users</h3>
                {visibleUsers.length > 0 ? (
                  visibleUsers.map((person) => (
                    <div className="profile-person" key={person.firebaseUID}>
                      <button type="button" className="profile-person-card" onClick={() => setPersonModal(person)}>
                        {normalizeImageSource(person.profileImage || person.photoURL) ? (
                          <img src={person.profileImage || person.photoURL} alt={person.name} />
                        ) : (
                          <div className="profile-person-avatar profile-person-avatar-fallback">
                            {buildInitials(person.name)}
                          </div>
                        )}
                        <div>
                          <strong>{person.name}</strong>
                          <span>@{person.username}</span>
                          {(person.bio || person.location) && (
                            <small>
                              {person.bio || person.location}
                            </small>
                          )}
                        </div>
                      </button>
                      <button
                        onClick={() => handleFollowToggle(person)}
                        disabled={person.firebaseUID === firebaseUser?.uid}
                      >
                        <UserPlus size={15} />
                        {person.firebaseUID === firebaseUser?.uid
                          ? 'You'
                          : followingIds.has(person.firebaseUID)
                            ? 'Following'
                            : outgoingRequestIds.has(person.firebaseUID)
                              ? 'Requested'
                              : incomingRequestIds.has(person.firebaseUID)
                                ? 'Accept in Requests'
                                : 'Follow'}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="profile-muted">
                    {searchValue.trim()
                      ? searchingUsers
                        ? 'Searching users...'
                        : 'No users found with that name.'
                      : directoryLoading
                        ? 'Loading real users...'
                        : 'No other real users found yet. This list fills as more people sign in.'}
                  </p>
                )}
              </section>

              <section className="profile-glass-card">
                <h3>Badges</h3>
                <div className="profile-badges">
                  <span><BadgeCheck size={15} /> Google verified</span>
                  <span><Users size={15} /> Community</span>
                </div>
              </section>
            </aside>
          </div>
          )}
        </section>
      </div>

      {modalOpen && (
        <EditProfileModal
          profile={profile}
          saving={saving}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {personModal && (
        <PersonProfileModal
          person={personModal}
          relation={
            followingIds.has(personModal.firebaseUID)
              ? 'following'
              : outgoingRequestIds.has(personModal.firebaseUID)
                ? 'requested'
                : incomingRequestIds.has(personModal.firebaseUID)
                  ? 'incoming'
                  : 'none'
          }
          onAction={() => handleFollowToggle(personModal)}
          onOpenRequests={() => {
            setPersonModal(null);
            setActiveView('requests');
          }}
          onClose={() => setPersonModal(null)}
        />
      )}
    </main>
  );
}

function mergeUserById(items, person) {
  if (!person?.firebaseUID) return items;
  const exists = items.some((item) => item.firebaseUID === person.firebaseUID);
  if (exists) {
    return items.map((item) => (item.firebaseUID === person.firebaseUID ? { ...item, ...person } : item));
  }
  return [person, ...items];
}

function Stat({ label, value }) {
  return (
    <div>
      <strong>{value || 0}</strong>
      <span>{label}</span>
    </div>
  );
}

function EditProfileModal({ profile, saving, onClose, onSave }) {
  const [form, setForm] = useState({
    name: profile.name || '',
    bio: profile.bio || '',
    location: profile.location || '',
    website: profile.website || '',
    profileImage: profile.profileImage || '',
    coverImage: profile.coverImage || '',
  });

  useEffect(() => {
    setForm({
      name: profile.name || '',
      bio: profile.bio || '',
      location: profile.location || '',
      website: profile.website || '',
      profileImage: profile.profileImage || '',
      coverImage: profile.coverImage || '',
    });
  }, [profile]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const updateFromFile = async (key, file) => {
    if (!file) return;
    try {
      const resized = await shrinkImage(file, key === 'coverImage' ? 1800 : 900, 0.82);
      update(key, resized);
    } catch {
      update(key, '');
    }
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <form
        className="profile-modal"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <header>
          <h2>Edit Profile</h2>
          <button type="button" onClick={onClose}>Close</button>
        </header>

        <label>
          Name
          <input value={form.name} onChange={(event) => update('name', event.target.value)} />
        </label>
        <label>
          Bio
          <textarea value={form.bio} onChange={(event) => update('bio', event.target.value)} rows="4" />
        </label>
        <label>
          Change profile picture
          <input type="file" accept="image/*" onChange={(event) => updateFromFile('profileImage', event.target.files?.[0])} />
        </label>
        {form.profileImage && <img className="profile-modal-preview" src={form.profileImage} alt="Profile preview" />}
        <label>
          Change cover banner
          <input type="file" accept="image/*" onChange={(event) => updateFromFile('coverImage', event.target.files?.[0])} />
        </label>
        {form.coverImage && <img className="profile-modal-cover-preview" src={form.coverImage} alt="Cover preview" />}
        <label>
          Location
          <input value={form.location} onChange={(event) => update('location', event.target.value)} />
        </label>
        <label>
          Website
          <input value={form.website} onChange={(event) => update('website', event.target.value)} />
        </label>

        <button className="profile-primary" disabled={saving} type="submit">
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}

function PersonProfileModal({ person, relation, onAction, onOpenRequests, onClose }) {
  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal profile-person-modal" onClick={(event) => event.stopPropagation()}>
        <header>
          <h2>User Profile</h2>
          <button type="button" onClick={onClose}><X size={18} /></button>
        </header>

        <div className="profile-person-modal-hero">
          {normalizeImageSource(person.profileImage || person.photoURL) ? (
            <img src={person.profileImage || person.photoURL} alt={person.name} />
          ) : (
            <div className="profile-person-avatar profile-person-avatar-fallback profile-person-modal-avatar">
              {buildInitials(person.name)}
            </div>
          )}
          <div>
            <h3>{person.name}</h3>
            <p>@{person.username}</p>
            <span>{person.bio || 'This user has not added a bio yet.'}</span>
          </div>
        </div>

        <div className="profile-person-modal-stats">
          <span><strong>{person.followers || 0}</strong> Followers</span>
          <span><strong>{person.following || 0}</strong> Following</span>
        </div>

        <div className="profile-person-modal-actions">
          {relation === 'incoming' ? (
            <button type="button" className="profile-primary" onClick={onOpenRequests}>
              <UserCheck size={16} /> Open Requests
            </button>
          ) : (
            <button type="button" className="profile-primary" onClick={onAction}>
              <UserPlus size={16} />
              {relation === 'following'
                ? 'Following'
                : relation === 'requested'
                  ? 'Requested'
                  : 'Add User'}
            </button>
          )}
        </div>

        {person.location && <p className="profile-muted"><MapPin size={14} /> {person.location}</p>}
      </div>
    </div>
  );
}
