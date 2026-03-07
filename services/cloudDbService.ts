
import { db } from '../src/lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { Project, AppState } from '../types';

const PROJECTS_COLLECTION = 'projects';

export const saveProjectToCloud = async (userId: string, project: Omit<Project, 'id'> & { id?: string | number }): Promise<string> => {
  if (!db) throw new Error('Firestore not initialized');

  const projectData = {
    name: project.name,
    userId: userId,
    lastModified: Timestamp.now(),
    data: JSON.stringify(project.data) // Store as string to avoid nested array issues in Firestore
  };

  if (project.id && typeof project.id === 'string' && project.id.length > 5) {
    // Update existing cloud project
    const docRef = doc(db, PROJECTS_COLLECTION, project.id);
    await updateDoc(docRef, projectData);
    return project.id;
  } else {
    // Create new cloud project
    const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), projectData);
    return docRef.id;
  }
};

export const getUserProjectsFromCloud = async (userId: string): Promise<any[]> => {
  if (!db) throw new Error('Firestore not initialized');

  const q = query(
    collection(db, PROJECTS_COLLECTION), 
    where('userId', '==', userId)
  );

  const querySnapshot = await getDocs(q);
  const projects = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      data: typeof data.data === 'string' ? JSON.parse(data.data) : data.data,
      lastModified: (data.lastModified as Timestamp).toDate()
    };
  });

  // Sort in memory to avoid needing a composite index
  return projects.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
};

export const deleteProjectFromCloud = async (projectId: string): Promise<void> => {
  if (!db) throw new Error('Firestore not initialized');
  await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId));
};

export const getProjectFromCloud = async (projectId: string): Promise<any> => {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, PROJECTS_COLLECTION, projectId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            data: typeof data.data === 'string' ? JSON.parse(data.data) : data.data,
            lastModified: (data.lastModified as Timestamp).toDate()
        };
    }
    return null;
};
