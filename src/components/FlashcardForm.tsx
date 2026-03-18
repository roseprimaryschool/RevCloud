import React, { useState } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';
import { useNavigate } from 'react-router-dom';

interface FlashcardFormProps {
  initialData?: { id: string; front: string; back: string };
  onSuccess?: () => void;
}

export function FlashcardForm({ initialData, onSuccess }: FlashcardFormProps) {
  const [front, setFront] = useState(initialData?.front || '');
  const [back, setBack] = useState(initialData?.back || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !front.trim() || !back.trim()) return;

    setIsSubmitting(true);
    try {
      if (initialData) {
        const cardRef = doc(db, 'flashcards', initialData.id);
        await updateDoc(cardRef, {
          front: front.trim(),
          back: back.trim()
        });
      } else {
        await addDoc(collection(db, 'flashcards'), {
          userId: user.uid,
          front: front.trim(),
          back: back.trim(),
          createdAt: Date.now(),
          status: 'new'
        });
        setFront('');
        setBack('');
      }
      if (onSuccess) onSuccess();
      else navigate('/');
    } catch (error) {
      handleFirestoreError(error, initialData ? OperationType.UPDATE : OperationType.CREATE, 'flashcards');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
      <div>
        <label htmlFor="front" className="block text-sm font-medium text-zinc-700 mb-1">
          Front (Question)
        </label>
        <textarea
          id="front"
          value={front}
          onChange={(e) => setFront(e.target.value)}
          required
          maxLength={1000}
          rows={3}
          className="w-full px-4 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow resize-none"
          placeholder="e.g., What is the capital of France?"
        />
      </div>
      <div>
        <label htmlFor="back" className="block text-sm font-medium text-zinc-700 mb-1">
          Back (Answer)
        </label>
        <textarea
          id="back"
          value={back}
          onChange={(e) => setBack(e.target.value)}
          required
          maxLength={2000}
          rows={4}
          className="w-full px-4 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow resize-none"
          placeholder="e.g., Paris"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !front.trim() || !back.trim()}
          className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update Card' : 'Create Card'}
        </button>
      </div>
    </form>
  );
}
