import React, { useState, useEffect, useRef } from 'react';
import { db, auth, storage } from '../src/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, deleteDoc, where } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { getUserColor, formatTimestamp } from '../src/utils/chatUtils';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';
import { ImagePlus, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  imageUrl?: string;
  timestamp: any;
  projectId: string;
}

const ChatWidget: React.FC<{ projectId: string | number; unreadDMs?: Record<string, boolean> }> = ({ projectId, unreadDMs = {} }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<{ id: string; name: string }[]>([]);
  const [chatMode, setChatMode] = useState<'project' | 'lounge' | 'dm'>('project');
  const [selectedDmUser, setSelectedDmUser] = useState<{ id: string; name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getActiveChannelId = () => {
    if (chatMode === 'project') return String(projectId);
    if (chatMode === 'lounge') return 'global';
    if (chatMode === 'dm' && selectedDmUser && auth.currentUser) {
      // Create a consistent ID for the two users
      const ids = [auth.currentUser.uid, selectedDmUser.id].sort();
      return `dm_${ids[0]}_${ids[1]}`;
    }
    return 'global';
  };

  const activeProjectId = getActiveChannelId();

  useEffect(() => {
    if (!auth.currentUser) return;

    // Set presence
    const presenceRef = doc(db, 'presence', 'global', 'users', auth.currentUser.uid);
    setDoc(presenceRef, { 
      name: auth.currentUser.displayName || 'Anonymous',
      lastSeen: serverTimestamp()
    });

    // Heartbeat
    const interval = setInterval(() => {
      setDoc(presenceRef, { lastSeen: serverTimestamp() }, { merge: true });
    }, 30000);

    return () => {
      clearInterval(interval);
      deleteDoc(presenceRef);
    };
  }, []);

  useEffect(() => {
    if (chatMode === 'dm' && !selectedDmUser) {
      setMessages([]);
      return;
    }

    // Clear unread status if we are in a DM with this user
    if (chatMode === 'dm' && selectedDmUser && auth.currentUser) {
      const unreadRef = doc(db, 'users', auth.currentUser.uid, 'unread_dms', selectedDmUser.id);
      deleteDoc(unreadRef).catch(console.error);
    }

    const q = query(
      collection(db, 'messages', activeProjectId, 'chat'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `messages/${activeProjectId}/chat`);
    });

    // Listen for typing users
    const typingQ = query(collection(db, 'messages', activeProjectId, 'typing'));
    const unsubscribeTyping = onSnapshot(typingQ, (snapshot) => {
      const typing = snapshot.docs
        .filter(doc => doc.id !== auth.currentUser?.uid)
        .map(doc => doc.data().userName);
      setTypingUsers(typing);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `messages/${activeProjectId}/typing`);
    });

    // Listen for online users
    const onlineQ = query(collection(db, 'presence', 'global', 'users'));
    const unsubscribeOnline = onSnapshot(onlineQ, (snapshot) => {
      const online = snapshot.docs
        .filter(doc => doc.id !== auth.currentUser?.uid)
        .map(doc => ({ id: doc.id, name: doc.data().name }));
      setOnlineUsers(online);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'presence/global/users');
    });

    return () => {
      unsubscribe();
      unsubscribeTyping();
      unsubscribeOnline();
    };
  }, [activeProjectId, chatMode, selectedDmUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!auth.currentUser || (chatMode === 'dm' && !selectedDmUser)) return;

    // Set typing status
    const typingRef = doc(db, 'messages', activeProjectId, 'typing', auth.currentUser.uid);
    setDoc(typingRef, { userName: auth.currentUser.displayName || 'Anonymous' });

    // Clear previous timeout
    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    // Set timeout to remove typing status
    typingTimeout.current = setTimeout(async () => {
      await deleteDoc(typingRef);
    }, 3000);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser || (chatMode === 'dm' && !selectedDmUser)) return;

    // Remove typing status immediately
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    const typingRef = doc(db, 'messages', activeProjectId, 'typing', auth.currentUser.uid);
    await deleteDoc(typingRef);

    await addDoc(collection(db, 'messages', activeProjectId, 'chat'), {
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || 'Anonymous',
      text: newMessage,
      timestamp: serverTimestamp(),
      projectId: activeProjectId
    });

    // Set unread status for the recipient
    if (chatMode === 'dm' && selectedDmUser) {
      const unreadRef = doc(db, 'users', selectedDmUser.id, 'unread_dms', auth.currentUser.uid);
      await setDoc(unreadRef, { 
        hasUnread: true, 
        timestamp: serverTimestamp() 
      }, { merge: true }).catch(console.error);
    }

    setNewMessage('');
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;
    
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // 1. Compress Image to a tiny Base64 string (usually under 100kb)
      const compressedDataUrl = await compressImage(file);
      
      // 2. BYPASS FIREBASE STORAGE ENTIRELY!
      // Since we compressed the image so small, we can just save the text string 
      // directly into the Firestore database. This completely ignores CORS issues!
      
      await addDoc(collection(db, 'messages', activeProjectId, 'chat'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        text: '',
        imageUrl: compressedDataUrl, // Save the Base64 string directly
        timestamp: serverTimestamp(),
        projectId: activeProjectId
      });

      if (chatMode === 'dm' && selectedDmUser) {
        const unreadRef = doc(db, 'users', selectedDmUser.id, 'unread_dms', auth.currentUser.uid);
        await setDoc(unreadRef, { 
          hasUnread: true, 
          timestamp: serverTimestamp() 
        }, { merge: true }).catch(console.error);
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadError(error.message || 'Failed to upload image.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startDM = (user: { id: string; name: string }) => {
    setSelectedDmUser(user);
    setChatMode('dm');
  };

  const hasAnyUnread = Object.keys(unreadDMs).length > 0;

  return (
    <div className="flex flex-col h-64 bg-slate-900 rounded-lg border border-slate-700 p-4">
      <div className="flex gap-2 mb-2">
        <button 
          onClick={() => setChatMode('project')}
          className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${chatMode === 'project' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
        >
          Project
        </button>
        <button 
          onClick={() => setChatMode('lounge')}
          className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded relative ${chatMode === 'lounge' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
        >
          Lounge
          {hasAnyUnread && chatMode !== 'lounge' && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
        {chatMode === 'dm' && selectedDmUser && (
          <button 
            className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-indigo-600 text-white"
          >
            DM: {selectedDmUser.name}
          </button>
        )}
      </div>
      
      {chatMode === 'lounge' && (
        <div className="text-[10px] text-slate-400 mb-2 border-b border-slate-800 pb-2">
          Online: {onlineUsers.length > 0 ? onlineUsers.map((u, i) => (
            <span key={u.id} className="relative inline-block">
              <button 
                onClick={() => startDM(u)}
                className="hover:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                title={`Message ${u.name} privately`}
              >
                {u.name}
                {unreadDMs[u.id] && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="New message!" />
                )}
              </button>
              {i < onlineUsers.length - 1 ? <span className="mr-1">,</span> : ''}
            </span>
          )) : 'Just you'}
        </div>
      )}

      <div className="flex-1 overflow-y-auto mb-4 space-y-2">
        {chatMode === 'dm' && !selectedDmUser ? (
          <div className="text-xs text-slate-500 text-center mt-10">
            Select a user from the Lounge to start a private chat.
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`text-xs ${msg.userId === auth.currentUser?.uid ? 'text-right' : 'text-left'}`}>
              <span className="text-[10px] text-slate-500 mr-1">{formatTimestamp(msg.timestamp)}</span>
              <span className="font-bold" style={{ color: getUserColor(msg.userId) }}>{msg.userName}: </span>
              {msg.imageUrl ? (
                <div className={`mt-1 mb-1 ${msg.userId === auth.currentUser?.uid ? 'flex justify-end' : 'flex justify-start'}`}>
                  <img src={msg.imageUrl} alt="Uploaded" className="max-w-[150px] max-h-[150px] rounded-md border border-slate-700 object-cover" referrerPolicy="no-referrer" />
                </div>
              ) : (
                <span className="text-slate-200">{msg.text}</span>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {typingUsers.length > 0 && (
        <div className="text-[10px] text-slate-500 italic mb-2">
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {uploadError && (
        <div className="text-[10px] text-red-400 mb-2 bg-red-950/50 p-1 rounded border border-red-900/50">
          ⚠️ {uploadError}
        </div>
      )}
      
      <form onSubmit={sendMessage} className="flex gap-2 items-center">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageUpload}
          disabled={isUploading || (chatMode === 'dm' && !selectedDmUser)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || (chatMode === 'dm' && !selectedDmUser)}
          className="text-slate-400 hover:text-indigo-400 disabled:opacity-50 transition-colors"
          title="Upload image"
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          disabled={isUploading || (chatMode === 'dm' && !selectedDmUser)}
          className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white disabled:opacity-50"
          placeholder={chatMode === 'dm' && !selectedDmUser ? "Select a user to chat..." : "Type a message..."}
        />
        <button 
          type="submit" 
          disabled={isUploading || !newMessage.trim() || (chatMode === 'dm' && !selectedDmUser)}
          className="bg-indigo-600 text-white px-3 py-1 rounded text-xs font-bold disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWidget;
