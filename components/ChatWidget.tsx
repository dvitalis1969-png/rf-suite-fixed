import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../src/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, deleteDoc, where } from 'firebase/firestore';
import { getUserColor, formatTimestamp } from '../src/utils/chatUtils';

interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: any;
  projectId: string;
}

const ChatWidget: React.FC<{ projectId: string | number }> = ({ projectId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<{ id: string; name: string }[]>([]);
  const [chatMode, setChatMode] = useState<'project' | 'lounge' | 'dm'>('project');
  const [selectedDmUser, setSelectedDmUser] = useState<{ id: string; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

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

    const q = query(
      collection(db, 'messages', activeProjectId, 'chat'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
    });

    // Listen for typing users
    const typingQ = query(collection(db, 'messages', activeProjectId, 'typing'));
    const unsubscribeTyping = onSnapshot(typingQ, (snapshot) => {
      const typing = snapshot.docs
        .filter(doc => doc.id !== auth.currentUser?.uid)
        .map(doc => doc.data().userName);
      setTypingUsers(typing);
    });

    // Listen for online users
    const onlineQ = query(collection(db, 'presence', 'global', 'users'));
    const unsubscribeOnline = onSnapshot(onlineQ, (snapshot) => {
      const online = snapshot.docs
        .filter(doc => doc.id !== auth.currentUser?.uid)
        .map(doc => ({ id: doc.id, name: doc.data().name }));
      setOnlineUsers(online);
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
    setNewMessage('');
  };

  const startDM = (user: { id: string; name: string }) => {
    setSelectedDmUser(user);
    setChatMode('dm');
  };

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
          className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${chatMode === 'lounge' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
        >
          Lounge
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
            <span key={u.id}>
              <button 
                onClick={() => startDM(u)}
                className="hover:text-indigo-400 hover:underline cursor-pointer"
                title={`Message ${u.name} privately`}
              >
                {u.name}
              </button>
              {i < onlineUsers.length - 1 ? ', ' : ''}
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
              <span className="text-slate-200">{msg.text}</span>
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
      
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          disabled={chatMode === 'dm' && !selectedDmUser}
          className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white disabled:opacity-50"
          placeholder={chatMode === 'dm' && !selectedDmUser ? "Select a user to chat..." : "Type a message..."}
        />
        <button 
          type="submit" 
          disabled={chatMode === 'dm' && !selectedDmUser}
          className="bg-indigo-600 text-white px-3 py-1 rounded text-xs font-bold disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWidget;
