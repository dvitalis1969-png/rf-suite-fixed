import React, { useState, useEffect } from 'react';
import { db, auth } from '../src/lib/firebase';
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface Presence {
  userId: string;
  userName: string;
  lastSeen: any;
}

const PresenceIndicator: React.FC<{ projectId: string | number }> = ({ projectId }) => {
  const [users, setUsers] = useState<Presence[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Update presence
    const userRef = doc(db, 'presence', String(projectId), 'users', auth.currentUser.uid);
    setDoc(userRef, {
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || 'Anonymous',
      lastSeen: serverTimestamp(),
      projectId: String(projectId)
    });

    // Listen for presence
    const q = collection(db, 'presence', String(projectId), 'users');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeUsers = snapshot.docs.map(doc => doc.data() as Presence);
      setUsers(activeUsers);
    });

    return () => unsubscribe();
  }, [projectId]);

  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <span>Active:</span>
      {users.map(user => (
        <div key={user.userId} className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-full">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span>{user.userName}</span>
        </div>
      ))}
    </div>
  );
};

export default PresenceIndicator;
