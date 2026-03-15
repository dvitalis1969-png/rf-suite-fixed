import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../src/lib/firebase';
import Card, { CardTitle } from './Card';

interface Plot {
  id: string;
  userId: string;
  userName: string;
  timestamp: number;
  projectId: string;
  imageData: string;
  description: string;
}

const PlotGallery: React.FC = () => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [plotToDelete, setPlotToDelete] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'plots'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plotsData: Plot[] = [];
      snapshot.forEach((doc) => {
        plotsData.push({ id: doc.id, ...doc.data() } as Plot);
      });
      setPlots(plotsData);
    });
    return () => unsubscribe();
  }, []);

  const confirmDelete = async () => {
    if (!plotToDelete) return;
    try {
      await deleteDoc(doc(db, 'plots', plotToDelete));
    } catch (error) {
      console.error('Error deleting plot:', error);
    } finally {
      setPlotToDelete(null);
    }
  };

  return (
    <Card className="p-4">
      <CardTitle>Plot Gallery</CardTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plots.map((plot) => (
          <div key={plot.id} className="bg-slate-900 border border-slate-700 rounded-lg p-2 relative group">
            <img src={plot.imageData} alt={plot.description} className="w-full h-48 object-cover rounded" />
            <div className="mt-2 text-xs text-slate-300">
              <p className="font-bold">{plot.userName}</p>
              <p>{plot.description}</p>
              <p className="text-slate-500">{new Date(plot.timestamp).toLocaleString()}</p>
            </div>
            {auth.currentUser?.uid === plot.userId && (
              <button
                onClick={() => setPlotToDelete(plot.id)}
                className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      {plotToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Delete Plot?</h3>
            <p className="text-slate-400 text-sm mb-6">Are you sure you want to delete this plot? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setPlotToDelete(null)} 
                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                className="px-4 py-2 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PlotGallery;
