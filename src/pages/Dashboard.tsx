import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';
import { PlusCircle, Play, Trash2, Edit2, BookOpen } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  createdAt: number;
  status: 'new' | 'learning' | 'known';
  lastReviewed?: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'flashcards'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cards: Flashcard[] = [];
      snapshot.forEach((doc) => {
        cards.push({ id: doc.id, ...doc.data() } as Flashcard);
      });
      setFlashcards(cards);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'flashcards');
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this flashcard?')) return;
    try {
      await deleteDoc(doc(db, 'flashcards', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `flashcards/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const newCards = flashcards.filter(c => c.status === 'new').length;
  const learningCards = flashcards.filter(c => c.status === 'learning').length;
  const knownCards = flashcards.filter(c => c.status === 'known').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Your Flashcards</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage and review your study materials</p>
        </div>
        <div className="flex gap-3">
          {flashcards.length > 0 && (
            <Link
              to="/review"
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors text-sm font-medium shadow-sm"
            >
              <Play className="w-4 h-4" />
              Review All
            </Link>
          )}
          <Link
            to="/create"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Create Card
          </Link>
        </div>
      </div>

      {flashcards.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-zinc-900">{newCards}</span>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">New</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-amber-600">{learningCards}</span>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">Learning</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-emerald-600">{knownCards}</span>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">Known</span>
          </div>
        </div>
      )}

      {flashcards.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-zinc-200 border-dashed">
          <BookOpen className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 mb-1">No flashcards yet</h3>
          <p className="text-zinc-500 mb-6 max-w-sm mx-auto">Create your first flashcard to start building your revision deck.</p>
          <Link
            to="/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Create Flashcard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flashcards.map((card) => (
            <div key={card.id} className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm hover:shadow-md transition-shadow group relative flex flex-col h-full">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                    card.status === 'known' ? 'bg-emerald-50 text-emerald-700' :
                    card.status === 'learning' ? 'bg-amber-50 text-amber-700' :
                    'bg-zinc-100 text-zinc-700'
                  }`}>
                    {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      to={`/edit/${card.id}`}
                      className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(card.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-medium text-zinc-900 line-clamp-3 mb-2">{card.front}</h3>
              </div>
              <div className="pt-4 mt-4 border-t border-zinc-100">
                <p className="text-sm text-zinc-500 line-clamp-2">{card.back}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
