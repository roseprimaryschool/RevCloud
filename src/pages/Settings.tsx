import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Trash2, AlertTriangle, User as UserIcon } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';

export function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteData = async () => {
    if (!user) return;
    
    const confirmDelete = window.confirm(
      'Are you sure you want to delete all your flashcards? This action cannot be undone.'
    );
    
    if (!confirmDelete) return;
    
    setIsDeleting(true);
    try {
      const q = query(collection(db, 'flashcards'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((document) => {
        batch.delete(document.ref);
      });
      
      await batch.commit();
      alert('All flashcards deleted successfully.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'flashcards');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const confirmDelete = window.confirm(
      'Are you absolutely sure you want to delete your account and all associated data? This is permanent.'
    );
    
    if (!confirmDelete) return;
    
    setIsDeleting(true);
    try {
      // Delete all flashcards first
      const q = query(collection(db, 'flashcards'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((document) => {
        batch.delete(document.ref);
      });
      await batch.commit();
      
      // Delete user document
      await deleteDoc(doc(db, 'users', user.uid));
      
      // Delete auth user
      await user.delete();
      
      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. You may need to sign in again to perform this action.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 mb-8">Account Settings</h1>
      
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-zinc-500" />
            Profile Information
          </h2>
          <div className="flex items-center gap-4">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-16 h-16 rounded-full border border-zinc-200" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-medium text-2xl">
                {user.email?.[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-zinc-900">{user.displayName || 'User'}</p>
              <p className="text-zinc-500 text-sm">{user.email}</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-zinc-50">
          <button
            onClick={() => logout().then(() => navigate('/login'))}
            className="px-4 py-2 bg-white border border-zinc-300 text-zinc-700 rounded-xl hover:bg-zinc-50 transition-colors text-sm font-medium shadow-sm"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-red-100 bg-red-50/50">
          <h2 className="text-lg font-semibold text-red-700 mb-1 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </h2>
          <p className="text-sm text-red-600/80">Irreversible actions for your account and data.</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-zinc-900">Delete all flashcards</h3>
              <p className="text-sm text-zinc-500">Remove all your study materials but keep your account.</p>
            </div>
            <button
              onClick={handleDeleteData}
              disabled={isDeleting}
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50"
            >
              Delete Data
            </button>
          </div>
          
          <div className="h-px bg-zinc-100 w-full"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-zinc-900">Delete account</h3>
              <p className="text-sm text-zinc-500">Permanently delete your account and all associated data.</p>
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50 shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
